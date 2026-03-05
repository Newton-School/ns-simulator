import { useMemo } from 'react'
import ServiceNode from '../../nodes/ServiceNode'
import VpcNode from '../../nodes/VpcNode'
import ComputeNode from '../../nodes/ComputeNode' 
import SecurityNode from '../../nodes/SecurityNode'
import { PacketEdge } from '@renderer/components/molecules/flow/edges/PacketEdge'

export const GRID_COLOR = '#2A303C'

export const nodeTypes = {
  serviceNode: ServiceNode,
  vpcNode: VpcNode,
  securityNode: SecurityNode,
  computeNode: ComputeNode 
}

export const useFlowConfig = () => {
  const edgeTypes = useMemo(() => ({
    packet: PacketEdge 
  }), [])

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'packet', 
      animated: true,
      style: { stroke: '#94A3B8', strokeWidth: 2 }
    }),
    []
  )

  return { edgeTypes, defaultEdgeOptions }
}