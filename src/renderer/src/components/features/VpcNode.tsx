import { memo } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { Cloud } from 'lucide-react';

const VpcNode = ({ data, selected }: NodeProps) => {
    return (
        <div className="relative w-full h-full group min-w-[200px] min-h-[200px]">
            <NodeResizer
                color="#3b82f6"
                isVisible={selected}
                minWidth={200}
                minHeight={200}
            />

            <div className={`
        absolute inset-0 rounded-xl border-2 border-dashed transition-all duration-300
        ${selected
                    ? 'border-nss-primary bg-nss-primary/5 shadow-sm'
                    : 'border-nss-border-high bg-nss-surface/30'
                }
      `}>
                <div className="absolute top-0 left-0 right-0 px-4 py-2 border-b border-dashed border-nss-border-high/50 flex items-center gap-2">
                    <div className="p-1 rounded bg-nss-surface border border-nss-border">
                        <Cloud size={14} className="text-nss-primary" />
                    </div>
                    <span className="text-xs font-bold text-nss-muted uppercase tracking-wider">
                        {data.label || 'VPC Region'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default memo(VpcNode);