import { LucideIcon } from 'lucide-react'

export interface ServiceNodeData {
  kind: 'service'
  registryId?: string
  iconKey: string
  status?: 'healthy' | 'degraded' | 'critical'
  throughput?: number
  errorRate?: number
  load?: number
  queueDepth?: number
  workers?: number
  capacity?: number
  queueDiscipline?: 'fifo' | 'lifo' | 'priority' | 'wfq'
  meanServiceMs?: number
  timeoutMs?: number
  region?: string

  label: string
  color?: ColorTheme | string
}

export interface SecurityNodeData {
  kind: 'security'
  registryId?: string
  label: string
  subLabel?: string
  iconKey: string
  status: 'healthy' | 'degraded' | 'critical'
  color?: ColorTheme | string
  blockRate?: number
  droppedPackets?: number
  activeThreats?: number
  load?: number
  workers?: number
  capacity?: number
  queueDiscipline?: 'fifo' | 'lifo' | 'priority' | 'wfq'
  meanServiceMs?: number
  timeoutMs?: number
  region?: string
}

export type ComputeType = 'SERVER' | 'LAMBDA' | 'WORKER' | 'CRON' | 'AUTH' | 'SEARCH_SERVICE'

export interface ComputeNodeData {
  kind: 'compute'
  registryId?: string
  computeType: ComputeType
  utilization: number // 0-100 (was cpu_usage)
  queueDepth: number // pending work count (was queue_depth)
  isOverloaded: boolean // simulation state (was is_overloaded)
  workers?: number
  capacity?: number
  queueDiscipline?: 'fifo' | 'lifo' | 'priority' | 'wfq'
  meanServiceMs?: number
  timeoutMs?: number
  vCPU?: number
  ram?: number
  region?: string
  threadPool?: number
  coldStart?: boolean

  // Optional overrides
  iconKey?: string
  label?: string
}

export interface NodeSimulationMetrics {
  throughput?: number
  queueDepth?: number
  utilization?: number
  errorRate?: number
}

// VPC Node Data
export interface VpcNodeData {
  kind: 'vpc'
  registryId?: string
  iconKey?: string
}

export type NodeType = 'serviceNode' | 'computeNode' | 'databaseNode' | 'vpcNode' | 'securityNode'

export type AnyNodeData = ServiceNodeData | ComputeNodeData | VpcNodeData | SecurityNodeData

type UnionKeyOf<T> = T extends unknown ? keyof T : never
type UnionValueOf<T, K extends PropertyKey> = T extends unknown
  ? K extends keyof T
    ? T[K]
    : never
  : never

export type AnyNodeDataKey = UnionKeyOf<AnyNodeData>
export type AnyNodeDataValue<K extends AnyNodeDataKey> = UnionValueOf<AnyNodeData, K>

export interface ColorTheme {
  bg: string
  border: string
  text: string
}

export interface CatalogItem {
  id: string
  type: NodeType
  label: string
  subLabel: string
  icon: LucideIcon // Better type than 'any'
  color: ColorTheme
  data: AnyNodeData
}

export interface CatalogCategory {
  id: string
  title: string
  items: CatalogItem[]
}
