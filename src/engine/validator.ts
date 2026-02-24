import { z } from 'zod';
import { TopologyJSON } from './types';

//zod Schema
const BaseDistributionConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('constant'), value: z.number() }),
  z.object({ type: z.literal('deterministic'), value: z.number() }),
  z.object({ type: z.literal('log-normal'), mu: z.number(), sigma: z.number().positive("Sigma must be > 0") }),
  z.object({ type: z.literal('exponential'), lambda: z.number().positive("Lambda must be > 0") }),
  z.object({ type: z.literal('normal'), mean: z.number(), stdDev: z.number().positive() }),
  z.object({ type: z.literal('uniform'), min: z.number(), max: z.number() }),
  z.object({ type: z.literal('weibull'), shape: z.number().positive(), scale: z.number().positive() }),
  z.object({ type: z.literal('poisson'), lambda: z.number().positive() }),
  z.object({ type: z.literal('binomial'), n: z.number().int().positive(), p: z.number().min(0).max(1) }),
  z.object({ type: z.literal('gamma'), shape: z.number().positive(), scale: z.number().positive() }),
  z.object({ type: z.literal('beta'), alpha: z.number().positive(), beta: z.number().positive() }),
  z.object({ type: z.literal('pareto'), scale: z.number().positive(), shape: z.number().positive() }),
  z.object({ type: z.literal('empirical'), samples: z.array(z.number()).min(1), interpolation: z.enum(['linear', 'step']) })
]);

export const DistributionConfigSchema = z.union([
  BaseDistributionConfigSchema,
  z.object({
    type: z.literal('mixture'),
    components: z.array(z.object({
      weight: z.number().positive(),
      distribution: BaseDistributionConfigSchema
    })).min(1)
  })
]);

export const GlobalConfigSchema = z.object({
  simulationDuration: z.number().positive(),
  seed: z.string(),
  warmupDuration: z.number().nonnegative(),
  timeResolution: z.enum(['microsecond', 'millisecond']),
  defaultTimeout: z.number().positive()
});

export const ComponentNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string(),
  category: z.string(),
  label: z.string(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),

  resources: z.object({
    cpu: z.number().positive(),
    memory: z.number().positive(),
    replicas: z.number().int().nonnegative(),
    maxReplicas: z.number().int().positive().optional()
  }).optional(),

  queue: z.object({
    workers: z.number().int().positive("Workers must be > 0"),
    capacity: z.number().int().nonnegative("Capacity must be >= 0"),
    discipline: z.enum(['fifo', 'lifo', 'priority', 'wfq'])
  }).optional(),

  processing: z.object({
    distribution: DistributionConfigSchema,
    timeout: z.number().positive("Timeout must be > 0")
  }).optional(),

  dependencies: z.object({
    critical: z.array(z.string()),
    optional: z.array(z.string())
  }).optional(),

  resilience: z.record(z.string(), z.unknown()).optional(),
  slo: z.record(z.string(), z.unknown()).optional(),
  failureModes: z.array(z.record(z.string(), z.unknown())).optional(),
  scaling: z.record(z.string(), z.unknown()).optional(),
  config: z.record(z.string(), z.unknown()).optional()
});

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
  condition: z.string().nullable().optional(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  animated: z.boolean().optional()
});

const DiurnalHourlyMultipliersSchema = z.tuple([
  z.number(), z.number(), z.number(), z.number(), z.number(), z.number(),
  z.number(), z.number(), z.number(), z.number(), z.number(), z.number(),
  z.number(), z.number(), z.number(), z.number(), z.number(), z.number(),
  z.number(), z.number(), z.number(), z.number(), z.number(), z.number()
]);

export const WorkloadProfileSchema = z.object({
  sourceNodeId: z.string().min(1),
  pattern: z.enum(['constant', 'poisson', 'bursty', 'diurnal', 'spike', 'sawtooth', 'replay']),

  baseRps: z.number().positive(),

  requestDistribution: z.array(z.object({
    type: z.string(),
    weight: z.number().nonnegative(),
    sizeBytes: z.number().positive()
  })).min(1),

  diurnal: z.object({
    peakMultiplier: z.number(),
    hourlyMultipliers: DiurnalHourlyMultipliersSchema
  }).optional(),

  spike: z.object({
    spikeTime: z.number().nonnegative(),
    spikeRps: z.number().nonnegative(),
    spikeDuration: z.number().nonnegative()
  }).optional()
});

export const FaultSpecSchema = z.object({
  targetId: z.string().min(1),
  faultType: z.string().min(1),
  timing: z.enum(['deterministic', 'probabilistic', 'conditional']),
  duration: z.enum(['fixed', 'until', 'permanent']),
  params: z.record(z.string(), z.unknown())
});

export const TopologyJSONSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  global: GlobalConfigSchema,
  nodes: z.array(ComponentNodeSchema),
  edges: z.array(EdgeDefinitionSchema),
  workload: WorkloadProfileSchema.optional(),

  faults: z.array(FaultSpecSchema).optional(),
  invariants: z.array(z.record(z.string(), z.unknown())).optional(),
  scenarios: z.array(z.record(z.string(), z.unknown())).optional()
});

//Validation Wrapper
export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  data?: TopologyJSON;
  errors?: ValidationError[];
  warnings?: string[];
}

const SOURCE_NODE_TYPES = ['user-client', 'mobile-app', 'web-browser', 'iot-device', 'external-system', 'api-gateway'];

export const validateTopology = (input: unknown): ValidationResult => {
  const warnings: string[] = [];
  const errors: ValidationError[] = [];

  //Zod Structural Parse
  const parseResult = TopologyJSONSchema.safeParse(input);
  if (!parseResult.success) {
    errors.push(...parseResult.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message
    })));
    return { valid: false, errors, warnings };
  }

  const topology = parseResult.data as TopologyJSON;

  //Cross-Reference Validations
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  let hasSourceNode = false;

  //Check Nodes
  topology.nodes.forEach((node, index) => {
    if (nodeIds.has(node.id)) {
      errors.push({ path: `nodes[${index}].id`, message: `Duplicate node ID: ${node.id}` });
    }
    nodeIds.add(node.id);

    if (SOURCE_NODE_TYPES.includes(node.type) || topology.workload?.sourceNodeId === node.id) {
      hasSourceNode = true;
    }
  });

  if (!hasSourceNode && topology.nodes.length > 0) {
    errors.push({ path: "nodes", message: "Topology must contain at least one source node (e.g., api-gateway) or a workload sourceNodeId." });
  }

  //Check Edges & Dependency References
  topology.edges.forEach((edge, index) => {
    if (edgeIds.has(edge.id)) {
      errors.push({ path: `edges[${index}].id`, message: `Duplicate edge ID: ${edge.id}` });
    }
    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.source)) {
      errors.push({ path: `edges[${index}].source`, message: `Source node ID '${edge.source}' does not exist.` });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({ path: `edges[${index}].target`, message: `Target node ID '${edge.target}' does not exist.` });
    }
  });

  topology.nodes.forEach((node, index) => {
    node.dependencies?.critical.forEach((depId, depIndex) => {
      if (!nodeIds.has(depId)) {
        errors.push({ path: `nodes[${index}].dependencies.critical[${depIndex}]`, message: `Critical dependency ID '${depId}' does not exist.` });
      }
    });
  });

  //Check that Faults target valid nodes or edges
  topology.faults?.forEach((fault, index) => {
    if (!nodeIds.has(fault.targetId) && !edgeIds.has(fault.targetId)) {
      errors.push({ path: `faults[${index}].targetId`, message: `Fault target ID '${fault.targetId}' does not match any existing node or edge.` });
    }
  });

  //Check Time Logic
  if (topology.global.simulationDuration <= topology.global.warmupDuration) {
    errors.push({ path: "global.simulationDuration", message: "simulationDuration must be greater than warmupDuration." });
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  //Graph Connectivity Check (Warnings only)
  const sourceNodeIds = topology.nodes
    .filter(n => SOURCE_NODE_TYPES.includes(n.type) || topology.workload?.sourceNodeId === n.id)
    .map(n => n.id);

  const adjacencyList = new Map<string, string[]>();
  topology.nodes.forEach(n => adjacencyList.set(n.id, []));
  topology.edges.forEach(e => {
    adjacencyList.get(e.source)?.push(e.target);
  });

  const visited = new Set<string>();
  const queue = [...sourceNodeIds];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (!visited.has(current)) {
      visited.add(current);
      const neighbors = adjacencyList.get(current) || [];
      queue.push(...neighbors);
    }
  }

  topology.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      warnings.push(`Node '${node.id}' (${node.label}) is disconnected and unreachable from any source node.`);
    }
  });

  return { valid: true, data: topology, warnings };
};