
type TrafficParticleProps = {
  path: string;
  fillColor: string;
  duration?: number;
  delay?: number;
};

export const TrafficParticle = ({
  path,
  fillColor,
  duration = 2,
  delay = 0
}: TrafficParticleProps) => {
  return (
    <circle r="4" fill={fillColor}>
      <animateMotion
        dur={`${duration}s`}
        // Negative begin value makes the animation start "in the past"
        // This ensures particles are spread out immediately on load.
        begin={`${delay}s`}
        repeatCount="indefinite"
        path={path}
        calcMode="linear"
      />
    </circle>

  );
};