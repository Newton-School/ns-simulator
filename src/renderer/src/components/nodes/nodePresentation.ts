import type { AnyNodeData } from '@renderer/types/ui'

export interface SummaryMetric {
  label: string
  value?: string | number
  unit?: string
  textColor?: string
}

export function getNodeStatus(data: AnyNodeData): 'healthy' | 'critical' {
  return data.ui?.overloadPreview ? 'critical' : 'healthy'
}

export function getPreRunSummary(data: AnyNodeData): SummaryMetric[] {
  if (data.profile === 'source') {
    return [
      {
        label: 'Pattern',
        value: data.source?.defaultWorkload.pattern
      },
      {
        label: 'Base RPS',
        value: data.source?.defaultWorkload.baseRps?.toFixed(1),
        unit: 'req/s'
      }
    ]
  }

  if (data.profile === 'security-filter') {
    return [
      {
        label: 'Block Rate',
        value:
          typeof data.sim?.securityPolicy?.blockRate === 'number'
            ? (data.sim.securityPolicy.blockRate * 100).toFixed(1)
            : undefined,
        unit: '%',
        textColor: 'text-nss-warning'
      },
      {
        label: 'Dropped Pkts',
        value:
          typeof data.sim?.securityPolicy?.droppedPackets === 'number'
            ? (data.sim.securityPolicy.droppedPackets * 100).toFixed(1)
            : undefined,
        unit: '%',
        textColor: 'text-nss-danger'
      },
      {
        label: 'Timeout',
        value:
          typeof data.sim?.processing?.timeout === 'number'
            ? data.sim.processing.timeout
            : undefined,
        unit: 'ms'
      }
    ]
  }

  const metrics: SummaryMetric[] = [
    {
      label: 'Workers',
      value: data.sim?.queue?.workers
    },
    {
      label: 'Capacity',
      value: data.sim?.queue?.capacity,
      unit: 'req'
    },
    {
      label: 'Timeout',
      value: data.sim?.processing?.timeout,
      unit: 'ms'
    }
  ]

  if (data.profile === 'router') {
    metrics.unshift({
      label: 'Routing',
      value: data.routingStrategy ?? 'passthrough'
    })
  }

  return metrics
}
