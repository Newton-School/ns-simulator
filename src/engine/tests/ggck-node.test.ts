import { describe, expect, it } from 'vitest'
import { GGcKNode, EventScheduler } from '../nodes/GGcKNode'
import { Distributions } from '../distribution'
import { createRandom } from '../random'
import { SimulationEvent, Request } from '../events'
import { ComponentNode } from '../types'

// --- Helpers ---

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

function makeConfig(overrides: Partial<ComponentNode> = {}): ComponentNode {
  return {
    id: 'test-node',
    type: 'api-endpoint',
    category: 'compute',
    label: 'Test Node',
    position: { x: 0, y: 0 },
    queue: { workers: 2, capacity: 5, discipline: 'fifo' },
    processing: { distribution: { type: 'constant', value: 10 }, timeout: 5000 },
    ...overrides
  }
}

function makeScheduler(): EventScheduler & { events: SimulationEvent[] } {
  const events: SimulationEvent[] = []
  return {
    events,
    schedule(event: SimulationEvent) {
      events.push(event)
    }
  }
}

function makeDist(seed = 'test-seed'): Distributions {
  return new Distributions(createRandom(seed))
}

// --- Tests ---

describe('GGcKNode', () => {
  describe('normal flow: 2 workers, capacity 5', () => {
    it('processes first 2 arrivals immediately, queues next 3, rejects the 6th', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(), makeDist(), scheduler)

      const r1 = makeRequest('r1')
      const r2 = makeRequest('r2')
      const r3 = makeRequest('r3')
      const r4 = makeRequest('r4')
      const r5 = makeRequest('r5')
      const r6 = makeRequest('r6')

      // First 2 go straight to workers
      expect(node.handleArrival(r1, 0n)).toEqual({ accepted: true })
      expect(node.handleArrival(r2, 1n)).toEqual({ accepted: true })

      let state = node.getState()
      expect(state.activeWorkers).toBe(2)
      expect(state.queueLength).toBe(0)
      expect(state.status).toBe('busy')

      // Next 3 get queued
      expect(node.handleArrival(r3, 2n)).toEqual({ accepted: true })
      expect(node.handleArrival(r4, 3n)).toEqual({ accepted: true })
      expect(node.handleArrival(r5, 4n)).toEqual({ accepted: true })

      state = node.getState()
      expect(state.activeWorkers).toBe(2)
      expect(state.queueLength).toBe(3)
      expect(state.status).toBe('saturated')

      // 6th is rejected — capacity is 5 (2 workers + 3 in queue = full)
      const result = node.handleArrival(r6, 5n)
      expect(result.accepted).toBe(false)
      if (!result.accepted) {
        expect(result.reason).toBe('capacity_exceeded')
      }

      const metrics = node.getMetrics()
      expect(metrics.totalArrivals).toBe(6)
      expect(metrics.totalRejections).toBe(1)
    })

    it('scheduler receives processing-complete events for each processed request', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(), makeDist(), scheduler)

      node.handleArrival(makeRequest('r1'), 0n)
      node.handleArrival(makeRequest('r2'), 1n)

      // 2 requests started immediately → 2 events scheduled
      expect(scheduler.events.length).toBe(2)
      expect(scheduler.events[0].type).toBe('processing-complete')
      expect(scheduler.events[0].requestId).toBe('r1')
      expect(scheduler.events[1].requestId).toBe('r2')
    })
  })

  describe('handleCompletion auto-dequeues', () => {
    it('starts the next queued request when a worker finishes', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(), makeDist(), scheduler)

      const r1 = makeRequest('r1')
      const r2 = makeRequest('r2')
      const r3 = makeRequest('r3')

      node.handleArrival(r1, 0n)
      node.handleArrival(r2, 1n)
      node.handleArrival(r3, 2n) // queued

      expect(node.getState().queueLength).toBe(1)
      expect(scheduler.events.length).toBe(2) // only r1 and r2 scheduled

      // Complete r1 → r3 should auto-dequeue and start
      const result = node.handleCompletion(r1, 100n)
      expect(result.nextRequest).not.toBeNull()
      expect(result.nextRequest!.id).toBe('r3')
      expect(node.getState().queueLength).toBe(0)
      expect(scheduler.events.length).toBe(3) // r3 now scheduled
    })

    it('returns null nextRequest when queue is empty', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(), makeDist(), scheduler)

      const r1 = makeRequest('r1')
      node.handleArrival(r1, 0n)

      const result = node.handleCompletion(r1, 100n)
      expect(result.nextRequest).toBeNull()
    })
  })

  describe('queue disciplines', () => {
    it('FIFO: dequeues in arrival order', () => {
      const config = makeConfig({ queue: { workers: 1, capacity: 5, discipline: 'fifo' } })
      const scheduler = makeScheduler()
      const node = new GGcKNode(config, makeDist(), scheduler)

      const r1 = makeRequest('r1')
      const r2 = makeRequest('r2')
      const r3 = makeRequest('r3')

      node.handleArrival(r1, 0n)  // goes to worker
      node.handleArrival(r2, 1n)  // queued first
      node.handleArrival(r3, 2n)  // queued second

      // Complete r1 → r2 should come out first (FIFO)
      const result1 = node.handleCompletion(r1, 100n)
      expect(result1.nextRequest!.id).toBe('r2')

      const result2 = node.handleCompletion(r2, 200n)
      expect(result2.nextRequest!.id).toBe('r3')
    })

    it('LIFO: dequeues most recent first', () => {
      const config = makeConfig({ queue: { workers: 1, capacity: 5, discipline: 'lifo' } })
      const scheduler = makeScheduler()
      const node = new GGcKNode(config, makeDist(), scheduler)

      const r1 = makeRequest('r1')
      const r2 = makeRequest('r2')
      const r3 = makeRequest('r3')

      node.handleArrival(r1, 0n)  // goes to worker
      node.handleArrival(r2, 1n)  // queued first
      node.handleArrival(r3, 2n)  // queued second

      // Complete r1 → r3 should come out first (LIFO)
      const result1 = node.handleCompletion(r1, 100n)
      expect(result1.nextRequest!.id).toBe('r3')

      const result2 = node.handleCompletion(r3, 200n)
      expect(result2.nextRequest!.id).toBe('r2')
    })

    it('priority: serves highest priority (lowest number) first, FIFO within same priority', () => {
      const config = makeConfig({ queue: { workers: 1, capacity: 10, discipline: 'priority' } })
      const scheduler = makeScheduler()
      const node = new GGcKNode(config, makeDist(), scheduler)

      const r1 = makeRequest('r1', 1) // normal priority → goes to worker
      const r2 = makeRequest('r2', 2) // low priority → queued
      const r3 = makeRequest('r3', 0) // high priority → queued
      const r4 = makeRequest('r4', 0) // high priority → queued (arrived after r3)
      const r5 = makeRequest('r5', 1) // normal priority → queued

      node.handleArrival(r1, 0n)
      node.handleArrival(r2, 1n)
      node.handleArrival(r3, 2n)
      node.handleArrival(r4, 3n)
      node.handleArrival(r5, 4n)

      // Complete r1 → should get r3 (priority 0, arrived first among priority-0)
      const out1 = node.handleCompletion(r1, 100n)
      expect(out1.nextRequest!.id).toBe('r3')

      // Complete r3 → should get r4 (priority 0, arrived second among priority-0)
      const out2 = node.handleCompletion(r3, 200n)
      expect(out2.nextRequest!.id).toBe('r4')

      // Complete r4 → should get r5 (priority 1, arrived before r2's priority 2)
      const out3 = node.handleCompletion(r4, 300n)
      expect(out3.nextRequest!.id).toBe('r5')

      // Complete r5 → should get r2 (priority 2, last one left)
      const out4 = node.handleCompletion(r5, 400n)
      expect(out4.nextRequest!.id).toBe('r2')
    })
  })

  describe('utilization', () => {
    it('equals activeWorkers / maxWorkers at any point', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(), makeDist(), scheduler)

      expect(node.getState().utilization).toBe(0)

      node.handleArrival(makeRequest('r1'), 0n)
      expect(node.getState().utilization).toBe(0.5) // 1/2

      node.handleArrival(makeRequest('r2'), 1n)
      expect(node.getState().utilization).toBe(1.0) // 2/2

      node.handleCompletion(makeRequest('r1'), 100n)
      expect(node.getState().utilization).toBe(0.5) // 1/2
    })
  })

  describe('node failure and recovery', () => {
    it('fail() rejects all arrivals and drops the queue', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(), makeDist(), scheduler)

      node.handleArrival(makeRequest('r1'), 0n)
      node.handleArrival(makeRequest('r2'), 1n)
      node.handleArrival(makeRequest('r3'), 2n) // queued

      expect(node.getState().queueLength).toBe(1)

      node.fail(10n)

      expect(node.getState().status).toBe('failed')
      expect(node.getState().queueLength).toBe(0)

      // New arrivals are rejected with 'node_failed'
      const result = node.handleArrival(makeRequest('r4'), 20n)
      expect(result.accepted).toBe(false)
      if (!result.accepted) {
        expect(result.reason).toBe('node_failed')
      }

      // 1 queued request dropped + 1 rejected after failure = 2 rejections
      expect(node.getMetrics().totalRejections).toBe(2)
    })

    it('recover() allows arrivals again', () => {
      const scheduler = makeScheduler()
      const node = new GGcKNode(makeConfig(), makeDist(), scheduler)

      node.fail(10n)
      expect(node.getState().status).toBe('failed')

      node.recover(20n)
      expect(node.getState().status).toBe('idle')

      const result = node.handleArrival(makeRequest('r1'), 30n)
      expect(result.accepted).toBe(true)
      expect(node.getState().status).toBe('busy')
    })
  })

  describe('status transitions', () => {
    it('idle → busy → saturated → busy → idle', () => {
      const config = makeConfig({ queue: { workers: 1, capacity: 3, discipline: 'fifo' } })
      const scheduler = makeScheduler()
      const node = new GGcKNode(config, makeDist(), scheduler)

      expect(node.getState().status).toBe('idle')

      const r1 = makeRequest('r1')
      node.handleArrival(r1, 0n)
      expect(node.getState().status).toBe('busy')

      node.handleArrival(makeRequest('r2'), 1n)
      expect(node.getState().status).toBe('saturated')

      // Complete r1 → r2 auto-dequeues → still busy (1 worker active, 0 in queue)
      node.handleCompletion(r1, 100n)
      expect(node.getState().status).toBe('busy')

      // Complete r2 → nothing left → idle
      node.handleCompletion(makeRequest('r2'), 200n)
      expect(node.getState().status).toBe('idle')
    })
  })

  describe('metrics after processing 100 requests', () => {
    it('tracks totalArrivals, totalCompleted, and totalRejections correctly', () => {
      const config = makeConfig({ queue: { workers: 4, capacity: 10, discipline: 'fifo' } })
      const scheduler = makeScheduler()
      const node = new GGcKNode(config, makeDist(), scheduler)

      const requests: Request[] = []
      for (let i = 0; i < 100; i++) {
        const req = makeRequest(`r${i}`)
        requests.push(req)
        node.handleArrival(req, BigInt(i))
      }

      // Capacity is 10, so first 10 accepted (4 workers + 6 queued), 90 rejected
      const metrics = node.getMetrics()
      expect(metrics.totalArrivals).toBe(100)
      expect(metrics.totalRejections).toBe(90)

      // Complete the 4 active workers → 4 auto-dequeued from queue
      for (let i = 0; i < 4; i++) {
        node.handleCompletion(requests[i], BigInt(1000 + i))
      }

      expect(node.getMetrics().totalCompleted).toBe(4)
      expect(node.getState().activeWorkers).toBe(4) // 4 auto-dequeued are now active
      expect(node.getState().queueLength).toBe(2)   // 6 - 4 = 2 remaining in queue
    })
  })

  describe('determinism', () => {
    it('same seed produces identical scheduled event timestamps', () => {
      const config = makeConfig()

      const s1 = makeScheduler()
      const n1 = new GGcKNode(config, makeDist('seed-A'), s1)
      n1.handleArrival(makeRequest('r1'), 0n)
      n1.handleArrival(makeRequest('r2'), 1n)

      const s2 = makeScheduler()
      const n2 = new GGcKNode(config, makeDist('seed-A'), s2)
      n2.handleArrival(makeRequest('r1'), 0n)
      n2.handleArrival(makeRequest('r2'), 1n)

      expect(s1.events.map((e) => e.timestamp)).toEqual(s2.events.map((e) => e.timestamp))
    })
  })
})
