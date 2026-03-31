import { LucideIcon } from 'lucide-react'

export interface ServiceNodeData {
  iconKey: string
  status?: 'healthy' | 'degraded' | 'critical'
  throughput?: number
  errorRate?: number
  load?: number
  queueDepth?: number

  label: string
  color?: ColorTheme | string
}

// Add this interface to your types file
export interface SecurityNodeData {
  label: string
  subLabel?: string
  iconKey: string
  status: 'healthy' | 'degraded' | 'critical'
  color?: ColorTheme | string
  blockRate?: number
  droppedPackets?: number
  activeThreats?: number
  load?: number
}

// New Compute Node Data
export type ComputeType = 'SERVER' | 'LAMBDA' | 'WORKER' | 'CRON' | 'AUTH' | 'SEARCH_SERVICE'

export interface ComputeNodeData {
  computeType: ComputeType
  cpu_usage: number // 0-100
  queue_depth: number // pending work count
  is_overloaded: boolean // Simulation state

  // Optional overrides
  iconKey?: string
  label?: string
}

// VPC Node Data
export interface VpcNodeData {
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
