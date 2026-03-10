import { SimulationEvent } from './events'

export class MinHeap<T extends SimulationEvent> {
  private heap: { event: T; seq: number }[] = []
  private _counter = 0

  get size(): number {
    return this.heap.length
  }
  get isEmpty(): boolean {
    return this.heap.length === 0
  }

  peek(): T | undefined {
    return this.heap[0]?.event
  }

  insert(event: T): void {
    //Use a per-heap sequence counter to ensure stable FIFO for identical TS/Priority within this heap
    this.heap.push({ event, seq: this._counter++ })
    this.bubbleUp(this.heap.length - 1)
  }

  extractMin(): T | undefined {
    if (this.isEmpty) return undefined
    if (this.size === 1) return this.heap.pop()!.event

    const min = this.heap[0].event
    this.heap[0] = this.heap.pop()!
    this.bubbleDown(0)
    return min
  }

  private compare(a: { event: T; seq: number }, b: { event: T; seq: number }): number {
    // Primary: Timestamp (BigInt)
    if (a.event.timestamp < b.event.timestamp) return -1
    if (a.event.timestamp > b.event.timestamp) return 1

    // Secondary: Priority (Lower number = Higher Priority)
    if (a.event.priority < b.event.priority) return -1
    if (a.event.priority > b.event.priority) return 1

    // Tertiary: Stability (Insertion Order via Sequence Number)
    return a.seq - b.seq
  }

  private bubbleUp(index: number): void {
    const element = this.heap[index]
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      const parent = this.heap[parentIndex]
      if (this.compare(element, parent) < 0) {
        this.heap[index] = parent
        index = parentIndex
      } else break
    }
    this.heap[index] = element
  }

  private bubbleDown(index: number): void {
    const length = this.size
    const element = this.heap[index]

    while (true) {
      const leftChildIdx = 2 * index + 1
      const rightChildIdx = 2 * index + 2
      let swapIdx: number | null = null

      if (leftChildIdx < length) {
        if (this.compare(this.heap[leftChildIdx], element) < 0) {
          swapIdx = leftChildIdx
        }
      }

      if (rightChildIdx < length) {
        if (
          (swapIdx === null && this.compare(this.heap[rightChildIdx], element) < 0) ||
          (swapIdx !== null && this.compare(this.heap[rightChildIdx], this.heap[leftChildIdx]) < 0)
        ) {
          swapIdx = rightChildIdx
        }
      }

      if (swapIdx === null) break
      this.heap[index] = this.heap[swapIdx]
      index = swapIdx
    }
    this.heap[index] = element
  }
}
