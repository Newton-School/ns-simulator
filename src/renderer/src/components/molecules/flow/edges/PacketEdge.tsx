import { BaseEdge, getSmoothStepPath, EdgeProps } from 'reactflow';
import { TrafficParticle } from '../../../atoms/TrafficParticle';

// Map specific traffic statuses to your Theme Variables
const VAR_MAP: Record<string, string> = {
  http: 'var(--nss-info)',       // Blue
  success: 'var(--nss-success)', // Green
  error: 'var(--nss-danger)',    // Red
  warning: 'var(--nss-warning)', // Orange
  default: 'var(--nss-muted)',   // Grey
};

// Map speed strings to seconds
const SPEED_MAP: Record<string, number> = {
  fast: 1.5,
  normal: 3,
  slow: 6,
};

export const PacketEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 16,
  });

  // 1. Read Data (Populated from onConnect)
  const trafficType = data?.trafficType || 'default';
  const packetCount = data?.packets || 1; // Number of particles
  const speedKey = data?.speed || 'normal';
  
  const particleColor = VAR_MAP[trafficType] || VAR_MAP.error;
  const duration = SPEED_MAP[speedKey];

  return (
    <>
      {/* Background Track */}
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ ...style, strokeWidth: 2, stroke: 'var(--nss-border-high)' }} 
      />

      {/* Generate Particles based on 'packetCount' */}
      {Array.from({ length: packetCount }).map((_, i) => {
        const delay = -1 * (duration / packetCount) * i;

        return (
          <TrafficParticle 
            key={`${id}-p-${i}`}
            path={edgePath} 
            fillColor={particleColor} 
            duration={duration} 
            delay={delay} // Pass the calculated delay
          />
        );
      })}
    </>
  );
};