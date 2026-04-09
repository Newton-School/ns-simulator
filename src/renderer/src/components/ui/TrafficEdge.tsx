import { useMemo } from 'react'
import { EdgeProps, getSmoothStepPath } from 'reactflow'

const TrafficEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  path,
  data
}: EdgeProps & { path?: string }) => {
  const [computedPath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16
  })

  const finalPath = path || computedPath
  const packetCount = Math.max(1, Math.floor(typeof data === 'number' ? data : 4))
  const duration = 5.5
  const interval = duration / packetCount

  const arrows = useMemo(() => {
    return [...Array(packetCount)].map((_, i) => (
      <g key={`${id}-arrow-${i}`}>
        <line
          x1="-6"
          y1="-5"
          x2="4"
          y2="0"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray=""
          style={{ pointerEvents: 'none' }}
        />
        <line
          x1="-6"
          y1="5"
          x2="4"
          y2="0"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray=""
          style={{ pointerEvents: 'none' }}
        />
        <animateMotion
          dur={`${duration}s`}
          repeatCount="indefinite"
          path={finalPath}
          rotate="auto"
          begin={`${i * interval}s`}
        />
      </g>
    ))
  }, [id, packetCount, duration, finalPath, interval])

  return (
    <>
      <path
        d={finalPath}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={8}
        style={{ transition: 'none', pointerEvents: 'none', opacity: 0.05 }}
      />

      <path
        id={id}
        d={finalPath}
        fill="none"
        markerEnd={markerEnd}
        className="react-flow__edge-path"
        style={{
          strokeWidth: 1.5,
          stroke: 'var(--nss-border-high)',
          strokeDasharray: '4 4',
          ...style
        }}
      />

      {arrows}
    </>
  )
}

export default TrafficEdge
