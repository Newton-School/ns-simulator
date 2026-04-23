import { useState, useCallback, useEffect, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowInstance,
  ReactFlowProvider,
  Edge,
  ConnectionLineType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { EdgeSimulationData } from '@renderer/types/ui'

import EmptyFlowState from '../ui/EmptyFlowState'
// Hooks & Config
import { EdgePropertiesPanel, EdgePropertiesPanelValue } from '../ui/EdgePropertiesPanel'

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
  const prevNodeCount = useRef(nodes.length)

  useEffect(() => {
    const isBulkLoad = Math.abs(nodes.length - prevNodeCount.current) > 1

    if (reactFlowInstance && isBulkLoad) {
      // Only fit view when many nodes are added at once (e.g. opening a saved file)
      window.requestAnimationFrame(() => {
        reactFlowInstance.fitView({
          padding: 0.2,
          maxZoom: 1.2,
          duration: 800
        })
      })
    }

    prevNodeCount.current = nodes.length
  }, [nodes.length, reactFlowInstance])

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation()
    setSelectedEdge(edge)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedEdge(null)
  }, [])

  const handleEdgePropertiesChange = useCallback(
    (patch: Partial<EdgePropertiesPanelValue>) => {
      if (!selectedEdge) return

      const { label, ...dataPatch } = patch
      const hasDataPatch = Object.keys(dataPatch).length > 0

      updateEdgeData(selectedEdge.id, {
        ...(label !== undefined ? { label } : {}),
        ...(hasDataPatch ? { data: dataPatch as Partial<EdgeSimulationData> } : {})
      })

      setSelectedEdge((prev) =>
        prev
          ? {
              ...prev,
              ...(label !== undefined ? { label } : {}),
              ...(hasDataPatch
                ? {
                    data: {
                      ...((prev.data as Record<string, unknown> | undefined) ?? {}),
                      ...dataPatch
                    }
                  }
                : {})
            }
          : null
      )
    },
    [selectedEdge, updateEdgeData]
  )

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
        <MiniMap className="!bg-nss-surface !border-nss-border" />
      </ReactFlow>
      {/* Empty State */}
      <EmptyFlowState isEmpty={isEmpty} />

      {selectedEdge && (
        <EdgePropertiesPanel
          value={{
            label: (selectedEdge.label as string) || '',
            ...(((selectedEdge.data as EdgeSimulationData | undefined) ?? {}) as EdgeSimulationData)
          }}
          onChange={handleEdgePropertiesChange}
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
