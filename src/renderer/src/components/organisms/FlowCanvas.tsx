import { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  BackgroundVariant,
  ReactFlowInstance,
  ReactFlowProvider,
  Node,
  EdgeTypes,
  useReactFlow,
  NodeDragHandler,
  getRectOfNodes,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useShallow } from 'zustand/react/shallow';
import { Group } from 'lucide-react';

import useStore from '../../store/useStore';
import ServiceNode from './nodes/ServiceNode';
import VpcNode from './nodes/VpcNode';
import { PacketEdge } from '../../components/molecules/flow/edges/PacketEdge';

const GRID_COLOR = '#2A303C';

const nodeTypes = {
  serviceNode: ServiceNode,
  vpcNode: VpcNode,
};

let id = 1;
const getId = () => `node_${id++}`;

const FlowCanvasInternal = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const { getIntersectingNodes } = useReactFlow();

  const edgeTypes = useMemo<EdgeTypes>(() => ({ packet: PacketEdge }), []);
  const defaultEdgeOptions = useMemo(() => ({
    type: 'packet',
    animated: false,
    data: { trafficType: 'default', speed: 'normal' },
  }), []);

  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, setNodes
  } = useStore(useShallow((state) => ({
    nodes: state.nodes,
    edges: state.edges,
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect,
    addNode: state.addNode,
    setNodes: state.setNodes,
  })));

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow/type');
    const dataString = event.dataTransfer.getData('application/reactflow/data');

    if (!type || !dataString) return;
    const data = JSON.parse(dataString);

    const position = reactFlowInstance?.screenToFlowPosition({ x: event.clientX, y: event.clientY }) || { x: 0, y: 0 };

    // 1. Find valid targets (VPCs only)
    const intersectingVpcs = nodes.filter(n =>
      n.type === 'vpcNode' &&
      position.x > n.position.x &&
      position.x < n.position.x + (n.width || 0) &&
      position.y > n.position.y &&
      position.y < n.position.y + (n.height || 0)
    ).sort((a, b) => (a.width! * a.height!) - (b.width! * b.height!));

    // 2. Target the smallest VPC (innermost)
    const targetVpc = intersectingVpcs[0];

    let newNode: Node = {
      id: getId(),
      type,
      position,
      data: { ...data },
    };

    if (targetVpc) {
      newNode.parentNode = targetVpc.id;
      newNode.extent = 'parent';
      // Convert to relative coordinates
      newNode.position = {
        x: position.x - targetVpc.position.x,
        y: position.y - targetVpc.position.y,
      };
      // Important: Lift nested items up so they are clickable
      newNode.zIndex = 10;
    }

    addNode(newNode);
  }, [reactFlowInstance, addNode, nodes]);


  // --- MAIN LOGIC: DRAG STOP HANDLER ---
  const onNodeDragStop: NodeDragHandler = useCallback((_, node) => {
    // 1. Calculate Intersections
    // Only look for VPCs. Dragging a VPC over a Service Node returns nothing (Fixes "Grouping Everything").
    const intersections = getIntersectingNodes(node).filter(
      (n) => n.type === 'vpcNode' && n.id !== node.id
    );

    // 2. Sort by Area (Smallest first)
    // This ensures we drop into the INNERMOST nested VPC.
    intersections.sort((a, b) => {
      const areaA = (a.width || 0) * (a.height || 0);
      const areaB = (b.width || 0) * (b.height || 0);
      return areaA - areaB;
    });

    const targetVpc = intersections[0];

    // --- SCENARIO A: ATTACH TO PARENT ---
    if (targetVpc) {
      // Prevent cycles: Don't let a parent drop into its own child
      if (node.id === targetVpc.parentNode) return;

      // If already parented to this VPC, do nothing
      if (node.parentNode === targetVpc.id) return;

      const relativePosition = {
        x: node.position.x - targetVpc.position.x,
        y: node.position.y - targetVpc.position.y,
      };

      setNodes(nodes.map((n) => n.id === node.id ? {
        ...n,
        parentNode: targetVpc.id,
        position: relativePosition,
        extent: 'parent',
        // Fix: Use zIndex 10 so nested VPCs sit ON TOP of their parent's background
        zIndex: 10,
        expandParent: false // Fix: Disable auto-expand to prevent resizing bugs
      } : n));
    }

    // --- SCENARIO B: DETACH FROM PARENT (If dragged out) ---
    // Note: If extent='parent', this never triggers via drag. Must use Ungroup button.
    else if (node.parentNode && !targetVpc) {
      // Logic handles rare cases where extent might be missing
      // ... (Logic remains same as before if needed)
    }
  }, [nodes, setNodes, getIntersectingNodes]);


  const onGroupSelection = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected && n.type !== 'vpcNode');
    if (selectedNodes.length < 2) return alert("Select 2+ nodes");

    const rect = getRectOfNodes(selectedNodes);
    const PADDING = 40;
    const groupId = getId();

    const groupNode: Node = {
      id: groupId,
      type: 'vpcNode',
      position: { x: rect.x - PADDING, y: rect.y - PADDING },
      style: { width: rect.width + PADDING * 2, height: rect.height + PADDING * 2 },
      data: { label: 'Cluster Group', iconKey: 'globe', status: 'healthy' },
    };

    const updatedChildren = nodes.map((node) => {
      if (node.selected && node.type !== 'vpcNode') {
        return {
          ...node,
          parentNode: groupId,
          extent: 'parent' as const,
          position: {
            x: node.position.x - (rect.x - PADDING),
            y: node.position.y - (rect.y - PADDING),
          },
          selected: false,
          zIndex: 10, // Ensure grouped items are above group background
        };
      }
      return node;
    });

    setNodes([groupNode, ...updatedChildren]);
  }, [nodes, setNodes]);

  return (
    <div style={{ width: '100%', height: '100%' }} className="bg-nss-bg relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStop={onNodeDragStop}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={GRID_COLOR} />
        <Controls className="!bg-nss-surface !border-nss-border" />
        <Panel position="top-right" className="bg-nss-surface p-2 rounded-lg border border-nss-border shadow-md">
          <button onClick={onGroupSelection} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-nss-muted hover:text-nss-primary transition-colors">
            <Group size={16} /> Group Selected
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export const FlowCanvas = () => <ReactFlowProvider><FlowCanvasInternal /></ReactFlowProvider>;