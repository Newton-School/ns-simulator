import { describe, expect, it } from 'vitest'
import { Request } from './core/events'
import { ComponentNode, EdgeDefinition } from './core/types'
import { RoutingTable } from './routing'
import { createRandom } from './stochastic/random'

function makeRequest(type = 'GET'): Request {
  return {
    id: 'req-1',
    type,
    sizeBytes: 256,
    priority: 1,
    createdAt: 0n,
    deadline: 1_000_000n,
    path: [],
    spans: [],
    retryCount: 0,
    metadata: {}
  }
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  overrides: Partial<EdgeDefinition> = {}
): EdgeDefinition {
  return {
    id,
    source,
    target,
    mode: 'synchronous',
    protocol: 'grpc',
    latency: { distribution: { type: 'constant', value: 1 }, pathType: 'same-dc' },
    bandwidth: 1000,
    maxConcurrentRequests: 1000,
    packetLossRate: 0,
    errorRate: 0,
    ...overrides
  }
}

function makeNode(id: string, type: ComponentNode['type'] = 'microservice'): ComponentNode {
  return {
    id,
    type,
    category: 'compute',
    label: id,
    position: { x: 0, y: 0 }
  }
}

describe('RoutingTable', () => {
  it('returns all outgoing edges for a source node', () => {
    const edges = [
      makeEdge('e1', 'node-a', 'node-b'),
      makeEdge('e2', 'node-a', 'node-c'),
      makeEdge('e3', 'node-x', 'node')
    ]

    const routing = new RoutingTable(edges, createRandom('outgoing'))
    const outgoing = routing.getOutgoingEdges('node-a')

    expect(outgoing).toHaveLength(2)
    expect(outgoing.map((e) => e.id).sort()).toEqual(['e1', 'e2'])
  })

  it('single target always resolves to the same edge', () => {
    const routing = new RoutingTable([makeEdge('e1', 'node-a', 'node-b')], createRandom('single'))
    const request = makeRequest()

    for (let i = 0; i < 100; i++) {
      const resolved = routing.resolveTarget('node-a', request)
      expect(resolved).toHaveLength(1)
      expect(resolved[0].targetNodeId).toBe('node-b')
      expect(resolved[0].edge.id).toBe('e1')
    }
  })

  it('weighted routing matches configured weight ratios within 5% over 10,000 calls', () => {
    const edges = [
      makeEdge('e1', 'router', 'a', { weight: 3 }),
      makeEdge('e2', 'router', 'b', { weight: 2 }),
      makeEdge('e3', 'router', 'c', { weight: 1 })
    ]

    const routing = new RoutingTable(edges, createRandom('weighted'))
    const request = makeRequest()
    const counts = { a: 0, b: 0, c: 0 }

    for (let i = 0; i < 10_000; i++) {
      const resolved = routing.resolveTarget('router', request)
      expect(resolved).toHaveLength(1)
      counts[resolved[0].targetNodeId as keyof typeof counts]++
    }

    const ratioA = counts.a / 10_000
    const ratioB = counts.b / 10_000
    const ratioC = counts.c / 10_000

    expect(ratioA).toBeGreaterThan(0.45)
    expect(ratioA).toBeLessThan(0.55)
    expect(ratioB).toBeGreaterThan(0.28)
    expect(ratioB).toBeLessThan(0.38)
    expect(ratioC).toBeGreaterThan(0.11)
    expect(ratioC).toBeLessThan(0.22)
  })

  it('fan-out returns all asynchronous targets in parallel', () => {
    const edges = [
      makeEdge('e1', 'node-a', 'node-b', { mode: 'asynchronous' }),
      makeEdge('e2', 'node-a', 'node-c', { mode: 'asynchronous' }),
      makeEdge('e3', 'node-a', 'node-d', { mode: 'asynchronous' })
    ]

    const routing = new RoutingTable(edges, createRandom('fanout'))
    const resolved = routing.resolveTarget('node-a', makeRequest())

    expect(resolved).toHaveLength(3)
    expect(resolved.map((r) => r.targetNodeId).sort()).toEqual(['node-b', 'node-c', 'node-d'])
  })

  it('round-robin cycles through targets using node type metadata', () => {
    const edges = [
      makeEdge('e1', 'load-balancer-1', 'a'),
      makeEdge('e2', 'load-balancer-1', 'b'),
      makeEdge('e3', 'load-balancer-1', 'c')
    ]
    const nodes = [makeNode('load-balancer-1', 'load-balancer')]

    const routing = new RoutingTable(edges, createRandom('rr'), nodes)
    const request = makeRequest()

    const picks = Array.from(
      { length: 7 },
      () => routing.resolveTarget('load-balancer-1', request)[0]
    )
    expect(picks.map((r) => r.targetNodeId)).toEqual(['a', 'b', 'c', 'a', 'b', 'c', 'a'])
  })

  it('round-robin falls back to id heuristic when no nodes provided', () => {
    const edges = [makeEdge('e1', 'load-balancer-1', 'a'), makeEdge('e2', 'load-balancer-1', 'b')]

    const routing = new RoutingTable(edges, createRandom('rr-fallback'))
    const picks = Array.from(
      { length: 4 },
      () => routing.resolveTarget('load-balancer-1', makeRequest())[0]
    )
    expect(picks.map((r) => r.targetNodeId)).toEqual(['a', 'b', 'a', 'b'])
  })

  it('conditional routing includes only edges whose condition matches request context', () => {
    const edges = [
      makeEdge('e1', 'node-a', 'post-target', { condition: 'request.type === "POST"' }),
      makeEdge('e2', 'node-a', 'get-target', { condition: 'request.type === "GET"' }),
      makeEdge('e3', 'node-a', 'always-target')
    ]
    const routing = new RoutingTable(edges, createRandom('conditional'))

    for (let i = 0; i < 200; i++) {
      const postPick = routing.resolveTarget('node-a', makeRequest('POST'))[0].targetNodeId
      expect(['post-target', 'always-target']).toContain(postPick)
      expect(postPick).not.toBe('get-target')

      const getPick = routing.resolveTarget('node-a', makeRequest('GET'))[0].targetNodeId
      expect(['get-target', 'always-target']).toContain(getPick)
      expect(getPick).not.toBe('post-target')
    }
  })

  it('mixed async and sync edges fan-out to all async and pick one sync', () => {
    const edges = [
      makeEdge('e1', 'node-a', 'queue-1', { mode: 'asynchronous' }),
      makeEdge('e2', 'node-a', 'queue-2', { mode: 'asynchronous' }),
      makeEdge('e3', 'node-a', 'service-1'),
      makeEdge('e4', 'node-a', 'service-2')
    ]

    const routing = new RoutingTable(edges, createRandom('mixed'))
    const results = routing.resolveTarget('node-a', makeRequest())

    const asyncTargets = results
      .filter((r) => r.edge.mode === 'asynchronous')
      .map((r) => r.targetNodeId)
    const syncTargets = results
      .filter((r) => r.edge.mode !== 'asynchronous')
      .map((r) => r.targetNodeId)

    expect(asyncTargets.sort()).toEqual(['queue-1', 'queue-2'])
    expect(syncTargets).toHaveLength(1)
    expect(['service-1', 'service-2']).toContain(syncTargets[0])
  })

  it('conditional-mode edge with no condition string is never eligible', () => {
    const edges = [
      makeEdge('e1', 'node-a', 'guarded', { mode: 'conditional' }),
      makeEdge('e2', 'node-a', 'always')
    ]

    const routing = new RoutingTable(edges, createRandom('cond-mode'))

    for (let i = 0; i < 50; i++) {
      const resolved = routing.resolveTarget('node-a', makeRequest())
      expect(resolved).toHaveLength(1)
      expect(resolved[0].targetNodeId).toBe('always')
    }
  })

  it('returns empty array for sink nodes', () => {
    const edges = [makeEdge('e1', 'a', 'b')]
    const routing = new RoutingTable(edges, createRandom('sink'))
    expect(routing.resolveTarget('no-outgoing', makeRequest())).toEqual([])
  })
})
