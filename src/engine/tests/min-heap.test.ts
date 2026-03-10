import { describe, it, expect } from 'vitest'
import { MinHeap } from '../min-heap'
import { SimulationEvent, EventType } from '../events'

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

describe('MinHeap Performance', () => {
  it('should handle 1M operations without errors', () => {
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
    const timings: number[] = []

    for (const n of testSizes) {
      const heap = new MinHeap<LightweightEvent>()
      const start = performance.now()

      for (let i = 0; i < n; i++) {
        heap.insert(new LightweightEvent(BigInt(i), i % 10))
      }

      while (!heap.isEmpty) {
        heap.extractMin()
      }

      timings.push(performance.now() - start)
    }

    // With O(log n), 10x more data shouldn't take 10x more time
    const ratio = timings[2] / timings[0]
    expect(ratio).toBeLessThan(15)
  })
})
