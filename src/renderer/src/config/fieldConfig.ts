import type { CanvasNodeDataV2, NodeProfile } from '../../../engine/catalog/nodeSpecTypes'

export type FieldPath = string
export type AccuracyClass = 'invariant' | 'default-override' | 'user-parameter' | 'not-simulated'

export type FieldDefinition =
  | {
      type: 'slider'
      label: string
      min: number
      max: number
      unit?: string
      visible?: (data: CanvasNodeDataV2) => boolean
    }
  | {
      type: 'select'
      label: string
      options: string[]
      visible?: (data: CanvasNodeDataV2) => boolean
    }
  | {
      type: 'input'
      label: string
      unit?: string
      step?: number
      visible?: (data: CanvasNodeDataV2) => boolean
    }
  | {
      type: 'boolean'
      label: string
      visible?: (data: CanvasNodeDataV2) => boolean
    }

const isDistribution = (data: CanvasNodeDataV2, type: string) =>
  data.sim?.processing?.distribution?.type === type

export const FIELD_DEFINITIONS: Record<FieldPath, FieldDefinition> = {
  'source.defaultWorkload.pattern': {
    type: 'select',
    label: 'Pattern',
    options: ['constant', 'poisson', 'bursty', 'diurnal', 'spike', 'sawtooth']
  },
  'source.defaultWorkload.baseRps': {
    type: 'input',
    label: 'Base RPS',
    unit: 'req/s'
  },
  'source.defaultWorkload.bursty.burstRps': {
    type: 'input',
    label: 'Burst RPS',
    unit: 'req/s',
    visible: (data) => data.source?.defaultWorkload.pattern === 'bursty'
  },
  'source.defaultWorkload.bursty.burstDuration': {
    type: 'input',
    label: 'Burst Duration',
    unit: 'ms',
    visible: (data) => data.source?.defaultWorkload.pattern === 'bursty'
  },
  'source.defaultWorkload.bursty.normalDuration': {
    type: 'input',
    label: 'Normal Duration',
    unit: 'ms',
    visible: (data) => data.source?.defaultWorkload.pattern === 'bursty'
  },
  'source.defaultWorkload.spike.spikeTime': {
    type: 'input',
    label: 'Spike Time',
    unit: 'ms',
    visible: (data) => data.source?.defaultWorkload.pattern === 'spike'
  },
  'source.defaultWorkload.spike.spikeRps': {
    type: 'input',
    label: 'Spike RPS',
    unit: 'req/s',
    visible: (data) => data.source?.defaultWorkload.pattern === 'spike'
  },
  'source.defaultWorkload.spike.spikeDuration': {
    type: 'input',
    label: 'Spike Duration',
    unit: 'ms',
    visible: (data) => data.source?.defaultWorkload.pattern === 'spike'
  },
  'source.defaultWorkload.sawtooth.peakRps': {
    type: 'input',
    label: 'Peak RPS',
    unit: 'req/s',
    visible: (data) => data.source?.defaultWorkload.pattern === 'sawtooth'
  },
  'source.defaultWorkload.sawtooth.rampDuration': {
    type: 'input',
    label: 'Ramp Duration',
    unit: 'ms',
    visible: (data) => data.source?.defaultWorkload.pattern === 'sawtooth'
  },
  routingStrategy: {
    type: 'select',
    label: 'Routing Strategy',
    options: ['passthrough', 'round-robin', 'random', 'weighted', 'least-conn', 'broadcast']
  },
  'sim.queue.workers': { type: 'input', label: 'Workers', unit: 'count' },
  'sim.queue.capacity': { type: 'input', label: 'Capacity', unit: 'req' },
  'sim.queue.discipline': {
    type: 'select',
    label: 'Queue Discipline',
    options: ['fifo', 'lifo', 'priority']
  },
  'sim.processing.timeout': { type: 'input', label: 'Timeout', unit: 'ms' },
  'sim.processing.distribution.type': {
    type: 'select',
    label: 'Distribution',
    options: ['constant', 'exponential', 'log-normal', 'normal']
  },
  'sim.processing.distribution.value': {
    type: 'input',
    label: 'Constant Value',
    unit: 'ms',
    visible: (data) => isDistribution(data, 'constant') || isDistribution(data, 'deterministic')
  },
  'sim.processing.distribution.lambda': {
    type: 'input',
    label: 'Lambda',
    step: 0.001,
    visible: (data) => isDistribution(data, 'exponential')
  },
  'sim.processing.distribution.mu': {
    type: 'input',
    label: 'Mu',
    step: 0.01,
    visible: (data) => isDistribution(data, 'log-normal')
  },
  'sim.processing.distribution.sigma': {
    type: 'input',
    label: 'Sigma',
    step: 0.01,
    visible: (data) => isDistribution(data, 'log-normal')
  },
  'sim.processing.distribution.mean': {
    type: 'input',
    label: 'Mean',
    step: 0.01,
    visible: (data) => isDistribution(data, 'normal')
  },
  'sim.processing.distribution.stdDev': {
    type: 'input',
    label: 'Std Dev',
    step: 0.01,
    visible: (data) => isDistribution(data, 'normal')
  },
  'sim.nodeErrorRate': {
    type: 'input',
    label: 'Node Error Rate',
    unit: 'ratio',
    step: 0.001
  },
  'sim.securityPolicy.blockRate': {
    type: 'input',
    label: 'Block Rate',
    unit: 'ratio',
    step: 0.001
  },
  'sim.securityPolicy.droppedPackets': {
    type: 'input',
    label: 'Dropped Packets',
    unit: 'ratio',
    step: 0.001
  },
  'sim.slo.latencyP99': { type: 'input', label: 'SLO P99', unit: 'ms' },
  'sim.slo.availabilityTarget': {
    type: 'input',
    label: 'Availability Target',
    unit: 'ratio',
    step: 0.001
  }
}

export const FIELD_ACCURACY: Partial<Record<FieldPath, AccuracyClass>> = {
  routingStrategy: 'user-parameter',
  'source.defaultWorkload.pattern': 'user-parameter',
  'source.defaultWorkload.baseRps': 'user-parameter',
  'source.defaultWorkload.bursty.burstRps': 'user-parameter',
  'source.defaultWorkload.bursty.burstDuration': 'user-parameter',
  'source.defaultWorkload.bursty.normalDuration': 'user-parameter',
  'source.defaultWorkload.spike.spikeTime': 'user-parameter',
  'source.defaultWorkload.spike.spikeRps': 'user-parameter',
  'source.defaultWorkload.spike.spikeDuration': 'user-parameter',
  'source.defaultWorkload.sawtooth.peakRps': 'user-parameter',
  'source.defaultWorkload.sawtooth.rampDuration': 'user-parameter',
  'sim.queue.workers': 'user-parameter',
  'sim.queue.capacity': 'user-parameter',
  'sim.queue.discipline': 'user-parameter',
  'sim.processing.timeout': 'user-parameter',
  'sim.processing.distribution.type': 'user-parameter',
  'sim.processing.distribution.value': 'user-parameter',
  'sim.processing.distribution.lambda': 'user-parameter',
  'sim.processing.distribution.mu': 'user-parameter',
  'sim.processing.distribution.sigma': 'user-parameter',
  'sim.processing.distribution.mean': 'user-parameter',
  'sim.processing.distribution.stdDev': 'user-parameter',
  'sim.nodeErrorRate': 'user-parameter',
  'sim.securityPolicy.blockRate': 'user-parameter',
  'sim.securityPolicy.droppedPackets': 'user-parameter',
  'sim.slo.latencyP99': 'user-parameter',
  'sim.slo.availabilityTarget': 'user-parameter'
}

export const PROFILE_FIELD_GROUPS: Record<NodeProfile, Record<string, FieldPath[]>> = {
  source: {
    Workload: ['source.defaultWorkload.pattern', 'source.defaultWorkload.baseRps'],
    Pattern: [
      'source.defaultWorkload.bursty.burstRps',
      'source.defaultWorkload.bursty.burstDuration',
      'source.defaultWorkload.bursty.normalDuration',
      'source.defaultWorkload.spike.spikeTime',
      'source.defaultWorkload.spike.spikeRps',
      'source.defaultWorkload.spike.spikeDuration',
      'source.defaultWorkload.sawtooth.peakRps',
      'source.defaultWorkload.sawtooth.rampDuration'
    ]
  },
  router: {
    Routing: ['routingStrategy'],
    Queueing: ['sim.queue.workers', 'sim.queue.capacity', 'sim.queue.discipline'],
    Processing: [
      'sim.processing.timeout',
      'sim.processing.distribution.type',
      'sim.processing.distribution.value',
      'sim.processing.distribution.lambda',
      'sim.processing.distribution.mu',
      'sim.processing.distribution.sigma',
      'sim.processing.distribution.mean',
      'sim.processing.distribution.stdDev'
    ],
    Reliability: ['sim.nodeErrorRate', 'sim.slo.latencyP99', 'sim.slo.availabilityTarget']
  },
  'compute-service': {
    Queueing: ['sim.queue.workers', 'sim.queue.capacity', 'sim.queue.discipline'],
    Processing: [
      'sim.processing.timeout',
      'sim.processing.distribution.type',
      'sim.processing.distribution.value',
      'sim.processing.distribution.lambda',
      'sim.processing.distribution.mu',
      'sim.processing.distribution.sigma',
      'sim.processing.distribution.mean',
      'sim.processing.distribution.stdDev'
    ],
    Reliability: ['sim.nodeErrorRate', 'sim.slo.latencyP99', 'sim.slo.availabilityTarget']
  },
  worker: {
    Queueing: ['sim.queue.workers', 'sim.queue.capacity', 'sim.queue.discipline'],
    Processing: [
      'sim.processing.timeout',
      'sim.processing.distribution.type',
      'sim.processing.distribution.value',
      'sim.processing.distribution.lambda',
      'sim.processing.distribution.mu',
      'sim.processing.distribution.sigma',
      'sim.processing.distribution.mean',
      'sim.processing.distribution.stdDev'
    ],
    Reliability: ['sim.nodeErrorRate', 'sim.slo.latencyP99', 'sim.slo.availabilityTarget']
  },
  datastore: {
    Queueing: ['sim.queue.workers', 'sim.queue.capacity', 'sim.queue.discipline'],
    Processing: [
      'sim.processing.timeout',
      'sim.processing.distribution.type',
      'sim.processing.distribution.value',
      'sim.processing.distribution.lambda',
      'sim.processing.distribution.mu',
      'sim.processing.distribution.sigma',
      'sim.processing.distribution.mean',
      'sim.processing.distribution.stdDev'
    ],
    Reliability: ['sim.nodeErrorRate', 'sim.slo.latencyP99', 'sim.slo.availabilityTarget']
  },
  broker: {
    Queueing: ['sim.queue.workers', 'sim.queue.capacity', 'sim.queue.discipline'],
    Processing: [
      'sim.processing.timeout',
      'sim.processing.distribution.type',
      'sim.processing.distribution.value',
      'sim.processing.distribution.lambda',
      'sim.processing.distribution.mu',
      'sim.processing.distribution.sigma',
      'sim.processing.distribution.mean',
      'sim.processing.distribution.stdDev'
    ],
    Reliability: ['sim.nodeErrorRate']
  },
  'security-filter': {
    Queueing: ['sim.queue.workers', 'sim.queue.capacity', 'sim.queue.discipline'],
    Processing: [
      'sim.processing.timeout',
      'sim.processing.distribution.type',
      'sim.processing.distribution.value',
      'sim.processing.distribution.lambda',
      'sim.processing.distribution.mu',
      'sim.processing.distribution.sigma',
      'sim.processing.distribution.mean',
      'sim.processing.distribution.stdDev'
    ],
    Security: ['sim.securityPolicy.blockRate', 'sim.securityPolicy.droppedPackets'],
    Reliability: ['sim.nodeErrorRate', 'sim.slo.latencyP99', 'sim.slo.availabilityTarget']
  },
  'control-plane': {
    Queueing: ['sim.queue.workers', 'sim.queue.capacity', 'sim.queue.discipline'],
    Processing: [
      'sim.processing.timeout',
      'sim.processing.distribution.type',
      'sim.processing.distribution.value',
      'sim.processing.distribution.lambda',
      'sim.processing.distribution.mu',
      'sim.processing.distribution.sigma',
      'sim.processing.distribution.mean',
      'sim.processing.distribution.stdDev'
    ],
    Reliability: ['sim.nodeErrorRate', 'sim.slo.latencyP99', 'sim.slo.availabilityTarget']
  },
  observability: {
    Queueing: ['sim.queue.workers', 'sim.queue.capacity', 'sim.queue.discipline'],
    Processing: [
      'sim.processing.timeout',
      'sim.processing.distribution.type',
      'sim.processing.distribution.value',
      'sim.processing.distribution.lambda',
      'sim.processing.distribution.mu',
      'sim.processing.distribution.sigma',
      'sim.processing.distribution.mean',
      'sim.processing.distribution.stdDev'
    ],
    Reliability: ['sim.nodeErrorRate', 'sim.slo.latencyP99', 'sim.slo.availabilityTarget']
  },
  integration: {
    Queueing: ['sim.queue.workers', 'sim.queue.capacity', 'sim.queue.discipline'],
    Processing: [
      'sim.processing.timeout',
      'sim.processing.distribution.type',
      'sim.processing.distribution.value',
      'sim.processing.distribution.lambda',
      'sim.processing.distribution.mu',
      'sim.processing.distribution.sigma',
      'sim.processing.distribution.mean',
      'sim.processing.distribution.stdDev'
    ],
    Reliability: ['sim.nodeErrorRate', 'sim.slo.latencyP99', 'sim.slo.availabilityTarget']
  },
  composite: {}
}
