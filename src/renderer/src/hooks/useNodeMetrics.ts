import useStore from '@renderer/store/useStore'

export function useNodeMetrics(id: string) {
  const runtime = useStore((s) => s.simulationMetricsByNode[id])
  const hasRuntime = runtime !== undefined
  const active = hasRuntime ? (runtime.active ?? false) : undefined

  return {
    throughput: runtime?.throughput,
    errorRate: runtime?.errorRate,
    queueDepth: runtime?.queueDepth,
    utilization: runtime?.utilization,
    hasRuntime,
    active
  }
}
