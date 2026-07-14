export type FailureRateLevel = 'ok' | 'warn' | 'crit'

export function roundedFailurePercent(value?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.round(Math.max(0, value) * 10) / 10
}

export function failureRateLevelFromPercent(value?: number): FailureRateLevel {
  const rounded = roundedFailurePercent(value)
  if (rounded > 5) return 'crit'
  if (rounded > 1) return 'warn'
  return 'ok'
}

export function failureRateLevelFromRatio(value?: number): FailureRateLevel {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'ok'
  return failureRateLevelFromPercent(value * 100)
}

export function failureRateTextClass(level: FailureRateLevel): string {
  if (level === 'crit') return 'text-nss-danger'
  if (level === 'warn') return 'text-nss-warning'
  return 'text-nss-success'
}
