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
import ServiceNode from './ServiceNode';
import VpcNode from '../features/VpcNode';
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

  // Memoized Custom Edge Types
  const edgeTypes = useMemo<EdgeTypes>(() => ({
    packet: PacketEdge,
  }), []);

  // Default Edge Options
  const defaultEdgeOptions = useMemo(() => ({
    type: 'packet',
    animated: false,
    data: { trafficType: 'default', speed: 'normal' },
  }), []);

  // Store Selectors
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setNodes
  } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      addNode: state.addNode,
      setNodes: state.setNodes,
    }))
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type');
      const dataString = event.dataTransfer.getData('application/reactflow/data');

      if (!type || !dataString) return;

      const data = JSON.parse(dataString);

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }) || { x: 0, y: 0 };

      const targetVpc = nodes.find(n =>
        n.type === 'vpcNode' &&
        position.x > n.position.x &&
        position.x < n.position.x + (n.width || 0) &&
        position.y > n.position.y &&
        position.y < n.position.y + (n.height || 0)
      );

      let finalParentId: string | undefined = undefined;
      let finalPosition = position;
      let finalExtent: 'parent' | undefined = undefined;

      if (targetVpc) {
        finalParentId = targetVpc.id;
        finalPosition = {
          x: position.x - targetVpc.position.x,
          y: position.y - targetVpc.position.y,
        };
        finalExtent = 'parent';
      }

      const newNode: Node = {
        id: getId(),
        type,
        position: finalPosition,
        parentNode: finalParentId,
        extent: finalExtent,
        data: { ...data },
      };

      addNode(newNode);
    },
    [reactFlowInstance, addNode, nodes]
  );

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_, node) => {
      if (node.type === 'vpcNode') return;

      const intersections = getIntersectingNodes(node).filter(
        (n) => n.type === 'vpcNode'
      );
      const targetVpc = intersections[0];

      // CASE A: Dropped INTO a VPC
      if (targetVpc && node.parentNode !== targetVpc.id) {
        const relativePosition = {
          x: node.position.x - targetVpc.position.x,
          y: node.position.y - targetVpc.position.y,
        };

        setNodes(
          nodes.map((n) =>
            n.id === node.id
              ? {
                ...n,
                parentNode: targetVpc.id,
                position: relativePosition,
                extent: 'parent' as const,
                expandParent: true,
              }
              : n
          )
        );
      }

      // CASE B: Dragged OUT of a VPC
      else if (!targetVpc && node.parentNode) {
        const oldParent = nodes.find((n) => n.id === node.parentNode);
        const worldPosition = oldParent
          ? {
            x: oldParent.position.x + node.position.x,
            y: oldParent.position.y + node.position.y,
          }
          : node.position;

        setNodes(
          nodes.map((n) =>
            n.id === node.id
              ? {
                ...n,
                parentNode: undefined,
                position: worldPosition,
                extent: undefined,
              }
              : n
          )
        );
      }
    },
    [nodes, setNodes, getIntersectingNodes]
  );

  const onGroupSelection = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected && n.type !== 'vpcNode');

    if (selectedNodes.length < 2) {
      alert("Please select at least 2 nodes to group.");
      return;
    }

    const rect = getRectOfNodes(selectedNodes);
    const PADDING = 40;
    const groupId = getId();

    const groupNode: Node = {
      id: groupId,
      type: 'vpcNode',
      position: {
        x: rect.x - PADDING,
        y: rect.y - PADDING
      },
      style: {
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      },
      data: { label: 'New Cluster Group', iconKey: 'globe', status: 'healthy' },
    };

    const updatedChildren = nodes.map((node) => {
      if (node.selected && node.type !== 'vpcNode') {
        const updatedNode: Node = {
          ...node,
          parentNode: groupId,
          extent: 'parent' as const,
          position: {
            x: node.position.x - (rect.x - PADDING),
            y: node.position.y - (rect.y - PADDING),
          },
          selected: false,
        };
        return updatedNode;
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
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={GRID_COLOR}
        />
        <Controls className="!bg-nss-surface !border-nss-border [&>button]:!fill-nss-muted hover:[&>button]:!fill-white" />

        {/* GROUP BUTTON */}
        <Panel position="top-right" className="bg-nss-surface p-2 rounded-lg border border-nss-border shadow-md">
          <button
            onClick={onGroupSelection}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-nss-muted hover:text-nss-primary transition-colors"
          >
            <Group size={16} />
            Group Selected
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export const FlowCanvas = () => (
  <ReactFlowProvider>
    <FlowCanvasInternal />
  </ReactFlowProvider>
);