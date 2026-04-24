import { BaseEdge, getSmoothStepPath, EdgeProps, EdgeLabelRenderer } from 'reactflow'
import { StatusBadge } from '../ui/StatusBadge'

export const PacketEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  selected
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
      {/* Glow halo — only visible when selected */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={8}
          strokeOpacity={0.25}
          strokeLinecap="round"
        />
      )}

      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? '#3b82f6' : 'var(--nss-border-high)'
        }}
        interactionWidth={30}
      />

      {/* Endpoint grab handles — visible on hover/selected, draggable for reconnection */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={5}
        className="edge-endpoint"
        style={selected ? { opacity: 1 } : undefined}
      />
      <circle
        cx={targetX}
        cy={targetY}
        r={5}
        className="edge-endpoint"
        style={selected ? { opacity: 1 } : undefined}
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
