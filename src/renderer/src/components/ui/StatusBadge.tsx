import { clsx } from 'clsx'

export const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    healthy: 'bg-nss-success/10 text-nss-success border-nss-success/20',
    degraded: 'bg-nss-warning/10 text-nss-warning border-nss-warning/20',
    critical: 'bg-nss-danger/10 text-nss-danger border-nss-danger/20',
    default: 'bg-slate-500/15 text-slate-500 border-slate-400/50 backdrop-blur-sm'
  }
  const styles = colors[status] || colors.default

  return (
    <span
      className={clsx(
        'px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border',
        styles
      )}
    >
      {status}
    </span>
  )
}
