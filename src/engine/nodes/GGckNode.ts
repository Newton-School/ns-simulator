import { ComponentNode, DistributionConfig, NodeMetrics } from '../types'
import { Request, SimulationEvent, createEvent } from '../events'
import { Distributions } from '../distribution'

export interface EventScheduler {
  schedule(event: SimulationEvent): void
}

export type ArrivalResult =
  | { accepted: true }
  | { accepted: false; reason: 'capacity_exceeded' | 'node_failed' }

export interface CompletionResult {
  nextRequest: Request | null
}

export interface NodeState {
  id: string
  status: 'idle' | 'busy' | 'saturated' | 'failed'
  activeWorkers: number
  queueLength: number
  utilization: number
  totalInSystem: number
}

export class GGcKNode {
  private readonly id: string
  private readonly maxWorkers: number
  private readonly maxCapacity: number
  private readonly serviceDistribution: DistributionConfig
  private readonly discipline: 'fifo' | 'lifo' | 'priority' | 'wfq'

  private queue: Request[] = []
  private activeWorkers = new Set<string>()
  private status: 'idle' | 'busy' | 'saturated' | 'failed' = 'idle'

  private arrivalTimes = new Map<string, bigint>()
  private startTimes = new Map<string, bigint>()

  private metrics: NodeMetrics = {
    totalArrivals: 0,
    totalCompleted: 0,
    totalFailed: 0,
    totalTimeout: 0,
    totalRejections: 0,
    totalRetries: 0,
    totalRetriesFailed: 0,
    totalRetriesSucceeded: 0,
    totalQueueTime: 0n,
    totalServiceTime: 0n,
    maxQueueLength: 0
  }

  private readonly distributions: Distributions
  private readonly scheduler: EventScheduler

  constructor(config: ComponentNode, distributions: Distributions, scheduler: EventScheduler) {
    this.id = config.id
    this.maxWorkers = config.queue?.workers ?? 1
    this.maxCapacity = config.queue?.capacity ?? 100
    this.serviceDistribution = config.processing?.distribution ?? { type: 'constant', value: 10 }
    this.discipline = config.queue?.discipline ?? 'fifo'
    this.distributions = distributions
    this.scheduler = scheduler
  }

  handleArrival(request: Request, currentTime: bigint): ArrivalResult {
    this.metrics.totalArrivals++
    this.arrivalTimes.set(request.id, currentTime)

    if (this.status === 'failed') {
      this.metrics.totalRejections++
      return { accepted: false, reason: 'node_failed' }
    }

    const currentLoad = this.queue.length + this.activeWorkers.size

    if (currentLoad >= this.maxCapacity) {
      this.metrics.totalRejections++
      return { accepted: false, reason: 'capacity_exceeded' }
    }

    if (this.activeWorkers.size < this.maxWorkers) {
      this.startProcessing(request, currentTime)
    } else {
      this.enqueue(request)
      this.metrics.maxQueueLength = Math.max(this.metrics.maxQueueLength, this.queue.length)
    }

    this.updateStatus()
    return { accepted: true }
  }

  handleCompletion(request: Request, currentTime: bigint): CompletionResult {
    this.metrics.totalCompleted++
    this.activeWorkers.delete(request.id)

    const startTime = this.startTimes.get(request.id) ?? currentTime
    const serviceTime = currentTime - startTime
    this.metrics.totalServiceTime += serviceTime

    this.arrivalTimes.delete(request.id)
    this.startTimes.delete(request.id)

    let nextRequest: Request | null = null
    if (this.queue.length > 0) {
      const dequeued = this.dequeue()
      if (dequeued) {
        this.startProcessing(dequeued, currentTime)
        nextRequest = dequeued
      }
    }

    this.updateStatus()
    return { nextRequest }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fail(_currentTime: bigint): void {
    this.metrics.totalRejections += this.queue.length
    this.queue = []
    this.status = 'failed'
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  recover(_currentTime: bigint): void {
    this.status = this.activeWorkers.size > 0 ? 'busy' : 'idle'
  }

  getState(): NodeState {
    return {
      id: this.id,
      status: this.status,
      activeWorkers: this.activeWorkers.size,
      queueLength: this.queue.length,
      utilization: this.activeWorkers.size / this.maxWorkers,
      totalInSystem: this.queue.length + this.activeWorkers.size
    }
  }

  getMetrics(): NodeMetrics {
    return { ...this.metrics }
  }

  private startProcessing(request: Request, currentTime: bigint): void {
    this.activeWorkers.add(request.id)
    this.startTimes.set(request.id, currentTime)

    const arrivalTime = this.arrivalTimes.get(request.id) ?? currentTime
    this.metrics.totalQueueTime += currentTime - arrivalTime

    const serviceTimeMs = Math.max(0, this.distributions.fromConfig(this.serviceDistribution))
    const serviceTimeMicro = BigInt(Math.round(serviceTimeMs * 1000))

    this.scheduler.schedule(
      createEvent(
        'processing-complete',
        this.id,
        request.id,
        { request },
        currentTime + serviceTimeMicro
      )
    )
  }

  private enqueue(request: Request): void {
    this.queue.push(request)
  }

  private dequeue(): Request | undefined {
    if (this.queue.length === 0) return undefined

    switch (this.discipline) {
      case 'fifo':
      case 'wfq':
        return this.queue.shift()
      case 'lifo':
        return this.queue.pop()
      case 'priority': {
        let bestIdx = 0
        for (let i = 1; i < this.queue.length; i++) {
          if (this.queue[i].priority < this.queue[bestIdx].priority) {
            bestIdx = i
          }
        }
        return this.queue.splice(bestIdx, 1)[0]
      }
      default:
        return this.queue.shift()
    }
  }

  private updateStatus(): void {
    if (this.status === 'failed') return

    if (this.activeWorkers.size === 0) {
      this.status = 'idle'
    } else if (this.activeWorkers.size >= this.maxWorkers && this.queue.length > 0) {
      this.status = 'saturated'
    } else {
      this.status = 'busy'
    }
  }
}
