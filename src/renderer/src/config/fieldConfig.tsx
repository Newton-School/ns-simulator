import type { AnyNodeDataKey } from '@renderer/types/ui'

export type FieldKey = AnyNodeDataKey

export type FieldDefinition =
  | {
      type: 'slider'
      label: string
      min: number
      max: number
      unit?: string
    }
  | {
      type: 'select'
      label: string
      options: string[]
    }
  | {
      type: 'input'
      label: string
      unit?: string
      step?: number
    }
  | {
      type: 'boolean'
      label: string
    }

export const FIELD_DEFINITIONS: Partial<Record<FieldKey, FieldDefinition>> = {
  // --- General ---
  status: { type: 'select', label: 'Health Status', options: ['healthy', 'degraded', 'critical'] },

  // --- Metrics ---
  throughput: { type: 'slider', label: 'Throughput', min: 0, max: 100000, unit: 'req/s' },
  errorRate: { type: 'input', label: 'Error Rate', unit: '%', step: 0.01 },
  load: { type: 'slider', label: 'CPU Utilization', min: 0, max: 100, unit: '%' },
  queueDepth: { type: 'input', label: 'Queue Depth', unit: 'req' },
  workers: { type: 'input', label: 'Workers', unit: 'count' },
  capacity: { type: 'input', label: 'Capacity', unit: 'req' },
  queueDiscipline: {
    type: 'select',
    label: 'Queue Discipline',
    options: ['fifo', 'lifo', 'priority', 'wfq']
  },
  meanServiceMs: { type: 'input', label: 'Mean Service Time', unit: 'ms' },
  timeoutMs: { type: 'input', label: 'Timeout', unit: 'ms' },

  blockRate: { type: 'input', label: 'Block Rate', unit: '%', step: 0.01 },
  droppedPackets: { type: 'input', label: 'Dropped Packets', unit: '%', step: 0.01 },

  // --- Specs ---
  vCPU: { type: 'input', label: 'vCPU Cores', unit: 'cores' },
  ram: { type: 'input', label: 'Memory', unit: 'GB' },
  region: { type: 'select', label: 'Region', options: ['us-east-1', 'us-west-2', 'eu-central-1'] },

  // --- Advanced ---
  threadPool: { type: 'slider', label: 'Thread Pool', min: 1, max: 500, unit: 'threads' },
  coldStart: { type: 'boolean', label: 'Cold Start Sim' }
}

// Legacy flat groups — kept for backward compatibility with any remaining consumers
export const FIELD_GROUPS = {
  Performance: ['throughput', 'errorRate', 'load', 'queueDepth'],
  Queueing: ['workers', 'capacity', 'queueDiscipline', 'meanServiceMs', 'timeoutMs'],
  Configuration: ['vCPU', 'ram', 'region', 'status'],
  Execution: ['threadPool', 'coldStart']
} as const satisfies Record<string, readonly FieldKey[]>

// Per-kind field groups — used by per-kind form components
export const FIELD_GROUPS_BY_KIND: Record<
  'compute' | 'service' | 'security',
  Record<string, FieldKey[]>
> = {
  compute: {
    Queueing: ['workers', 'capacity', 'queueDiscipline', 'meanServiceMs', 'timeoutMs'],
    Configuration: ['vCPU', 'ram', 'region']
  },
  service: {
    Performance: ['throughput', 'errorRate', 'load', 'queueDepth'],
    Queueing: ['workers', 'capacity', 'queueDiscipline', 'meanServiceMs', 'timeoutMs'],
    Configuration: ['status', 'region']
  },
  security: {
    Metrics: ['blockRate', 'droppedPackets', 'load'],
    Configuration: ['status']
  }
}
