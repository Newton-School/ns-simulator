import type { SimulationOutput } from '../../../../engine/analysis/output'
import type { SimulationStatus } from '../../hooks/useSimulation'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ResultsTrayProps {
  status: SimulationStatus
  progress: number
  eventsProcessed: number
  results: SimulationOutput | null
  error: string | null
  onClose?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMs(ms: number): string {
  if (ms === 0) return '—'
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function fmtPct(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`
}

const SECTION_TITLE = 'text-[11px] font-semibold text-nss-muted uppercase tracking-wider'
const SURFACE_CARD = 'bg-nss-surface border border-nss-border rounded-md'

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-nss-surface border border-nss-border rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full bg-nss-primary transition-all duration-200"
        style={{ width: `${Math.min(100, progress)}%` }}
      />
    </div>
  )
}

function SummaryPanel({ output }: { output: SimulationOutput }) {
  const { summary } = output
  const l = summary.latency

  return (
    <div className="space-y-3">
      <h3 className={SECTION_TITLE}>Summary</h3>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <StatCard label="Total Requests" value={summary.totalRequests.toLocaleString()} />
        <StatCard label="Throughput" value={`${summary.throughput.toFixed(1)} rps`} />
        <StatCard
          label="Error Rate"
          value={fmtPct(summary.errorRate)}
          highlight={summary.errorRate > 0.01 ? 'warn' : summary.errorRate > 0.05 ? 'crit' : 'ok'}
        />
        <StatCard label="Timed Out" value={summary.timedOutRequests.toLocaleString()} />
      </div>

      <h3 className={`${SECTION_TITLE} pt-1`}>End-to-end Latency</h3>
      <div className="grid grid-cols-5 gap-1 text-xs text-center">
        {(['p50', 'p90', 'p95', 'p99', 'max'] as const).map((k) => (
          <div key={k} className={`${SURFACE_CARD} p-1.5`}>
            <div className="text-nss-muted">{k}</div>
            <div className="font-medium tabular-nums text-nss-text">{fmtMs(l[k])}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight
}: {
  label: string
  value: string
  highlight?: 'ok' | 'warn' | 'crit'
}) {
  const colour =
    highlight === 'crit'
      ? 'text-nss-danger'
      : highlight === 'warn'
        ? 'text-nss-warning'
        : 'text-nss-text'

  return (
    <div className={`${SURFACE_CARD} p-2`}>
      <div className="text-xs text-nss-muted">{label}</div>
      <div className={`font-medium tabular-nums text-sm ${colour}`}>{value}</div>
    </div>
  )
}

function PerNodeTable({ output }: { output: SimulationOutput }) {
  const entries = Object.entries(output.perNode)
  if (entries.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className={SECTION_TITLE}>Per-node Metrics</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="text-nss-muted border-b border-nss-border">
              <th className="text-left pb-1 pr-3">Node</th>
              <th className="text-right pb-1 pr-2">Arrived</th>
              <th className="text-right pb-1 pr-2">Done</th>
              <th className="text-right pb-1 pr-2">Reject</th>
              <th className="text-right pb-1 pr-2">Util</th>
              <th className="text-right pb-1">p99</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([nodeId, m]) => {
              const utilPct = (m.utilization * 100).toFixed(1)
              const utilColour =
                m.utilization > 0.9
                  ? 'text-nss-danger'
                  : m.utilization > 0.7
                    ? 'text-nss-warning'
                    : 'text-nss-success'
              return (
                <tr key={nodeId} className="border-b border-nss-border hover:bg-nss-surface/70">
                  <td className="py-1 pr-3 text-nss-text truncate max-w-[120px]">
                    {m.nodeLabel ?? nodeId}
                  </td>
                  <td className="text-right pr-2 text-nss-text">
                    {m.totalArrived.toLocaleString()}
                  </td>
                  <td className="text-right pr-2 text-nss-text">
                    {m.totalProcessed.toLocaleString()}
                  </td>
                  <td className="text-right pr-2 text-nss-muted">
                    {m.totalRejected.toLocaleString()}
                  </td>
                  <td className={`text-right pr-2 ${utilColour}`}>{utilPct}%</td>
                  <td className="text-right text-nss-text">{fmtMs(m.latencyP99)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SLOBreaches({ output }: { output: SimulationOutput }) {
  if (output.sloBreaches.length === 0) {
    return (
      <p className="text-xs text-nss-success flex items-center gap-1">
        <span>✓</span> No SLO breaches
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className={SECTION_TITLE}>SLO Breaches</h3>
      <div className="space-y-1">
        {output.sloBreaches.map((b, i) => {
          const isCrit = b.severity === 'critical'
          const metricStr =
            b.metric === 'latencyP99'
              ? `p99: target ${fmtMs(b.target)} / actual ${fmtMs(b.actual)}`
              : `availability: target ${fmtPct(b.target)} / actual ${fmtPct(b.actual)}`
          return (
            <div
              key={i}
              className={`text-xs rounded px-2 py-1 flex items-start gap-2 ${
                isCrit
                  ? 'bg-nss-danger/10 border border-nss-danger/20 text-nss-danger'
                  : 'bg-nss-warning/10 border border-nss-warning/20 text-nss-warning'
              }`}
            >
              <span className="shrink-0 font-semibold">{isCrit ? 'CRIT' : 'WARN'}</span>
              <span>
                {b.nodeLabel} — {metricStr}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LittlesLaw({ output }: { output: SimulationOutput }) {
  const violations = output.littlesLawCheck.filter((r) => !r.withinTolerance)
  if (violations.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className={SECTION_TITLE}>
        Little&apos;s Law Violations{' '}
        <span className="text-nss-muted/80 normal-case">(error &gt; 10%)</span>
      </h3>
      <div className="space-y-1">
        {violations.map((r, i) => (
          <div
            key={i}
            className="text-xs tabular-nums text-nss-warning bg-nss-warning/10 border border-nss-warning/20 rounded px-2 py-1"
          >
            {r.nodeId}: L={r.observedL.toFixed(2)} expected={r.expectedL.toFixed(2)} error=
            {(r.error * 100).toFixed(1)}%
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ResultsTray({
  status,
  progress,
  eventsProcessed,
  results,
  error,
  onClose
}: ResultsTrayProps) {
  if (status === 'idle') return null

  return (
    <div className="flex flex-col h-full bg-nss-panel border-t border-nss-border text-nss-text font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-nss-border shrink-0">
        <span className="text-sm font-semibold text-nss-text">Simulation</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-nss-muted">{eventsProcessed.toLocaleString()} events</span>
          <StatusBadge status={status} />
          {onClose && (
            <button
              onClick={onClose}
              className="h-6 w-6 inline-flex items-center justify-center rounded border border-transparent text-nss-muted hover:text-nss-text hover:bg-nss-surface hover:border-nss-border transition-colors"
              aria-label="Close results"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Progress bar (visible while running or paused) */}
      {(status === 'running' || status === 'paused') && (
        <div className="px-4 py-2 shrink-0">
          <ProgressBar progress={progress} />
          <div className="text-xs text-nss-muted mt-1">{progress.toFixed(1)}% complete</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 my-2 text-xs text-nss-danger bg-nss-danger/10 border border-nss-danger/20 rounded-md p-2 shrink-0">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
          <SummaryPanel output={results} />
          <SLOBreaches output={results} />
          <PerNodeTable output={results} />
          <LittlesLaw output={results} />
          <div className="text-xs text-nss-muted pb-2">
            Seed: {results.seed} · Reproducible: {results.reproducible ? 'yes' : 'no'}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: SimulationStatus }) {
  const conf: Record<SimulationStatus, { label: string; cls: string }> = {
    idle: { label: 'Idle', cls: 'text-nss-muted' },
    running: { label: 'Running', cls: 'text-nss-primary animate-pulse' },
    paused: { label: 'Paused', cls: 'text-nss-warning' },
    complete: { label: 'Complete', cls: 'text-nss-success' },
    error: { label: 'Error', cls: 'text-nss-danger' }
  }
  const { label, cls } = conf[status]
  return <span className={`text-xs font-medium ${cls}`}>{label}</span>
}
