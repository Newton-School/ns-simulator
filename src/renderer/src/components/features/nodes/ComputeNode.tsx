import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Server, Zap, Cpu, Clock, Activity } from 'lucide-react';
import { ComputeNodeData, ComputeType } from '@renderer/types/ui';

const COMPUTE_ICONS: Record<ComputeType, any> = {
  SERVER: Server,
  LAMBDA: Zap,
  WORKER: Cpu,
  CRON: Clock
};

const ComputeNode = ({ data, selected }: NodeProps<ComputeNodeData>) => {
  const Icon = COMPUTE_ICONS[data.computeType] || Activity;
  
  const overloadStyle = data.is_overloaded 
    ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse' 
    : selected 
      ? 'border-nss-primary shadow-lg' 
      : 'border-nss-border hover:border-nss-muted';

  const getUtilColor = (usage: number) => {
    if (usage >= 90) return 'bg-nss-danger';
    if (usage >= 70) return 'bg-nss-warning';
    return 'bg-nss-success';
  };

  return (
    <div className={`
      relative min-w-[180px] bg-nss-surface rounded-lg border-2 transition-all duration-300
      ${overloadStyle}
    `}>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-nss-muted" />
      
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-nss-border bg-nss-panel rounded-t-lg">
        <div className={`p-2 rounded-md bg-nss-bg border border-nss-border text-nss-text`}>
          <Icon size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-nss-text uppercase tracking-wide">
            {data.label}
          </span>
          <span className="text-[10px] text-nss-muted font-mono">
            {data.computeType}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        
        {/* Utilization Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-medium text-nss-muted">
            <span>Utilization</span>
            <span>{data.cpu_usage}%</span>
          </div>
          <div className="h-2 w-full bg-nss-bg rounded-full overflow-hidden border border-nss-border">
            <div 
              className={`h-full transition-all duration-300 ${getUtilColor(data.cpu_usage)}`} 
              style={{ width: `${Math.min(data.cpu_usage, 100)}%` }}
            />
          </div>
        </div>

        {/* Queue Badge */}
        <div className="flex items-center justify-between p-2 rounded bg-nss-bg border border-nss-border">
          <span className="text-[10px] text-nss-muted font-medium">Backlog</span>
          <span className={`
            px-2 py-0.5 rounded-full text-[10px] font-bold
            ${data.queue_depth > 50 ? 'bg-nss-danger/20 text-nss-danger' : 'bg-nss-primary/20 text-nss-primary'}
          `}>
            {data.queue_depth} reqs
          </span>
        </div>

      </div>
      
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-nss-muted" />
    </div>
  );
};

export default memo(ComputeNode);