import { BaseEdge, getSmoothStepPath, EdgeProps, EdgeLabelRenderer } from 'reactflow'
import { StatusBadge } from '../../../atoms/StatusBadge'

export const PacketEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label
}: EdgeProps) => {
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
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth: 2, stroke: 'var(--nss-border-high)' }}
      />

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
