import { expect, test, describe, vi } from 'vitest'
import { GGcKNode } from '../nodes/GGcKNode'

describe('GGcKNode', () => {
  // A helper function to generate a fake request
  const createFakeRequest = (id: string, priority = 1): any => ({
    id,
    priority
    // Add other fields if TypeScript complains
  })

  test('normal flow: processes arrivals immediately if workers available', () => {
    // 1. Arrange: Create our fake dependencies
    const fakeScheduler = {
      scheduleTimeEvent: vi.fn()
    } as any

    const fakeDistributions = {
      service: { sample: () => 10n } // Always takes 10 ticks
    } as any

    const fakeConfig = {
      id: 'node-1',
      queue: {
        workers: 2,
        capacity: 3,
        discipline: 'fifo'
      }
    } as any

    // 2. Act: Create the node
    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)

    // Send 1st request
    const req1 = createFakeRequest('req-1')
    const result1 = node.handleArrival(req1, 0n)

    // 3. Assert: Check the results!
    expect(result1.status).toBe('processed')
    expect(node.getState().activeWorkers).toBe(1)
    expect(fakeScheduler.scheduleTimeEvent).toHaveBeenCalledTimes(1)
  })
  test('queue flow: queues when workers busy, rejects when capacity full', () => {
    const fakeScheduler = { scheduleTimeEvent: vi.fn() } as any
    const fakeDistributions = { service: { sample: () => 10n } } as any
    const fakeConfig = {
      id: 'node-2',
      queue: { workers: 2, capacity: 3, discipline: 'fifo' }
    } as any
    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)
    // First 2 requests (processes immediately)
    node.handleArrival(createFakeRequest('req-1'), 0n)
    node.handleArrival(createFakeRequest('req-2'), 0n)
    // Next 3 requests (queued)
    const res3 = node.handleArrival(createFakeRequest('req-3'), 0n)
    node.handleArrival(createFakeRequest('req-4'), 0n)
    const res5 = node.handleArrival(createFakeRequest('req-5'), 0n)

    expect(res3.status).toBe('queued')
    expect(res5.status).toBe('queued')
    expect(node.getState().queueLength).toBe(3)
    expect(node.getState().status).toBe('saturated') // Node becomes saturated when queue is full
    // 6th request (should be rejected!)
    const res6 = node.handleArrival(createFakeRequest('req-6'), 0n)
    expect(res6.status).toBe('rejected')
    expect(node.getMetrics().requestsRejected).toBe(1)
  })
  test('completion flow: frees worker and pulls from queue', () => {
    const fakeScheduler = { scheduleTimeEvent: vi.fn() } as any
    const fakeDistributions = { service: { sample: () => 10n } } as any
    const fakeConfig = {
      id: 'node-3',
      queue: { workers: 1, capacity: 2, discipline: 'fifo' }
    } as any
    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)
    // Queue up 2 requests (1 processed, 1 queued)
    node.handleArrival(createFakeRequest('req-1'), 0n)
    node.handleArrival(createFakeRequest('req-2'), 0n)
    // Simulate the first request completing
    node.handleCompletion(createFakeRequest('req-1'), 10n)
    // The worker should be freed and the second request should start
    expect(node.getState().activeWorkers).toBe(1)
    expect(node.getState().queueLength).toBe(0)
    expect(fakeScheduler.scheduleTimeEvent).toHaveBeenCalledTimes(2) // 1 for req-1, 1 for req-2
  })
  test('failure flow: rejects all queued requests and stops processing', () => {
    const fakeScheduler = { scheduleTimeEvent: vi.fn() } as any
    const fakeDistributions = { service: { sample: () => 10n } } as any
    const fakeConfig = {
      id: 'node-4',
      queue: { workers: 1, capacity: 2, discipline: 'fifo' }
    } as any
    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)
    // Queue up 3 requests (1 processed, 2 queued)
    node.handleArrival(createFakeRequest('req-1'), 0n)
    node.handleArrival(createFakeRequest('req-2'), 0n)
    node.handleArrival(createFakeRequest('req-3'), 0n)
    // Fail the node
    node.fail(10n)
    expect(node.getState().status).toBe('failed')
    expect(node.getMetrics().requestsRejected).toBe(2) // The 2 queued requests should be rejected
    expect(fakeScheduler.scheduleTimeEvent).toHaveBeenCalledTimes(1) // Only the first processing event should exist
  })
  test('recovery flow: returns to idle state and accepts new requests', () => {
    const fakeScheduler = { scheduleTimeEvent: vi.fn() } as any
    const fakeDistributions = { service: { sample: () => 10n } } as any
    const fakeConfig = {
      id: 'node-5',
      queue: { workers: 1, capacity: 1, discipline: 'fifo' }
    } as any
    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)
    // Fail the node
    node.fail(10n)
    // Recover the node
    node.recover(20n)
    expect(node.getState().status).toBe('idle')
    // Send a new request
    const res = node.handleArrival(createFakeRequest('req-1'), 20n)
    expect(res.status).toBe('processed')
    expect(node.getState().activeWorkers).toBe(1)
  })
  test('priority discipline: processes higher priority requests first', () => {
    const fakeScheduler = { scheduleTimeEvent: vi.fn() } as any
    const fakeDistributions = { service: { sample: () => 10n } } as any
    const fakeConfig = {
      id: 'node-6',
      queue: { workers: 1, capacity: 3, discipline: 'priority' }
    } as any
    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)
    // Queue 3 requests with different priorities
    node.handleArrival(createFakeRequest('req-1', 2), 0n) // Low priority
    node.handleArrival(createFakeRequest('req-2', 0), 0n) // High priority
    node.handleArrival(createFakeRequest('req-3', 1), 0n) // Medium priority
    // The high priority request should be processed first
    // req-2 has highest priority (0). It's in the queue along with req-3.
    // Let's complete the first active request (req-1)
    node.handleCompletion(createFakeRequest('req-1', 2), 10n)
    node.handleCompletion(createFakeRequest('req-2', 0), 20n)

    expect(fakeScheduler.scheduleTimeEvent).toHaveBeenCalledTimes(3)
    const events = fakeScheduler.scheduleTimeEvent.mock.calls
    // 0: req-1 starts immediately. 1: req-2 dequeued. 2: req-3 dequeued
    expect(events[1][0].requestId).toBe('req-2')
    expect(events[2][0].requestId).toBe('req-3')
  })
  test('fifo discipline: processes requests in arrival order', () => {
    const fakeScheduler = { scheduleTimeEvent: vi.fn() } as any
    const fakeDistributions = { service: { sample: () => 10n } } as any
    const fakeConfig = {
      id: 'node-7',
      queue: { workers: 1, capacity: 3, discipline: 'fifo' }
    } as any
    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)
    // Queue 3 requests
    node.handleArrival(createFakeRequest('req-1'), 0n)
    node.handleArrival(createFakeRequest('req-2'), 0n)
    node.handleArrival(createFakeRequest('req-3'), 0n)
    // The requests should be processed in arrival order
    node.handleCompletion(createFakeRequest('req-1'), 10n)
    node.handleCompletion(createFakeRequest('req-2'), 20n)

    expect(fakeScheduler.scheduleTimeEvent).toHaveBeenCalledTimes(3)
    const events = fakeScheduler.scheduleTimeEvent.mock.calls
    expect(events[1][0].requestId).toBe('req-2')
    expect(events[2][0].requestId).toBe('req-3')
  })
  test('lifo discipline: processes requests in reverse arrival order', () => {
    const fakeScheduler = { scheduleTimeEvent: vi.fn() } as any
    const fakeDistributions = { service: { sample: () => 10n } } as any
    const fakeConfig = {
      id: 'node-8',
      queue: { workers: 1, capacity: 3, discipline: 'lifo' }
    } as any
    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)
    // Queue 3 requests
    node.handleArrival(createFakeRequest('req-1'), 0n)
    node.handleArrival(createFakeRequest('req-2'), 0n)
    node.handleArrival(createFakeRequest('req-3'), 0n)
    // The requests should be processed in reverse arrival order
    node.handleCompletion(createFakeRequest('req-1'), 10n)
    node.handleCompletion(createFakeRequest('req-3'), 20n)

    expect(fakeScheduler.scheduleTimeEvent).toHaveBeenCalledTimes(3)
    const events = fakeScheduler.scheduleTimeEvent.mock.calls
    expect(events[1][0].requestId).toBe('req-3')
    expect(events[2][0].requestId).toBe('req-2')
  })
  test('wfq discipline: processes requests based on weight (priority)', () => {
    const fakeScheduler = { scheduleTimeEvent: vi.fn() } as any
    const fakeDistributions = { service: { sample: () => 10n } } as any
    const fakeConfig = {
      id: 'node-9',
      queue: { workers: 1, capacity: 3, discipline: 'wfq' }
    } as any
    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)
    // Queue 3 requests with different weights
    node.handleArrival(createFakeRequest('req-1', 1), 0n) // Weight 1
    node.handleArrival(createFakeRequest('req-2', 3), 0n) // Weight 3 (highest)
    node.handleArrival(createFakeRequest('req-3', 2), 0n) // Weight 2
    // The request with the highest weight should be processed first (lower number = better weight in our priority queue setup for this test)
    node.handleCompletion(createFakeRequest('req-1', 1), 10n)
    node.handleCompletion(createFakeRequest('req-3', 2), 20n)

    expect(fakeScheduler.scheduleTimeEvent).toHaveBeenCalledTimes(3)
    const events = fakeScheduler.scheduleTimeEvent.mock.calls
    expect(events[1][0].requestId).toBe('req-3') // Weight 2 (Better than 3)
    expect(events[2][0].requestId).toBe('req-2') // Weight 3
  })
  test('utilization calculation: should be 100% when all workers busy', () => {
    const fakeScheduler = { scheduleTimeEvent: vi.fn() } as any
    const fakeDistributions = { service: { sample: () => 10n } } as any
    const fakeConfig = {
      id: 'node-10',
      queue: { workers: 2, capacity: 2, discipline: 'fifo' }
    } as any
    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)
    // Fill both workers
    node.handleArrival(createFakeRequest('req-1'), 0n)
    node.handleArrival(createFakeRequest('req-2'), 0n)
    expect(node.getState().utilization).toBe(1)
  })
  test('utilization calculation: should be 0% when idle', () => {
    const fakeScheduler = { scheduleTimeEvent: vi.fn() } as any
    const fakeDistributions = { service: { sample: () => 10n } } as any
    const fakeConfig = {
      id: 'node-11',
      queue: { workers: 2, capacity: 2, discipline: 'fifo' }
    } as any
    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)
    expect(node.getState().utilization).toBe(0)
  })
  test('utilization calculation: should be 50% when half workers busy', () => {
    const fakeScheduler = { scheduleTimeEvent: vi.fn() } as any
    const fakeDistributions = { service: { sample: () => 10n } } as any
    const fakeConfig = {
      id: 'node-12',
      queue: { workers: 2, capacity: 2, discipline: 'fifo' }
    } as any
    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)
    // Fill one worker
    node.handleArrival(createFakeRequest('req-1'), 0n)
    expect(node.getState().utilization).toBe(0.5)
  })
  test('saturation detection: should detect saturation when queue is full', () => {
    const fakeScheduler = { scheduleTimeEvent: vi.fn() } as any
    const fakeDistributions = { service: { sample: () => 10n } } as any
    const fakeConfig = {
      id: 'node-13',
      queue: { workers: 1, capacity: 2, discipline: 'fifo' }
    } as any
    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)
    // Fill the queue
    node.handleArrival(createFakeRequest('req-1'), 0n) // Worker 1
    node.handleArrival(createFakeRequest('req-2'), 0n) // Queue pos 1
    node.handleArrival(createFakeRequest('req-3'), 0n) // Queue pos 2
    expect(node.getState().status).toBe('saturated')
  })
  test('saturation detection: should not be saturated when queue has space', () => {
    const fakeScheduler = { scheduleTimeEvent: vi.fn() } as any
    const fakeDistributions = { service: { sample: () => 10n } } as any
    const fakeConfig = {
      id: 'node-14',
      queue: { workers: 1, capacity: 2, discipline: 'fifo' }
    } as any
    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)
    // Add only one request
    node.handleArrival(createFakeRequest('req-1'), 0n)
    expect(node.getState().status).toBe('busy')
  })
  test('metrics: correctly tracks metrics after processing 100 requests', () => {
    const fakeScheduler = { scheduleTimeEvent: vi.fn() } as any
    const fakeDistributions = { service: { sample: () => 10n } } as any

    // We'll give it 10 workers to easily process heavily
    const fakeConfig = {
      id: 'node-100',
      queue: { workers: 10, capacity: 100, discipline: 'fifo' }
    } as any

    const node = new GGcKNode(fakeConfig, fakeDistributions, fakeScheduler)

    // Send 100 requests and complete them immediately
    for (let i = 0; i < 100; i++) {
      const req = createFakeRequest(`req-${i}`)
      node.handleArrival(req, BigInt(i))
      node.handleCompletion(req, BigInt(i + 10))
    }

    // Check the metrics map
    const metrics = node.getMetrics()
    expect(metrics.requestsProcessed).toBe(100)
    expect(metrics.requestsRejected).toBeUndefined() // or 0, if we initialized it to 0
  })
})
