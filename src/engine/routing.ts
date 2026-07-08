import type { Request } from './core/events'
import type { ComponentNode, EdgeDefinition, RandomGenerator } from './core/types'
import { resolveTraits } from './traits/resolveTraits'
import type { FilterRoutesDecision, NodeBehaviourTrait, TraitResolver } from './traits/types'

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

export type RouteRejectionReason = 'no_healthy_targets' | 'trait_invalid_reroute'

export interface ResolveTargetOptions {
  clock?: bigint
  isTargetHealthy?: (nodeId: string) => boolean
  isEdgeHealthy?: (edge: EdgeDefinition) => boolean
  onTraitDecision?: (decision: {
    traitName: string
    nodeId: string
    hook: 'filterRoutes'
    decision: string
    payload?: Record<string, unknown>
  }) => void
}

export interface ResolveTargetResult {
  routes: ResolveRoute[]
  rejectionReason?: RouteRejectionReason
}

const HEALTH_AWARE_ROUTER_TYPES = new Set<ComponentNode['type']>([
  'load-balancer',
  'load-balancer-l4',
  'load-balancer-l7'
])

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
   * Per-source bounded cursor used to rotate choices in round-robin mode.
   * Always stored modulo the active candidate count to avoid unsafe-integer drift.
   */
  private readonly roundRobinIndexBySource = new Map<string, number>()

  /**
   * Set of node IDs that should use round-robin routing, derived from node
   * config metadata. Only populated when node definitions are provided.
   */
  private readonly roundRobinSourceIds: Set<string>
  private readonly healthAwareSourceIds: Set<string>
  private readonly nodeById = new Map<string, ComponentNode>()
  private readonly traitsBySourceId = new Map<string, readonly NodeBehaviourTrait[]>()

  /**
   * @param edges Topology edges used to build routing lookup tables.
   * @param rng   RNG dependency used for probabilistic routing decisions.
   * @param nodes Optional node definitions used to identify round-robin sources
   *              by explicit routing strategy rather than by type heuristic.
   */
  constructor(
    edges: EdgeDefinition[],
    private readonly rng: RandomGenerator,
    nodes: ComponentNode[] = [],
    traitResolver: TraitResolver = resolveTraits
  ) {
    for (const edge of edges) {
      const list = this.outgoingBySource.get(edge.source)
      if (list) {
        list.push(edge)
      } else {
        this.outgoingBySource.set(edge.source, [edge])
      }
    }

    for (const node of nodes) {
      this.nodeById.set(node.id, node)
      this.traitsBySourceId.set(node.id, traitResolver(node))
    }

    this.roundRobinSourceIds = new Set(
      nodes
        .filter(
          (node) =>
            node.config?.['routingStrategy'] === 'round-robin' ||
            (this.traitsBySourceId.get(node.id) ?? []).some(
              (trait) => trait.routingStrategyHint === 'round-robin'
            )
        )
        .map((node) => node.id)
    )

    this.healthAwareSourceIds = new Set(
      nodes.filter((node) => HEALTH_AWARE_ROUTER_TYPES.has(node.type)).map((node) => node.id)
    )
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
   *
   * Async edges always fan-out: every eligible async edge produces a route.
   * Sync/streaming/conditional edges compete: exactly one is selected via
   * round-robin, weighted, or uniform random selection.
   * Both groups are evaluated independently, so a mixed topology fans out
   * to all async targets while still picking one sync target.
   */
  resolveTarget(
    sourceNodeId: string,
    request: Request,
    options: ResolveTargetOptions = {}
  ): ResolveRoute[] {
    return this.resolveTargetResult(sourceNodeId, request, options).routes
  }

  resolveTargetResult(
    sourceNodeId: string,
    request: Request,
    options: ResolveTargetOptions = {}
  ): ResolveTargetResult {
    const outgoing = this.outgoingBySource.get(sourceNodeId)
    if (!outgoing || outgoing.length === 0) {
      return { routes: [] }
    }

    const eligible = outgoing.filter((edge) => this.matchesCondition(edge, request))
    if (eligible.length === 0) {
      return { routes: [] }
    }

    const healthEligible = this.filterHealthyTargets(sourceNodeId, eligible, options)
    if (healthEligible.length === 0) {
      return { routes: [], rejectionReason: 'no_healthy_targets' }
    }

    const traitFiltered = this.applyTraitRouteFilters(
      sourceNodeId,
      healthEligible.map((edge) => this.toResolved(edge)),
      request,
      options
    )

    if (traitFiltered.length === 0) {
      return { routes: [] }
    }

    const asyncRoutes = traitFiltered.filter((route) => route.edge.mode === 'asynchronous')
    const syncRoutes = traitFiltered.filter((route) => route.edge.mode !== 'asynchronous')

    const results: ResolveRoute[] = [...asyncRoutes]

    if (syncRoutes.length === 1) {
      results.push(syncRoutes[0])
    } else if (syncRoutes.length > 1) {
      results.push(this.pickSyncRoute(sourceNodeId, syncRoutes))
    }

    return { routes: results }
  }

  /**
   * Selects one edge from synchronous candidates using round-robin,
   * weighted, or uniform random strategy.
   */
  private pickSyncRoute(sourceNodeId: string, routes: ResolveRoute[]): ResolveRoute {
    if (this.isRoundRobinSource(sourceNodeId)) {
      const current = this.roundRobinIndexBySource.get(sourceNodeId) ?? 0
      const safeIndex = current % routes.length
      const route = routes[safeIndex]
      this.roundRobinIndexBySource.set(sourceNodeId, (safeIndex + 1) % routes.length)
      return route
    }

    if (routes.some((route) => route.edge.weight !== undefined)) {
      return this.pickByWeight(routes)
    }

    return routes[this.rng.integer(0, routes.length - 1)]
  }

  /**
   * Evaluates whether an edge is eligible for routing given the request context.
   *
   * Supported condition formats:
   *   - No condition / empty string: always eligible (unless mode is 'conditional')
   *   - `request.type === "X"` / `request.type == "X"`
   *   - `request.type !== "X"` / `request.type != "X"`
   *
   * Edges with mode 'conditional' must have a non-empty condition string;
   * they are treated as ineligible if the condition is absent or empty.
   */
  private matchesCondition(edge: EdgeDefinition, request: Request): boolean {
    const { condition, mode } = edge

    if (mode === 'conditional' && (!condition || condition.trim().length === 0)) {
      return false
    }

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
  private pickByWeight(routes: ResolveRoute[]): ResolveRoute {
    let total = 0
    const weights: number[] = []

    for (const route of routes) {
      const weight = route.edge.weight ?? 1
      const normalized = Number.isFinite(weight) && weight > 0 ? weight : 0
      weights.push(normalized)
      total += normalized
    }

    // If configured weights are unusable, fall back to uniform random
    if (total <= 0) {
      return routes[this.rng.integer(0, routes.length - 1)]
    }

    const target = this.rng.next() * total
    let cumulative = 0

    for (let i = 0; i < routes.length; i++) {
      cumulative += weights[i]
      if (target < cumulative) {
        return routes[i]
      }
    }

    return routes[routes.length - 1]
  }

  private filterHealthyTargets(
    sourceNodeId: string,
    edges: EdgeDefinition[],
    options: ResolveTargetOptions
  ): EdgeDefinition[] {
    if (!this.isHealthAwareSource(sourceNodeId)) {
      return edges
    }

    return edges.filter((edge) => {
      const targetHealthy = options.isTargetHealthy?.(edge.target) ?? true
      const edgeHealthy = options.isEdgeHealthy?.(edge) ?? true
      return targetHealthy && edgeHealthy
    })
  }

  /**
   * Returns true if the source node should use round-robin routing.
   * Uses explicit node config when available. Falls back to an ID substring
   * heuristic for legacy topology JSON that predates routingStrategy.
   */
  private isRoundRobinSource(sourceNodeId: string): boolean {
    return this.roundRobinSourceIds.has(sourceNodeId)
  }

  private isHealthAwareSource(sourceNodeId: string): boolean {
    return this.healthAwareSourceIds.has(sourceNodeId)
  }

  /**
   * Converts a selected edge into the stable `ResolveRoute` shape.
   */
  private toResolved(edge: EdgeDefinition): ResolveRoute {
    return { targetNodeId: edge.target, edge }
  }

  private applyTraitRouteFilters(
    sourceNodeId: string,
    candidates: ResolveRoute[],
    request: Request,
    options: ResolveTargetOptions
  ): ResolveRoute[] {
    const node = this.nodeById.get(sourceNodeId)
    if (!node) {
      return candidates
    }

    let filtered = candidates
    for (const trait of this.traitsBySourceId.get(sourceNodeId) ?? []) {
      if (!trait.filterRoutes) {
        continue
      }

      const result = trait.filterRoutes({
        node,
        request,
        clock: options.clock ?? 0n,
        candidates: filtered
      })
      const normalized = this.normalizeFilterRoutesDecision(filtered, result)
      options.onTraitDecision?.({
        traitName: trait.name,
        nodeId: sourceNodeId,
        hook: 'filterRoutes',
        decision: normalized.decision,
        payload: normalized.payload
      })
      filtered = normalized.routes
    }

    return filtered
  }

  private normalizeFilterRoutesDecision(
    previousRoutes: ResolveRoute[],
    decision: FilterRoutesDecision
  ): {
    routes: ResolveRoute[]
    decision: string
    payload: Record<string, unknown>
  } {
    if (Array.isArray(decision)) {
      return {
        routes: decision,
        decision: decision.length === previousRoutes.length ? 'continue' : 'filtered',
        payload: {
          beforeCandidateCount: previousRoutes.length,
          afterCandidateCount: decision.length
        }
      }
    }

    return {
      routes: decision.routes,
      decision:
        decision.decision ??
        (decision.routes.length === previousRoutes.length ? 'continue' : 'filtered'),
      payload: {
        beforeCandidateCount: previousRoutes.length,
        afterCandidateCount: decision.routes.length,
        ...(decision.payload ?? {})
      }
    }
  }
}
