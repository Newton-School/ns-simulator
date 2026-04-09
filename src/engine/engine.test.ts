import { describe, expect, it } from 'vitest'
import { createEvent } from './core/events'
import { msToMicro } from './core/time'
import type { ComponentNode, EdgeDefinition, TopologyJSON } from './core/types'
import { SimulationEngine } from './engine'

function makeNode(id: string): ComponentNode {
  return {
    id,
    type: 'microservice',
    category: 'compute',
    label: id,
    position: { x: 0, y: 0 },
    queue: { workers: 1, capacity: 10, discipline: 'fifo' },
    processing: { distribution: { type: 'constant', value: 0 }, timeout: 1_000 }
  }
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  overrides: Partial<EdgeDefinition> = {}
): EdgeDefinition {
  return {
    id,
    source,
    target,
    mode: 'synchronous',
    protocol: 'grpc',
    latency: { distribution: { type: 'constant', value: 0 }, pathType: 'same-dc' },
    bandwidth: 1000,
    maxConcurrentRequests: 1000,
    packetLossRate: 0,
    errorRate: 0,
    ...overrides
  }
}

function makeTopology(overrides: Partial<TopologyJSON> = {}): TopologyJSON {
  return {
    id: 'topology-test',
    name: 'engine-test',
    version: '1.0.0',
    global: {
      simulationDuration: 50,
      seed: 'engine-seed',
      warmupDuration: 0,
      timeResolution: 'microsecond',
      defaultTimeout: 30_000,
      traceSampleRate: 1,
      ...overrides.global
    },
    nodes: overrides.nodes ?? [makeNode('node-a')],
    edges: overrides.edges ?? [],
    workload: overrides.workload
  }
}

describe('SimulationEngine', () => {
  it('does not drop out-of-window events and reports no pending in-window events', () => {
    const topology = makeTopology({ workload: undefined })
    const engine = new SimulationEngine(topology)
    const futureEvent = createEvent('node-failure', 'node-a', '', {}, msToMicro(500))

    const internal = engine as unknown as {
      eventQueue: { insert: (event: ReturnType<typeof createEvent>) => void; size: number }
    }
    internal.eventQueue.insert(futureEvent)

    expect(engine.hasPendingEvents()).toBe(false)

    engine.step(1)

    expect(engine.getEventsProcessed()).toBe(0)
    expect(internal.eventQueue.size).toBe(1)
    expect(engine.hasPendingEvents()).toBe(false)
  })

  it('records spans and traces from node processing', () => {
    const topology = makeTopology({
      global: { simulationDuration: 20, defaultTimeout: 1_000, traceSampleRate: 1 },
      nodes: [makeNode('source'), makeNode('worker')],
      edges: [makeEdge('source-to-worker', 'source', 'worker')],
      workload: {
        sourceNodeId: 'source',
        pattern: 'constant',
        baseRps: 1,
        requestDistribution: [{ type: 'GET', weight: 1, sizeBytes: 100 }]
      }
    })

    const output = new SimulationEngine(topology).run()

    expect(output.summary.successfulRequests).toBe(1)
    expect(output.perNode.worker.totalProcessed).toBe(1)
    expect(output.traces).toHaveLength(1)
    expect(output.traces[0].spans).toHaveLength(1)
    expect(output.traces[0].spans[0].nodeId).toBe('worker')
  })

  it('schedules packet-loss timeout at request deadline, not immediately', () => {
    const topology = makeTopology({
      global: { simulationDuration: 100, defaultTimeout: 1_000, traceSampleRate: 1 },
      nodes: [makeNode('source'), makeNode('mid'), makeNode('dst')],
      edges: [
        makeEdge('source-to-mid', 'source', 'mid'),
        makeEdge('mid-to-dst', 'mid', 'dst', { packetLossRate: 1 })
      ],
      workload: {
        sourceNodeId: 'source',
        pattern: 'constant',
        baseRps: 1,
        requestDistribution: [{ type: 'GET', weight: 1, sizeBytes: 100 }]
      }
    })

    const engine = new SimulationEngine(topology)
    const output = engine.run()

    expect(engine.getEventsProcessed()).toBeGreaterThan(0)
    expect(engine.hasPendingEvents()).toBe(false)
    expect(output.summary.totalRequests).toBe(0)
    expect(output.summary.timedOutRequests).toBe(0)
  })

  it('forks requests on async fan-out so each branch has a distinct request id', () => {
    const topology = makeTopology({
      global: { simulationDuration: 20, traceSampleRate: 1 },
      nodes: [makeNode('source'), makeNode('a'), makeNode('b')],
      edges: [
        makeEdge('source-to-a', 'source', 'a', { mode: 'asynchronous' }),
        makeEdge('source-to-b', 'source', 'b', { mode: 'asynchronous' })
      ],
      workload: {
        sourceNodeId: 'source',
        pattern: 'constant',
        baseRps: 1,
        requestDistribution: [{ type: 'GET', weight: 1, sizeBytes: 100 }]
      }
    })

    const output = new SimulationEngine(topology).run()
    const traceIds = output.traces.map((trace) => trace.requestId)

    expect(output.summary.successfulRequests).toBe(2)
    expect(output.traces).toHaveLength(2)
    expect(new Set(traceIds).size).toBe(2)
    expect(output.perNode.a.totalProcessed).toBe(1)
    expect(output.perNode.b.totalProcessed).toBe(1)
  })
})
