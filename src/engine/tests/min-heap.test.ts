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
    this.nodeId = id || `node-${Math.floor(Math.random() * 100)}`
    this.requestId = `req-${Math.random().toString(36).substr(2, 9)}`
    this.data = {}
  }
}

describe('MinHeap Correctness', () => {
  it('should order 10 scrambled events correctly', () => {
    const heap = new MinHeap<MockSimulationEvent>()

    // Create 10 events in scrambled order
    const scrambledEvents = [
      new MockSimulationEvent(500n, 5, 'event-1'),
      new MockSimulationEvent(100n, 2, 'event-2'),
      new MockSimulationEvent(300n, 1, 'event-3'),
      new MockSimulationEvent(100n, 1, 'event-4'),  // Same timestamp as event-2, lower priority
      new MockSimulationEvent(700n, 3, 'event-5'),
      new MockSimulationEvent(100n, 1, 'event-6'),  // Same timestamp and priority as event-4
      new MockSimulationEvent(200n, 8, 'event-7'),
      new MockSimulationEvent(900n, 1, 'event-8'),
      new MockSimulationEvent(100n, 3, 'event-9'),  // Same timestamp as event-2,4,6, higher priority
      new MockSimulationEvent(400n, 2, 'event-10'),
    ]

    // Insert in scrambled order
    scrambledEvents.forEach(event => heap.insert(event))

    // Extract all events
    const sorted: MockSimulationEvent[] = []
    while (!heap.isEmpty) {
      const event = heap.extractMin()
      if (event) sorted.push(event)
    }

    // Expected order (by timestamp, then priority, then insertion order):
    const expectedOrder = [
      'event-4',  // 100n, priority 1 (inserted first among 100n/priority-1)
      'event-6',  // 100n, priority 1 (inserted second among 100n/priority-1)
      'event-2',  // 100n, priority 2
      'event-9',  // 100n, priority 3
      'event-7',  // 200n, priority 8
      'event-3',  // 300n, priority 1
      'event-10', // 400n, priority 2
      'event-1',  // 500n, priority 5
      'event-5',  // 700n, priority 3
      'event-8',  // 900n, priority 1
    ]

    expect(sorted.length).toBe(10)
    expect(sorted.map(e => e.nodeId)).toEqual(expectedOrder)

    // Verify ordering rules are followed
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]

      // Primary: timestamp should be non-decreasing
      expect(prev.timestamp <= curr.timestamp).toBe(true)

      // Secondary: if same timestamp, priority should be non-decreasing
      if (prev.timestamp === curr.timestamp) {
        expect(prev.priority <= curr.priority).toBe(true)
      }
    }
  })

  it('should handle events with identical timestamp and priority (FIFO)', () => {
    const heap = new MinHeap<MockSimulationEvent>()

    // Create 5 events with identical timestamp and priority
    const events = [
      new MockSimulationEvent(100n, 5, 'first'),
      new MockSimulationEvent(100n, 5, 'second'),
      new MockSimulationEvent(100n, 5, 'third'),
      new MockSimulationEvent(100n, 5, 'fourth'),
      new MockSimulationEvent(100n, 5, 'fifth'),
    ]

    events.forEach(event => heap.insert(event))

    const sorted: MockSimulationEvent[] = []
    while (!heap.isEmpty) {
      const event = heap.extractMin()
      if (event) sorted.push(event)
    }

    // Should maintain insertion order (FIFO)
    expect(sorted.map(e => e.nodeId)).toEqual(['first', 'second', 'third', 'fourth', 'fifth'])
  })

  it('should handle mixed timestamp scenarios', () => {
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
      new MockSimulationEvent(2000n, 3, 'e10'),
      new MockSimulationEvent(6000n, 1, 'e11'),
      new MockSimulationEvent(1000n, 3, 'e12'),
    ]

    events.forEach(event => heap.insert(event))

    const sorted: MockSimulationEvent[] = []
    while (!heap.isEmpty) {
      const event = heap.extractMin()
      if (event) sorted.push(event)
    }

    expect(sorted.length).toBe(12)

    // Verify all 1000n events come first, ordered by priority then insertion
    const firstFour = sorted.slice(0, 5)
    expect(firstFour.every(e => e.timestamp === 1000n)).toBe(true)
    expect(firstFour.map(e => e.nodeId)).toEqual(['e2', 'e4', 'e8', 'e6', 'e12'])
  })
})

describe('MinHeap Performance', () => {
  it('should handle 1M insert+extract in < 2s', () => {
    const heap = new MinHeap<MockSimulationEvent>()
    const numOperations = 1_000_000

    const events: MockSimulationEvent[] = []
    for (let i = 0; i < numOperations; i++) {
      events.push(
        new MockSimulationEvent(
          BigInt(Math.floor(Math.random() * 1_000_000)),
          Math.floor(Math.random() * 10)
        )
      )
    }

    const startTime = performance.now()

    for (const event of events) {
      heap.insert(event)
    }

    const extracted: MockSimulationEvent[] = []
    while (!heap.isEmpty) {
      const event = heap.extractMin()
      if (event) extracted.push(event)
    }

    const endTime = performance.now()
    const duration = (endTime - startTime) / 1000

    console.log(`✓ 1M operations in ${duration.toFixed(3)}s`)

    expect(duration).toBeLessThan(2)
    expect(extracted.length).toBe(numOperations)
  })
})