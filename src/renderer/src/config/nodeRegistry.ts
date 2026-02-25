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
  ShieldAlert
} from 'lucide-react'
import { getTheme } from './themeConfig'

export interface NodeDef {
  id: string
  type: 'computeNode' | 'serviceNode' | 'vpcNode' | 'securityNode'
  label: string
  subLabel: string
  icon: LucideIcon
  lookupKey: string // Used to find Theme (computeType or iconKey)
  defaultData: Record<string, any>
}

export const NODE_REGISTRY: Record<string, NodeDef> = {
  //Compute Nodes
  'backend-server': {
    id: 'backend-server',
    type: 'computeNode',
    label: 'API Server',
    subLabel: 'Long-running Process',
    icon: Server,
    lookupKey: 'SERVER',
    defaultData: { computeType: 'SERVER', cpu_usage: 45, queue_depth: 12, is_overloaded: false }
  },
  'lambda-function': {
    id: 'lambda-function',
    type: 'computeNode',
    label: 'Serverless Fn',
    subLabel: 'Event Driven',
    icon: Zap,
    lookupKey: 'LAMBDA',
    defaultData: { computeType: 'LAMBDA', cpu_usage: 10, queue_depth: 0, is_overloaded: false }
  },
  'async-worker': {
    id: 'async-worker',
    type: 'computeNode',
    label: 'Job Worker',
    subLabel: 'Background Task',
    icon: Cpu,
    lookupKey: 'WORKER',
    defaultData: { computeType: 'WORKER', cpu_usage: 88, queue_depth: 145, is_overloaded: true }
  },
  'cron-job': {
    id: 'cron-job',
    type: 'computeNode',
    label: 'Cron Job',
    subLabel: 'Scheduled Task',
    icon: Clock,
    lookupKey: 'CRON',
    defaultData: { computeType: 'CRON', cpu_usage: 0, queue_depth: 0, is_overloaded: false }
  },

  // Service Nodes
  'primary-db': {
    id: 'primary-db',
    type: 'serviceNode',
    label: 'Primary DB',
    subLabel: 'Relational SQL',
    icon: Database,
    lookupKey: 'database',
    defaultData: { iconKey: 'database', status: 'healthy', throughput: 2400, load: 60 }
  },
  'redis-cache': {
    id: 'redis-cache',
    type: 'serviceNode',
    label: 'Redis Cache',
    subLabel: 'In-memory key/val',
    icon: Server,
    lookupKey: 'server',
    defaultData: { iconKey: 'server', status: 'healthy', throughput: 5000, load: 15 }
  },
  'load-balancer': {
    id: 'load-balancer',
    type: 'serviceNode',
    label: 'Load Balancer',
    subLabel: 'L7 Routing',
    icon: Network,
    lookupKey: 'network',
    defaultData: { iconKey: 'network', status: 'healthy', throughput: 10000, load: 10 }
  },

  //Security Nodes
  waf: {
    id: 'waf',
    type: 'securityNode',
    label: 'WAF',
    subLabel: 'Web App Firewall',
    icon: Shield,
    lookupKey: 'waf',
    defaultData: { iconKey: 'waf', status: 'healthy', blockRate: 1.2, load: 10 }
  },
  'firewall-rule': {
    id: 'firewall-rule',
    type: 'securityNode',
    label: 'Firewall Rule',
    subLabel: 'L4/L7 Filtering',
    icon: ShieldAlert,
    lookupKey: 'firewall',
    defaultData: { iconKey: 'firewall', status: 'healthy', droppedPackets: 0 }
  },

  // Infrastructure
  'vpc-region': {
    id: 'vpc-region',
    type: 'vpcNode',
    label: 'VPC Region',
    subLabel: 'Isolated Network',
    icon: Cloud,
    lookupKey: 'cloud',
    defaultData: { iconKey: 'cloud' }
  },
  'availability-zone': {
    id: 'availability-zone',
    type: 'vpcNode',
    label: 'Availability Zone',
    subLabel: 'Fault Domain',
    icon: Box,
    lookupKey: 'az',
    defaultData: { iconKey: 'az' }
  },

  // Clients & Edge
  'client-user': {
    id: 'client-user',
    type: 'serviceNode',
    label: 'Client',
    subLabel: 'Browser / Mobile',
    icon: Monitor,
    lookupKey: 'monitor',
    defaultData: { iconKey: 'monitor', status: 'healthy', throughput: 0, load: 0 }
  },
  dns: {
    id: 'dns',
    type: 'serviceNode',
    label: 'DNS',
    subLabel: 'Name Resolution',
    icon: Navigation,
    lookupKey: 'dns',
    defaultData: { iconKey: 'dns', status: 'healthy', throughput: 0, load: 0 }
  },
  cdn: {
    id: 'cdn',
    type: 'serviceNode',
    label: 'CDN',
    subLabel: 'Edge Caching',
    icon: Wifi,
    lookupKey: 'cdn',
    defaultData: { iconKey: 'cdn', status: 'healthy', throughput: 50000, load: 5 }
  },
  'api-gateway': {
    id: 'api-gateway',
    type: 'serviceNode',
    label: 'API Gateway',
    subLabel: 'Request Router',
    icon: Globe,
    lookupKey: 'globe',
    defaultData: { iconKey: 'globe', status: 'healthy', throughput: 8000, load: 20 }
  },

  // Messaging
  'message-queue': {
    id: 'message-queue',
    type: 'serviceNode',
    label: 'Message Queue',
    subLabel: 'SQS / RabbitMQ',
    icon: Inbox,
    lookupKey: 'queue',
    defaultData: { iconKey: 'queue', status: 'healthy', throughput: 3000, queueDepth: 0, load: 10 }
  },
  'message-broker': {
    id: 'message-broker',
    type: 'serviceNode',
    label: 'Event Broker',
    subLabel: 'Kafka / Event Stream',
    icon: Radio,
    lookupKey: 'broker',
    defaultData: { iconKey: 'broker', status: 'healthy', throughput: 100000, load: 10 }
  },

  // Data Stores (additional)
  'nosql-db': {
    id: 'nosql-db',
    type: 'serviceNode',
    label: 'NoSQL DB',
    subLabel: 'DynamoDB / MongoDB',
    icon: Layers,
    lookupKey: 'nosql',
    defaultData: { iconKey: 'nosql', status: 'healthy', throughput: 5000, load: 30 }
  },
  'read-replica': {
    id: 'read-replica',
    type: 'serviceNode',
    label: 'Read Replica',
    subLabel: 'SQL Read Replica',
    icon: GitBranch,
    lookupKey: 'replica',
    defaultData: { iconKey: 'replica', status: 'healthy', throughput: 2000, load: 40 }
  },
  'object-storage': {
    id: 'object-storage',
    type: 'serviceNode',
    label: 'Object Storage',
    subLabel: 'S3 / Blob Store',
    icon: HardDrive,
    lookupKey: 'storage',
    defaultData: { iconKey: 'storage', status: 'healthy', throughput: 500, load: 10 }
  },
  'search-index': {
    id: 'search-index',
    type: 'serviceNode',
    label: 'Search Index',
    subLabel: 'Elasticsearch',
    icon: Search,
    lookupKey: 'search',
    defaultData: { iconKey: 'search', status: 'healthy', throughput: 1500, load: 25 }
  },

  // External
  'external-service': {
    id: 'external-service',
    type: 'serviceNode',
    label: 'External Service',
    subLabel: '3rd Party API',
    icon: ExternalLink,
    lookupKey: 'external',
    defaultData: { iconKey: 'external', status: 'healthy', throughput: 500, load: 5 }
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
  CRON: { label: NODE_REGISTRY['cron-job'].label, subLabel: NODE_REGISTRY['cron-job'].subLabel }
}
