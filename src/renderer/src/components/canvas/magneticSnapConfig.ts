export const MAGNETIC_CONNECTION_RADIUS_PX = 80

const MIN_ZOOM = 0.01

export function getMagneticRadiusInFlowUnits(zoom: number): number {
  return MAGNETIC_CONNECTION_RADIUS_PX / Math.max(zoom, MIN_ZOOM)
}
