import { describe, expect, it } from 'vitest'
import type { RequestSpan } from '../core/events'
import type { GlobalConfig } from '../core/types'
import type { CompletedRequest } from '../metrics'
import { MetricsCollector } from '../metrics'
import { RequestTracer } from '../tracer'
import { generateSimulationOutput } from './output'

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

function makeCompletedRequest(overrides: Partial<CompletedRequest> = {}): CompletedRequest {
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

describe('generateSimulationOutput', () => {
  it("computes Little's Law output for a simple synthetic node sample", () => {
    const metrics = new MetricsCollector({ warmupDuration: 0 })
    const tracer = new RequestTracer({ sampleRate: 0 })

    metrics.recordRequest(
      makeCompletedRequest({
        id: 'req-little',
        status: 'success',
        createdAt: 0n,
        totalLatency: 5,
        spans: [makeSpan('node-a', 0n, 2_000n, 3_000n)]
      })
    )
    metrics.recordNodeSnapshot(
      'node-a',
      {
        id: 'node-a',
        status: 'idle',
        activeWorkers: 1,
        queueLength: 0,
        utilization: 0.2,
        totalInSystem: 0.005
      },
      0n
    )

    const config: GlobalConfig = {
      simulationDuration: 1_000,
      seed: 'test-seed',
      warmupDuration: 0,
      timeResolution: 'microsecond',
      defaultTimeout: 1_000
    }

    const output = generateSimulationOutput(metrics, tracer, [], null, [], config, 1)
    const little = output.littlesLawCheck.find((entry) => entry.nodeId === 'node-a')

    expect(little).toBeDefined()
    expect(little?.expectedL).toBeCloseTo(0.005, 8)
    expect(little?.observedL).toBeCloseTo(0.005, 8)
    expect(little?.withinTolerance).toBe(true)
  })
})
