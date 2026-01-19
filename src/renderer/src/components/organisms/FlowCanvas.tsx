import { useState, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  BackgroundVariant, 
  ReactFlowInstance,
  ReactFlowProvider,
  Node
} from 'reactflow';
import 'reactflow/dist/style.css'; 
import { useShallow } from 'zustand/react/shallow'; 

import useStore from '../../store/useStore'; 
import ServiceNode from '../../features/nodes/ServiceNode';

// nss-border = #2A303C
const GRID_COLOR = '#2A303C'; 

const nodeTypes = {
  serviceNode: ServiceNode,
};

let id = 1;
const getId = () => `node_${id++}`;

const FlowCanvasInternal = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

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
    // Used nss-bg (#0B0E11)
    <div style={{ width: '100%', height: '100%' }} className="bg-nss-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
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
        {/* Styled Controls to match nss-surface (#1F242C) */}
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