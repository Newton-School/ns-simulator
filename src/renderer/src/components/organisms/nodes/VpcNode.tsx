import { memo, useCallback } from 'react';
import {
  NodeProps,
  NodeResizer,
  NodeToolbar,
  Position
} from 'reactflow';
import { Cloud, Lock, Ungroup } from 'lucide-react'; // Import Ungroup icon
import useStore from '../../../store/useStore'; // Import your store

const VpcNode = ({ id, data, selected }: NodeProps) => {
  const { nodes, setNodes } = useStore.getState();

  const handleUngroup = useCallback(() => {
    const currentNodes = nodes;
    const parentNode = currentNodes.find(n => n.id === id);

    if (!parentNode) return;

    const updatedNodes = currentNodes.map(node => {
      // If this node is a child of the current VPC
      if (node.parentNode === id) {
        return {
          ...node,
          parentNode: undefined, // Remove parent
          extent: undefined,     // Remove movement constraint
          position: {            // Convert Relative -> Absolute
            x: parentNode.position.x + node.position.x,
            y: parentNode.position.y + node.position.y,
          }
        };
      }
      return node;
    });

    // 4. Update nodes (and optionally remove the VPC itself)
    // If you want to KEEP the VPC box but empty it, use 'updatedNodes'
    // If you want to DELETE the VPC box, filter it out:
    // const finalNodes = updatedNodes.filter(n => n.id !== id);

    setNodes(updatedNodes);

  }, [id, setNodes]);

  return (
    <div className="relative w-full h-full group min-w-[200px] min-h-[200px]">

      {/* --- NEW: TOOLBAR (Only visible when selected) --- */}
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        offset={10}
        className="flex gap-2"
      >
        <button
          onClick={handleUngroup}
          className="flex items-center gap-1.5 px-2 py-1 bg-nss-surface border border-nss-border rounded shadow-md text-[10px] font-bold uppercase tracking-wider text-nss-muted hover:text-nss-danger hover:border-nss-danger transition-colors"
        >
          <Ungroup size={12} />
          Ungroup
        </button>
      </NodeToolbar>

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
          <div className="ml-auto">
            <Lock size={12} className="text-nss-muted opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(VpcNode);