import {
  failureRateLevelFromPercent,
  failureRateTextClass,
  roundedFailurePercent
} from '@renderer/utils/failureRatePresentation'

type RuntimeNodeMetricsProps = {
  arrived?: number
  completed?: number
  failureRate?: number
  className?: string
}

function fmtCount(value?: number): string {
  return Math.max(0, Math.round(value ?? 0)).toLocaleString()
}

function fmtFailureRate(value?: number): string {
  return roundedFailurePercent(value).toFixed(1)
}

function RuntimeMetricCell({
  label,
  value,
  tone = 'text-nss-text'
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] text-nss-muted uppercase tracking-wide font-semibold leading-tight">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-[12px] leading-tight tabular-nums whitespace-nowrap ${tone}`}
      >
        {value}
      </div>
    </div>
  )
}

export function RuntimeNodeMetrics({
  arrived,
  completed,
  failureRate,
  className = 'grid grid-cols-2 gap-4'
}: RuntimeNodeMetricsProps) {
  return (
    <div className={className}>
      <RuntimeMetricCell
        label="Done / Arrived"
        value={`${fmtCount(completed)} / ${fmtCount(arrived)}`}
      />
      <RuntimeMetricCell
        label="Failure Rate"
        value={`${fmtFailureRate(failureRate)}%`}
        tone={failureRateTextClass(failureRateLevelFromPercent(failureRate))}
      />
    </div>
  )
}
