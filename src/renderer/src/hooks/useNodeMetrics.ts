import useStore from '@renderer/store/useStore'

interface MetricFallback {
  throughput?: number
  errorRate?: number
  queueDepth?: number
  utilization?: number
}

/**
 * Returns simulation runtime metrics for a node, falling back to the node's
 * static data values when no runtime metrics are available (i.e. simulation
 * hasn't run yet or the node produced no output).
 *
 * `hasRuntime` is true once a simulation has completed and metrics have been
 * written for this node, regardless of whether the node received traffic.
 * `active` is true only when the node received traffic during the post-warmup
 * window — use this to distinguish "zero traffic" from "no simulation run yet".
 */
export function useNodeMetrics(id: string, fallback: MetricFallback) {
  const runtime = useStore((s) => s.simulationMetricsByNode[id])
  const hasRuntime = runtime !== undefined
  const active = hasRuntime ? (runtime.active ?? false) : undefined

  return {
    throughput: runtime?.throughput ?? fallback.throughput,
    errorRate: runtime?.errorRate ?? fallback.errorRate,
    queueDepth: runtime?.queueDepth ?? fallback.queueDepth,
    utilization: runtime?.utilization ?? fallback.utilization,
    hasRuntime,
    active
  }
}
