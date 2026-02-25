export const FIELD_DEFINITIONS: Record<string, any> = {
  // --- General ---
  status: { type: 'select', label: 'Health Status', options: ['healthy', 'degraded', 'critical'] },

  // --- Metrics ---
  throughput: { type: 'slider', label: 'Throughput', min: 0, max: 100000, unit: 'req/s' },
  errorRate: { type: 'input', label: 'Error Rate', unit: '%', step: 0.01 },
  load: { type: 'slider', label: 'CPU Load', min: 0, max: 100, unit: '%' },
  queueDepth: { type: 'input', label: 'Queue Depth', unit: 'ms' },

  droppedPackets: { type: 'input', label: 'Dropped Packets', unit: '%' },
  blockRate: { type: 'input', label: 'Block Rate', unit: '%' },

  // --- Specs  ---
  vCPU: { type: 'input', label: 'vCPU Cores', unit: 'cores' },
  ram: { type: 'input', label: 'Memory', unit: 'GB' },
  region: { type: 'select', label: 'Region', options: ['us-east-1', 'us-west-2', 'eu-central-1'] },

  // --- Advanced ---
  threadPool: { type: 'slider', label: 'Thread Pool', min: 1, max: 500, unit: 'threads' },
  coldStart: { type: 'boolean', label: 'Cold Start Sim' }
}

// Group keys to display them in sections
export const FIELD_GROUPS = {
  Performance: ['throughput', 'errorRate', 'load', 'queueDepth'],
  Configuration: ['vCPU', 'ram', 'region', 'status'],
  Execution: ['threadPool', 'coldStart']
}
