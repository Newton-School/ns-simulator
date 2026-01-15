import { memo, useCallback, useMemo, useState, useEffect } from 'react';
import {
  NodeProps,
  NodeResizer,
  NodeToolbar,
  Position,
  Node
} from 'reactflow';
import { Cloud, Lock, Ungroup, CheckCircle2 } from 'lucide-react';
import useStore from '@renderer/store/useStore';

const PADDING = 20;
const DEFAULT_MIN_SIZE = 200;

const getAbsolutePosition = (node: Node, allNodes: Node[]) => {
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentNode;

  while (parentId) {
    const parent = allNodes.find((n) => n.id === parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentNode;
  }
  return { x, y };
};

const VpcNode = ({ id, data, selected }: NodeProps) => {
  const nodes = useStore((state) => state.nodes);
  const { setNodes } = useStore.getState();

  // Local state to track visual "Success/Green" status
  const [isUngrouped, setIsUngrouped] = useState(false);

  // Check for children (Used for Sizing AND Revert Logic)
  const children = useMemo(() => nodes.filter((n) => n.parentNode === id), [nodes, id]);
  const hasChildren = children.length > 0;

  // Revert Logic: If a node is added (hasChildren becomes true), revert to Blue
  useEffect(() => {
    if (hasChildren && isUngrouped) {
      setIsUngrouped(false);
    }
  }, [hasChildren, isUngrouped]);

  // Dynamic Size Logic
  const { minW, minH } = useMemo(() => {
    if (!hasChildren) return { minW: DEFAULT_MIN_SIZE, minH: DEFAULT_MIN_SIZE };

    let maxRight = 0;
    let maxBottom = 0;

    children.forEach((child) => {
      const childRight = child.position.x + (child.width || 0);
      const childBottom = child.position.y + (child.height || 0);
      if (childRight > maxRight) maxRight = childRight;
      if (childBottom > maxBottom) maxBottom = childBottom;
    });

    return {
      minW: Math.max(DEFAULT_MIN_SIZE, maxRight + PADDING),
      minH: Math.max(DEFAULT_MIN_SIZE, maxBottom + PADDING),
    };
  }, [children, hasChildren]);

  // Ungroup Logic
  const handleUngroup = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const currentNodes = useStore.getState().nodes;
    const parentNode = currentNodes.find(n => n.id === id);

    if (!parentNode) return;

    const parentAbsPos = getAbsolutePosition(parentNode, currentNodes);

    const updatedNodes = currentNodes.map(node => {
      if (node.parentNode === id) {
        return {
          ...node,
          parentNode: undefined,
          extent: undefined,
          zIndex: 0,
          position: {
            x: parentAbsPos.x + node.position.x,
            y: parentAbsPos.y + node.position.y,
          }
        };
      }
      return node;
    });

    setNodes(updatedNodes);
    setIsUngrouped(true); // Turn Green/Grey
  }, [id, setNodes]);

  return (
    <div
      className="relative w-full h-full group"
      style={{ minWidth: minW, minHeight: minH }}
    >
      <NodeToolbar isVisible={selected} position={Position.Top} offset={10}>
        <button
          onClick={handleUngroup}
          disabled={!hasChildren && isUngrouped} // Disable if empty & already ungrouped
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded shadow-md text-[10px] font-bold uppercase tracking-wider transition-colors border
            ${isUngrouped && !hasChildren
              ? 'bg-nss-surface border-nss-border text-nss-muted cursor-default' /* Grey State (Done) */
              : 'bg-[rgb(var(--nss-danger))]/10 border-[rgb(var(--nss-danger))]/50 text-[rgb(var(--nss-danger))] hover:bg-[rgb(var(--nss-danger))] hover:text-white cursor-pointer' /* Red State (Ungroup) */
            }
          `}
        >
          {isUngrouped && !hasChildren ? <CheckCircle2 size={12} /> : <Ungroup size={12} />}
          {isUngrouped && !hasChildren ? 'Done' : 'Ungroup'}
        </button>
      </NodeToolbar>

      {/* --- VISUAL CONTENT --- */}
      <div className={`
        absolute inset-0 rounded-xl border-2 border-dashed transition-all duration-300
        ${isUngrouped && !hasChildren
          /* Success State: Green Border (Only if empty) */
          ? 'border-[rgb(var(--nss-success))] bg-[rgb(var(--nss-success))]/5 shadow-sm'
          : selected
            /* Selected State: Blue Border */
            ? 'border-nss-primary bg-nss-primary/5 shadow-sm'
            /* Default State: Grey Border */
            : 'border-nss-border-high bg-nss-surface/30'
        }
      `}>
        <div className={`
            absolute top-0 left-0 right-0 px-4 py-2 border-b border-dashed flex items-center gap-2
            ${isUngrouped && !hasChildren ? 'border-[rgb(var(--nss-success))]/30' : 'border-nss-border-high/50'}
        `}>
          <div className="p-1 rounded bg-nss-surface border border-nss-border">
            <Cloud
              size={14}
              className={isUngrouped && !hasChildren ? 'text-[rgb(var(--nss-success))]' : 'text-nss-primary'}
            />
          </div>
          <span className="text-xs font-bold text-nss-muted uppercase tracking-wider">
            {data.label || 'VPC Region'}
          </span>
          <div className="ml-auto">
            {/* Show lock only if it is NOT in the green/ungrouped state */}
            {(!isUngrouped || hasChildren) && <Lock size={12} className="text-nss-muted opacity-50" />}
          </div>
        </div>
      </div>

      {/* --- RESIZER --- */}
      <NodeResizer
        color="#3b82f6"
        isVisible={selected}
        minWidth={minW}
        minHeight={minH}
        handleStyle={{ width: 12, height: 12, borderRadius: '50%' }}
      />
    </div>
  );
};

export default memo(VpcNode);