import { useState } from 'react'
import type { WorkloadProfile, GlobalConfig } from '../../../../engine/core/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScenarioSettings {
  global: Partial<GlobalConfig>
  workload: Partial<Omit<WorkloadProfile, 'requestDistribution'>>
}

export interface SourceNodeOption {
  id: string
  label: string
}

interface ScenarioBarProps {
  onRun: (settings: ScenarioSettings) => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  isRunning: boolean
  isPaused: boolean
  sourceNodes: SourceNodeOption[]
  disabled?: boolean
}

type WorkloadPattern = WorkloadProfile['pattern']

// ─── Pattern labels ───────────────────────────────────────────────────────────

const PATTERN_OPTIONS: { value: WorkloadPattern; label: string }[] = [
  { value: 'constant', label: 'Constant' },
  { value: 'poisson', label: 'Poisson' },
  { value: 'bursty', label: 'Bursty' },
  { value: 'spike', label: 'Spike' },
  { value: 'diurnal', label: 'Diurnal' },
  { value: 'sawtooth', label: 'Sawtooth' }
]

const CONTROL_BASE =
  'h-7 rounded-md border border-nss-border bg-nss-input-bg text-nss-text text-xs font-sans px-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed focus:border-nss-primary'

const ACTION_BUTTON_BASE =
  'h-7 px-3 text-xs font-semibold font-sans rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

// ─── Component ────────────────────────────────────────────────────────────────

export function ScenarioBar({
  onRun,
  onPause,
  onResume,
  onStop,
  isRunning,
  isPaused,
  sourceNodes,
  disabled = false
}: ScenarioBarProps) {
  // ─── Workload settings ─────────────────────────────────────────────────────
  const [pattern, setPattern] = useState<WorkloadPattern>('poisson')
  const [baseRps, setBaseRps] = useState(100)

  // Pattern-specific params
  const [burstRps, setBurstRps] = useState(500)
  const [burstDuration, setBurstDuration] = useState(2000)
  const [normalDuration, setNormalDuration] = useState(8000)

  const [spikeTime, setSpikeTime] = useState(30_000)
  const [spikeRps, setSpikeRps] = useState(1000)
  const [spikeDuration, setSpikeDuration] = useState(5000)

  const [sawPeakRps, setSawPeakRps] = useState(300)
  const [sawRampDuration, setSawRampDuration] = useState(10_000)

  // ─── Global settings ───────────────────────────────────────────────────────
  const [simDuration, setSimDuration] = useState(60) // seconds
  const [warmup, setWarmup] = useState(5) // seconds
  const [seed, setSeed] = useState('default-seed')
  const [sourceNodeId, setSourceNodeId] = useState('auto')

  // ─── Build settings object ─────────────────────────────────────────────────
  function buildSettings(): ScenarioSettings {
    const workload: Partial<WorkloadProfile> = { pattern, baseRps }
    if (sourceNodeId !== 'auto') {
      workload.sourceNodeId = sourceNodeId
    }

    if (pattern === 'bursty') {
      workload.bursty = { burstRps, burstDuration, normalDuration }
    } else if (pattern === 'spike') {
      workload.spike = { spikeTime, spikeRps, spikeDuration }
    } else if (pattern === 'sawtooth') {
      workload.sawtooth = { peakRps: sawPeakRps, rampDuration: sawRampDuration }
    }

    return {
      global: {
        simulationDuration: simDuration * 1000,
        warmupDuration: warmup * 1000,
        seed
      },
      workload
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-nss-panel border-b border-nss-border overflow-x-auto shrink-0 text-nss-text font-sans">
      {/* Run / Pause / Stop controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!isRunning && !isPaused && (
          <button
            onClick={() => onRun(buildSettings())}
            disabled={disabled}
            className={`${ACTION_BUTTON_BASE} bg-nss-primary text-white border-transparent hover:bg-nss-primary-hover`}
          >
            ▶ Run
          </button>
        )}

        {isRunning && !isPaused && (
          <>
            <button
              onClick={onPause}
              className={`${ACTION_BUTTON_BASE} bg-nss-warning text-black border-transparent hover:bg-nss-warning/80`}
            >
              ⏸ Pause
            </button>
            <button
              onClick={onStop}
              className={`${ACTION_BUTTON_BASE} bg-nss-surface text-nss-text border-nss-border hover:bg-nss-bg`}
            >
              ■ Stop
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={onResume}
              className={`${ACTION_BUTTON_BASE} bg-nss-success text-black border-transparent hover:bg-nss-success/80`}
            >
              ▶ Resume
            </button>
            <button
              onClick={onStop}
              className={`${ACTION_BUTTON_BASE} bg-nss-surface text-nss-text border-nss-border hover:bg-nss-bg`}
            >
              ■ Stop
            </button>
          </>
        )}
      </div>

      <Divider />

      {/* Pattern selector */}
      <label className="flex items-center gap-1.5 text-xs text-nss-muted shrink-0">
        Pattern
        <select
          value={pattern}
          onChange={(e) => setPattern(e.target.value as WorkloadPattern)}
          disabled={isRunning}
          className={`${CONTROL_BASE} min-w-[108px]`}
        >
          {PATTERN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1.5 text-xs text-nss-muted shrink-0">
        Source
        <select
          value={sourceNodeId}
          onChange={(e) => setSourceNodeId(e.target.value)}
          disabled={isRunning}
          className={`${CONTROL_BASE} min-w-[172px]`}
        >
          <option value="auto">Auto (heuristic)</option>
          {sourceNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label}
            </option>
          ))}
        </select>
      </label>

      {/* Base RPS */}
      <NumberInput
        label="Base RPS"
        value={baseRps}
        min={1}
        onChange={setBaseRps}
        disabled={isRunning}
      />

      {/* Pattern-specific params */}
      {pattern === 'bursty' && (
        <>
          <NumberInput
            label="Burst RPS"
            value={burstRps}
            min={1}
            onChange={setBurstRps}
            disabled={isRunning}
          />
          <NumberInput
            label="Burst ms"
            value={burstDuration}
            min={100}
            onChange={setBurstDuration}
            disabled={isRunning}
          />
          <NumberInput
            label="Normal ms"
            value={normalDuration}
            min={100}
            onChange={setNormalDuration}
            disabled={isRunning}
          />
        </>
      )}

      {pattern === 'spike' && (
        <>
          <NumberInput
            label="Spike at ms"
            value={spikeTime}
            min={0}
            onChange={setSpikeTime}
            disabled={isRunning}
          />
          <NumberInput
            label="Spike RPS"
            value={spikeRps}
            min={1}
            onChange={setSpikeRps}
            disabled={isRunning}
          />
          <NumberInput
            label="Spike dur ms"
            value={spikeDuration}
            min={100}
            onChange={setSpikeDuration}
            disabled={isRunning}
          />
        </>
      )}

      {pattern === 'sawtooth' && (
        <>
          <NumberInput
            label="Peak RPS"
            value={sawPeakRps}
            min={1}
            onChange={setSawPeakRps}
            disabled={isRunning}
          />
          <NumberInput
            label="Ramp ms"
            value={sawRampDuration}
            min={100}
            onChange={setSawRampDuration}
            disabled={isRunning}
          />
        </>
      )}

      <Divider />

      {/* Duration */}
      <NumberInput
        label="Dur (s)"
        value={simDuration}
        min={1}
        onChange={setSimDuration}
        disabled={isRunning}
      />
      <NumberInput
        label="Warmup (s)"
        value={warmup}
        min={0}
        onChange={setWarmup}
        disabled={isRunning}
      />

      {/* Seed */}
      <label className="flex items-center gap-1.5 text-xs text-nss-muted shrink-0">
        Seed
        <input
          type="text"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          disabled={isRunning}
          className={`${CONTROL_BASE} w-32`}
        />
      </label>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-5 bg-nss-border shrink-0" />
}

function NumberInput({
  label,
  value,
  min,
  onChange,
  disabled
}: {
  label: string
  value: number
  min: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-nss-muted shrink-0">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (!isNaN(v) && v >= min) onChange(v)
        }}
        disabled={disabled}
        className={`${CONTROL_BASE} w-20`}
      />
    </label>
  )
}
