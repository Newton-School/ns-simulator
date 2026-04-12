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
 */
export function useNodeMetrics(id: string, fallback: MetricFallback) {
  const runtime = useStore((s) => s.simulationMetricsByNode[id])
  return {
    throughput: runtime?.throughput ?? fallback.throughput,
    errorRate: runtime?.errorRate ?? fallback.errorRate,
    queueDepth: runtime?.queueDepth ?? fallback.queueDepth,
    utilization: runtime?.utilization ?? fallback.utilization
  }
}
