import type { MetricLens } from '@renderer/types/ui'
import { MetricItem } from '@renderer/components/properties/MetricItem'
import { RuntimeNodeMetrics } from '@renderer/components/nodes/RuntimeNodeMetrics'
import { LensMetricCard } from './LensMetricCard'
import type { IdentityChip, LensCardData, SummaryMetric } from './nodePresentation'

type NodeMetricContentProps = {
  isInactive: boolean
  hasRuntime: boolean
  lens: MetricLens
  arrived?: number
  completed?: number
  failureRate?: number
  lensCard: LensCardData | null
  identityChip: IdentityChip | null
  preRunMetric: SummaryMetric | null
  inactiveClassName?: string
  identityClassName?: string
  runtimeClassName?: string
  preRunClassName?: string
}

export function NodeMetricContent({
  isInactive,
  hasRuntime,
  lens,
  arrived,
  completed,
  failureRate,
  lensCard,
  identityChip,
  preRunMetric,
  inactiveClassName = 'text-[10px] text-nss-muted italic text-center py-2',
  identityClassName = 'flex items-baseline gap-1.5 mb-3',
  runtimeClassName,
  preRunClassName = 'grid grid-cols-1 gap-4'
}: NodeMetricContentProps) {
  if (isInactive) {
    return <p className={inactiveClassName}>No post-warmup traffic</p>
  }

  if (lens === 'results' && hasRuntime) {
    return (
      <RuntimeNodeMetrics
        arrived={arrived}
        completed={completed}
        failureRate={failureRate}
        className={runtimeClassName}
      />
    )
  }

  if (lensCard) {
    return <LensMetricCard card={lensCard} />
  }

  if (hasRuntime) {
    return null
  }

  if (!identityChip && !preRunMetric) {
    return null
  }

  return (
    <>
      {identityChip ? (
        <div className={identityClassName}>
          <span className="text-[10px] text-nss-muted uppercase tracking-wider font-semibold">
            {identityChip.label}
          </span>
          <span className="font-mono text-xs text-nss-text">{identityChip.value}</span>
        </div>
      ) : null}
      {preRunMetric ? (
        <div className={preRunClassName}>
          <MetricItem
            label={preRunMetric.label}
            value={preRunMetric.value}
            unit={preRunMetric.unit}
            textColor={preRunMetric.textColor}
          />
        </div>
      ) : null}
    </>
  )
}
