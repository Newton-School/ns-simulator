import { useCallback, useEffect, useRef } from 'react'
import useStore from '@renderer/store/useStore'
import { useFileHandlers } from './useFileHandlers'

import {
  convertFlatToNested,
  convertNestedToFlat,
  NestedFileData
} from '@renderer/utils/nodeTransformers'

const extractFileName = (path: string): string => {
  return path.replace(/^.*[\\/]/, '')
}

const generateId = (type) => `${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`

let clipboard: { nodes: any[]; edges: any[] } = { nodes: [], edges: [] }

const useKeyboardShortcuts = (onSave: () => void, onOpen: () => void) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (!isMod) return

      if (e.key.toLowerCase() === 's') {
        e.preventDefault()
        onSave()
      } else if (e.key.toLowerCase() === 'o') {
        e.preventDefault()
        onOpen()
      } else if(e.key.toLowerCase() === 'c') {
        e.preventDefault();
        const {nodes,edges} = useStore.getState()
        console.log(useStore.getState());
        
        const selectedNodes = nodes.filter(node => node.selected)

        if(selectedNodes.length === 0) return;

        const selectedIds = new Set(selectedNodes.map((node) => node.id))

        const selectedEdges = edges.filter((edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target))

        clipboard = {
          nodes: selectedNodes,
          edges: selectedEdges
        }        
      }

      // paste nodes & edges
      else if(e.key.toLowerCase() === 'v') {
        e.preventDefault()

        if(!clipboard) return;

        const { nodes, edges, setNodes, setEdges, setUnsaved } = useStore.getState()

        const idMap = new Map<string, string>()

        // relicate nodes
        const newNodes = clipboard.nodes.map((node) => {
          const newId = generateId('node')
          idMap.set(node.id, newId)

          return {
            ...node,
            id: newId,
            position: {
              x: node.position.x + 40,
              y: node.position.y + 40
            },
            selected: false
          }
        })

        // replicate edges
        const newEdges = clipboard.edges.map((edge) => ({
          ...edge,
          id: generateId("edge"),
          source: idMap.get(edge.source)!,
          target: idMap.get(edge.target)!
        }))

        setNodes([...nodes, ...newNodes])
        setEdges([...edges, ...newEdges])
        setUnsaved(true)

        console.log('Pasted:', newNodes, newEdges)
      }


    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSave, onOpen])
}

export const useFlowPersistence = () => {
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const setNodes = useStore((s) => s.setNodes)
  const setEdges = useStore((s) => s.setEdges)
  const setFileName = useStore((s) => s.setFileName)
  const setUnsaved = useStore((s) => s.setUnsaved)

  const isLoadingRef = useRef(false)

  const handleGetFileData = useCallback(() => {
    const { nodes, edges } = useStore.getState()
    const nestedNodes = convertFlatToNested(nodes)
    return JSON.stringify({ nodes: nestedNodes, edges }, null, 2)
  }, [])

  const handleLoadFileData = useCallback(
    (fileContent: string | object, filePath?: string) => {
      try {
        const data = (
          typeof fileContent === 'string' ? JSON.parse(fileContent) : fileContent
        ) as NestedFileData

        if (!data?.nodes) throw new Error('Invalid file format')

        const flatNodes = convertNestedToFlat(data.nodes)

        isLoadingRef.current = true

        setNodes(flatNodes)
        setEdges(data.edges || [])
        setUnsaved(false)

        if (filePath && typeof filePath === 'string') {
          setFileName(extractFileName(filePath))
        }

        setTimeout(() => {
          isLoadingRef.current = false
        }, 100)
      } catch (error) {
        console.error('Failed to load flow:', error)
        alert('Error loading file.')
        isLoadingRef.current = false
      }
    },
    [setNodes, setEdges, setFileName, setUnsaved]
  )

  const { handleSave: innerSave, handleOpen } = useFileHandlers(
    handleGetFileData,
    handleLoadFileData
  )

  const handleSaveWrapper = useCallback(async () => {
    const savedPath = await innerSave()

    if (savedPath && typeof savedPath === 'string') {
      setFileName(extractFileName(savedPath))
      setUnsaved(false)
    }
  }, [innerSave, setFileName, setUnsaved])

  useKeyboardShortcuts(handleSaveWrapper, handleOpen)

  useEffect(() => {
    if (isLoadingRef.current) return

    if (nodes.length > 0) {
      setUnsaved(true)
    }
  }, [nodes, edges, setUnsaved])

  return { handleSave: handleSaveWrapper, handleOpen }
}
