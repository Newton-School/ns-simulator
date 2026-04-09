import { generateSimulationOutput, SimulationOutput, TimeSeriesSnapshot } from "./analysis/output"
import { createEvent, Request, SimulationEvent } from "./core/events"
import { microToMs, msToMicro, secToMicro } from "./core/time"
import { ComponentNode, EdgeDefinition, EventScheduler, TopologyJSON } from "./core/types"
import { MetricsCollector } from "./metrics"
import { GGcKNode } from "./nodes/GGcKNode"
import { RoutingTable } from "./routing"
import { MinHeap } from "./scheduler/min-heap"
import { Distributions } from "./stochastic/distribution"
import { createRandom } from "./stochastic/random"
import { RequestTracer } from "./tracer"
import { WorkloadGenerator } from "./workload"

export class SimulationEngine {
  onProgress?: (percent: number, eventsProcessed: number) => void
  onSnapshot?: (snapshot: TimeSeriesSnapshot) => void

  private readonly eventQueue = new MinHeap<SimulationEvent>()
  private readonly distributions: Distributions
  private readonly routing: RoutingTable
  private readonly metrics: MetricsCollector
  private readonly tracer: RequestTracer
  private readonly nodes = new Map<string, GGcKNode>()
  private readonly workload?: WorkloadGenerator

  private readonly requestById = new Map<string, Request>()
  private readonly simulationDurationUs: bigint
  private readonly snapshotIntervalUs = secToMicro(1)

  private clock = 0n
  private lastSnapshotAt = -1n
  private eventsProcessed = 0
  private running = false
  private paused = false
  private readonly timeSeries: TimeSeriesSnapshot[] = []

  constructor(private readonly topology: TopologyJSON) {
    const rng = createRandom(topology.global.seed)
    this.distributions = new Distributions(rng)
    this.routing = new RoutingTable(topology.edges, rng, topology.nodes)
    this.metrics = new MetricsCollector({
      warmupDuration: topology.global.warmupDuration,
      nodes: topology.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        slo: node.slo
      }))
    })
    this.tracer = new RequestTracer({ sampleRate: topology.global.traceSampleRate ?? 0.01 })
    this.simulationDurationUs = msToMicro(topology.global.simulationDuration)

    const scheduler: EventScheduler = {
      schedule: (event) => this.eventQueue.insert(event)
    }

    for (const node of topology.nodes) {
      const normalized = this.withNodeDefaults(node)
      this.nodes.set(node.id, new GGcKNode(normalized, this.distributions, scheduler))
    }

    if (topology.workload) {
      this.workload = new WorkloadGenerator(topology.workload, rng, scheduler, {
        defaultTimeoutMs: topology.global.defaultTimeout,
        simulationDurationMs: topology.global.simulationDuration
      })
      this.workload.initialize(0n)
    }
  }

  run(): SimulationOutput {
    this.running = true
    this.paused = false

    this.processEvents()
    return this.generateResults()
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
  }

  stop(): void {
    this.running = false
  }

  step(count: number): void {
    if (count <= 0) {
      return
    }
    const wasPaused = this.paused
    this.running = true
    this.paused = false
    this.processEvents(count)
    this.paused = wasPaused
  }

  hasPendingEvents(): boolean {
    return !this.eventQueue.isEmpty && this.clock < this.simulationDurationUs
  }

  getResults(): SimulationOutput {
    return this.generateResults()
  }

  captureSnapshot(): TimeSeriesSnapshot {
    const snapshot = this.takeSnapshot()
    this.timeSeries.push(snapshot)
    return snapshot
  }

  getEventsProcessed(): number {
    return this.eventsProcessed
  }

  private processEvents(maxEvents?: number): void {
    let processedInCall = 0

    while (this.running && !this.paused && !this.eventQueue.isEmpty) {
      if (maxEvents !== undefined && processedInCall >= maxEvents) {
        break
      }

      const event = this.eventQueue.extractMin()
      if (!event) {
        break
      }

      if (event.timestamp > this.simulationDurationUs) {
        break
      }

      this.clock = event.timestamp

      if (this.shouldEmitSnapshot(this.clock)) {
        const snapshot = this.takeSnapshot()
        this.timeSeries.push(snapshot)
        this.onSnapshot?.(snapshot)
      }

      this.handleEvent(event)
      this.eventsProcessed++
      processedInCall++

      if (this.eventsProcessed % 1000 === 0) {
        const percent = Math.min(100, (microToMs(this.clock) / this.topology.global.simulationDuration) * 100)
        this.onProgress?.(percent, this.eventsProcessed)
      }
    }

    if (this.eventQueue.isEmpty || this.clock >= this.simulationDurationUs) {
      this.running = false
    }
  }

  private handleEvent(event: SimulationEvent): void {
    switch (event.type) {
      case 'request-generated':
        this.handleRequestGenerated(event)
        break
      case 'request-arrival':
        this.handleRequestArrival(event)
        break
      case 'processing-complete':
        this.handleProcessingComplete(event)
        break
      case 'request-forwarded':
        this.handleRequestForwarded(event)
        break
      case 'request-complete':
        this.handleRequestComplete(event)
        break
      case 'request-timeout':
        this.handleRequestTimeout(event)
        break
      case 'request-rejected':
        this.handleRequestRejected(event)
        break
      case 'node-failure':
        this.nodes.get(event.nodeId)?.fail(this.clock)
        break
      case 'node-recovery':
        this.nodes.get(event.nodeId)?.recover(this.clock)
        break
      default:
        // Other event types are integrated in later tickets.
        break
    }
  }

  private handleRequestGenerated(event: SimulationEvent): void {
    if (!this.workload) {
      return
    }

    const request = this.workload.generateNext(this.clock)
    this.requestById.set(request.id, request)
    this.tracer.setRequestCreatedAt(request.id, request.createdAt)

    const sourceNodeId = event.nodeId
    const routes = this.routing.resolveTarget(sourceNodeId, request)
    if (routes.length === 0) {
      if (this.nodes.has(sourceNodeId)) {
        this.eventQueue.insert(
          createEvent('request-arrival', sourceNodeId, request.id, { request }, this.clock)
        )
      } else {
        this.eventQueue.insert(
          createEvent('request-complete', sourceNodeId, request.id, { request }, this.clock)
        )
      }
      return
    }

    for (const route of routes) {
      const arrivalTime = this.clock + this.sampleEdgeLatencyUs(route.edge)
      this.eventQueue.insert(
        createEvent('request-arrival', route.targetNodeId, request.id, { request }, arrivalTime)
      )
    }
  }

  private handleRequestArrival(event: SimulationEvent): void {
    const node = this.nodes.get(event.nodeId)
    const request = this.getRequest(event)
    if (!node || !request) {
      return
    }

    const result = node.handleArrival(request, this.clock)
    if (result.status === 'rejected') {
      this.eventQueue.insert(
        createEvent(
          'request-rejected',
          event.nodeId,
          request.id,
          { request, reason: result.reason },
          this.clock
        )
      )
    }
  }

  private handleProcessingComplete(event: SimulationEvent): void {
    const node = this.nodes.get(event.nodeId)
    const request = this.getRequest(event)
    if (!node || !request) {
      return
    }

    node.handleCompletion(request, this.clock)

    const routes = this.routing.resolveTarget(event.nodeId, request)
    if (routes.length === 0) {
      this.eventQueue.insert(
        createEvent('request-complete', event.nodeId, request.id, { request }, this.clock)
      )
      return
    }

    for (const route of routes) {
      this.eventQueue.insert(
        createEvent(
          'request-forwarded',
          event.nodeId,
          request.id,
          { request, edge: route.edge, targetNodeId: route.targetNodeId },
          this.clock
        )
      )
    }
  }

  private handleRequestForwarded(event: SimulationEvent): void {
    const request = this.getRequest(event)
    if (!request) {
      return
    }

    const edge = event.data.edge as EdgeDefinition | undefined
    const targetNodeId = event.data.targetNodeId as string | undefined
    if (!edge || !targetNodeId) {
      return
    }

    if (this.distributions.random() < edge.packetLossRate) {
      this.eventQueue.insert(
        createEvent('request-timeout', targetNodeId, request.id, { request }, this.clock)
      )
      return
    }

    const arrivalTime = this.clock + this.sampleEdgeLatencyUs(edge)
    this.eventQueue.insert(
      createEvent('request-arrival', targetNodeId, request.id, { request }, arrivalTime)
    )
  }

  private handleRequestComplete(event: SimulationEvent): void {
    const request = this.getRequest(event)
    if (!request) {
      return
    }

    const totalLatency = microToMs(this.clock - request.createdAt)
    this.metrics.recordRequest({
      id: request.id,
      status: 'success',
      totalLatency,
      path: request.path,
      spans: request.spans,
      createdAt: request.createdAt,
      completedAt: this.clock
    })

    for (const span of request.spans) {
      this.tracer.recordSpan(request.id, span)
    }
    this.tracer.markStatus(request.id, 'success')
    this.requestById.delete(request.id)
  }

  private handleRequestTimeout(event: SimulationEvent): void {
    const request = this.getRequest(event)
    if (request) {
      for (const span of request.spans) {
        this.tracer.recordSpan(request.id, span)
      }
      this.tracer.markStatus(request.id, 'timeout')
      this.requestById.delete(request.id)
    }

    this.metrics.recordTimeout(event.requestId, event.nodeId, request?.createdAt)
  }

  private handleRequestRejected(event: SimulationEvent): void {
    const reason = (event.data.reason as string | undefined) ?? 'rejected'
    const request = this.getRequest(event)
    this.metrics.recordRejection(event.nodeId, reason, request?.createdAt)

    if (request) {
      for (const span of request.spans) {
        this.tracer.recordSpan(request.id, span)
      }
      this.tracer.markStatus(request.id, 'rejected')
      this.requestById.delete(request.id)
    }
  }

  private sampleEdgeLatencyUs(edge: EdgeDefinition): bigint {
    const latencyMs = Math.max(0, this.distributions.fromConfig(edge.latency.distribution))
    return msToMicro(latencyMs)
  }

  private getRequest(event: SimulationEvent): Request | undefined {
    const fromEvent = event.data.request as Request | undefined
    if (fromEvent) {
      this.requestById.set(fromEvent.id, fromEvent)
      return fromEvent
    }
    return this.requestById.get(event.requestId)
  }

  private shouldEmitSnapshot(timestamp: bigint): boolean {
    return (
      this.lastSnapshotAt < 0n || timestamp - this.lastSnapshotAt >= this.snapshotIntervalUs
    )
  }

  private takeSnapshot(): TimeSeriesSnapshot {
    this.lastSnapshotAt = this.clock
    const nodes: TimeSeriesSnapshot['nodes'] = {}

    for (const [nodeId, node] of this.nodes) {
      const state = node.getState()
      this.metrics.recordNodeSnapshot(nodeId, state, this.clock)
      nodes[nodeId] = {
        queueLength: state.queueLength,
        activeWorkers: state.activeWorkers,
        utilization: state.utilization,
        status: state.status
      }
    }

    return {
      timestamp: microToMs(this.clock),
      nodes
    }
  }

  private generateResults(): SimulationOutput {
    return generateSimulationOutput(
      this.metrics,
      this.tracer,
      this.timeSeries,
      null,
      [],
      this.topology.global,
      this.eventsProcessed
    )
  }

  private withNodeDefaults(node: ComponentNode): ComponentNode {
    return {
      ...node,
      queue: node.queue ?? { workers: 1, capacity: 100, discipline: 'fifo' },
      processing: node.processing ?? { distribution: { type: 'constant', value: 1 }, timeout: 30_000 }
    }
  }
}