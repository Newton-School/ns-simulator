export type ComponentCategory = 
  | "compute" | "network-and-edge" | "storage-and-data" | "messaging-and-streaming" 
  | "orchestration-and-infra" | "security-and-identity" | "observability" 
  | "devops-and-delivery" | "data-infra-and-analytics" | "real-time-and-media" 
  | "external-and-integration" | "dns-and-certs" | "consensus-and-coordination" | "auxiliary";

export type ComputeType = "api-endpoint" | "microservice" | "sidecar" | "batch-worker" | "serverless-function" | "faas-background" | "container" | "vm-instance" | "edge-compute" | "gpu-node";
export type NetworkType = "load-balancer" | "global-traffic-manager" | "nat-gateway" | "transit-gateway" | "vpn-gateway" | "cdn" | "api-gateway" | "service-mesh" | "reverse-proxy" | "high-perf-nic" | "network-policy";
export type StorageType = "relational-db" | "nosql-db" | "object-storage" | "block-storage" | "distributed-file-system" | "in-memory-cache" | "search-index" | "time-series-db" | "columnar-db" | "graph-db" | "data-warehouse" | "archive-storage" | "schema-registry" | "cdc" | "backup-service" | "kms-storage";
export type MessagingType = "queue" | "pub-sub" | "stream" | "event-bus" | "event-sourcing-store" | "message-broker" | "task-queue";
export type OrchestrationType = "kubernetes-cluster" | "container-registry" | "service-registry" | "config-store" | "secrets-manager" | "cluster-autoscaler" | "orchestrator-scheduler" | "ci-cd-runner" | "iac-engine" | "container-runtime" | "provisioner";
export type SecurityType = "iam-rbac" | "waf" | "firewall" | "bastion-host" | "certificate-authority" | "secrets-rotation" | "kms-security" | "dlp-inspection" | "identity-provider" | "siem" | "privilege-escalation-control";
export type ObservabilityType = "centralized-logging" | "distributed-tracing" | "metrics-store" | "alerting-hook" | "dashboard" | "rum-monitoring" | "health-check-manager" | "profiling-service";
export type DevopsType = "artifact-repository" | "build-system" | "feature-flag-service" | "deployment-controller" | "chaos-engineering-framework" | "policy-as-code" | "pipeline-secrets";
export type DataInfraType = "etl-pipeline" | "streaming-analytics" | "feature-store" | "model-serving";
export type RealTimeType = "websockets-gateway" | "push-notification-service" | "transcoder" | "signaling-server" | "sfu-mcu" | "webrtc-mesh";
export type IntegrationType = "webhook-gateway" | "third-party-api-connector" | "payment-gateway" | "third-party-auth";
export type DnsType = "dns-authoritative-server" | "internal-dns" | "certificate-distro";
export type ConsensusType = "etcd-consul-kv" | "leader-election" | "distributed-lock" | "coordination-service";
export type AuxiliaryType = "service-mesh-telemetry" | "policy-engine" | "rate-limiter" | "circuit-breaker-controller" | "idempotency-manager" | "request-tracking" | "backpressure-controller" | "throttler";

export type ComponentType = 
  | ComputeType | NetworkType | StorageType | MessagingType | OrchestrationType 
  | SecurityType | ObservabilityType | DevopsType | DataInfraType 
  | RealTimeType | IntegrationType | DnsType | ConsensusType | AuxiliaryType;

export type DistributionConfig =
  | { type: 'constant'; value: number }
  | { type: 'uniform'; min: number; max: number }
  | { type: 'normal'; mean: number; stdDev: number; min?: number; max?: number }
  | { type: 'log-normal'; mu: number; sigma: number }
  | { type: 'exponential'; rate: number }
  | { type: 'poisson'; lambda: number }
  | { type: 'weibull'; shape: number; scale: number }
  | { type: 'gamma'; shape: number; rate: number }
  | { type: 'beta'; alpha: number; beta: number; min?: number; max?: number }
  | { type: 'pareto'; shape: number; scale: number }
  | { type: 'empirical'; samples: number[]; interpolation: 'linear' | 'step' }
  | { type: 'mixture'; components: { weight: number; distribution: DistributionConfig }[] };

export interface ResourceConfig {
  cpu: number;
  memory: number;
  replicas: number;
  maxReplicas?: number;
}

export interface QueueConfig {
  workers: number;
  capacity: number;
  discipline: "fifo" | "lifo" | "priority" | "wfq";
}

export interface ProcessingConfig {
  distribution: DistributionConfig;
  timeout: number;
}

export interface DependenciesConfig {
  critical: string[];
  optional: string[];
}

export interface ResilienceConfig {
  circuitBreaker?: {
    failureThreshold: number;
    failureCount: number;
    recoveryTimeout: number;
    halfOpenRequests: number;
  };
  retry?: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    multiplier: number;
    jitter: boolean;
  };
  rateLimiter?: {
    maxTokens: number;
    refillRate: number;
  };
  bulkhead?: {
    maxConcurrent: number;
  };
}

export interface SLOConfig {
  latencyP99: number;
  availabilityTarget: number;
  errorBudget: number;
}

export interface FailureMode {
  mode: string;
  severity: "critical" | "degraded" | "minor";
  mtbf?: number;
  mttr?: number;
  trigger?: {
    metric: string;
    operator: ">" | "<" | ">=" | "<=" | "==";
    value: number;
  };
}

export interface ScalingConfig {
  type: "horizontal" | "vertical";
  metric: string;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldown: number;
  coldStartPenalty?: {
    distribution: DistributionConfig;
  };
}

export interface ComponentNode {
  id: string;
  type: ComponentType;
  category: ComponentCategory;
  label: string;
  position: { x: number; y: number };
  resources?: ResourceConfig;
  queue?: QueueConfig;
  processing?: ProcessingConfig;
  dependencies?: DependenciesConfig;
  resilience?: ResilienceConfig;
  slo?: SLOConfig;
  failureModes?: FailureMode[];
  scaling?: ScalingConfig;
  config?: Record<string, unknown>;
}

export interface EdgeDefinition {
  id: string;
  source: string;
  target: string;
  label?: string;
  mode: "synchronous" | "asynchronous" | "streaming" | "conditional";
  protocol: "https" | "grpc" | "tcp" | "udp" | "websocket" | "amqp" | "kafka";
  latency: {
    distribution: DistributionConfig;
    pathType: "same-rack" | "same-dc" | "cross-zone" | "cross-region" | "internet";
  };
  bandwidth: number;
  maxConcurrentRequests: number;
  packetLossRate: number;
  errorRate: number;
  weight?: number;
  condition?: string | null;
  
  // React Flow metadata
  sourceHandle?: string;
  targetHandle?: string;
  animated?: boolean;
}

export interface WorkloadProfile {
  sourceNodeId: string;
  pattern: "constant" | "poisson" | "bursty" | "diurnal" | "spike" | "sawtooth" | "replay";
  baseRps: number;
  diurnal?: {
    peakMultiplier: number;
    hourlyMultipliers: number[];
  };
  spike?: {
    spikeTime: number;
    spikeRps: number;
    spikeDuration: number;
  };
  requestDistribution: Array<{
    type: string;
    weight: number;
    sizeBytes: number;
  }>;
}

export interface FaultSpec {
  targetId: string;
  faultType: string;
  timing: "deterministic" | "probabilistic" | "conditional";
  duration: "fixed" | "until" | "permanent";
  params: Record<string, unknown>;
}

export interface InvariantCheck {
  id: string;
  description: string;
  condition: string;
}

export interface ScenarioRef {
  id: string;
  name: string;
  overrides: Record<string, unknown>;
}

export interface GlobalConfig {
  simulationDuration: number;
  seed: string;
  warmupDuration: number;
  timeResolution: "microsecond" | "millisecond";
  defaultTimeout: number;
}

export interface TopologyJSON {
  id: string;
  name: string;
  version: string;
  global: GlobalConfig;
  nodes: ComponentNode[];
  edges: EdgeDefinition[];
  workload?: WorkloadProfile;
  faults?: FaultSpec[];
  invariants?: InvariantCheck[];
  scenarios?: ScenarioRef[];
}