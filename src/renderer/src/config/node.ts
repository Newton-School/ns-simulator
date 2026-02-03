export type ComputeType = 'SERVER' | 'LAMBDA' | 'WORKER' | 'CRON';

export interface ComputeNodeData {
  label: string;
  computeType: ComputeType;
  cpu_usage: number;      // 0-100
  queue_depth: number;    // pending work count
  is_overloaded: boolean; // Simulation state
  
  iconKey?: string;
  subLabel?: string;
}