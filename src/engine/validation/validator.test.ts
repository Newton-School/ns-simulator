import { describe, expect, it } from 'vitest'
import { mockArchitecture } from '../__mocks__/sampleTopology'
import { validateTopology } from './validator'

describe('validateTopology workload fields', () => {
  it('preserves bursty workload settings after validation', () => {
    const topology = {
      ...mockArchitecture,
      workload: {
        ...mockArchitecture.workload!,
        pattern: 'bursty' as const,
        bursty: {
          burstRps: 1500,
          burstDuration: 2500,
          normalDuration: 7500
        }
      }
    }

    const result = validateTopology(topology)

    expect(result.valid).toBe(true)
    expect(result.data?.workload?.pattern).toBe('bursty')
    expect(result.data?.workload?.bursty).toEqual({
      burstRps: 1500,
      burstDuration: 2500,
      normalDuration: 7500
    })
  })

  it('preserves sawtooth workload settings after validation', () => {
    const topology = {
      ...mockArchitecture,
      workload: {
        ...mockArchitecture.workload!,
        pattern: 'sawtooth' as const,
        sawtooth: {
          peakRps: 1200,
          rampDuration: 10000
        }
      }
    }

    const result = validateTopology(topology)

    expect(result.valid).toBe(true)
    expect(result.data?.workload?.pattern).toBe('sawtooth')
    expect(result.data?.workload?.sawtooth).toEqual({
      peakRps: 1200,
      rampDuration: 10000
    })
  })

  it('accepts and preserves global traceSampleRate', () => {
    const topology = {
      ...mockArchitecture,
      global: {
        ...mockArchitecture.global,
        traceSampleRate: 0.25
      }
    }

    const result = validateTopology(topology)

    expect(result.valid).toBe(true)
    expect(result.data?.global.traceSampleRate).toBe(0.25)
  })
})
