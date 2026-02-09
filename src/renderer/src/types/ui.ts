import { LucideIcon } from 'lucide-react';

export interface ServiceNodeData {
  iconKey: string;
  status?: 'healthy' | 'degraded' | 'critical';
  throughput?: number;
  errorRate?: number;
  load?: number;
  queueDepth?: number;

  // Visual Animation Props (Legacy/Service specific)
  trafficType?: 'http' | 'success' | 'error' | 'warning' | 'default';
  packets?: number;
  speed?: 'slow' | 'normal' | 'fast';
}

// New Compute Node Data
export type ComputeType = 'SERVER' | 'LAMBDA' | 'WORKER' | 'CRON';

export interface ComputeNodeData {
  computeType: ComputeType;
  cpu_usage: number;      // 0-100
  queue_depth: number;    // pending work count
  is_overloaded: boolean; // Simulation state
  
  // Optional overrides
  iconKey?: string;
  label?: string;
}

// VPC Node Data
export interface VpcNodeData {
  iconKey?: string;
}


export type NodeType = 'serviceNode' | 'computeNode' | 'databaseNode' | 'vpcNode';

export type AnyNodeData = ServiceNodeData | ComputeNodeData | VpcNodeData;


export interface CatalogItem {
  id: string;
  type: NodeType;
  label: string;
  subLabel: string;
  icon: LucideIcon; // Better type than 'any'
  color: string;
  
  data: AnyNodeData;
}

export interface CatalogCategory {
  id: string;
  title: string;
  items: CatalogItem[];
}