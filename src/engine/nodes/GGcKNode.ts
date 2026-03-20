import { createEvent, Request } from '../events'
import {
  ComponentNode,
  DistributionConfig,
  NodeMetrics,
  EventScheduler,
  Distributions
} from '../types'

export class GGcKNode {
  private id: string
  private queue: Request[]
  private activeWorkers: number
  private maxWorkers: number
  private maxCapacity: number
  private state: 'idle' | 'busy' | 'saturated' | 'failed'
  private metrics: NodeMetrics
  private serviceDistribution: DistributionConfig
  private discipline: 'fifo' | 'lifo' | 'priority' | 'wfq'
  private scheduler: EventScheduler
  constructor(config: ComponentNode, distributions: Distributions, scheduler: EventScheduler) {
    if (!config.queue) {
      throw new Error(`GGcKNode requires a 'queue' configuration for component '${config.id}'.`)
    }
    const queueConfig = config.queue
    this.id = config.id
    this.queue = []
    this.activeWorkers = 0
    this.maxWorkers = queueConfig.workers
    this.maxCapacity = queueConfig.capacity
    this.state = 'idle'
    this.metrics = {}
    this.discipline = queueConfig.discipline
    this.serviceDistribution = distributions.service
    this.scheduler = scheduler
  }
  handleArrival(request: Request, currentTime: bigint) {
    if (this.state === 'failed') return { status: 'rejected' }
    if (this.activeWorkers < this.maxWorkers) {
      this.activeWorkers++
      this.startProcessing(request, currentTime)
      return { status: 'processed' }
    }
    if (this.queue.length < this.maxCapacity) {
      this.queue.push(request)
      if (this.queue.length == this.maxCapacity) {
        this.state = 'saturated'
      }
      return { status: 'queued' }
    }
    this.metrics.requestsRejected = (this.metrics.requestsRejected || 0) + 1
    return { status: 'rejected' }
  }
  startProcessing(request: Request, currentTime: bigint) {
    const serviceTime = (this.serviceDistribution as any).sample?.() || 10n
    const event = createEvent(
      'processing-complete',
      this.id,
      request.id,
      {},
      currentTime + serviceTime
    )
    if (this.state === 'idle') {
      this.state = 'busy'
    }
    this.scheduler.scheduleTimeEvent(event)
  }
  handleCompletion(_request: Request, currentTime: bigint) {
    void _request
    // If the node has failed, do not process any more work from the queue.
    // Still decrement the worker count safely to keep internal accounting consistent.
    if (this.state === 'failed') {
      if (this.activeWorkers > 0) {
        this.activeWorkers--
      } else {
        this.activeWorkers = 0
      }
      return
    }

    if (this.activeWorkers > 0) {
      this.activeWorkers--
    } else {
      this.activeWorkers = 0
    }

    this.metrics.requestsProcessed = (this.metrics.requestsProcessed || 0) + 1
    if (this.queue.length > 0) {
      let nextRequest: Request | undefined
      switch (this.discipline) {
        case 'fifo':
          nextRequest = this.queue.shift()
          break
        case 'lifo':
          nextRequest = this.queue.pop()
          break
        case 'priority':
        case 'wfq': {
          let highestPriorityIndex = 0
          for (let i = 1; i < this.queue.length; i++) {
            if (this.queue[i].priority < this.queue[highestPriorityIndex].priority) {
              highestPriorityIndex = i
            }
          }
          nextRequest = this.queue.splice(highestPriorityIndex, 1)[0]
          break
        }
      }
      if (nextRequest && this.activeWorkers < this.maxWorkers) {
        this.activeWorkers++
        this.startProcessing(nextRequest, currentTime)
      }
      this.state = this.queue.length >= this.maxCapacity ? 'saturated' : 'busy'
    } else {
      this.state = 'idle'
    }
  }
  fail(_currentTime: bigint) {
    void _currentTime
    this.metrics.requestsRejected = (this.metrics.requestsRejected || 0) + this.queue.length
    this.queue = []
    this.activeWorkers = 0
    this.state = 'failed'
  }
  recover(_currentTime: bigint) {
    void _currentTime
    this.state = 'idle'
  }
  getMetrics() {
    return this.metrics
  }
  getState() {
    return {
      id: this.id,
      status: this.state,
      activeWorkers: this.activeWorkers,
      queueLength: this.queue.length,
      utilization: this.activeWorkers > 0 ? this.activeWorkers / this.maxWorkers : 0
    }
  }
}
