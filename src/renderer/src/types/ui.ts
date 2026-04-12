import { LucideIcon } from 'lucide-react'

export interface ServiceNodeData {
  kind: 'service'
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

  label: string
  color?: ColorTheme | string
}

export interface SecurityNodeData {
  kind: 'security'
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
}

export type ComputeType = 'SERVER' | 'LAMBDA' | 'WORKER' | 'CRON' | 'AUTH' | 'SEARCH_SERVICE'

export interface ComputeNodeData {
  kind: 'compute'
  computeType: ComputeType
  utilization: number // 0-100 (was cpu_usage)
  queueDepth: number // pending work count (was queue_depth)
  isOverloaded: boolean // simulation state (was is_overloaded)
  workers?: number
  capacity?: number
  queueDiscipline?: 'fifo' | 'lifo' | 'priority' | 'wfq'
  meanServiceMs?: number
  timeoutMs?: number

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
  iconKey?: string
}

export type NodeType = 'serviceNode' | 'computeNode' | 'databaseNode' | 'vpcNode' | 'securityNode'

export type AnyNodeData = ServiceNodeData | ComputeNodeData | VpcNodeData | SecurityNodeData

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
