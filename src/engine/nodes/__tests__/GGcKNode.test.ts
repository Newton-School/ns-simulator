import { describe, expect, it, vi } from 'vitest'
import { GGcKNode } from '../GGcKNode'
import { Distributions } from '../../stochastic/distribution'
import { EventScheduler } from '../../core/types'
import { createRandom } from '../../stochastic/random'
import { Request, SimulationEvent } from '../../core/events'
import { ComponentNode } from '../../core/types'

function makeRequest(id: string, priority = 1): Request {
  return {
    id,
    type: 'GET',
    sizeBytes: 256,
    priority,
    createdAt: 0n,
    deadline: 10_000_000n,
    path: [],
    spans: [],
    retryCount: 0,
    metadata: {}
  }
}

function makeConfig(
  workers: number,
  capacity: number,
  discipline: 'fifo' | 'lifo' | 'priority' | 'wfq' = 'fifo',
  id = 'node-test'
): ComponentNode {
  return {
    id,
    type: 'api-endpoint',
    category: 'compute',
    label: 'Test Node',
    position: { x: 0, y: 0 },
    queue: { workers, capacity, discipline },
    processing: { distribution: { type: 'constant', value: 10 }, timeout: 5000 }
  }
}

function makeScheduler(): EventScheduler & { events: SimulationEvent[] } {
  const events: SimulationEvent[] = []
  return {
    events,
    schedule: vi.fn((event: SimulationEvent) => {
      events.push(event)
    })
  }
}

function makeDist(seed = 'test'): Distributions {
  return new Distributions(createRandom(seed))
}

describe('GGcKNode', () => {
  it('processes first 2 arrivals immediately, queues next 1, rejects the 4th (workers=2, capacity=3)', () => {
    const scheduler = makeScheduler()
    const node = new GGcKNode(makeConfig(2, 3), makeDist(), scheduler)

    expect(node.handleArrival(makeRequest('r1'), 0n).status).toBe('processed')
    expect(node.handleArrival(makeRequest('r2'), 1n).status).toBe('processed')
    expect(node.handleArrival(makeRequest('r3'), 2n).status).toBe('queued')
    expect(node.handleArrival(makeRequest('r4'), 3n).status).toBe('rejected')

    expect(node.getState().activeWorkers).toBe(2)
    expect(node.getState().queueLength).toBe(1)
    expect(node.getMetrics().totalRejections).toBe(1)
  })

  it('schedules a processing-complete event for each immediately processed request', () => {
    const scheduler = makeScheduler()
    const node = new GGcKNode(makeConfig(2, 4), makeDist(), scheduler)

    node.handleArrival(makeRequest('r1'), 0n)
    node.handleArrival(makeRequest('r2'), 1n)

    expect(scheduler.schedule).toHaveBeenCalledTimes(2)
    expect(scheduler.events[0].type).toBe('processing-complete')
    expect(scheduler.events[0].requestId).toBe('r1')
    expect(scheduler.events[1].requestId).toBe('r2')
  })

  it('handleCompletion frees a worker and auto-dequeues the next request', () => {
    const scheduler = makeScheduler()
    const node = new GGcKNode(makeConfig(1, 3), makeDist(), scheduler)

    const r1 = makeRequest('r1')
    node.handleArrival(r1, 0n)
    node.handleArrival(makeRequest('r2'), 1n)
    node.handleArrival(makeRequest('r3'), 2n)

    expect(node.getState().queueLength).toBe(2)
    expect(scheduler.schedule).toHaveBeenCalledTimes(1)

    const result = node.handleCompletion(r1, 100n)
    expect(result.nextRequest?.id).toBe('r2')
    expect(node.getState().queueLength).toBe(1)
    expect(scheduler.schedule).toHaveBeenCalledTimes(2)
  })

  it('handleCompletion returns null nextRequest when queue is empty', () => {
    const scheduler = makeScheduler()
    const node = new GGcKNode(makeConfig(1, 2), makeDist(), scheduler)

    const r1 = makeRequest('r1')
    node.handleArrival(r1, 0n)

    const result = node.handleCompletion(r1, 100n)
    expect(result.nextRequest).toBeNull()
    expect(node.getState().status).toBe('idle')
  })

  describe('queue disciplines', () => {
    it('FIFO: dequeues in arrival order', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(1, 3, 'fifo'), makeDist(), scheduler)

      const r1 = makeRequest('r1')
      node.handleArrival(r1, 0n)
      node.handleArrival(makeRequest('r2'), 1n)
      node.handleArrival(makeRequest('r3'), 2n)

      node.handleCompletion(r1, 10n)
      expect(scheduler.events[1].requestId).toBe('r2')

      node.handleCompletion(makeRequest('r2'), 20n)
      expect(scheduler.events[2].requestId).toBe('r3')
    })

    it('LIFO: dequeues in reverse arrival order', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(1, 3, 'lifo'), makeDist(), scheduler)

      const r1 = makeRequest('r1')
      node.handleArrival(r1, 0n)
      node.handleArrival(makeRequest('r2'), 1n)
      node.handleArrival(makeRequest('r3'), 2n)

      node.handleCompletion(r1, 10n)
      expect(scheduler.events[1].requestId).toBe('r3')

      node.handleCompletion(makeRequest('r3'), 20n)
      expect(scheduler.events[2].requestId).toBe('r2')
    })

    it('priority: serves highest priority (lowest number) first, FIFO within same level', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(1, 5, 'priority'), makeDist(), scheduler)

      const r1 = makeRequest('r1', 1)
      node.handleArrival(r1, 0n)
      node.handleArrival(makeRequest('r2', 2), 1n)
      node.handleArrival(makeRequest('r3', 0), 2n)
      node.handleArrival(makeRequest('r4', 0), 3n)

      node.handleCompletion(r1, 10n)
      expect(scheduler.events[1].requestId).toBe('r3')

      node.handleCompletion(makeRequest('r3', 0), 20n)
      expect(scheduler.events[2].requestId).toBe('r4')

      node.handleCompletion(makeRequest('r4', 0), 30n)
      expect(scheduler.events[3].requestId).toBe('r2')
    })

    it('wfq: falls back to FIFO order', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(1, 3, 'wfq'), makeDist(), scheduler)

      const r1 = makeRequest('r1')
      node.handleArrival(r1, 0n)
      node.handleArrival(makeRequest('r2'), 1n)
      node.handleArrival(makeRequest('r3'), 2n)

      node.handleCompletion(r1, 10n)
      expect(scheduler.events[1].requestId).toBe('r2')
    })
  })

  describe('utilization', () => {
    it('is 0 when idle', () => {
      const node = new GGcKNode(makeConfig(2, 4), makeDist(), makeScheduler())
      expect(node.getState().utilization).toBe(0)
    })

    it('is 0.5 when 1 of 2 workers busy', () => {
      const node = new GGcKNode(makeConfig(2, 4), makeDist(), makeScheduler())
      node.handleArrival(makeRequest('r1'), 0n)
      expect(node.getState().utilization).toBe(0.5)
    })

    it('is 1.0 when all workers busy', () => {
      const node = new GGcKNode(makeConfig(2, 4), makeDist(), makeScheduler())
      node.handleArrival(makeRequest('r1'), 0n)
      node.handleArrival(makeRequest('r2'), 1n)
      expect(node.getState().utilization).toBe(1.0)
    })
  })

  describe('status transitions', () => {
    it('idle → busy → saturated → busy → idle', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(1, 2, 'fifo'), makeDist(), scheduler)

      expect(node.getState().status).toBe('idle')

      const r1 = makeRequest('r1')
      node.handleArrival(r1, 0n)
      expect(node.getState().status).toBe('busy')

      node.handleArrival(makeRequest('r2'), 1n)
      expect(node.getState().status).toBe('saturated')

      node.handleCompletion(r1, 10n)
      expect(node.getState().status).toBe('busy')

      node.handleCompletion(makeRequest('r2'), 20n)
      expect(node.getState().status).toBe('idle')
    })
  })

  describe('failure and recovery', () => {
    it('fail() drops queue, rejects all future arrivals, counts dropped as rejections', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(1, 3), makeDist(), scheduler)

      node.handleArrival(makeRequest('r1'), 0n)
      node.handleArrival(makeRequest('r2'), 1n)
      node.handleArrival(makeRequest('r3'), 2n)

      node.fail(10n)

      expect(node.getState().status).toBe('failed')
      expect(node.getState().queueLength).toBe(0)
      expect(node.getMetrics().totalRejections).toBe(2)

      const r4 = node.handleArrival(makeRequest('r4'), 20n)
      expect(r4.status).toBe('rejected')
      expect(node.getMetrics().totalRejections).toBe(3)
    })

    it('recover() accepts new arrivals again', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(1, 2), makeDist(), scheduler)

      node.fail(10n)
      node.recover(20n)

      expect(node.getState().status).toBe('idle')
      expect(node.handleArrival(makeRequest('r1'), 30n).status).toBe('processed')
    })

    it('ignores handleCompletion for orphaned in-flight requests after fail+recover', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(1, 2, 'fifo', 'node-orphaned'), makeDist(), scheduler)

      const r1 = makeRequest('r1')
      node.handleArrival(r1, 0n) // r1 is processing

      node.fail(10n) // clears queue & tracking
      node.recover(20n)

      expect(node.getState().status).toBe('idle')

      // Simulator (or scheduler) fires completion for the old request
      const compResult = node.handleCompletion(r1, 30n)

      expect(compResult.nextRequest).toBeNull() // Doesn't start new work
      expect(node.getMetrics().totalCompleted).toBe(0) // Not counted as successful
      expect(node.getState().activeWorkers).toBe(0) // activeWorkers remains 0, no underflow
    })
  })

  describe('metrics after 100 requests', () => {
    it('tracks totalArrivals, totalCompleted, totalRejections correctly', () => {
      const scheduler = makeScheduler()
      // workers=10, capacity=10 → no queue slots, all capacity is workers
      // Sending 100 requests: first 10 accepted, next 90 rejected
      const node = new GGcKNode(makeConfig(10, 10), makeDist(), scheduler)

      const accepted: Request[] = []
      for (let i = 0; i < 100; i++) {
        const req = makeRequest(`r${i}`)
        const result = node.handleArrival(req, BigInt(i))
        if (result.status === 'processed') accepted.push(req)
      }

      expect(node.getMetrics().totalArrivals).toBe(100)
      expect(node.getMetrics().totalRejections).toBe(90)

      // Now complete all accepted requests
      for (const req of accepted) {
        node.handleCompletion(req, 1000n)
      }

      expect(node.getMetrics().totalCompleted).toBe(10)
    })
  })
})
