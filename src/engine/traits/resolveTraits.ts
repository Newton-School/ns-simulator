import { getComponentSpec } from '../catalog/componentSpecs'
import type { ComponentNode, ComponentType } from '../core/types'
import type { NodeBehaviourTrait, TraitResolver } from './types'

export type TraitRegistry = Partial<Record<ComponentType, readonly NodeBehaviourTrait[]>>

const ROUND_ROBIN_ROUTING_TRAIT: NodeBehaviourTrait = Object.freeze({
  name: 'routing.round-robin',
  routingStrategyHint: 'round-robin'
})

export function createTraitResolver(registry: TraitRegistry = {}): TraitResolver {
  return (node: ComponentNode): readonly NodeBehaviourTrait[] => {
    const traits: NodeBehaviourTrait[] = []
    const componentSpec = getComponentSpec(node.type)

    // Ordering is deterministic: foundational routing hints first, then
    // component-specific traits from the registry in declaration order.
    if (componentSpec?.routingStrategy === 'round-robin') {
      traits.push(ROUND_ROBIN_ROUTING_TRAIT)
    }

    const registeredTraits = registry[node.type]
    if (registeredTraits) {
      traits.push(...registeredTraits)
    }

    return traits
  }
}

export const resolveTraits = createTraitResolver()
