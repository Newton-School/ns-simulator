import { RequestSpan } from "./core/events"
import { microToMs, msToMicro } from "./core/time"
import { ComponentNode, NodeState, SLOConfig } from "./core/types"


export interface CompletedRequest {
  id: string
  status: 'success' | 'timeout' | 'rejected' | 'error'
  totalLatency: number // ms
  path: string[]
  spans: RequestSpan[]
  createdAt: bigint
  completedAt: bigint
}

export interface LatencyPercentiles {
  p50: number
  p90: number
  p95: number
  p99: number
  min: number
  max: number
  mean: number
}

export interface PerNodeMetrics {
  nodeLabel?: string
  totalArrived: number
  postWarmupArrived: number
  totalProcessed: number
  totalRejected: number
  totalTimedOut: number
  avgQueueLength: number
  avgServiceTime: number
  avgQueueWait: number
  avgTimeInSystem: number
  avgInSystem: number
  peakQueueLength: number
  utilization: number
  throughput: number
  errorRate: number
  availability: number
  latencyP99: number
}

export interface SimulationSummary {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  rejectedRequests: number
  timedOutRequests: number
  duration: number // ms
  throughput: number // successful req / sec after warmup
  errorRate: number // failed / total
  latency: LatencyPercentiles
}

interface InternalNodeMetrics {
  totalArrived: number
  postWarmupArrived: number
  totalProcessed: number
  totalRejected: number
  totalTimedOut: number
  queueSamples: number
  queueLengthSum: number
  queueWaitSumMs: number
  serviceTimeSumMs: number
  inSystemSamples: number
  inSystemSum: number
  peakQueueLength: number
  utilizationSamples: number
  utilizationSum: number
  latencySamplesMs: number[]
}

export interface NodeMetadata {
  label?: string
  slo?: SLOConfig
}

export class MetricsCollector {
  private readonly warmupDurationMs: number
  private readonly warmupDurationUs: bigint

  private readonly successfulLatencies: number[] = []
  private readonly perNode = new Map<string, InternalNodeMetrics>()
  private readonly nodeMetadata = new Map<string, NodeMetadata>()

  private totalRequests = 0
  private successfulRequests = 0
  private postWarmupSuccessfulRequests = 0
  private failedRequests = 0
  private rejectedRequests = 0
  private timedOutRequests = 0

  constructor(config: {
    warmupDuration: number
    nodes?: Array<Pick<ComponentNode, 'id' | 'label' | 'slo'>>
  }) {
    this.warmupDurationMs = Math.max(0, config.warmupDuration)
    this.warmupDurationUs = msToMicro(this.warmupDurationMs)
    for (const node of config.nodes ?? []) {
      this.nodeMetadata.set(node.id, {
        label: node.label,
        slo: node.slo
      })
    }
  }

  recordRequest(request: CompletedRequest): void {
    this.totalRequests++

    if (request.status === 'success') {
      this.successfulRequests++
      if (request.createdAt >= this.warmupDurationUs) {
        this.postWarmupSuccessfulRequests++
        this.successfulLatencies.push(request.totalLatency)
      }
    } else {
      this.failedRequests++
      if (request.status === 'rejected') {
        this.rejectedRequests++
      }
      if (request.status === 'timeout') {
        this.timedOutRequests++
      }
    }

    const isPostWarmup = request.createdAt >= this.warmupDurationUs
    for (const span of request.spans) {
      const node = this.ensureNodeMetrics(span.nodeId)
      node.totalArrived++
      if (isPostWarmup) {
        node.postWarmupArrived++
      }
      node.totalProcessed++
      node.queueWaitSumMs += microToMs(span.queueWait)
      node.serviceTimeSumMs += microToMs(span.serviceTime)
      node.latencySamplesMs.push(microToMs(span.queueWait + span.serviceTime))
    }

    // If spans are unavailable, path still gives visibility into arrivals.
    if (request.spans.length === 0 && request.path.length > 0) {
      for (const nodeId of request.path) {
        this.ensureNodeMetrics(nodeId).totalArrived++
      }
    }
  }

  recordRejection(nodeId: string, reason: string): void {
    void reason
    this.totalRequests++
    this.failedRequests++
    this.rejectedRequests++

    const node = this.ensureNodeMetrics(nodeId)
    node.totalArrived++
    node.totalRejected++
  }

  recordTimeout(_requestId: string, nodeId: string): void {
    this.totalRequests++
    this.failedRequests++
    this.timedOutRequests++

    const node = this.ensureNodeMetrics(nodeId)
    node.totalArrived++
    node.totalTimedOut++
  }

  recordNodeSnapshot(nodeId: string, state: NodeState, timestamp: bigint): void {
    void timestamp
    const node = this.ensureNodeMetrics(nodeId)

    node.queueLengthSum += state.queueLength
    node.queueSamples++
    node.peakQueueLength = Math.max(node.peakQueueLength, state.queueLength)
    node.inSystemSum += state.totalInSystem
    node.inSystemSamples++

    const utilization = Number.isFinite(state.utilization) ? state.utilization : 0
    const clampedUtilization = Math.min(1, Math.max(0, utilization))
    node.utilizationSum += clampedUtilization
    node.utilizationSamples++
  }

  generateSummary(duration: number): SimulationSummary {
    const effectiveDurationMs = Math.max(0, duration - this.warmupDurationMs)
    const throughput =
      effectiveDurationMs > 0 ? this.postWarmupSuccessfulRequests / (effectiveDurationMs / 1000) : 0
    const errorRate = this.totalRequests > 0 ? this.failedRequests / this.totalRequests : 0

    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      rejectedRequests: this.rejectedRequests,
      timedOutRequests: this.timedOutRequests,
      duration,
      throughput,
      errorRate,
      latency: this.getLatencyPercentiles()
    }
  }

  getPerNodeMetrics(durationMs = 0): Map<string, PerNodeMetrics> {
    const result = new Map<string, PerNodeMetrics>()
    const effectiveDurationMs = Math.max(0, durationMs - this.warmupDurationMs)
    const durationSec = effectiveDurationMs > 0 ? effectiveDurationMs / 1000 : 0
    const nodeIds = new Set<string>([...this.perNode.keys(), ...this.nodeMetadata.keys()])

    for (const nodeId of nodeIds) {
      const metrics = this.perNode.get(nodeId)
      const metadata = this.nodeMetadata.get(nodeId)
      const totalArrived = metrics?.totalArrived ?? 0
      const totalProcessed = metrics?.totalProcessed ?? 0
      const totalRejected = metrics?.totalRejected ?? 0
      const totalTimedOut = metrics?.totalTimedOut ?? 0
      const failed = totalRejected + totalTimedOut
      const errorRate = totalArrived > 0 ? failed / totalArrived : 0
      const latencyP99 = this.percentile(metrics?.latencySamplesMs ?? [], 0.99)

      result.set(nodeId, {
        nodeLabel: metadata?.label,
        totalArrived,
        postWarmupArrived: metrics?.postWarmupArrived ?? 0,
        totalProcessed,
        totalRejected,
        totalTimedOut,
        avgQueueLength: metrics && metrics.queueSamples > 0 ? metrics.queueLengthSum / metrics.queueSamples : 0,
        avgServiceTime: metrics && metrics.totalProcessed > 0 ? metrics.serviceTimeSumMs / metrics.totalProcessed : 0,
        avgQueueWait: metrics && metrics.totalProcessed > 0 ? metrics.queueWaitSumMs / metrics.totalProcessed : 0,
        avgTimeInSystem:
          metrics && metrics.totalProcessed > 0
            ? (metrics.queueWaitSumMs + metrics.serviceTimeSumMs) / metrics.totalProcessed
            : 0,
        avgInSystem: metrics && metrics.inSystemSamples > 0 ? metrics.inSystemSum / metrics.inSystemSamples : 0,
        peakQueueLength: metrics?.peakQueueLength ?? 0,
        utilization:
          metrics && metrics.utilizationSamples > 0 ? metrics.utilizationSum / metrics.utilizationSamples : 0,
        throughput: durationSec > 0 ? totalProcessed / durationSec : 0,
        errorRate,
        availability: 1 - errorRate,
        latencyP99
      })
    }

    return result
  }

  getNodeMetadata(nodeId: string): NodeMetadata | undefined {
    return this.nodeMetadata.get(nodeId)
  }

  getAllNodeMetadata(): Map<string, NodeMetadata> {
    return new Map(this.nodeMetadata)
  }

  getLatencyPercentiles(): LatencyPercentiles {
    if (this.successfulLatencies.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0, min: 0, max: 0, mean: 0 }
    }

    const sorted = [...this.successfulLatencies].sort((a, b) => a - b)
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const mean = sorted.reduce((acc, value) => acc + value, 0) / sorted.length

    return {
      p50: this.percentile(sorted, 0.5),
      p90: this.percentile(sorted, 0.9),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
      min,
      max,
      mean
    }
  }

  private percentile(sortedAsc: number[], p: number): number {
    if (sortedAsc.length === 0) {
      return 0
    }

    if (!this.isSortedAscending(sortedAsc)) {
      sortedAsc = [...sortedAsc].sort((a, b) => a - b)
    }

    const idx = Math.floor(p * (sortedAsc.length - 1))
    return sortedAsc[Math.min(sortedAsc.length - 1, Math.max(0, idx))]
  }

  private isSortedAscending(values: number[]): boolean {
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i - 1]) {
        return false
      }
    }
    return true
  }

  private ensureNodeMetrics(nodeId: string): InternalNodeMetrics {
    const existing = this.perNode.get(nodeId)
    if (existing) {
      return existing
    }

    const created: InternalNodeMetrics = {
      totalArrived: 0,
      postWarmupArrived: 0,
      totalProcessed: 0,
      totalRejected: 0,
      totalTimedOut: 0,
      queueSamples: 0,
      queueLengthSum: 0,
      queueWaitSumMs: 0,
      serviceTimeSumMs: 0,
      inSystemSamples: 0,
      inSystemSum: 0,
      peakQueueLength: 0,
      utilizationSamples: 0,
      utilizationSum: 0,
      latencySamplesMs: []
    }

    this.perNode.set(nodeId, created)
    return created
  }
}
