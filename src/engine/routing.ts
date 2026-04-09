import type { Request } from './core/events'
import type { EdgeDefinition, RandomGenerator } from './core/types'

/**
 * Normalized output for a single routing choice.
 */
export interface ResolveRoute {
  /**
   * Destination node chosen for the current hop.
   */
  targetNodeId: string

  /**
   * Concrete edge metadata that was selected.
   */
  edge: EdgeDefinition
}

/**
 * Maintains pre-indexed outgoing edges and source-specific cursors used by
 * routing strategies (for example: weighted and round-robin).
 */
export class RoutingTable {
  /**
   * Adjacency list keyed by source node ID for fast edge lookup.
   */
  private readonly outgoingBySource = new Map<string, EdgeDefinition[]>()

  /**
   * Per-source cursor used to rotate choices in round-robin mode.
   */
  private readonly roundRobinIndexBySource = new Map<string, number>()

  /**
   * @param edges Topology edges used to build routing lookup tables.
   * @param rng RNG dependency used for probabilistic routing decisions.
   */
  constructor(
    edges: EdgeDefinition[],
    private readonly rng: RandomGenerator
  ) {
    for (const edge of edges) {
      const list = this.outgoingBySource.get(edge.source)
      if (list) {
        list.push(edge)
      } else {
        this.outgoingBySource.set(edge.source, [edge])
      }
    }
  }

  /**
   * Returns all edges that originate from the provided source node.
   */
  getOutgoingEdges(sourceNodeId: string): EdgeDefinition[] {
    const edges = this.outgoingBySource.get(sourceNodeId)
    return edges ? [...edges] : []
  }

  /**
   * Resolves the next route(s) for a request based on source edges,
   * edge mode, edge conditions, and selection strategy.
   */
  resolveTarget(sourceNodeId: string, request: Request): ResolveRoute[] {
    const outgoing = this.outgoingBySource.get(sourceNodeId)
    if (!outgoing || outgoing.length === 0) {
      return []
    }

    // Conditional edges are evaluated first. Any edge with no conditions is always eligible.
    const eligible = outgoing.filter((edge) => this.matchesCondition(edge.condition, request))
    if (eligible.length === 0) {
      return []
    }

    if (eligible.length === 1) {
      return [this.toResolved(eligible[0])]
    }

    // Fan-out for async edges
    if (eligible.every((edge) => edge.mode === 'asynchronous')) {
      return eligible.map((edge) => this.toResolved(edge))
    }

    const routable = eligible.filter((edge) => edge.mode !== 'asynchronous')
    if (routable.length === 0) {
      return []
    }

    if (routable.length === 1) {
      return [this.toResolved(routable[0])]
    }

    // Round-robin for load-balancer-like sources.
    if (this.isRoundRobinSource(sourceNodeId)) {
      const current = this.roundRobinIndexBySource.get(sourceNodeId) ?? 0
      const edge = routable[current % routable.length]
      this.roundRobinIndexBySource.set(sourceNodeId, (current + 1) % routable.length)
      return [this.toResolved(edge)]
    }

    // Weighted selection when any weight is configured
    if (routable.some((edge) => edge.weight !== undefined)) {
      return [this.toResolved(this.pickByWeight(routable))]
    }

    // Default fallback for multi-target non-weighted routes
    const index = this.rng.integer(0, routable.length - 1)
    return [this.toResolved(routable[index])]
  }

  /**
   * Evaluates an optional condition string against request data to determine
   * whether the edge is eligible for routing.
   */
  private matchesCondition(condition: string | undefined, request: Request): boolean {
    if (!condition || condition.trim().length === 0) {
      return true
    }

    const normalized = condition.replace(/\s/g, ' ').trim()

    const typeExpr = normalized.match(/^request\.type\s*(===|==|!==|!=)\s*["']([^"']+)["']$/)
    if (typeExpr) {
      const operator = typeExpr[1]
      const expectedType = typeExpr[2]
      switch (operator) {
        case '===':
        case '==':
          return request.type === expectedType
        case '!==':
        case '!=':
          return request.type !== expectedType
        default:
          return false
      }
    }

    return false
  }

  /**
   * Picks one edge from a candidate set using relative weight values.
   */
  private pickByWeight(edges: EdgeDefinition[]): EdgeDefinition {
    let total = 0
    const weights: number[] = []

    for (const edge of edges) {
      const weight = edge.weight ?? 1
      const normalized = Number.isFinite(weight) && weight > 0 ? weight : 0
      weights.push(normalized)
      total += normalized
    }

    // If configured weight are unusable, fall back to uniform random
    if (total <= 0) {
      return edges[this.rng.integer(0, edges.length - 1)]
    }

    const target = this.rng.next() * total
    let cumulative = 0

    for (let i = 0; i < edges.length; i++) {
      cumulative += weights[i]
      if (target < cumulative) {
        return edges[i]
      }
    }

    return edges[edges.length - 1]
  }

  /**
   * Reports whether the given source node should use round-robin routing.
   */
  private isRoundRobinSource(sourceNodeId: string): boolean {
    const id = sourceNodeId.toLowerCase()
    return id.includes('load-balancer') || id.includes('lb')
  }

  /**
   * Converts a selected edge into the stable `ResolveRoute` shape.
   */
  private toResolved(edge: EdgeDefinition): ResolveRoute {
    return { targetNodeId: edge.target, edge }
  }
}
