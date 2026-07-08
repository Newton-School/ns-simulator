import type { Request } from '../core/events'
import type { ComponentNode } from '../core/types'
import type { ResolveRoute } from '../routing'

export type TraitHookName = 'beforeArrival' | 'beforeRouting' | 'filterRoutes'

export type TraitRoutingStrategyHint = 'round-robin'

export interface TraitContext {
  node: ComponentNode
  request: Request
  clock: bigint
}

export interface TraitFilterRoutesContext extends TraitContext {
  candidates: ResolveRoute[]
}

export type BeforeArrivalDecision =
  | { action: 'continue'; payload?: Record<string, unknown> }
  | { action: 'handled'; latencyUs: bigint; payload?: Record<string, unknown> }
  | { action: 'rejected'; reason: string; payload?: Record<string, unknown> }

export type BeforeRoutingDecision =
  | { action: 'route'; payload?: Record<string, unknown> }
  | { action: 'complete'; payload?: Record<string, unknown> }
  | { action: 'reroute'; targetNodeId: string; payload?: Record<string, unknown> }

export type FilterRoutesDecision =
  | ResolveRoute[]
  | {
      routes: ResolveRoute[]
      decision?: string
      payload?: Record<string, unknown>
    }

export interface NodeBehaviourTrait {
  name: string
  routingStrategyHint?: TraitRoutingStrategyHint
  beforeArrival?: (context: TraitContext) => BeforeArrivalDecision
  beforeRouting?: (context: TraitContext) => BeforeRoutingDecision
  filterRoutes?: (context: TraitFilterRoutesContext) => FilterRoutesDecision
}

export type TraitResolver = (node: ComponentNode) => readonly NodeBehaviourTrait[]
