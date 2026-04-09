import { Node, XYPosition } from 'reactflow'

let id = 1
export const getId = () => `node_${id++}`

/**
 * Finds the smallest VPC node that intersects with the given position.
 * Prioritizes innermost nested VPCs by sorting by area.
 */
export const findTargetVpc = (
  nodes: Node[],
  position: XYPosition,
  excludeNodeId?: string
): Node | undefined => {
  const intersectingVpcs = nodes.filter(
    (n) =>
      n.type === 'vpcNode' &&
      n.id !== excludeNodeId && // Don't match self
      position.x > n.position.x &&
      position.x < n.position.x + (n.width || 0) &&
      position.y > n.position.y &&
      position.y < n.position.y + (n.height || 0)
  )

  // Sort by Area (Width * Height) ascending -> Smallest First
  intersectingVpcs.sort((a, b) => {
    const areaA = (a.width || 0) * (a.height || 0)
    const areaB = (b.width || 0) * (b.height || 0)
    return areaA - areaB
  })

  return intersectingVpcs[0]
}
