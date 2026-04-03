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
  const duration = 3.5
  const interval = duration / packetCount

  const arrows = useMemo(() => {
    return [...Array(packetCount)].map((_, i) => (
      <g key={`${id}-arrow-${i}`} style={{ transition: 'none', pointerEvents: 'none' }}>
        {/* Main wide chevron */}
        <path
          d="M -6 -5 L 4 0 L -6 5"
          fill="none"
          stroke="var(--nss-primary, #3b82f6)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="arrow-lead"
        />

        <path
          d="M -5 -3 L 2 0 L -5 3"
          fill="none"
          stroke="white"
          strokeWidth="1"
          strokeOpacity="0.8"
        />

        <path
          d="M -14 -4 L -8 0 L -14 4"
          fill="none"
          stroke="var(--nss-primary, #3b82f6)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ opacity: 0.3 }}
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
        stroke="var(--nss-primary, #3b82f6)"
        strokeWidth={8}
        style={{ transition: 'none', pointerEvents: 'none', opacity: 0.05 }}
      />

      {/* The Main Connection Line */}
      <path
        id={id}
        d={finalPath}
        fill="none"
        markerEnd={markerEnd}
        className="react-flow__edge-path"
        style={{
          strokeWidth: 1.5,
          stroke: 'var(--nss-border-high)',
          ...style
        }}
      />

      {/* Render the memoized arrows */}
      {arrows}
    </>
  )
}

export default TrafficEdge
