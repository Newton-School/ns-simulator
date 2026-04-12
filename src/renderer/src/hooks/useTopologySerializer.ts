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
}

type NodeRuntimeData = NodePerformanceData & {
  registryId?: string
  kind?: 'compute' | 'service' | 'security' | 'vpc'
  computeType?: string
  iconKey?: string
  label?: string
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
  'ingress-controller': 0.3,
  'reverse-proxy': 0.5,
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

function derivePerformanceConfig(
  data: NodePerformanceData,
  engineType?: ComponentType,
  category?: ComponentCategory
) {
  const desiredThroughput = asPositiveNumber(data.throughput)
  const utilizationPct =
    asFiniteNumber(data.utilization) ?? asFiniteNumber(data.load) ?? DEFAULT_UTILIZATION_HINT
  const utilizationHint = clamp(utilizationPct / 100, 0.05, 0.98)
  const queueDepthHint = asNonNegativeInt(data.queueDepth) ?? 0

  const workersFromThroughput = desiredThroughput ? Math.ceil(desiredThroughput / 10_000) : 1
  const workersFromQueueDepth = Math.max(1, Math.round(Math.sqrt(queueDepthHint + 1)))
  const workersFromUtilization = Math.max(1, Math.round(utilizationHint * 8))

  const workers = Math.min(
    MAX_DERIVED_WORKERS,
    asPositiveInt(data.workers) ??
      Math.max(workersFromThroughput, workersFromQueueDepth, workersFromUtilization)
  )

  const derivedCapacity = Math.max(workers, workers + queueDepthHint)
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

  if (data.isOverloaded) {
    meanServiceMs *= 2
  }

  // Apply category floor (prevents unrealistically fast simulation for slow
  // node categories even when the formula produces a low number)
  const categoryFloor = category ? (CATEGORY_MIN_SERVICE_MS[category] ?? 0) : 0
  meanServiceMs = Math.max(0.05, categoryFloor, meanServiceMs)

  const timeoutMs = asPositiveInt(data.timeoutMs) ?? Math.max(100, Math.round(meanServiceMs * 40))
  const queueDiscipline = asQueueDiscipline(data.queueDiscipline) ?? 'fifo'

  return {
    queue: { workers, capacity, discipline: queueDiscipline },
    processing: {
      distribution: { type: 'exponential' as const, lambda: 1 / meanServiceMs },
      timeout: timeoutMs
    }
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
  return {
    id,
    type: componentType,
    category,
    label: d.label ?? def.label ?? registryId,
    position: pos,
    queue: perf.queue,
    processing: perf.processing
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

  // Infer edge mode: async when the target is a fire-and-forget sink
  // (messaging, observability). Declared in NODE_REGISTRY.simulationConfig.isAsync.
  const mode: EdgeDefinition['mode'] = asyncNodeIds.has(target) ? 'asynchronous' : 'synchronous'

  // Infer protocol from target type
  const targetType = nodeTypeById.get(target)
  let protocol: EdgeDefinition['protocol'] = 'https'
  if (targetType === 'queue' || targetType === 'message-broker') protocol = 'amqp'
  else if (targetType === 'stream') protocol = 'kafka'

  return {
    id: id || `${source}->${target}`,
    source,
    target,
    label: typeof rfEdge.label === 'string' ? rfEdge.label : undefined,
    mode,
    protocol,
    latency: {
      distribution: { type: 'log-normal', mu: 2.3, sigma: 0.5 }, // ~10ms median
      pathType: 'same-dc'
    },
    bandwidth: 1000,
    maxConcurrentRequests: 100,
    packetLossRate: 0,
    errorRate: 0.001
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
      // 1. Explicit workload override
      // 2. First api-gateway or ingress-controller (proper entry points)
      // 3. client-user (pass-through entry point, config.sourceOnly = true)
      // 4. First node in canvas order
      const PREFERRED_SOURCE_TYPES = new Set<ComponentType>(['api-gateway', 'ingress-controller'])
      const SOURCE_ONLY_TYPES = new Set<ComponentType>(['api-gateway']) // client-user maps to this

      const sourceNode =
        engineNodes.find((n) => PREFERRED_SOURCE_TYPES.has(n.type) && !n.config?.['sourceOnly']) ??
        engineNodes.find((n) => SOURCE_ONLY_TYPES.has(n.type)) ??
        engineNodes[0]

      const sourceRfNode = nodes.find((n) => n.id === sourceNode.id)
      const sourceThroughput = asPositiveNumber(
        (sourceRfNode?.data as NodePerformanceData)?.throughput
      )

      const global: GlobalConfig = { ...DEFAULT_GLOBAL, ...(overrides?.global ?? {}) }
      const workloadOverrides = overrides?.workload ?? {}
      const overrideBaseRps = asPositiveNumber(workloadOverrides.baseRps)

      const workload: WorkloadProfile = {
        ...DEFAULT_WORKLOAD,
        sourceNodeId: sourceNode.id,
        ...workloadOverrides,
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
