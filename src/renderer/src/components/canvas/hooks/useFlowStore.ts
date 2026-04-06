import { useShallow } from 'zustand/react/shallow'
import useStore from '@renderer/store/useStore'

export const useFlowStore = () => {
  return useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      addNode: state.addNode,
      setNodes: state.setNodes,
      setEdges: state.setEdges,
      updateNodeData: state.updateNodeData,
      updateEdgeData: state.updateEdgeData
    }))
  )
}
