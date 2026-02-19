import {
  Server,
  Zap,
  Cpu,
  Clock,
  Database,
  Network,
  Cloud,
  LucideIcon,
  Settings
} from 'lucide-react'
import { getTheme } from './themeConfig'

export interface NodeDef {
  id: string
  type: 'computeNode' | 'serviceNode' | 'vpcNode'
  label: string
  subLabel: string
  icon: LucideIcon
  lookupKey: string // Used to find Theme (computeType or iconKey)
  defaultData: Record<string, unknown>
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

  //Infrastructure
  'vpc-region': {
    id: 'vpc-region',
    type: 'vpcNode',
    label: 'VPC Region',
    subLabel: 'Isolated Network',
    icon: Cloud,
    lookupKey: 'cloud',
    defaultData: { iconKey: 'cloud' }
  }
}

export const resolveNodeConfig = (
  key: string | undefined
): {
  icon: LucideIcon
  theme: { bg: string; border: string; text: string }
  label: string
  subLabel?: string
} => {
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
