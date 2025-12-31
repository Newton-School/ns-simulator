import { useState, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  BackgroundVariant, 
  ReactFlowInstance,
  Node
} from 'reactflow';
import 'reactflow/dist/style.css'; 
import { useShallow } from 'zustand/react/shallow'; 

import useStore from '../../store/useStore'; 
import DummyNode from '../nodes/DummyNode'; 

// Mapping all types to DummyNode for now
const nodeTypes = {
  server: DummyNode,
  database: DummyNode,
  router: DummyNode,
  loadBalancer: DummyNode
};

// Simple ID generator
let id = 1;
const getId = () => `node_${id++}`;

export const Canvas = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Zustand Selectors
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

      const rawData = event.dataTransfer.getData('application/reactflow');
      
      // 1. Validate data
      if (!rawData) return;

      // 2. Parse the JSON sent from Catalog
      const { type, label, color } = JSON.parse(rawData);

      // 3. Calculate Position
      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // 4. Create New Node
      const newNode: Node = {
        id: getId(),
        type, // e.g. 'server'
        position: position || { x: 0, y: 0 },
        data: { 
            label, // e.g. 'Server'
            color  // e.g. 'bg-blue-500'
        },
      };

      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
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
            gap={12} 
            size={1}
            color="#aaa" 
        />
        <Controls style={{ fill: '#333' }} />
      </ReactFlow>
    </div>
  );
};