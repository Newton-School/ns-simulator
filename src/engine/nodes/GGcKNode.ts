import { createEvent, Request } from '../events'
import { ComponentNode, DistributionConfig, EventScheduler, NodeMetrics, NodeState } from '../types'
import { Distributions } from '../distribution'

export type ArrivalResult =
  | { status: 'processed' }
  | { status: 'queued' }
  | { status: 'rejected'; reason: 'capacity_exceeded' | 'node_failed' }

export interface CompletionResult {
  nextRequest: Request | null
}

export class GGcKNode {
  private readonly id: string
  private readonly maxWorkers: number
  private readonly maxCapacity: number
  private readonly serviceDistribution: DistributionConfig
  private readonly discipline: 'fifo' | 'lifo' | 'priority' | 'wfq'

  private queue: Request[] = []
  private activeWorkers = 0
  private status: 'idle' | 'busy' | 'saturated' | 'failed' = 'idle'

  private readonly arrivalTimes = new Map<string, bigint>()
  private readonly startTimes = new Map<string, bigint>()

  private metrics: NodeMetrics = {
    totalArrivals: 0,
    totalCompleted: 0,
    totalRejections: 0,
    totalQueueTime: 0n,
    totalServiceTime: 0n,
    maxQueueLength: 0
  }

  private readonly distributions: Distributions
  private readonly scheduler: EventScheduler

  constructor(config: ComponentNode, distributions: Distributions, scheduler: EventScheduler) {
    if (!config.queue) {
      throw new Error(`GGcKNode requires a 'queue' configuration for component '${config.id}'.`)
    }
    this.id = config.id
    this.maxWorkers = config.queue.workers
    this.maxCapacity = config.queue.capacity
    this.discipline = config.queue.discipline
    this.serviceDistribution = config.processing?.distribution ?? { type: 'constant', value: 10 }
    this.distributions = distributions
    this.scheduler = scheduler
  }

  handleArrival(request: Request, currentTime: bigint): ArrivalResult {
    this.metrics.totalArrivals++

    if (this.status === 'failed') {
      this.metrics.totalRejections++
      return { status: 'rejected', reason: 'node_failed' }
    }

    const currentLoad = this.activeWorkers + this.queue.length

    if (currentLoad >= this.maxCapacity) {
      this.metrics.totalRejections++
      return { status: 'rejected', reason: 'capacity_exceeded' }
    }

    this.arrivalTimes.set(request.id, currentTime)

    if (this.activeWorkers < this.maxWorkers) {
      this.startProcessing(request, currentTime)
      this.updateStatus()
      return { status: 'processed' }
    }

    this.queue.push(request)
    this.metrics.maxQueueLength = Math.max(this.metrics.maxQueueLength, this.queue.length)
    this.updateStatus()
    return { status: 'queued' }
  }

  handleCompletion(request: Request, currentTime: bigint): CompletionResult {
    if (!this.startTimes.has(request.id)) {
      return { nextRequest: null }
    }

    if (this.activeWorkers > 0) {
      this.activeWorkers--
    }

    const startTime = this.startTimes.get(request.id) ?? currentTime
    this.metrics.totalServiceTime += currentTime - startTime
    this.metrics.totalCompleted++

    this.arrivalTimes.delete(request.id)
    this.startTimes.delete(request.id)

    if (this.status === 'failed') {
      return { nextRequest: null }
    }

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

    this.activeWorkers = 0
    this.startTimes.clear()
    this.arrivalTimes.clear()

    this.status = 'failed'
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  recover(_currentTime: bigint): void {
    this.status = 'idle'
  }

  getState(): NodeState {
    return {
      id: this.id,
      status: this.status,
      activeWorkers: this.activeWorkers,
      queueLength: this.queue.length,
      utilization: this.activeWorkers / this.maxWorkers,
      totalInSystem: this.activeWorkers + this.queue.length
    }
  }

  getMetrics(): NodeMetrics {
    return { ...this.metrics }
  }

  private startProcessing(request: Request, currentTime: bigint): void {
    this.activeWorkers++
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
      default: {
        const _exhaustive: never = this.discipline
        throw new Error(`Unknown queue discipline: ${_exhaustive}`)
      }
    }
  }

  private updateStatus(): void {
    if (this.status === 'failed') return

    if (this.activeWorkers === 0) {
      this.status = 'idle'
    } else if (this.activeWorkers >= this.maxWorkers && this.queue.length > 0) {
      this.status = 'saturated'
    } else {
      this.status = 'busy'
    }
  }
}
