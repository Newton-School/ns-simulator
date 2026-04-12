import {
  Server,
  Zap,
  Cpu,
  Clock,
  Database,
  Network,
  Cloud,
  LucideIcon,
  Settings,
  Monitor,
  Navigation,
  Wifi,
  Globe,
  Inbox,
  Radio,
  Layers,
  GitBranch,
  HardDrive,
  Search,
  ExternalLink,
  Box,
  Shield,
  ShieldAlert,
  Router,
  LockKeyhole,
  Waypoints,
  ArrowRightLeft,
  LayoutGrid,
  Activity,
  FileText,
  Library,
  Radar,
  BellRing,
  HeartPulse,
  ServerCog,
  BookOpen,
  ShieldCheck,
  Fingerprint,
  Bell,
  LineChart,
  Sliders,
  Key,
  ToggleLeft
} from 'lucide-react'
import { getTheme } from './themeConfig'
import type { ComponentType, ComponentCategory } from '../../../engine/core/types'
import type { AnyNodeData } from '@renderer/types/ui'

export interface SimulationConfig {
  componentType: ComponentType
  category: ComponentCategory
  isSourceOnly?: boolean
  isAsync?: boolean
  routingStrategy?: 'round-robin' | 'random' | 'least-conn' | 'passthrough'
}

export interface NodeDef {
  id: string
  type: 'computeNode' | 'serviceNode' | 'vpcNode' | 'securityNode'
  label: string
  subLabel: string
  icon: LucideIcon
  lookupKey: string // Used to find Theme (computeType or iconKey)
  defaultData: AnyNodeData
  simulationConfig?: SimulationConfig
}

export const NODE_REGISTRY: Record<string, NodeDef> = {
  // ── Compute Nodes ────────────────────────────────────────────────────────────
  'backend-server': {
    id: 'backend-server',
    type: 'computeNode',
    label: 'API Server',
    subLabel: 'Long-running Process',
    icon: Server,
    lookupKey: 'SERVER',
    defaultData: {
      kind: 'compute',
      computeType: 'SERVER',
      utilization: 45,
      queueDepth: 12,
      isOverloaded: false
    },
    simulationConfig: { componentType: 'microservice', category: 'compute' }
  },
  'lambda-function': {
    id: 'lambda-function',
    type: 'computeNode',
    label: 'Serverless Fn',
    subLabel: 'Event Driven',
    icon: Zap,
    lookupKey: 'LAMBDA',
    defaultData: {
      kind: 'compute',
      computeType: 'LAMBDA',
      utilization: 10,
      queueDepth: 0,
      isOverloaded: false
    },
    simulationConfig: { componentType: 'serverless-function', category: 'compute' }
  },
  'async-worker': {
    id: 'async-worker',
    type: 'computeNode',
    label: 'Job Worker',
    subLabel: 'Background Task',
    icon: Cpu,
    lookupKey: 'WORKER',
    defaultData: {
      kind: 'compute',
      computeType: 'WORKER',
      utilization: 88,
      queueDepth: 145,
      isOverloaded: true
    },
    simulationConfig: { componentType: 'batch-worker', category: 'compute', isAsync: true }
  },
  'cron-job': {
    id: 'cron-job',
    type: 'computeNode',
    label: 'Cron Job',
    subLabel: 'Scheduled Task',
    icon: Clock,
    lookupKey: 'CRON',
    defaultData: {
      kind: 'compute',
      computeType: 'CRON',
      utilization: 0,
      queueDepth: 0,
      isOverloaded: false
    },
    simulationConfig: { componentType: 'batch-worker', category: 'compute', isAsync: true }
  },
  'auth-service': {
    id: 'auth-service',
    type: 'computeNode',
    label: 'Auth Service',
    subLabel: 'Authentication / Tokens',
    icon: Fingerprint,
    lookupKey: 'AUTH',
    defaultData: {
      kind: 'compute',
      computeType: 'AUTH',
      utilization: 25,
      queueDepth: 5,
      isOverloaded: false
    },
    simulationConfig: { componentType: 'auth-service', category: 'compute' }
  },
  'search-service': {
    id: 'search-service',
    type: 'computeNode',
    label: 'Search Service',
    subLabel: 'Query Processing',
    icon: Search,
    lookupKey: 'SEARCH_SERVICE',
    defaultData: {
      kind: 'compute',
      computeType: 'SEARCH_SERVICE',
      utilization: 55,
      queueDepth: 20,
      isOverloaded: false
    },
    simulationConfig: { componentType: 'search-service', category: 'compute' }
  },

  // ── Service Nodes ─────────────────────────────────────────────────────────────
  'primary-db': {
    id: 'primary-db',
    type: 'serviceNode',
    label: 'Primary DB',
    subLabel: 'Relational SQL',
    icon: Database,
    lookupKey: 'database',
    defaultData: {
      kind: 'service',
      iconKey: 'database',
      label: 'Primary DB',
      status: 'healthy',
      throughput: 2400,
      load: 60
    },
    simulationConfig: { componentType: 'relational-db', category: 'storage-and-data' }
  },
  'redis-cache': {
    id: 'redis-cache',
    type: 'serviceNode',
    label: 'Redis Cache',
    subLabel: 'In-memory key/val',
    icon: Server,
    lookupKey: 'server',
    defaultData: {
      kind: 'service',
      iconKey: 'server',
      label: 'Redis Cache',
      status: 'healthy',
      throughput: 5000,
      load: 15
    },
    simulationConfig: { componentType: 'in-memory-cache', category: 'storage-and-data' }
  },
  'load-balancer': {
    id: 'load-balancer',
    type: 'serviceNode',
    label: 'Load Balancer',
    subLabel: 'L7 Routing',
    icon: Network,
    lookupKey: 'network',
    defaultData: {
      kind: 'service',
      iconKey: 'network',
      label: 'Load Balancer',
      status: 'healthy',
      throughput: 10000,
      load: 10
    },
    simulationConfig: {
      componentType: 'load-balancer',
      category: 'network-and-edge',
      routingStrategy: 'round-robin'
    }
  },
  'ingress-controller': {
    id: 'ingress-controller',
    type: 'serviceNode',
    label: 'Ingress',
    subLabel: 'K8s Traffic Routing',
    icon: Waypoints,
    lookupKey: 'ingress',
    defaultData: {
      kind: 'service',
      iconKey: 'ingress',
      label: 'Ingress',
      status: 'healthy',
      throughput: 15000,
      load: 15
    },
    simulationConfig: {
      componentType: 'ingress-controller',
      category: 'network-and-edge',
      routingStrategy: 'round-robin'
    }
  },
  'reverse-proxy': {
    id: 'reverse-proxy',
    type: 'serviceNode',
    label: 'Reverse Proxy',
    subLabel: 'L7 Routing',
    icon: ArrowRightLeft,
    lookupKey: 'proxy',
    defaultData: {
      kind: 'service',
      iconKey: 'proxy',
      label: 'Reverse Proxy',
      status: 'healthy',
      throughput: 10000,
      load: 10
    },
    simulationConfig: {
      componentType: 'reverse-proxy',
      category: 'network-and-edge',
      routingStrategy: 'round-robin'
    }
  },
  'nat-gateway': {
    id: 'nat-gateway',
    type: 'serviceNode',
    label: 'NAT Gateway',
    subLabel: 'Outbound Internet',
    icon: Router,
    lookupKey: 'nat',
    defaultData: {
      kind: 'service',
      iconKey: 'nat',
      label: 'NAT Gateway',
      status: 'healthy',
      throughput: 1000,
      load: 5
    },
    simulationConfig: { componentType: 'nat-gateway', category: 'network-and-edge' }
  },
  'vpn-gateway': {
    id: 'vpn-gateway',
    type: 'serviceNode',
    label: 'VPN Gateway',
    subLabel: 'Secure Site-to-Site',
    icon: LockKeyhole,
    lookupKey: 'vpn',
    defaultData: {
      kind: 'service',
      iconKey: 'vpn',
      label: 'VPN Gateway',
      status: 'degraded',
      throughput: 500,
      load: 10
    },
    simulationConfig: { componentType: 'vpn-gateway', category: 'network-and-edge' }
  },
  'routing-rule': {
    id: 'routing-rule',
    type: 'serviceNode',
    label: 'Routing Rule',
    subLabel: 'Path / Header Matching',
    icon: GitBranch,
    lookupKey: 'routing',
    defaultData: {
      kind: 'service',
      iconKey: 'routing-rule',
      label: 'Routing Rule',
      status: 'healthy',
      throughput: 20000,
      load: 5
    },
    simulationConfig: { componentType: 'routing-rule', category: 'network-and-edge' }
  },
  'routing-policy': {
    id: 'routing-policy',
    type: 'serviceNode',
    label: 'Routing Policy',
    subLabel: 'Traffic Distribution',
    icon: Waypoints,
    lookupKey: 'routing',
    defaultData: {
      kind: 'service',
      iconKey: 'routing-policy',
      label: 'Routing Policy',
      status: 'healthy',
      throughput: 20000,
      load: 5
    },
    simulationConfig: { componentType: 'routing-policy', category: 'network-and-edge' }
  },

  // ── Security Nodes ───────────────────────────────────────────────────────────
  waf: {
    id: 'waf',
    type: 'securityNode',
    label: 'WAF',
    subLabel: 'Web App Firewall',
    icon: Shield,
    lookupKey: 'waf',
    defaultData: {
      kind: 'security',
      iconKey: 'waf',
      label: 'WAF',
      status: 'healthy',
      blockRate: 1.2,
      load: 10
    },
    simulationConfig: { componentType: 'waf', category: 'security-and-identity' }
  },
  'firewall-rule': {
    id: 'firewall-rule',
    type: 'securityNode',
    label: 'Firewall Rule',
    subLabel: 'L4/L7 Filtering',
    icon: ShieldAlert,
    lookupKey: 'firewall',
    defaultData: {
      kind: 'security',
      iconKey: 'firewall',
      label: 'Firewall Rule',
      status: 'healthy',
      droppedPackets: 0
    },
    simulationConfig: { componentType: 'firewall', category: 'security-and-identity' }
  },
  'security-group': {
    id: 'security-group',
    type: 'securityNode',
    label: 'Security Group',
    subLabel: 'Network Boundary',
    icon: ShieldCheck,
    lookupKey: 'security-group',
    defaultData: {
      kind: 'security',
      iconKey: 'security-group',
      label: 'Security Group',
      status: 'healthy',
      droppedPackets: 0,
      blockRate: 0
    },
    simulationConfig: { componentType: 'firewall', category: 'security-and-identity' }
  },

  // ── Infrastructure (VPC) ─────────────────────────────────────────────────────
  'vpc-region': {
    id: 'vpc-region',
    type: 'vpcNode',
    label: 'VPC Region',
    subLabel: 'Isolated Network',
    icon: Cloud,
    lookupKey: 'cloud',
    defaultData: { kind: 'vpc', iconKey: 'cloud' }
  },
  'availability-zone': {
    id: 'availability-zone',
    type: 'vpcNode',
    label: 'Availability Zone',
    subLabel: 'Fault Domain',
    icon: Box,
    lookupKey: 'az',
    defaultData: { kind: 'vpc', iconKey: 'az' }
  },
  subnet: {
    id: 'subnet',
    type: 'vpcNode',
    label: 'Subnet',
    subLabel: 'Network Partition',
    icon: LayoutGrid,
    lookupKey: 'subnet',
    defaultData: { kind: 'vpc', iconKey: 'subnet' }
  },
  'dns-server': {
    id: 'dns-server',
    type: 'serviceNode',
    label: 'DNS Server',
    subLabel: 'Internal DNS / Authoritative',
    icon: ServerCog,
    lookupKey: 'server-cog',
    defaultData: {
      kind: 'service',
      iconKey: 'server-cog',
      label: 'DNS Server',
      status: 'healthy',
      throughput: 5000,
      load: 10
    },
    simulationConfig: { componentType: 'internal-dns', category: 'dns-and-certs' }
  },
  'discovery-service': {
    id: 'discovery-service',
    type: 'serviceNode',
    label: 'Discovery Service',
    subLabel: 'Service Registry',
    icon: BookOpen,
    lookupKey: 'book-open',
    defaultData: {
      kind: 'service',
      iconKey: 'book-open',
      label: 'Discovery Service',
      status: 'healthy',
      throughput: 3000,
      load: 15
    },
    simulationConfig: { componentType: 'service-registry', category: 'orchestration-and-infra' }
  },

  // ── Clients & Edge ───────────────────────────────────────────────────────────
  'client-user': {
    id: 'client-user',
    type: 'serviceNode',
    label: 'Client',
    subLabel: 'Browser / Mobile',
    icon: Monitor,
    lookupKey: 'monitor',
    defaultData: {
      kind: 'service',
      iconKey: 'monitor',
      label: 'Client',
      status: 'healthy',
      throughput: 0,
      load: 0
    },
    simulationConfig: {
      componentType: 'api-gateway',
      category: 'network-and-edge',
      isSourceOnly: true
    }
  },
  dns: {
    id: 'dns',
    type: 'serviceNode',
    label: 'DNS',
    subLabel: 'Name Resolution',
    icon: Navigation,
    lookupKey: 'dns',
    defaultData: {
      kind: 'service',
      iconKey: 'dns',
      label: 'DNS',
      status: 'healthy',
      throughput: 0,
      load: 0
    },
    simulationConfig: { componentType: 'internal-dns', category: 'dns-and-certs' }
  },
  cdn: {
    id: 'cdn',
    type: 'serviceNode',
    label: 'CDN',
    subLabel: 'Edge Caching',
    icon: Wifi,
    lookupKey: 'cdn',
    defaultData: {
      kind: 'service',
      iconKey: 'cdn',
      label: 'CDN',
      status: 'healthy',
      throughput: 50000,
      load: 5
    },
    simulationConfig: { componentType: 'cdn', category: 'network-and-edge' }
  },
  'api-gateway': {
    id: 'api-gateway',
    type: 'serviceNode',
    label: 'API Gateway',
    subLabel: 'Request Router',
    icon: Globe,
    lookupKey: 'globe',
    defaultData: {
      kind: 'service',
      iconKey: 'globe',
      label: 'API Gateway',
      status: 'healthy',
      throughput: 8000,
      load: 20
    },
    simulationConfig: { componentType: 'api-gateway', category: 'network-and-edge' }
  },

  // ── Messaging ────────────────────────────────────────────────────────────────
  'message-queue': {
    id: 'message-queue',
    type: 'serviceNode',
    label: 'Message Queue',
    subLabel: 'SQS / RabbitMQ',
    icon: Inbox,
    lookupKey: 'queue',
    defaultData: {
      kind: 'service',
      iconKey: 'queue',
      label: 'Message Queue',
      status: 'healthy',
      throughput: 3000,
      queueDepth: 0,
      load: 10
    },
    simulationConfig: { componentType: 'queue', category: 'messaging-and-streaming', isAsync: true }
  },
  'message-broker': {
    id: 'message-broker',
    type: 'serviceNode',
    label: 'Event Broker',
    subLabel: 'Kafka / Event Stream',
    icon: Radio,
    lookupKey: 'broker',
    defaultData: {
      kind: 'service',
      iconKey: 'broker',
      label: 'Event Broker',
      status: 'healthy',
      throughput: 100000,
      load: 10
    },
    simulationConfig: {
      componentType: 'message-broker',
      category: 'messaging-and-streaming',
      isAsync: true
    }
  },

  // ── Data Stores ───────────────────────────────────────────────────────────────
  'nosql-db': {
    id: 'nosql-db',
    type: 'serviceNode',
    label: 'NoSQL DB',
    subLabel: 'DynamoDB / MongoDB',
    icon: Layers,
    lookupKey: 'nosql',
    defaultData: {
      kind: 'service',
      iconKey: 'nosql',
      label: 'NoSQL DB',
      status: 'healthy',
      throughput: 5000,
      load: 30
    },
    simulationConfig: { componentType: 'nosql-db', category: 'storage-and-data' }
  },
  'read-replica': {
    id: 'read-replica',
    type: 'serviceNode',
    label: 'Read Replica',
    subLabel: 'SQL Read Replica',
    icon: GitBranch,
    lookupKey: 'replica',
    defaultData: {
      kind: 'service',
      iconKey: 'replica',
      label: 'Read Replica',
      status: 'healthy',
      throughput: 2000,
      load: 40
    },
    simulationConfig: { componentType: 'relational-db', category: 'storage-and-data' }
  },
  'object-storage': {
    id: 'object-storage',
    type: 'serviceNode',
    label: 'Object Storage',
    subLabel: 'S3 / Blob Store',
    icon: HardDrive,
    lookupKey: 'storage',
    defaultData: {
      kind: 'service',
      iconKey: 'storage',
      label: 'Object Storage',
      status: 'healthy',
      throughput: 500,
      load: 10
    },
    simulationConfig: { componentType: 'object-storage', category: 'storage-and-data' }
  },
  'search-index': {
    id: 'search-index',
    type: 'serviceNode',
    label: 'Search Index',
    subLabel: 'Elasticsearch',
    icon: Search,
    lookupKey: 'search',
    defaultData: {
      kind: 'service',
      iconKey: 'search',
      label: 'Search Index',
      status: 'healthy',
      throughput: 1500,
      load: 25
    },
    simulationConfig: { componentType: 'search-index', category: 'storage-and-data' }
  },

  // ── App Support ──────────────────────────────────────────────────────────────
  'push-notification-service': {
    id: 'push-notification-service',
    type: 'serviceNode',
    label: 'Notification Service',
    subLabel: 'Push / Email / SMS',
    icon: Bell,
    lookupKey: 'notification',
    defaultData: {
      kind: 'service',
      iconKey: 'notification',
      label: 'Notification Service',
      status: 'healthy',
      throughput: 3000,
      load: 15
    },
    simulationConfig: {
      componentType: 'push-notification-service',
      category: 'real-time-and-media',
      isAsync: true
    }
  },
  'streaming-analytics': {
    id: 'streaming-analytics',
    type: 'serviceNode',
    label: 'Analytics Service',
    subLabel: 'Streaming Analytics',
    icon: LineChart,
    lookupKey: 'analytics',
    defaultData: {
      kind: 'service',
      iconKey: 'analytics',
      label: 'Analytics Service',
      status: 'healthy',
      throughput: 10000,
      load: 40
    },
    simulationConfig: {
      componentType: 'streaming-analytics',
      category: 'data-infra-and-analytics',
      isAsync: true
    }
  },

  // ── External ─────────────────────────────────────────────────────────────────
  'external-service': {
    id: 'external-service',
    type: 'serviceNode',
    label: 'External Service',
    subLabel: '3rd Party API',
    icon: ExternalLink,
    lookupKey: 'external',
    defaultData: {
      kind: 'service',
      iconKey: 'external',
      label: 'External Service',
      status: 'healthy',
      throughput: 500,
      load: 5
    },
    simulationConfig: {
      componentType: 'third-party-api-connector',
      category: 'external-and-integration'
    }
  },

  // ── Control Plane ─────────────────────────────────────────────────────────────
  'config-store': {
    id: 'config-store',
    type: 'serviceNode',
    label: 'Config Store',
    subLabel: 'Configuration',
    icon: Sliders,
    lookupKey: 'config',
    defaultData: {
      kind: 'service',
      iconKey: 'config',
      label: 'Config Store',
      status: 'healthy',
      throughput: 1000,
      load: 10
    },
    simulationConfig: { componentType: 'config-store', category: 'orchestration-and-infra' }
  },
  'secrets-manager': {
    id: 'secrets-manager',
    type: 'serviceNode',
    label: 'Secrets Manager',
    subLabel: 'Secrets & Keys',
    icon: Key,
    lookupKey: 'secrets',
    defaultData: {
      kind: 'service',
      iconKey: 'secrets',
      label: 'Secrets Manager',
      status: 'healthy',
      throughput: 500,
      load: 5
    },
    simulationConfig: { componentType: 'secrets-manager', category: 'orchestration-and-infra' }
  },
  'feature-flag-service': {
    id: 'feature-flag-service',
    type: 'serviceNode',
    label: 'Feature Flag Service',
    subLabel: 'Feature Flags',
    icon: ToggleLeft,
    lookupKey: 'flags',
    defaultData: {
      kind: 'service',
      iconKey: 'flags',
      label: 'Feature Flag Service',
      status: 'healthy',
      throughput: 2000,
      load: 15
    },
    simulationConfig: { componentType: 'feature-flag-service', category: 'devops-and-delivery' }
  },

  // ── Observability ─────────────────────────────────────────────────────────────
  'metrics-collector-agent': {
    id: 'metrics-collector-agent',
    type: 'serviceNode',
    label: 'Metrics Collector',
    subLabel: 'Agent / Telegraf',
    icon: Activity,
    lookupKey: 'metrics-collector',
    defaultData: {
      kind: 'service',
      iconKey: 'metrics-collector',
      label: 'Metrics Collector',
      status: 'healthy',
      throughput: 1000,
      load: 5
    },
    simulationConfig: { componentType: 'metrics-store', category: 'observability', isAsync: true }
  },
  'log-collector-agent': {
    id: 'log-collector-agent',
    type: 'serviceNode',
    label: 'Log Collector',
    subLabel: 'Fluentd / Promtail',
    icon: FileText,
    lookupKey: 'log-collector',
    defaultData: {
      kind: 'service',
      iconKey: 'log-collector',
      label: 'Log Collector',
      status: 'healthy',
      throughput: 5000,
      load: 10
    },
    simulationConfig: {
      componentType: 'centralized-logging',
      category: 'observability',
      isAsync: true
    }
  },
  'log-aggregation-service': {
    id: 'log-aggregation-service',
    type: 'serviceNode',
    label: 'Centralized Logging',
    subLabel: 'Elasticsearch / Loki',
    icon: Library,
    lookupKey: 'log-aggregator',
    defaultData: {
      kind: 'service',
      iconKey: 'log-aggregator',
      label: 'Centralized Logging',
      status: 'healthy',
      throughput: 15000,
      load: 20
    },
    simulationConfig: {
      componentType: 'centralized-logging',
      category: 'observability',
      isAsync: true
    }
  },
  'distributed-tracing-collector': {
    id: 'distributed-tracing-collector',
    type: 'serviceNode',
    label: 'Distributed Tracing',
    subLabel: 'Jaeger / Tempo',
    icon: Radar,
    lookupKey: 'tracing',
    defaultData: {
      kind: 'service',
      iconKey: 'tracing',
      label: 'Distributed Tracing',
      status: 'healthy',
      throughput: 10000,
      load: 15
    },
    simulationConfig: {
      componentType: 'distributed-tracing',
      category: 'observability',
      isAsync: true
    }
  },
  'alerting-engine': {
    id: 'alerting-engine',
    type: 'serviceNode',
    label: 'Alerting Hook',
    subLabel: 'Alertmanager / PagerDuty',
    icon: BellRing,
    lookupKey: 'alerting',
    defaultData: {
      kind: 'service',
      iconKey: 'alerting',
      label: 'Alerting Hook',
      status: 'healthy',
      throughput: 500,
      load: 5
    },
    simulationConfig: { componentType: 'alerting-hook', category: 'observability', isAsync: true }
  },
  'health-check-monitor': {
    id: 'health-check-monitor',
    type: 'serviceNode',
    label: 'Health Check Manager',
    subLabel: 'Synthetic Monitoring',
    icon: HeartPulse,
    lookupKey: 'health-check',
    defaultData: {
      kind: 'service',
      iconKey: 'health-check',
      label: 'Health Check Manager',
      status: 'healthy',
      throughput: 100,
      load: 5
    },
    simulationConfig: { componentType: 'health-check-manager', category: 'observability' }
  }
}

export const resolveNodeConfig = (key: string | undefined) => {
  if (!key) return { icon: Settings, theme: getTheme('default'), label: 'Unknown' }

  const byLookup = Object.values(NODE_REGISTRY).find((def) => def.lookupKey === key)
  if (byLookup) return { ...byLookup, theme: getTheme(byLookup.lookupKey) }

  const byId = NODE_REGISTRY[key]
  if (byId) return { ...byId, theme: getTheme(byId.lookupKey) }

  return {
    icon: Settings,
    theme: getTheme('default'),
    label: 'Unknown',
    subLabel: ''
  }
}

export const COMPUTE_DEFAULTS = {
  SERVER: {
    label: NODE_REGISTRY['backend-server'].label,
    subLabel: NODE_REGISTRY['backend-server'].subLabel
  },
  LAMBDA: {
    label: NODE_REGISTRY['lambda-function'].label,
    subLabel: NODE_REGISTRY['lambda-function'].subLabel
  },
  WORKER: {
    label: NODE_REGISTRY['async-worker'].label,
    subLabel: NODE_REGISTRY['async-worker'].subLabel
  },
  CRON: { label: NODE_REGISTRY['cron-job'].label, subLabel: NODE_REGISTRY['cron-job'].subLabel },
  AUTH: {
    label: NODE_REGISTRY['auth-service'].label,
    subLabel: NODE_REGISTRY['auth-service'].subLabel
  },
  SEARCH_SERVICE: {
    label: NODE_REGISTRY['search-service'].label,
    subLabel: NODE_REGISTRY['search-service'].subLabel
  }
}
