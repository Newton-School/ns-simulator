import { useEffect, useRef, useCallback } from 'react'
import { Node, Edge, useReactFlow } from 'reactflow'
import { useFlowStore } from './useFlowStore'

export const useCopyPaste = () => {
  const { nodes, edges, setNodes, setEdges } = useFlowStore()
  const storeRef = useRef({ nodes, edges })
  useEffect(() => {
    storeRef.current = { nodes, edges }
  }, [nodes, edges])

  const { screenToFlowPosition } = useReactFlow()
  const mousePosRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const clipboardRef = useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] })

  const copy = useCallback(() => {
    const { nodes: currentNodes, edges: currentEdges } = storeRef.current
    const selectedNodes = currentNodes.filter((n) => n.selected)
    if (selectedNodes.length === 0) return
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id))
    const selectedEdges = currentEdges.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
    )
    clipboardRef.current = {
      nodes: JSON.parse(JSON.stringify(selectedNodes)),
      edges: JSON.parse(JSON.stringify(selectedEdges))
    }
  }, [])

  const paste = useCallback(() => {
    const { nodes: clipboardNodes, edges: clipboardEdges } = clipboardRef.current
    if (clipboardNodes.length === 0) return

    const { nodes: currentNodes, edges: currentEdges } = storeRef.current
    let minX = Infinity
    let minY = Infinity
    clipboardNodes.forEach((node) => {
      if (node.position.x < minX) minX = node.position.x
      if (node.position.y < minY) minY = node.position.y
    })
    const targetFlowPos = screenToFlowPosition({
      x: mousePosRef.current.x,
      y: mousePosRef.current.y
    })
    const offsetX = targetFlowPos.x - minX
    const offsetY = targetFlowPos.y - minY

    const idMap = new Map<string, string>()
    clipboardNodes.forEach((node) => {
      idMap.set(node.id, crypto.randomUUID())
    })

    const pastedNodes = clipboardNodes.map((node) => {
      const newNode = { ...node, id: idMap.get(node.id)! }
      if (newNode.parentNode && idMap.has(newNode.parentNode)) {
        newNode.parentNode = idMap.get(newNode.parentNode)!
      }
      newNode.position = {
        x: newNode.position.x + offsetX,
        y: newNode.position.y + offsetY
      }
      newNode.selected = true
      return newNode
    })

    const pastedEdges = clipboardEdges.map((edge) => ({
      ...edge,
      id: crypto.randomUUID(),
      source: idMap.get(edge.source)!,
      target: idMap.get(edge.target)!,
      selected: true
    }))

    const nextNodes: Node[] = [
      ...currentNodes.map((n) => ({ ...n, selected: false })),
      ...pastedNodes
    ]
    const nextEdges: Edge[] = [
      ...currentEdges.map((e) => ({ ...e, selected: false })),
      ...pastedEdges
    ]

    setNodes(nextNodes)
    setEdges(nextEdges)
  }, [setNodes, setEdges, screenToFlowPosition])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
        event.preventDefault()
        copy()
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
        event.preventDefault()
        paste()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [copy, paste])
}
