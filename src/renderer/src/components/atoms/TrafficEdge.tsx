import { EdgeProps, getSmoothStepPath } from 'reactflow'

const TrafficEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
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
    borderRadius: 20
  })

  const finalPath = path || computedPath
  const packetCount = typeof data === 'number' ? data : 4
  const duration = 3.5
  const interval = duration / packetCount

  return (
    <>
      {/* Background Glow */}
      <path
        d={finalPath}
        fill="none"
        stroke="rgb(var(--nss-primary) / 0.05)"
        strokeWidth={8}
        style={{ transition: 'none', pointerEvents: 'none' }}
      />

      {/* The Main Connection Line */}
      <path
        id={id}
        d={finalPath}
        fill="none"
        stroke="var(--nss-border-high)"
        strokeWidth={1.5}
        className="react-flow__edge-path"
      />

      {/* Arrows */}
      {[...Array(packetCount)].map((_, i) => (
        <g key={`${id}-arrow-${i}`} style={{ transition: 'none' }}>
          <path
            d="M -6 -5 L 4 0 L -6 5"
            fill="none"
            stroke="rgb(var(--nss-primary))"
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
            stroke="rgb(var(--nss-primary) / 0.3)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          <animateMotion
            dur={`${duration}s`}
            repeatCount="indefinite"
            path={finalPath}
            rotate="auto"
            begin={`${i * interval}s`}
          />
        </g>
      ))}
    </>
  )
}

export default TrafficEdge
