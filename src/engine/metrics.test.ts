import { describe, expect, it } from 'vitest'
import type { RequestSpan } from './core/events'
import type { NodeState } from './core/types'
import type { CompletedRequest } from './metrics'
import { MetricsCollector } from './metrics'

function makeSpan(
  nodeId: string,
  arrivalTimeUs: bigint,
  queueWaitUs: bigint,
  serviceTimeUs: bigint
): RequestSpan {
  return {
    nodeId,
    arrivalTime: arrivalTimeUs,
    queueWait: queueWaitUs,
    serviceTime: serviceTimeUs,
    departureTime: arrivalTimeUs + queueWaitUs + serviceTimeUs
  }
}

function makeRequest(overrides: Partial<CompletedRequest> = {}): CompletedRequest {
  const createdAt = overrides.createdAt ?? 0n
  return {
    id: overrides.id ?? 'req-1',
    status: overrides.status ?? 'success',
    totalLatency: overrides.totalLatency ?? 0,
    path: overrides.path ?? [],
    spans: overrides.spans ?? [],
    createdAt,
    completedAt: overrides.completedAt ?? createdAt + 1_000n
  }
}

function makeSnapshot(overrides: Partial<NodeState> = {}): NodeState {
  return {
    id: overrides.id ?? 'node-a',
    status: overrides.status ?? 'idle',
    activeWorkers: overrides.activeWorkers ?? 0,
    queueLength: overrides.queueLength ?? 0,
    utilization: overrides.utilization ?? 0,
    totalInSystem: overrides.totalInSystem ?? 0
  }
}

describe('MetricsCollector', () => {
  it('computes warmup-filtered latency percentiles and throughput', () => {
    const metrics = new MetricsCollector({ warmupDuration: 100 })

    metrics.recordRequest(
      makeRequest({ id: 'pre', createdAt: 50_000n, totalLatency: 999, status: 'success' })
    )
    metrics.recordRequest(
      makeRequest({ id: 'r1', createdAt: 150_000n, totalLatency: 300, status: 'success' })
    )
    metrics.recordRequest(
      makeRequest({ id: 'r2', createdAt: 200_000n, totalLatency: 100, status: 'success' })
    )
    metrics.recordRequest(
      makeRequest({ id: 'r3', createdAt: 250_000n, totalLatency: 400, status: 'success' })
    )
    metrics.recordRequest(
      makeRequest({ id: 'r4', createdAt: 300_000n, totalLatency: 200, status: 'success' })
    )

    const latency = metrics.getLatencyPercentiles()
    expect(latency).toEqual({
      p50: 200,
      p90: 300,
      p95: 300,
      p99: 300,
      min: 100,
      max: 400,
      mean: 250
    })

    const summary = metrics.generateSummary(1_000)
    expect(summary.totalRequests).toBe(5)
    expect(summary.successfulRequests).toBe(5)
    expect(summary.throughput).toBeCloseTo(4 / 0.9, 8)
  })

  it('tracks per-node arrivals and warmup gating for rejections/timeouts', () => {
    const metrics = new MetricsCollector({ warmupDuration: 100 })

    metrics.recordRequest(
      makeRequest({
        id: 'success-post',
        status: 'success',
        createdAt: 150_000n,
        totalLatency: 5,
        spans: [makeSpan('node-a', 150_000n, 2_000n, 3_000n)]
      })
    )
    metrics.recordRequest(
      makeRequest({
        id: 'success-pre',
        status: 'success',
        createdAt: 50_000n,
        totalLatency: 2,
        spans: [makeSpan('node-a', 50_000n, 1_000n, 1_000n)]
      })
    )

    metrics.recordRejection('node-a', 'capacity', 150_000n)
    metrics.recordTimeout('req-timeout', 'node-a', 50_000n)
    metrics.recordNodeSnapshot(
      'node-a',
      makeSnapshot({ queueLength: 2, totalInSystem: 3, utilization: 0.4 }),
      0n
    )
    metrics.recordNodeSnapshot(
      'node-a',
      makeSnapshot({ queueLength: 4, totalInSystem: 1, utilization: 1.2 }),
      10_000n
    )

    const perNode = metrics.getPerNodeMetrics(1_000).get('node-a')
    expect(perNode).toBeDefined()
    expect(perNode).toMatchObject({
      totalArrived: 4,
      postWarmupArrived: 2,
      totalProcessed: 2,
      totalRejected: 1,
      totalTimedOut: 1,
      avgQueueLength: 3,
      avgQueueWait: 1.5,
      avgServiceTime: 2,
      avgTimeInSystem: 3.5,
      avgInSystem: 2,
      utilization: 0.7,
      throughput: 2 / 0.9,
      errorRate: 0.5,
      availability: 0.5,
      latencyP99: 2
    })
  })

  it('counts post-warmup arrivals when only path data is available', () => {
    const metrics = new MetricsCollector({ warmupDuration: 100 })
    metrics.recordRequest(
      makeRequest({
        id: 'path-only',
        status: 'error',
        createdAt: 200_000n,
        path: ['node-a'],
        spans: []
      })
    )

    const perNode = metrics.getPerNodeMetrics(1_000).get('node-a')
    expect(perNode).toBeDefined()
    expect(perNode?.totalArrived).toBe(1)
    expect(perNode?.postWarmupArrived).toBe(1)
  })
})
