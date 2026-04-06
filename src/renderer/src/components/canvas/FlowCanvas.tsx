import { useState, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  BackgroundVariant,
  ReactFlowInstance,
  ReactFlowProvider,
  Edge,
  ConnectionLineType
} from 'reactflow'
import 'reactflow/dist/style.css'

import EmptyFlowState from '../ui/EmptyFlowState'
// Hooks & Config
import { EdgePropertiesPanel } from '../ui/EdgePropertiesPanel'

import { useFlowStore } from './hooks/useFlowStore'
import { useFlowDnD } from './hooks/useFlowDnD'
import { useFlowConfig, nodeTypes, GRID_COLOR } from './config/flowConfig'

const FlowCanvasInternal = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setNodes,
    updateEdgeData
  } = useFlowStore()

  const { edgeTypes, defaultEdgeOptions } = useFlowConfig()

  const { onDragOver, onDrop, onNodeDragStop } = useFlowDnD({
    nodes,
    addNode,
    setNodes,
    instance: reactFlowInstance
  })

  const isEmpty = nodes.length === 0
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation()
    setSelectedEdge(edge)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedEdge(null)
  }, [])

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedEdge) return

    const newLabel = e.target.value

    updateEdgeData(selectedEdge.id, newLabel)

    setSelectedEdge((prev) =>
      prev
        ? {
            ...prev,
            label: newLabel
          }
        : null
    )
  }

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
        connectionLineType={ConnectionLineType.SmoothStep}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStop={onNodeDragStop}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={GRID_COLOR} />
        <Controls className="!bg-nss-surface !border-nss-border" />
      </ReactFlow>
      {/* Empty State */}
      <EmptyFlowState isEmpty={isEmpty} />

      {selectedEdge && (
        <EdgePropertiesPanel
          labelValue={(selectedEdge.label as string) || ''}
          onLabelChange={handleLabelChange}
          onClose={() => setSelectedEdge(null)}
        />
      )}
    </div>
  )
}

export const FlowCanvas = () => (
  <ReactFlowProvider>
    <FlowCanvasInternal />
  </ReactFlowProvider>
)
