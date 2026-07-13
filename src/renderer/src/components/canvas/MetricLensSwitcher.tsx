import { useEffect } from 'react'
import { clsx } from 'clsx'
import { useShallow } from 'zustand/react/shallow'
import type { MetricLens, PreRunMetricLens, RuntimeMetricLens } from '@renderer/types/ui'
import useStore from '@renderer/store/useStore'

type MetricLensOption<T extends MetricLens = MetricLens> = { id: T; label: string }

const PRE_RUN_LENSES: Array<MetricLensOption<PreRunMetricLens>> = [
  { id: 'workers', label: 'Workers' },
  { id: 'capacity', label: 'Capacity' },
  { id: 'timeout', label: 'Timeout' }
]

const RUNTIME_LENSES: Array<MetricLensOption<RuntimeMetricLens>> = [
  { id: 'results', label: 'Results' },
  { id: 'saturation', label: 'Saturation' },
  { id: 'latency', label: 'Latency' },
  { id: 'errors', label: 'Errors' },
  { id: 'throughput', label: 'Throughput' }
]

function includesLens(lenses: Array<MetricLensOption>, metricLens: MetricLens): boolean {
  return lenses.some((lens) => lens.id === metricLens)
}

/**
 * One control decides the single metric family every node card and edge
 * label shows (C1). Pre-run it shows static config lenses; after a run it
 * switches to runtime result lenses.
 */
export const MetricLensSwitcher = () => {
  const { metricLens, setMetricLens, hasRuntimeMetrics } = useStore(
    useShallow((state) => ({
      metricLens: state.metricLens,
      setMetricLens: state.setMetricLens,
      hasRuntimeMetrics: Object.keys(state.simulationMetricsByNode).length > 0
    }))
  )
  const lenses = hasRuntimeMetrics ? RUNTIME_LENSES : PRE_RUN_LENSES
  const activeLens = includesLens(lenses, metricLens) ? metricLens : lenses[0].id

  useEffect(() => {
    if (activeLens !== metricLens) {
      setMetricLens(activeLens)
    }
  }, [activeLens, metricLens, setMetricLens])

  return (
    <div className="absolute top-4 left-4 z-10 flex gap-1.5 p-1 rounded-full bg-nss-surface border border-nss-border shadow-lg">
      {lenses.map((lens) => (
        <button
          key={lens.id}
          type="button"
          onClick={() => setMetricLens(lens.id)}
          className={clsx(
            'px-3 py-1 text-xs font-semibold rounded-full transition-colors',
            activeLens === lens.id
              ? 'bg-nss-primary/20 border border-nss-primary/50 text-nss-primary'
              : 'border border-transparent text-nss-muted hover:text-nss-text'
          )}
        >
          {lens.label}
        </button>
      ))}
    </div>
  )
}
