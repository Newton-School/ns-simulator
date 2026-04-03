import { getSmoothStepPath, EdgeProps, EdgeLabelRenderer } from 'reactflow'
import { StatusBadge } from '../../../atoms/StatusBadge'
import TrafficEdge from '@renderer/components/atoms/TrafficEdge'

export const PacketEdge = (props: EdgeProps) => {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label } = props

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16
  })

  const hasLabel = typeof label === 'string' && label.trim().length > 0

  return (
    <>
      <TrafficEdge {...props} path={edgePath} />

      {hasLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all'
            }}
            className="nodrag nopan"
          >
            <StatusBadge status={label.toString()} />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}