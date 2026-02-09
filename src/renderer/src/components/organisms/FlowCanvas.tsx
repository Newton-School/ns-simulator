import { useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  BackgroundVariant,
  ReactFlowInstance,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Hooks & Config
import { useFlowStore } from '../features/canvas/hooks/useFlowStore';
import { useFlowDnD } from '../features/canvas/hooks/useFlowDnD';
import { useFlowConfig, nodeTypes, GRID_COLOR } from '../features/canvas/config/flowConfig'

const FlowCanvasInternal = () => {
  // Local State
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Store State
  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, setNodes
  } = useFlowStore();

  // Static Config (Memoized)
  const { edgeTypes, defaultEdgeOptions } = useFlowConfig();

  // Drag & Drop Logic (Custom Hook)
  const { onDragOver, onDrop, onNodeDragStop } = useFlowDnD({
    nodes,
    addNode,
    setNodes,
    instance: reactFlowInstance,
  });

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
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={GRID_COLOR}
        />
        <Controls className="!bg-nss-surface !border-nss-border" />
      </ReactFlow>
    </div>
  );
};

// Wrap in Provider to ensure hooks like useReactFlow work inside
export const FlowCanvas = () => (
  <ReactFlowProvider>
    <FlowCanvasInternal />
  </ReactFlowProvider>
);