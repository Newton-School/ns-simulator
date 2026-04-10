import { useCallback } from 'react'
import { ReactFlowInstance, NodeDragHandler, Node, useReactFlow } from 'reactflow'
import { findTargetVpc, getId } from '../utils/canvasUtils'

interface UseFlowDnDProps {
  nodes: Node[]
  addNode: (node: Node) => void
  setNodes: (nodes: Node[]) => void
  instance: ReactFlowInstance | null
}

//Circular dedendency check function
const createsCircularDependency = (
  draggedNodeId: string,
  targetParentId: string,
  nodes: Node[]
): boolean => {
  let currentParentId: string | undefined = targetParentId

  while (currentParentId) {
    if (currentParentId === draggedNodeId) {
      return true // Cycle detected!
    }

    const parentNode = nodes.find((n) => n.id === currentParentId)
    currentParentId = parentNode?.parentNode
  }

  return false
}

export const useFlowDnD = ({ nodes, addNode, setNodes, instance }: UseFlowDnDProps) => {
  const { getIntersectingNodes } = useReactFlow()

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/reactflow/type')
      const dataString = event.dataTransfer.getData('application/reactflow/data')

      if (!type || !dataString) return

      const data = JSON.parse(dataString)
      const position = instance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      }) || { x: 0, y: 0 }

      // Reusable logic to find target VPC
      const targetVpc = findTargetVpc(nodes, position)

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { ...data }
      }

      if (targetVpc) {
        newNode.parentNode = targetVpc.id
        newNode.extent = 'parent'
        newNode.zIndex = 10 // Lift nested items
        newNode.position = {
          x: position.x - targetVpc.position.x,
          y: position.y - targetVpc.position.y
        }
      }

      addNode(newNode)
    },
    [instance, addNode, nodes]
  )

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_, node) => {
      // Find intersections using React Flow's helper, then filter for VPCs
      const intersections = getIntersectingNodes(node).filter(
        (n) => n.type === 'vpcNode' && n.id !== node.id
      )

      // Manual sort since getIntersectingNodes doesn't guarantee order
      intersections.sort((a, b) => {
        const areaA = (a.width || 0) * (a.height || 0)
        const areaB = (b.width || 0) * (b.height || 0)
        return areaA - areaB
      })

      const targetVpc = intersections[0]

      if (targetVpc) {
        if (createsCircularDependency(node.id, targetVpc.id, nodes)) {
          console.warn('Nesting aborted: Circular dependency detected.')
          return
        }

        if (node.parentNode === targetVpc.id) return

        const relativePosition = {
          x: node.position.x - targetVpc.position.x,
          y: node.position.y - targetVpc.position.y
        }

        setNodes(
          nodes.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  parentNode: targetVpc.id,
                  position: relativePosition,
                  extent: 'parent',
                  expandParent: false,
                  zIndex: 10
                }
              : n
          )
        )
      }

      // Scenario B: Detach is handled by Ungroup Button (Toolbar)
      // We purposefully don't auto-detach on drag to prevent accidental removals.
    },
    [nodes, setNodes, getIntersectingNodes]
  )

  return { onDragOver, onDrop, onNodeDragStop }
}
