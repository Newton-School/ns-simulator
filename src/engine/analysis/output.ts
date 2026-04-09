import { GlobalConfig } from '../core/types'
import { MetricsCollector, PerNodeMetrics, SimulationSummary } from '../metrics'
import { RequestTrace, RequestTracer } from '../tracer'

export interface TimeSeriesSnapshot {
  timestamp: number
  node: Record<
    string,
    {
      queueLength: number
      activeWorkers: number
      utilization: number
      status: string
    }
  >
}

export interface CasualGraph {
  rootCauses: Array<{
    nodeId: string
    event: string
    time: number
  }>
  propagation: Array<{
    from: string
    to: string
    effect: string
    time: number
  }>
  impactSummary: {
    totalNodesAffected: number
    cascadeDepth: number
    timeToFullCascade: number
  }
}

export interface InvariantViolation {
  invariantId: string
  invariantName: string
  violatedAt: number
  details: string
  rootCause?: string
  affectedComponents?: string[]
}

export interface SLOBreach {
  nodeId: string
  nodeLabel: string
  metric: 'latencyP99' | 'availability'
  target: number
  actual: number
  severity: 'warning' | 'critical'
}

export interface LittlesLawResult {
  nodeId: string
  observedL: number
  expectedL: number
  error: number
  withinTolerance: boolean
}

export interface SimulationOutput {
  summary: SimulationSummary
  perNode: Record<string, PerNodeMetrics>
  timeSeries: TimeSeriesSnapshot[]
  traces: RequestTrace[]
  causalGraph: CasualGraph | null
  sloBreaches: SLOBreach[]
  invariantViolations: InvariantViolation[]
  littlesLawCheck: LittlesLawResult[]
  seed: string
  reproducible: true
  eventsProcessed: number
}

export function generateSimulationOutput(
  metrics: MetricsCollector,
  tracer: RequestTracer,
  timeSeries: TimeSeriesSnapshot[],
  causalGraph: CasualGraph | null,
  invariantViolations: InvariantViolation[],
  config: GlobalConfig
): SimulationOutput {
  const summary = metrics.generateSummary(config.simulationDuration)
  const perNode = Object.fromEntries(metrics.getPerNodeMetrics(config.simulationDuration)) as Record<
    string,
    PerNodeMetrics
  >
  const littlesLawCheck = calculateLittlesLaw(perNode, config)
  const sloBreaches = detectSLOBreaches(metrics, perNode)

  return {
    summary,
    perNode,
    timeSeries: [...timeSeries],
    traces: tracer.getTraces(),
    causalGraph,
    sloBreaches,
    invariantViolations: [...invariantViolations],
    littlesLawCheck,
    seed: config.seed,
    reproducible: true,
    eventsProcessed: 0
  }
}

function detectSLOBreaches(
  metrics: MetricsCollector,
  perNode: Record<string, PerNodeMetrics>
): SLOBreach[] {
  const breaches: SLOBreach[] = []

  for (const [nodeId, nodeMetrics] of Object.entries(perNode)) {
    const metadata = metrics.getNodeMetadata(nodeId)
    const slo = metadata?.slo
    if (!slo) {
      continue
    }

    const nodeLabel = metadata?.label ?? nodeMetrics.nodeLabel ?? nodeId

    if (nodeMetrics.latencyP99 > slo.latencyP99) {
      breaches.push({
        nodeId,
        nodeLabel,
        metric: 'latencyP99',
        target: slo.latencyP99,
        actual: nodeMetrics.latencyP99,
        severity: severityForRatio(nodeMetrics.latencyP99 / Math.max(slo.latencyP99, 0.0001))
      })
    }

    if (nodeMetrics.availability < slo.availabilityTarget) {
      breaches.push({
        nodeId,
        nodeLabel,
        metric: 'availability',
        target: slo.availabilityTarget,
        actual: nodeMetrics.availability,
        severity: severityForRatio(
          Math.max(0.0001, slo.availabilityTarget - nodeMetrics.availability) /
            Math.max(slo.availabilityTarget, 0.0001)
        )
      })
    }
  }

  return breaches
}

function calculateLittlesLaw(
  perNode: Record<string, PerNodeMetrics>,
  config: GlobalConfig
): LittlesLawResult[] {
  const durationSec = Math.max(0.001, (config.simulationDuration - config.warmupDuration) / 1000)

  return Object.entries(perNode).map(([nodeId, metrics]) => {
    const lambda = metrics.totalArrived / durationSec
    const wObservedSec = metrics.avgTimeInSystem / 1000
    const expectedL = lambda * wObservedSec
    const observedL = metrics.avgInSystem
    const error = Math.abs(observedL - expectedL) / Math.max(expectedL, 0.001)

    return {
      nodeId,
      observedL,
      expectedL,
      error,
      withinTolerance: error <= 0.1
    }
  })
}

function severityForRatio(ratio: number): 'warning' | 'critical' {
  return ratio >= 1.25 ? 'critical' : 'warning'
}
