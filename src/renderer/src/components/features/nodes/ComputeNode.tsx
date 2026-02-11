import React, { memo, useMemo } from 'react';
import { Position, NodeProps } from 'reactflow';
import { ComputeNodeData } from '@renderer/types/ui';
import { resolveNodeConfig } from '@renderer/config/nodeRegistry';
import { ProgressBar } from '@renderer/components/atoms/ProgressBar';
import UniversalHandle from '@renderer/components/atoms/UniversalHandle';

const OFFSETS = ['25%', '50%', '75%'];
const POSITIONS = [Position.Left, Position.Top, Position.Right, Position.Bottom];

const ComputeNode = ({ data, selected }: NodeProps<ComputeNodeData>) => {
    const { icon: Icon, theme } = resolveNodeConfig(data.computeType);
    const isOverloaded = data.is_overloaded;

    const containerClasses = useMemo(() => {
        const base = "group relative min-w-[180px] bg-nss-surface rounded-lg border-2";

        if (isOverloaded) {
            return `${base} border-nss-danger shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse`;
        }
        if (selected) {
            return `${base} border-nss-primary shadow-lg`;
        }
        return `${base} border-nss-border hover:border-nss-muted`;
    }, [isOverloaded, selected]);

    const safeColor = theme.bg || 'bg-nss-primary';

    const badgeClass = data.queue_depth > 50
        ? 'bg-nss-danger/20 text-nss-danger'
        : 'bg-nss-primary/20 text-nss-primary';

    return (
        <div className={containerClasses}>
            {POSITIONS.map((pos) => (
                <React.Fragment key={pos}>
                    {OFFSETS.map((offset, i) => (
                        <UniversalHandle
                            key={`${pos}-${i}`}
                            id={`${pos}-${i}`}
                            position={pos}
                            offset={offset}
                        />
                    ))}
                </React.Fragment>
            ))}
            <div className="flex items-center gap-3 p-3 border-b border-nss-border bg-nss-panel rounded-t-lg">
                <div className={`
                    p-2 rounded-md flex items-center justify-center shrink-0
                    ${isOverloaded
                        ? 'bg-nss-danger/10 border-nss-danger/30 text-nss-danger'
                        : `bg-opacity-50 ${safeColor}`
                    }
                `}>
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

            <div className="p-3 space-y-3">
                <ProgressBar
                    label="Utilization"
                    value={data.cpu_usage}
                />

                <div className="flex items-center justify-between p-2 rounded bg-nss-bg border border-nss-border">
                    <span className="text-[10px] text-nss-muted font-medium">
                        Queue Depth
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>
                        {data.queue_depth} reqs
                    </span>
                </div>
            </div>
        </div>
    );
};

export default memo(ComputeNode);