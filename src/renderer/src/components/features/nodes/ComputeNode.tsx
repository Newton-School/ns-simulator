import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ComputeNodeData } from '@renderer/types/ui';
import { resolveNodeConfig } from '@renderer/config/nodeRegistry';
import { ProgressBar } from '@renderer/components/atoms/ProgressBar';

const ComputeNode = ({ data, selected }: NodeProps<ComputeNodeData>) => {
    const { icon: Icon, theme } = resolveNodeConfig(data.computeType);
    const isOverloaded = data.is_overloaded;

    const containerStyle = isOverloaded
        ? 'border-nss-danger shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'
        : selected
            ? 'border-nss-primary shadow-lg'
            : 'border-nss-border hover:border-nss-muted';

    const safeColor = theme.bg || 'bg-nss-primary';

    return (
        <div className={`relative min-w-[180px] bg-nss-surface rounded-lg border-2 transition-all duration-300 ${containerStyle}`}>
            <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-nss-muted" />

            {/* Header */}
            <div className="flex items-center gap-3 p-3 border-b border-nss-border bg-nss-panel rounded-t-lg">
                <div className={`p-2 rounded-md transition-colors duration-300 flex items-center justify-center
                    ${isOverloaded 
                        ? 'bg-nss-danger/10 border-nss-danger/30 text-nss-danger' 
                        : `bg-opacity-50 ${safeColor} shrink-0`
                    }`}>
                    <Icon size={16} />
                </div>

                <div className="flex flex-col">
                    <span className="text-xs font-bold text-nss-text uppercase tracking-wide">{data.label}</span>
                    <span className="text-[10px] text-nss-muted font-mono">{data.computeType}</span>
                </div>
            </div>

            {/* Body */}
            <div className="p-3 space-y-3">
                <ProgressBar 
                    label="Utilization" 
                    value={data.cpu_usage} 
                />

                {/* Queue Badge */}
                <div className="flex items-center justify-between p-2 rounded bg-nss-bg border border-nss-border">
                    <span className="text-[10px] text-nss-muted font-medium">Queue Depth</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                        ${data.queue_depth > 50 ? 'bg-nss-danger/20 text-nss-danger' : 'bg-nss-primary/20 text-nss-primary'}`}>
                        {data.queue_depth} reqs
                    </span>
                </div>
            </div>

            <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-nss-muted" />
        </div>
    );
};

export default memo(ComputeNode);