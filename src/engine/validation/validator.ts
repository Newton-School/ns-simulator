import { z } from 'zod'
import { TopologyJSON } from '../core/types'

const COMPONENT_CATEGORIES = [
  'compute',
  'network-and-edge',
  'storage-and-data',
  'messaging-and-streaming',
  'orchestration-and-infra',
  'security-and-identity',
  'observability',
  'devops-and-delivery',
  'data-infra-and-analytics',
  'real-time-and-media',
  'external-and-integration',
  'dns-and-certs',
  'consensus-and-coordination',
  'auxiliary'
] as const

const COMPONENT_TYPES = [
  'api-endpoint',
  'microservice',
  'sidecar',
  'batch-worker',
  'serverless-function',
  'faas-background',
  'container',
  'vm-instance',
  'edge-compute',
  'gpu-node',
  'auth-service',
  'search-service',
  'load-balancer',
  'load-balancer-l4',
  'load-balancer-l7',
  'global-traffic-manager',
  'edge-router',
  'nat-gateway',
  'transit-gateway',
  'vpn-gateway',
  'cdn',
  'api-gateway',
  'service-mesh',
  'ingress-controller',
  'reverse-proxy',
  'high-perf-nic',
  'network-policy',
  'routing-rule',
  'routing-policy',
  'relational-db',
  'nosql-db',
  'object-storage',
  'block-storage',
  'distributed-file-system',
  'in-memory-cache',
  'search-index',
  'time-series-db',
  'columnar-db',
  'graph-db',
  'vector-db',
  'data-warehouse',
  'data-lake',
  'kv-store',
  'archive-storage',
  'schema-registry',
  'cdc',
  'backup-service',
  'kms-storage',
  'queue',
  'pub-sub',
  'stream',
  'event-bus',
  'event-sourcing-store',
  'message-broker',
  'task-queue',
  'kubernetes-cluster',
  'container-registry',
  'service-registry',
  'tool-registry',
  'config-store',
  'secrets-manager',
  'cluster-autoscaler',
  'agent-orchestrator',
  'orchestrator-scheduler',
  'ci-cd-runner',
  'iac-engine',
  'container-runtime',
  'provisioner',
  'iam-rbac',
  'waf',
  'firewall',
  'bastion-host',
  'certificate-authority',
  'secrets-rotation',
  'kms-security',
  'dlp-inspection',
  'identity-provider',
  'siem',
  'privilege-escalation-control',
  'centralized-logging',
  'distributed-tracing',
  'metrics-store',
  'alerting-hook',
  'dashboard',
  'rum-monitoring',
  'health-check-manager',
  'safety-observability-mesh',
  'profiling-service',
  'artifact-repository',
  'build-system',
  'feature-flag-service',
  'deployment-controller',
  'chaos-engineering-framework',
  'policy-as-code',
  'pipeline-secrets',
  'etl-pipeline',
  'streaming-analytics',
  'feature-store',
  'memory-fabric',
  'model-serving',
  'websockets-gateway',
  'push-notification-service',
  'transcoder',
  'signaling-server',
  'sfu-mcu',
  'webrtc-mesh',
  'webhook-gateway',
  'llm-gateway',
  'third-party-api-connector',
  'payment-gateway',
  'third-party-auth',
  'dns-authoritative-server',
  'internal-dns',
  'certificate-distro',
  'etcd-consul-kv',
  'leader-election',
  'distributed-lock',
  'coordination-service',
  'service-mesh-telemetry',
  'policy-engine',
  'sharding',
  'hashing',
  'shard-node',
  'partition-node',
  'rate-limiter',
  'circuit-breaker-controller',
  'idempotency-manager',
  'request-tracking',
  'backpressure-controller',
  'throttler'
] as const

//zod Schema
const BaseDistributionConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('constant'), value: z.number() }),
  z.object({ type: z.literal('deterministic'), value: z.number() }),
  z.object({
    type: z.literal('log-normal'),
    mu: z.number(),
    sigma: z.number().positive('Sigma must be > 0')
  }),
  z.object({ type: z.literal('exponential'), lambda: z.number().positive('Lambda must be > 0') }),
  z.object({ type: z.literal('normal'), mean: z.number(), stdDev: z.number().positive() }),
  z
    .object({
      type: z.literal('uniform'),
      min: z.number(),
      max: z.number()
    })
    .refine((data) => data.max > data.min, {
      message: 'For uniform distribution, max must be greater than min',
      path: ['max']
    }),
  z.object({
    type: z.literal('weibull'),
    shape: z.number().positive(),
    scale: z.number().positive()
  }),
  z.object({ type: z.literal('poisson'), lambda: z.number().positive() }),
  z.object({
    type: z.literal('binomial'),
    n: z.number().int().positive(),
    p: z.number().min(0).max(1)
  }),
  z.object({
    type: z.literal('gamma'),
    shape: z.number().positive(),
    scale: z.number().positive()
  }),
  z.object({ type: z.literal('beta'), alpha: z.number().positive(), beta: z.number().positive() }),
  z.object({
    type: z.literal('pareto'),
    scale: z.number().positive(),
    shape: z.number().positive()
  }),
  z.object({
    type: z.literal('empirical'),
    samples: z.array(z.number()).min(1),
    interpolation: z.enum(['linear', 'step'])
  })
])

export const DistributionConfigSchema = z.union([
  BaseDistributionConfigSchema,
  z.object({
    type: z.literal('mixture'),
    components: z
      .array(
        z.object({
          weight: z.number().nonnegative(),
          distribution: BaseDistributionConfigSchema
        })
      )
      .min(1)
  })
])

export const GlobalConfigSchema = z.object({
  simulationDuration: z.number().positive(),
  seed: z.string(),
  warmupDuration: z.number().nonnegative(),
  timeResolution: z.enum(['microsecond', 'millisecond']),
  defaultTimeout: z.number().positive(),
  traceSampleRate: z.number().min(0).max(1).optional()
})

export const ComponentNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(COMPONENT_TYPES),
  category: z.enum(COMPONENT_CATEGORIES),
  label: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),

  resources: z
    .object({
      cpu: z.number().positive(),
      memory: z.number().positive(),
      replicas: z.number().int().positive(),
      maxReplicas: z.number().int().positive().optional()
    })
    .optional(),

  queue: z
    .object({
      workers: z.number().int().positive('Workers must be > 0'),
      capacity: z.number().int().nonnegative('Capacity must be >= 0'),
      discipline: z.enum(['fifo', 'lifo', 'priority', 'wfq'])
    })
    .optional(),

  processing: z
    .object({
      distribution: DistributionConfigSchema,
      timeout: z.number().positive('Timeout must be > 0')
    })
    .optional(),

  dependencies: z
    .object({
      critical: z.array(z.string()),
      optional: z.array(z.string())
    })
    .optional(),

  resilience: z.record(z.string(), z.unknown()).optional(),
  slo: z.record(z.string(), z.unknown()).optional(),
  failureModes: z.array(z.record(z.string(), z.unknown())).optional(),
  scaling: z.record(z.string(), z.unknown()).optional(),
  config: z.record(z.string(), z.unknown()).optional()
})

export const EdgeDefinitionSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
  mode: z.enum(['synchronous', 'asynchronous', 'streaming', 'conditional']),
  protocol: z.enum(['https', 'grpc', 'tcp', 'udp', 'websocket', 'amqp', 'kafka']),
  latency: z.object({
    distribution: DistributionConfigSchema,
    pathType: z.enum(['same-rack', 'same-dc', 'cross-zone', 'cross-region', 'internet'])
  }),
  bandwidth: z.number().positive(),
  maxConcurrentRequests: z.number().int().positive(),
  packetLossRate: z.number().min(0).max(1),
  errorRate: z.number().min(0).max(1),
  weight: z.number().optional(),
  condition: z.string().optional(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  animated: z.boolean().optional()
})

const DiurnalHourlyMultipliersSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number()
])

export const WorkloadProfileSchema = z.object({
  sourceNodeId: z.string().min(1),
  pattern: z.enum(['constant', 'poisson', 'bursty', 'diurnal', 'spike', 'sawtooth', 'replay']),

  baseRps: z.number().positive(),

  requestDistribution: z
    .array(
      z.object({
        type: z.string(),
        weight: z.number().nonnegative(),
        sizeBytes: z.number().positive()
      })
    )
    .min(1)
    .refine(
      (dist) => {
        const totalWeight = dist.reduce((acc, curr) => acc + curr.weight, 0)
        return totalWeight > 0 && Math.abs(totalWeight - 1.0) < 0.0001
      },
      { message: 'The sum of requestDistribution weights must equal 1.0' }
    ),

  diurnal: z
    .object({
      peakMultiplier: z.number(),
      hourlyMultipliers: DiurnalHourlyMultipliersSchema
    })
    .optional(),

  spike: z
    .object({
      spikeTime: z.number().nonnegative(),
      spikeRps: z.number().nonnegative(),
      spikeDuration: z.number().nonnegative()
    })
    .optional(),

  bursty: z
    .object({
      burstRps: z.number().nonnegative(),
      burstDuration: z.number().nonnegative(),
      normalDuration: z.number().nonnegative()
    })
    .refine((config) => config.burstDuration + config.normalDuration > 0, {
      message: 'bursty.burstDuration + bursty.normalDuration must be > 0'
    })
    .optional(),

  sawtooth: z
    .object({
      peakRps: z.number().nonnegative(),
      rampDuration: z.number().nonnegative()
    })
    .optional()
})

export const FaultSpecSchema = z.object({
  targetId: z.string().min(1),
  faultType: z.string().min(1),
  timing: z.enum(['deterministic', 'probabilistic', 'conditional']),
  duration: z.enum(['fixed', 'until', 'permanent']),
  params: z.record(z.string(), z.unknown())
})

export const InvariantCheckSchema = z.object({
  id: z.string().min(1),
  description: z.string(),
  condition: z.string().min(1)
})

export const ScenarioRefSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  overrides: z.record(z.string(), z.unknown())
})

export const TopologyJSONSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  global: GlobalConfigSchema,
  nodes: z.array(ComponentNodeSchema),
  edges: z.array(EdgeDefinitionSchema),
  workload: WorkloadProfileSchema.optional(),

  faults: z.array(FaultSpecSchema).optional(),
  invariants: z.array(InvariantCheckSchema).optional(),
  scenarios: z.array(ScenarioRefSchema).optional()
})

//Validation Wrapper
export interface ValidationError {
  path: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  data?: TopologyJSON
  errors?: ValidationError[]
  warnings?: string[]
}

const SOURCE_NODE_TYPES = [
  'user-client',
  'mobile-app',
  'web-browser',
  'iot-device',
  'external-system',
  'api-gateway'
]

export const validateTopology = (input: unknown): ValidationResult => {
  const warnings: string[] = []
  const errors: ValidationError[] = []

  //Zod Structural Parse
  const parseResult = TopologyJSONSchema.safeParse(input)
  if (!parseResult.success) {
    errors.push(
      ...parseResult.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    )
    return { valid: false, errors, warnings }
  }

  const topology = parseResult.data as TopologyJSON

  //Cross-Reference Validations
  const nodeIds = new Set<string>()
  const edgeIds = new Set<string>()
  let hasSourceNode = false

  //Check Nodes
  topology.nodes.forEach((node, index) => {
    if (nodeIds.has(node.id)) {
      errors.push({ path: `nodes[${index}].id`, message: `Duplicate node ID: ${node.id}` })
    }
    nodeIds.add(node.id)

    if (SOURCE_NODE_TYPES.includes(node.type) || topology.workload?.sourceNodeId === node.id) {
      hasSourceNode = true
    }
  })

  const workloadSourceNodeId = topology.workload?.sourceNodeId
  if (workloadSourceNodeId && !nodeIds.has(workloadSourceNodeId)) {
    errors.push({
      path: 'workload.sourceNodeId',
      message: 'Workload sourceNodeId references non-existent node.'
    })
  }

  if (!hasSourceNode && topology.nodes.length > 0) {
    errors.push({
      path: 'nodes',
      message:
        'Topology must contain at least one source node (e.g., api-gateway) or a workload sourceNodeId.'
    })
  }

  //Check Edges & Dependency References
  topology.edges.forEach((edge, index) => {
    if (edgeIds.has(edge.id)) {
      errors.push({ path: `edges[${index}].id`, message: `Duplicate edge ID: ${edge.id}` })
    }
    edgeIds.add(edge.id)

    if (!nodeIds.has(edge.source)) {
      errors.push({
        path: `edges[${index}].source`,
        message: `Source node ID '${edge.source}' does not exist.`
      })
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({
        path: `edges[${index}].target`,
        message: `Target node ID '${edge.target}' does not exist.`
      })
    }
  })

  topology.nodes.forEach((node, index) => {
    node.dependencies?.optional?.forEach((depId, depIndex) => {
      if (!nodeIds.has(depId)) {
        errors.push({
          path: `nodes[${index}].dependencies.optional[${depIndex}]`,
          message: `Optional dependency ID '${depId}' does not exist.`
        })
      }
    })
  })

  //Check that Faults target valid nodes or edges
  topology.faults?.forEach((fault, index) => {
    if (!nodeIds.has(fault.targetId) && !edgeIds.has(fault.targetId)) {
      errors.push({
        path: `faults[${index}].targetId`,
        message: `Fault target ID '${fault.targetId}' does not match any existing node or edge.`
      })
    }
  })

  //Check Time Logic
  if (topology.global.simulationDuration <= topology.global.warmupDuration) {
    errors.push({
      path: 'global.simulationDuration',
      message: 'simulationDuration must be greater than warmupDuration.'
    })
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings }
  }

  //Graph Connectivity Check (Warnings only)
  const sourceNodeIds = topology.nodes
    .filter((n) => SOURCE_NODE_TYPES.includes(n.type) || topology.workload?.sourceNodeId === n.id)
    .map((n) => n.id)

  const adjacencyList = new Map<string, string[]>()
  topology.nodes.forEach((n) => adjacencyList.set(n.id, []))
  topology.edges.forEach((e) => {
    adjacencyList.get(e.source)?.push(e.target)
  })

  const visited = new Set<string>()
  const queue = [...sourceNodeIds]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (!visited.has(current)) {
      visited.add(current)
      const neighbors = adjacencyList.get(current) || []
      queue.push(...neighbors)
    }
  }

  topology.nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      warnings.push(
        `Node '${node.id}' (${node.label}) is disconnected and unreachable from any source node.`
      )
    }
  })

  return { valid: true, data: topology, warnings }
}
