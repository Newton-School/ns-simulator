import { describe, it, expect } from 'vitest'
import { MinHeap } from '../min-heap'
import { SimulationEvent, EventType } from '../../core/events'

class MockSimulationEvent implements SimulationEvent {
  timestamp: bigint
  type: EventType
  nodeId: string
  requestId: string
  data: Record<string, unknown>
  priority: number

  constructor(timestamp: bigint, priority: number, id: string = '') {
    this.timestamp = timestamp
    this.priority = priority
    this.type = 'request-generated'
    this.nodeId = id || 'node-1'
    this.requestId = 'req-1'
    this.data = {}
  }
}

class LightweightEvent implements SimulationEvent {
  type: EventType = 'request-generated'
  nodeId: string = 'node-1'
  requestId: string = 'req-1'
  data: Record<string, unknown> = {}

  constructor(
    public timestamp: bigint,
    public priority: number
  ) {}
}

describe('MinHeap Correctness', () => {
  it('should order 10 scrambled events correctly', () => {
    const heap = new MinHeap<MockSimulationEvent>()

    const scrambledEvents = [
      new MockSimulationEvent(500n, 5, 'event-1'),
      new MockSimulationEvent(100n, 2, 'event-2'),
      new MockSimulationEvent(300n, 1, 'event-3'),
      new MockSimulationEvent(100n, 1, 'event-4'),
      new MockSimulationEvent(700n, 3, 'event-5'),
      new MockSimulationEvent(100n, 1, 'event-6'),
      new MockSimulationEvent(200n, 8, 'event-7'),
      new MockSimulationEvent(900n, 1, 'event-8'),
      new MockSimulationEvent(100n, 3, 'event-9'),
      new MockSimulationEvent(400n, 2, 'event-10')
    ]

    scrambledEvents.forEach((event) => heap.insert(event))

    const sorted: MockSimulationEvent[] = []
    while (!heap.isEmpty) {
      const event = heap.extractMin()
      if (event) sorted.push(event)
    }

    const expectedOrder = [
      'event-4',
      'event-6',
      'event-2',
      'event-9',
      'event-7',
      'event-3',
      'event-10',
      'event-1',
      'event-5',
      'event-8'
    ]

    expect(sorted.length).toBe(10)
    expect(sorted.map((e) => e.nodeId)).toEqual(expectedOrder)

    // Verify ordering rules
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      expect(prev.timestamp <= curr.timestamp).toBe(true)
      if (prev.timestamp === curr.timestamp) {
        expect(prev.priority <= curr.priority).toBe(true)
      }
    }
  })

  it('should handle events with identical timestamp and priority (FIFO)', () => {
    const heap = new MinHeap<MockSimulationEvent>()

    const events = [
      new MockSimulationEvent(100n, 5, 'first'),
      new MockSimulationEvent(100n, 5, 'second'),
      new MockSimulationEvent(100n, 5, 'third'),
      new MockSimulationEvent(100n, 5, 'fourth'),
      new MockSimulationEvent(100n, 5, 'fifth')
    ]

    events.forEach((event) => heap.insert(event))

    const sorted: MockSimulationEvent[] = []
    while (!heap.isEmpty) {
      const event = heap.extractMin()
      if (event) sorted.push(event)
    }

    expect(sorted.map((e) => e.nodeId)).toEqual(['first', 'second', 'third', 'fourth', 'fifth'])
  })

  it('should maintain correct ordering for mixed scenarios', () => {
    const heap = new MinHeap<MockSimulationEvent>()

    const events = [
      new MockSimulationEvent(5000n, 10, 'e1'),
      new MockSimulationEvent(1000n, 1, 'e2'),
      new MockSimulationEvent(3000n, 5, 'e3'),
      new MockSimulationEvent(1000n, 1, 'e4'),
      new MockSimulationEvent(2000n, 3, 'e5'),
      new MockSimulationEvent(1000n, 2, 'e6'),
      new MockSimulationEvent(4000n, 7, 'e7'),
      new MockSimulationEvent(1000n, 1, 'e8'),
      new MockSimulationEvent(3000n, 4, 'e9'),
      new MockSimulationEvent(2000n, 3, 'e10')
    ]

    events.forEach((event) => heap.insert(event))

    const sorted: MockSimulationEvent[] = []
    while (!heap.isEmpty) {
      const event = heap.extractMin()
      if (event) sorted.push(event)
    }

    expect(sorted.length).toBe(10)

    const firstFour = sorted.slice(0, 4)
    expect(firstFour.every((e) => e.timestamp === 1000n)).toBe(true)
    expect(firstFour.map((e) => e.nodeId)).toEqual(['e2', 'e4', 'e8', 'e6'])
  })
})

// Gated behind an environment variable to prevent blocking standard CI runs
describe.runIf(process.env.RUN_PERF_TESTS)('MinHeap Performance', () => {
  // Added an explicit large timeout (30 seconds) for heavy operations
  it('should handle 1M operations without errors', { timeout: 30000 }, () => {
    const heap = new MinHeap<LightweightEvent>()
    const numOperations = 1_000_000

    // Insert on-the-fly (no pre-allocation)
    for (let i = 0; i < numOperations; i++) {
      heap.insert(
        new LightweightEvent(
          BigInt(Math.floor(Math.random() * 1_000_000)),
          Math.floor(Math.random() * 10)
        )
      )
    }

    let extractCount = 0
    while (!heap.isEmpty) {
      heap.extractMin()
      extractCount++
    }

    expect(extractCount).toBe(numOperations)
  })

  it('should scale logarithmically (O(log n) complexity)', () => {
    const testSizes = [10_000, 50_000, 100_000]
    const iterations = 5
    const averageTimings: number[] = []

    // JIT Warm-up to normalize CPU state before measurement
    const warmupHeap = new MinHeap<LightweightEvent>()
    for (let i = 0; i < 5000; i++) warmupHeap.insert(new LightweightEvent(1n, 1))
    while (!warmupHeap.isEmpty) warmupHeap.extractMin()

    // Multiple iterations to calculate statistical tolerance
    for (const n of testSizes) {
      let totalTime = 0

      for (let iter = 0; iter < iterations; iter++) {
        const heap = new MinHeap<LightweightEvent>()
        const start = performance.now()

        for (let i = 0; i < n; i++) {
          heap.insert(new LightweightEvent(BigInt(i), i % 10))
        }

        while (!heap.isEmpty) {
          heap.extractMin()
        }

        totalTime += performance.now() - start
      }

      averageTimings.push(totalTime / iterations)
    }

    // Evaluate complexity using averaged timings to mitigate CI wall-clock variance.
    const ratio = averageTimings[2] / averageTimings[0]
    expect(ratio).toBeLessThan(20)
  })
})
