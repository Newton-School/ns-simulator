import { create } from 'zustand'
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow'

type RFState = {
  // --- Graph Data ---
  nodes: Node[]
  edges: Edge[]

  // --- File State ---
  fileName: string | null
  isUnsaved: boolean

  // --- Actions ---
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  addNode: (node: Node) => void
  // Add type definition
  updateNodeData: (nodeId: string, data: any) => void
  updateEdgeData: (edgeId: string, label: string, data?: any) => void
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void

  // --- File Actions ---
  setFileName: (name: string | null) => void
  setUnsaved: (unsaved: boolean) => void
}

const useStore = create<RFState>((set, get) => ({
  nodes: [],
  edges: [],

  // Initial File State
  fileName: 'Untitled',
  isUnsaved: false,

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes)
    })
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges)
    })
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges)
    })
  },

  addNode: (node: Node) => {
    const currentNodes = get().nodes
    let newId = node.id

    // Check if ID exists. If yes, append timestamp/random to make it unique.
    if (currentNodes.some((n) => n.id === newId)) {
      newId = `${newId}_${Math.floor(Math.random() * 10000)}`
    }

    const isVpcContainer = node.type === 'vpcNode'

    let calculatedZIndex = node.zIndex

    if (isVpcContainer) {
      if (node.parentNode) {
        const parentObj = currentNodes.find((n) => n.id === node.parentNode)

        const parentZIndex = parentObj?.zIndex !== undefined ? parentObj.zIndex : -10
        calculatedZIndex = parentZIndex + 1
      } else {
        calculatedZIndex = -10
      }
    }
    const safeNode = {
      ...node,
      id: newId,
      ...(isVpcContainer && { zIndex: calculatedZIndex })
    }

    set({ nodes: [...currentNodes, safeNode] })
  },

  setNodes: (nodes: Node[]) => {
    set({ nodes })
  },

  setEdges: (edges: Edge[]) => {
    set({ edges })
  },

  updateNodeData: (nodeId: string, data: any) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, ...data }
          }
        }
        return node
      })
    })
  },

  updateEdgeData: (edgeId: string, label: string) => {
    set({
      edges: get().edges.map((edge) => {
        if (edge.id === edgeId) {
          return {
            ...edge,
            label
          }
        }
        return edge
      })
    })
  },

  // File State Setters
  setFileName: (fileName) => set({ fileName }),
  setUnsaved: (isUnsaved) => set({ isUnsaved })
}))

export default useStore
