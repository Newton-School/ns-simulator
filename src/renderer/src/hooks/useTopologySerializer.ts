import { useCallback } from 'react'
import { Node, Edge } from 'reactflow'
import useStore from '../store/useStore'
import type {
  TopologyJSON,
  ComponentNode,
  EdgeDefinition,
  ComponentType,
  ComponentCategory,
  GlobalConfig,
  WorkloadProfile
} from '../../../engine/core/types'
import { NODE_REGISTRY } from '../config/nodeRegistry'

// ─── Types ────────────────────────────────────────────────────────────────────

type QueueDiscipline = NonNullable<ComponentNode['queue']>['discipline']

type NodePerformanceData = {
  throughput?: number
  load?: number
  utilization?: number
  queueDepth?: number
  workers?: number
  capacity?: number
  queueDiscipline?: QueueDiscipline
  meanServiceMs?: number
  timeoutMs?: number
  isOverloaded?: boolean
  vCPU?: number
  ram?: number
  status?: 'healthy' | 'degraded' | 'critical'
  errorRate?: number
  blockRate?: number
  droppedPackets?: number
}

type NodeRuntimeData = NodePerformanceData & {
  registryId?: string
  kind?: 'compute' | 'service' | 'security' | 'vpc'
  computeType?: string
  iconKey?: string
  label?: string
}

type EdgeRuntimeData = {
  protocol?: EdgeDefinition['protocol']
  mode?: EdgeDefinition['mode']
  latencyMu?: number
  latencySigma?: number
  pathType?: EdgeDefinition['latency']['pathType']
  bandwidth?: number
  maxConcurrentRequests?: number
  packetLossRate?: number
  errorRate?: number
}

// ─── Per-category performance baselines ──────────────────────────────────────

/**
 * Category-specific floor on mean service time (ms). Prevents the throughput
 * formula from producing unrealistically fast numbers for slow components.
 */
const CATEGORY_MIN_SERVICE_MS: Partial<Record<ComponentCategory, number>> = {
  'storage-and-data': 3, // slowest floor for DBs / object stores
  'external-and-integration': 50, // third-party calls: 50ms+
  'security-and-identity': 0.5, // WAF / firewall: sub-ms but not zero
  'dns-and-certs': 0.2
}

/**
 * Type-specific mean service time overrides (ms). Takes precedence over
 * category floor when the node type has well-known latency characteristics.
 */
const TYPE_MEAN_SERVICE_MS: Partial<Record<ComponentType, number>> = {
  'in-memory-cache': 0.1, // Redis: ~0.1ms
  'relational-db': 8, // Postgres/MySQL: ~5-20ms
  'nosql-db': 3, // DynamoDB / Mongo: ~2-5ms
  'object-storage': 20, // S3 GET: ~15-30ms
  'search-index': 10, // Elasticsearch: ~5-20ms
  cdn: 2, // CDN cache hit: ~1-5ms
  'load-balancer': 0.2,
  'load-balancer-l4': 0.15,
  'load-balancer-l7': 0.4,
  'edge-router': 0.8,
  'ingress-controller': 0.3,
  'reverse-proxy': 0.5,
  'service-mesh': 0.6,
  'api-gateway': 1,
  'routing-rule': 0.1,
  'routing-policy': 0.1,
  'nat-gateway': 0.5,
  'vpn-gateway': 2,
  waf: 0.3,
  firewall: 0.1,
  'third-party-api-connector': 150, // External: 100-300ms
  'payment-gateway': 200,
  'internal-dns': 0.5,
  'time-series-db': 6,
  'graph-db': 7,
  'vector-db': 8,
  'data-warehouse': 12,
  'data-lake': 18,
  'kv-store': 0.3,
  'llm-gateway': 6,
  'tool-registry': 1,
  'memory-fabric': 3,
  'agent-orchestrator': 10,
  'safety-observability-mesh': 2,
  sharding: 0.4,
  hashing: 0.2,
  'shard-node': 4,
  'partition-node': 3,
  'centralized-logging': 1,
  'metrics-store': 0.5,
  'distributed-tracing': 1,
  'alerting-hook': 5
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_GLOBAL: GlobalConfig = {
  simulationDuration: 60_000, // 60 s
  seed: 'default-seed',
  warmupDuration: 5_000, // 5 s
  timeResolution: 'millisecond',
  defaultTimeout: 5_000,
  traceSampleRate: 0.01
}

const DEFAULT_WORKLOAD: WorkloadProfile = {
  sourceNodeId: '',
  pattern: 'poisson',
  baseRps: 100,
  requestDistribution: [{ type: 'default', weight: 1.0, sizeBytes: 1024 }]
}

const DEFAULT_UTILIZATION_HINT = 65
const MAX_DERIVED_WORKERS = 512
const MAX_DERIVED_CAPACITY = 2_000_000
const EDGE_DEFAULTS = {
  latencyMu: 2.3,
  latencySigma: 0.5,
  pathType: 'same-dc' as const,
  bandwidth: 1000,
  maxConcurrentRequests: 100,
  packetLossRate: 0,
  errorRate: 0.001
}
const REGISTRY_ID_BY_LOOKUP_KEY = Object.values(NODE_REGISTRY).reduce<Record<string, string>>(
  (acc, def) => {
    acc[def.lookupKey] = def.id
    return acc
  },
  {}
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asPositiveNumber(value: unknown): number | null {
  const num = asFiniteNumber(value)
  return num !== null && num > 0 ? num : null
}

function asNonNegativeInt(value: unknown): number | null {
  const num = asFiniteNumber(value)
  if (num === null) return null
  const rounded = Math.round(num)
  return rounded >= 0 ? rounded : null
}

function asPositiveInt(value: unknown): number | null {
  const num = asNonNegativeInt(value)
  return num !== null && num > 0 ? num : null
}

function asQueueDiscipline(value: unknown): QueueDiscipline | null {
  if (value === 'fifo' || value === 'lifo' || value === 'priority' || value === 'wfq') {
    return value
  }
  return null
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Accepts percentage input in the range [0,100] and normalizes it to [0,1].
 */
function asProbability(value: unknown): number | null {
  const num = asFiniteNumber(value)
  if (num === null || num < 0 || num > 100) return null
  return num / 100
}

function asPathType(value: unknown): EdgeDefinition['latency']['pathType'] | null {
  if (
    value === 'same-rack' ||
    value === 'same-dc' ||
    value === 'cross-zone' ||
    value === 'cross-region' ||
    value === 'internet'
  ) {
    return value
  }
  return null
}

function asProtocol(value: unknown): EdgeDefinition['protocol'] | null {
  if (
    value === 'https' ||
    value === 'grpc' ||
    value === 'tcp' ||
    value === 'udp' ||
    value === 'websocket' ||
    value === 'amqp' ||
    value === 'kafka'
  ) {
    return value
  }
  return null
}

function asEdgeMode(value: unknown): EdgeDefinition['mode'] | null {
  if (
    value === 'synchronous' ||
    value === 'asynchronous' ||
    value === 'streaming' ||
    value === 'conditional'
  ) {
    return value
  }
  return null
}

function derivePerformanceConfig(
  data: NodePerformanceData,
  engineType?: ComponentType,
  category?: ComponentCategory
) {
  const vCpuCores = asPositiveNumber(data.vCPU) ?? 4
  const memoryGb = asPositiveNumber(data.ram) ?? 8
  const status = data.status ?? 'healthy'

  const desiredThroughput = asPositiveNumber(data.throughput)
  const utilizationPct =
    asFiniteNumber(data.utilization) ?? asFiniteNumber(data.load) ?? DEFAULT_UTILIZATION_HINT
  const utilizationHint = clamp(utilizationPct / 100, 0.05, 0.98)
  const queueDepthHint = asNonNegativeInt(data.queueDepth) ?? 0

  const workersFromThroughput = desiredThroughput ? Math.ceil(desiredThroughput / 10_000) : 1
  const workersFromQueueDepth = Math.max(1, Math.round(Math.sqrt(queueDepthHint + 1)))
  const workersFromUtilization = Math.max(1, Math.round(utilizationHint * 8))
  const workersFromCpu = Math.max(1, Math.round(vCpuCores * 2))

  let workers = Math.min(
    MAX_DERIVED_WORKERS,
    asPositiveInt(data.workers) ??
      Math.max(workersFromThroughput, workersFromQueueDepth, workersFromUtilization, workersFromCpu)
  )
  if (status === 'degraded') workers = Math.max(1, Math.floor(workers * 0.8))
  if (status === 'critical') workers = Math.max(1, Math.floor(workers * 0.5))

  const memoryCapacityBoost = clamp(memoryGb / 8, 0.5, 8)
  const derivedCapacity = Math.max(
    workers,
    Math.round((workers + queueDepthHint) * memoryCapacityBoost)
  )
  const capacity = Math.max(
    workers,
    Math.min(MAX_DERIVED_CAPACITY, asPositiveInt(data.capacity) ?? derivedCapacity)
  )

  // Resolve mean service time with precedence:
  // 1. Explicit override on data
  // 2. Well-known type baseline
  // 3. Derived from throughput/utilization formula
  // 4. Category floor
  let meanServiceMs = asPositiveNumber(data.meanServiceMs)

  if (meanServiceMs === null) {
    meanServiceMs = engineType ? (TYPE_MEAN_SERVICE_MS[engineType] ?? null) : null
  }

  if (meanServiceMs === null && desiredThroughput) {
    meanServiceMs = (workers * utilizationHint * 1000) / desiredThroughput
  }

  if (meanServiceMs === null) {
    meanServiceMs = 10 + utilizationHint * 90
  }

  // Deterministic resource/status mapping:
  // - more vCPU -> lower service time
  // - degraded/critical status -> slower processing
  const cpuServiceFactor = clamp(4 / vCpuCores, 0.2, 4)
  meanServiceMs *= cpuServiceFactor
  if (status === 'degraded') meanServiceMs *= 1.5
  if (status === 'critical') meanServiceMs *= 3

  if (data.isOverloaded) {
    meanServiceMs *= 2
  }

  // Apply category floor (prevents unrealistically fast simulation for slow
  // node categories even when the formula produces a low number)
  const categoryFloor = category ? (CATEGORY_MIN_SERVICE_MS[category] ?? 0) : 0
  meanServiceMs = Math.max(0.05, categoryFloor, meanServiceMs)

  const timeoutMs = asPositiveInt(data.timeoutMs) ?? Math.max(100, Math.round(meanServiceMs * 40))
  const queueDiscipline = asQueueDiscipline(data.queueDiscipline) ?? 'fifo'

  const configuredErrorRate = asProbability(data.errorRate) ?? 0
  const statusErrorRate = status === 'critical' ? 0.1 : status === 'degraded' ? 0.02 : 0
  const nodeErrorRate = clamp(configuredErrorRate + statusErrorRate, 0, 0.95)

  const blockRate = asProbability(data.blockRate) ?? 0
  const droppedPackets = asProbability(data.droppedPackets) ?? 0

  return {
    queue: { workers, capacity, discipline: queueDiscipline },
    processing: {
      distribution: { type: 'exponential' as const, lambda: 1 / meanServiceMs },
      timeout: timeoutMs
    },
    nodeErrorRate: nodeErrorRate > 0 ? nodeErrorRate : undefined,
    securityPolicy: blockRate > 0 || droppedPackets > 0 ? { blockRate, droppedPackets } : undefined
  }
}

function resolveRegistryId(rfNode: Node): string | null {
  const data = (rfNode.data ?? {}) as NodeRuntimeData

  if (
    typeof data.registryId === 'string' &&
    data.registryId.length > 0 &&
    NODE_REGISTRY[data.registryId]
  ) {
    return data.registryId
  }

  const idDerivedRegistry = rfNode.id.replace(/_\d+$/, '')
  if (NODE_REGISTRY[idDerivedRegistry]) return idDerivedRegistry

  const lookupKey = data.kind === 'compute' ? data.computeType : data.iconKey
  if (typeof lookupKey !== 'string' || lookupKey.length === 0) return null

  return REGISTRY_ID_BY_LOOKUP_KEY[lookupKey] ?? null
}

// ─── Node serializer ──────────────────────────────────────────────────────────

/**
 * Converts a ReactFlow node into an engine ComponentNode.
 * All engine type/category mappings now live in NODE_REGISTRY.simulationConfig —
 * this function is a thin reader of that registry.
 */
function serializeNode(rfNode: Node): ComponentNode | null {
  const { id, type: nodeType, data, position } = rfNode

  if (nodeType === 'vpcNode') return null

  const d = data as NodeRuntimeData
  const pos = { x: position?.x ?? 0, y: position?.y ?? 0 }
  const registryId = resolveRegistryId(rfNode)
  if (!registryId) return null

  const def = NODE_REGISTRY[registryId]
  const simConfig = def?.simulationConfig

  if (!simConfig) return null

  const { componentType, category, isSourceOnly } = simConfig

  if (isSourceOnly) {
    return {
      id,
      type: componentType,
      category,
      label: d.label ?? def.label ?? registryId,
      position: pos,
      config: { sourceOnly: true }
    }
  }

  const perf = derivePerformanceConfig(d, componentType, category)
  const config: Record<string, unknown> = {}
  if (perf.nodeErrorRate !== undefined) {
    config.nodeErrorRate = perf.nodeErrorRate
  }
  if (perf.securityPolicy) {
    config.securityPolicy = perf.securityPolicy
  }

  return {
    id,
    type: componentType,
    category,
    label: d.label ?? def.label ?? registryId,
    position: pos,
    queue: perf.queue,
    processing: perf.processing,
    config: Object.keys(config).length > 0 ? config : undefined
  }
}

function serializeEdge(
  rfEdge: Edge,
  nodeIds: Set<string>,
  nodeTypeById: Map<string, ComponentType>,
  asyncNodeIds: Set<string>
): EdgeDefinition | null {
  const { id, source, target } = rfEdge
  if (!nodeIds.has(source) || !nodeIds.has(target)) return null
  const d = (rfEdge.data ?? {}) as EdgeRuntimeData

  // Infer edge mode: async when the target is a fire-and-forget sink
  // (messaging, observability). Declared in NODE_REGISTRY.simulationConfig.isAsync.
  let mode: EdgeDefinition['mode'] = asyncNodeIds.has(target) ? 'asynchronous' : 'synchronous'
  const explicitMode = asEdgeMode(d.mode)
  if (explicitMode) mode = explicitMode

  // Infer protocol from target type
  const targetType = nodeTypeById.get(target)
  let protocol: EdgeDefinition['protocol'] = 'https'
  if (targetType === 'queue' || targetType === 'message-broker' || targetType === 'pub-sub') {
    protocol = 'amqp'
  } else if (targetType === 'stream') protocol = 'kafka'
  protocol = asProtocol(d.protocol) ?? protocol

  const latencyMu = asPositiveNumber(d.latencyMu) ?? EDGE_DEFAULTS.latencyMu
  const latencySigma = asPositiveNumber(d.latencySigma) ?? EDGE_DEFAULTS.latencySigma
  const pathType = asPathType(d.pathType) ?? EDGE_DEFAULTS.pathType
  const bandwidth = asPositiveNumber(d.bandwidth) ?? EDGE_DEFAULTS.bandwidth
  const maxConcurrentRequests =
    asPositiveInt(d.maxConcurrentRequests) ?? EDGE_DEFAULTS.maxConcurrentRequests
  const packetLossRate = clamp(
    asProbability(d.packetLossRate) ?? EDGE_DEFAULTS.packetLossRate,
    0,
    1
  )
  const errorRate = clamp(asProbability(d.errorRate) ?? EDGE_DEFAULTS.errorRate, 0, 1)

  return {
    id: id || `${source}->${target}`,
    source,
    target,
    label: typeof rfEdge.label === 'string' ? rfEdge.label : undefined,
    mode,
    protocol,
    latency: {
      distribution: { type: 'log-normal', mu: latencyMu, sigma: latencySigma },
      pathType
    },
    bandwidth,
    maxConcurrentRequests,
    packetLossRate,
    errorRate
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface SerializerResult {
  topology: TopologyJSON | null
  errors: string[]
}

export function useTopologySerializer() {
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)

  const serialize = useCallback(
    (overrides?: {
      global?: Partial<GlobalConfig>
      workload?: Partial<WorkloadProfile>
    }): SerializerResult => {
      const errors: string[] = []

      // Convert nodes
      const engineNodes: ComponentNode[] = []
      for (const rfNode of nodes) {
        const n = serializeNode(rfNode)
        if (n) engineNodes.push(n)
      }

      if (engineNodes.length === 0) {
        errors.push('Canvas has no serializable nodes. Add components to run a simulation.')
        return { topology: null, errors }
      }

      const nodeIds = new Set(engineNodes.map((n) => n.id))
      const nodeTypeById = new Map(engineNodes.map((n) => [n.id, n.type]))

      // Build the set of async-target node IDs from registry declarations
      const asyncNodeIds = new Set(
        nodes
          .filter((n) => {
            const registryId = resolveRegistryId(n)
            if (!registryId) return false
            return NODE_REGISTRY[registryId]?.simulationConfig?.isAsync === true
          })
          .map((n) => n.id)
      )

      // Convert edges
      const engineEdges: EdgeDefinition[] = []
      for (const rfEdge of edges) {
        const e = serializeEdge(rfEdge, nodeIds, nodeTypeById, asyncNodeIds)
        if (e) engineEdges.push(e)
      }

      // Source node selection order:
      // 1. Explicit workload override (user-specified)
      // 2. sourceOnly nodes — client-user and similar explicit entry points
      //    (these are pass-throughs that represent the external caller)
      // 3. First api-gateway or ingress-controller that is NOT sourceOnly
      //    (proper infrastructure entry points)
      // 4. First node in canvas order (fallback)
      const PREFERRED_SOURCE_TYPES = new Set<ComponentType>(['api-gateway', 'ingress-controller'])

      const explicitSourceNodeId =
        typeof overrides?.workload?.sourceNodeId === 'string'
          ? overrides.workload.sourceNodeId
          : undefined
      const explicitSourceNode = explicitSourceNodeId
        ? engineNodes.find((n) => n.id === explicitSourceNodeId)
        : undefined

      if (explicitSourceNodeId && !explicitSourceNode) {
        errors.push(`Selected source node '${explicitSourceNodeId}' no longer exists in canvas.`)
      }

      const sourceNode =
        explicitSourceNode ??
        // Prefer explicit entry-point nodes (client-user, etc.) over infrastructure gateways
        engineNodes.find((n) => n.config?.['sourceOnly'] === true) ??
        engineNodes.find((n) => PREFERRED_SOURCE_TYPES.has(n.type) && !n.config?.['sourceOnly']) ??
        engineNodes[0]

      const sourceRfNode = nodes.find((n) => n.id === sourceNode.id)
      const sourceThroughput = asPositiveNumber(
        (sourceRfNode?.data as NodePerformanceData)?.throughput
      )

      const global: GlobalConfig = { ...DEFAULT_GLOBAL, ...(overrides?.global ?? {}) }
      const workloadOverrides = overrides?.workload ?? {}
      const overrideBaseRps = asPositiveNumber(workloadOverrides.baseRps)
      const sanitizedWorkloadOverrides = { ...workloadOverrides }
      if (explicitSourceNodeId && !explicitSourceNode) {
        delete sanitizedWorkloadOverrides.sourceNodeId
      }

      const workload: WorkloadProfile = {
        ...DEFAULT_WORKLOAD,
        sourceNodeId: sourceNode.id,
        ...sanitizedWorkloadOverrides,
        baseRps: overrideBaseRps ?? sourceThroughput ?? DEFAULT_WORKLOAD.baseRps
      }

      const topology: TopologyJSON = {
        id: `sim-${Date.now()}`,
        name: 'Canvas Topology',
        version: '1.0.0',
        global,
        nodes: engineNodes,
        edges: engineEdges,
        workload
      }

      return { topology, errors }
    },
    [nodes, edges]
  )

  return { serialize }
}
