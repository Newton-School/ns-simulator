import { useState, useCallback, useMemo } from 'react'; // Added useMemo
import ReactFlow, {
  Background,
  Controls,
  BackgroundVariant,
  ReactFlowInstance,
  ReactFlowProvider,
  Node,
  EdgeTypes // Import Type
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useShallow } from 'zustand/react/shallow';

import useStore from '../../store/useStore';
import ServiceNode from './ServiceNode';
import { PacketEdge } from '../molecules/flow/edges/PacketEdge';

// nss-border = #2A303C
const GRID_COLOR = '#2A303C';

const nodeTypes = {
  serviceNode: ServiceNode,
};

let id = 1;
const getId = () => `node_${id++}`;

const FlowCanvasInternal = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Define Edge Types (Memoized to prevent re-renders)
  const edgeTypes = useMemo<EdgeTypes>(() => ({
    packet: PacketEdge,
  }), []);

  // Default options: Every new connection becomes a 'packet' edge
  const defaultEdgeOptions = useMemo(() => ({
    type: 'packet',
    animated: false, // Turn off default "marching ants"
    data: { trafficType: 'default', speed: 'normal' }, // Default data
  }), []);

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      addNode: state.addNode,
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

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { ...data },
      };

      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );

  return (
    <div style={{ width: '100%', height: '100%' }} className="bg-nss-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes} // Pass Custom Edges
        defaultEdgeOptions={defaultEdgeOptions} // Apply defaults
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={GRID_COLOR}
        />
        <Controls className="!bg-nss-surface !border-nss-border [&>button]:!fill-nss-muted hover:[&>button]:!fill-white" />
      </ReactFlow>
    </div>
  );
};

export const FlowCanvas = () => (
  <ReactFlowProvider>
    <FlowCanvasInternal />
  </ReactFlowProvider>
);