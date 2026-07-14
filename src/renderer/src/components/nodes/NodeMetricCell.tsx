export function NodeMetricCell({
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
