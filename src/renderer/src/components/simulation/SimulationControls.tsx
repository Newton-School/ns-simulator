import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Square } from 'lucide-react'
import type { WorkloadProfile } from '../../../../engine/core/types'
import type { ScenarioSettings, SourceNodeOption } from './ScenarioBar'

type WorkloadPattern = WorkloadProfile['pattern']

const PATTERN_OPTIONS: { value: WorkloadPattern; label: string }[] = [
  { value: 'constant', label: 'Constant' },
  { value: 'poisson', label: 'Poisson' },
  { value: 'bursty', label: 'Bursty' },
  { value: 'spike', label: 'Spike' },
  { value: 'diurnal', label: 'Diurnal' },
  { value: 'sawtooth', label: 'Sawtooth' }
]

const CONTROL_BASE =
  'h-7 w-full rounded-md border border-nss-border bg-nss-input-bg text-nss-text text-xs font-sans px-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed focus:border-nss-primary'

const ACTION_BUTTON_BASE =
  'h-7 px-3 text-xs font-semibold font-sans rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

interface SimulationControlsProps {
  onRun: (settings: ScenarioSettings) => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  isRunning: boolean
  isPaused: boolean
  sourceNodes: SourceNodeOption[]
  disabled?: boolean
}

export function SimulationControls({
  onRun,
  onPause,
  onResume,
  onStop,
  isRunning,
  isPaused,
  sourceNodes,
  disabled = false
}: SimulationControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // ─── Form state ────────────────────────────────────────────────────────────
  const [pattern, setPattern] = useState<WorkloadPattern>('poisson')
  const [baseRps, setBaseRps] = useState(100)
  const [burstRps, setBurstRps] = useState(500)
  const [burstDuration, setBurstDuration] = useState(2000)
  const [normalDuration, setNormalDuration] = useState(8000)
  const [spikeTime, setSpikeTime] = useState(30_000)
  const [spikeRps, setSpikeRps] = useState(1000)
  const [spikeDuration, setSpikeDuration] = useState(5000)
  const [sawPeakRps, setSawPeakRps] = useState(300)
  const [sawRampDuration, setSawRampDuration] = useState(10_000)
  const [simDuration, setSimDuration] = useState(60)
  const [warmup, setWarmup] = useState(5)
  const [seed, setSeed] = useState('default-seed')
  const [sourceNodeId, setSourceNodeId] = useState('auto')

  // ─── Close on outside click or Escape ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  // ─── Close popover when simulation starts ──────────────────────────────────
  useEffect(() => {
    if (isRunning || isPaused) setIsOpen(false)
  }, [isRunning, isPaused])

  // ─── Build settings ────────────────────────────────────────────────────────
  function buildSettings(): ScenarioSettings {
    const workload: Partial<WorkloadProfile> = { pattern, baseRps }
    if (sourceNodeId !== 'auto') workload.sourceNodeId = sourceNodeId
    if (pattern === 'bursty') workload.bursty = { burstRps, burstDuration, normalDuration }
    else if (pattern === 'spike') workload.spike = { spikeTime, spikeRps, spikeDuration }
    else if (pattern === 'sawtooth')
      workload.sawtooth = { peakRps: sawPeakRps, rampDuration: sawRampDuration }
    return {
      global: { simulationDuration: simDuration * 1000, warmupDuration: warmup * 1000, seed },
      workload
    }
  }

  function handleRun() {
    setIsOpen(false)
    onRun(buildSettings())
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} className="relative flex items-center gap-1.5">
      {/* Idle */}
      {!isRunning && !isPaused && (
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled}
          className={`${ACTION_BUTTON_BASE} flex items-center gap-1.5 bg-nss-primary text-white border-transparent hover:bg-nss-primary-hover`}
        >
          <Play size={12} className="fill-white" />
          Run
        </button>
      )}

      {/* Running */}
      {isRunning && !isPaused && (
        <>
          <button
            onClick={onPause}
            className={`${ACTION_BUTTON_BASE} flex items-center gap-1.5 bg-nss-warning text-black border-transparent hover:bg-nss-warning/80`}
          >
            <Pause size={12} className="fill-black" />
            Pause
          </button>
          <button
            onClick={onStop}
            className={`${ACTION_BUTTON_BASE} flex items-center gap-1.5 bg-nss-surface text-nss-text border-nss-border hover:bg-nss-bg`}
          >
            <Square size={12} className="fill-current" />
            Stop
          </button>
        </>
      )}

      {/* Paused */}
      {isPaused && (
        <>
          <button
            onClick={onResume}
            className={`${ACTION_BUTTON_BASE} flex items-center gap-1.5 bg-nss-success text-black border-transparent hover:bg-nss-success/80`}
          >
            <Play size={12} className="fill-black" />
            Resume
          </button>
          <button
            onClick={onStop}
            className={`${ACTION_BUTTON_BASE} flex items-center gap-1.5 bg-nss-surface text-nss-text border-nss-border hover:bg-nss-bg`}
          >
            <Square size={12} className="fill-current" />
            Stop
          </button>
        </>
      )}

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-nss-panel border border-nss-border rounded-lg shadow-2xl p-4 w-80 font-sans">
          {/* Workload section */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-nss-muted mb-2">
            Workload
          </p>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <Field label="Pattern">
              <select
                value={pattern}
                onChange={(e) => setPattern(e.target.value as WorkloadPattern)}
                className={CONTROL_BASE}
              >
                {PATTERN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Base RPS">
              <NumberInput value={baseRps} min={1} onChange={setBaseRps} />
            </Field>
          </div>

          <Field label="Source" className="mb-2">
            <select
              value={sourceNodeId}
              onChange={(e) => setSourceNodeId(e.target.value)}
              className={CONTROL_BASE}
            >
              <option value="auto">Auto (heuristic)</option>
              {sourceNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Pattern-specific params */}
          {pattern === 'bursty' && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              <Field label="Burst RPS">
                <NumberInput value={burstRps} min={1} onChange={setBurstRps} />
              </Field>
              <Field label="Burst ms">
                <NumberInput value={burstDuration} min={100} onChange={setBurstDuration} />
              </Field>
              <Field label="Normal ms">
                <NumberInput value={normalDuration} min={100} onChange={setNormalDuration} />
              </Field>
            </div>
          )}

          {pattern === 'spike' && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              <Field label="Spike at ms">
                <NumberInput value={spikeTime} min={0} onChange={setSpikeTime} />
              </Field>
              <Field label="Spike RPS">
                <NumberInput value={spikeRps} min={1} onChange={setSpikeRps} />
              </Field>
              <Field label="Spike dur ms">
                <NumberInput value={spikeDuration} min={100} onChange={setSpikeDuration} />
              </Field>
            </div>
          )}

          {pattern === 'sawtooth' && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Field label="Peak RPS">
                <NumberInput value={sawPeakRps} min={1} onChange={setSawPeakRps} />
              </Field>
              <Field label="Ramp ms">
                <NumberInput value={sawRampDuration} min={100} onChange={setSawRampDuration} />
              </Field>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-nss-border my-3" />

          {/* Timing section */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-nss-muted mb-2">
            Timing
          </p>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <Field label="Duration (s)">
              <NumberInput value={simDuration} min={1} onChange={setSimDuration} />
            </Field>
            <Field label="Warmup (s)">
              <NumberInput value={warmup} min={0} onChange={setWarmup} />
            </Field>
          </div>

          <Field label="Seed" className="mb-4">
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className={CONTROL_BASE}
            />
          </Field>

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={disabled}
            className="w-full h-8 text-xs font-semibold font-sans rounded-md bg-nss-primary text-white border-transparent hover:bg-nss-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Play size={12} className="fill-white" />
            Run Simulation
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label,
  children,
  className = ''
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] text-nss-muted">{label}</span>
      {children}
    </div>
  )
}

function NumberInput({
  value,
  min,
  onChange
}: {
  value: number
  min: number
  onChange: (v: number) => void
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      onChange={(e) => {
        const v = Number(e.target.value)
        if (!isNaN(v) && v >= min) onChange(v)
      }}
      className={CONTROL_BASE}
    />
  )
}
