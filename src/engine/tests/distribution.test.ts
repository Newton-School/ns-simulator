import { describe, expect, it } from 'vitest'
import { Distributions } from '../distribution'
import { createRandom } from '../random'
import { DistributionConfig } from '../types'

function makeDistributions(seed: string): Distributions {
  return new Distributions(createRandom(seed))
}

function mean(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0) / values.length
}

function stdDev(values: number[]): number {
  const avg = mean(values)
  const variance = values.reduce((acc, value) => acc + (value - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

describe('Distributions', () => {
  it('is deterministic for the same seed', () => {
    const a = makeDistributions('same-seed')
    const b = makeDistributions('same-seed')

    const sampleA = Array.from({ length: 500 }, () => a.logNormal(0, 1))
    const sampleB = Array.from({ length: 500 }, () => b.logNormal(0, 1))

    expect(sampleA).toEqual(sampleB)
  })

  it('constant and uniform return expected values', () => {
    const dist = makeDistributions('constant-uniform')

    expect(dist.constant(42)).toBe(42)

    for (let i = 0; i < 2000; i++) {
      const value = dist.uniform(5, 10)
      expect(value).toBeGreaterThanOrEqual(5)
      expect(value).toBeLessThan(10)
    }
  })

  it('exponential(1) has mean approximately 1 over 10,000 samples', () => {
    const dist = makeDistributions('exp-mean')
    const values = Array.from({ length: 10_000 }, () => dist.exponential(1))
    const avg = mean(values)

    expect(avg).toBeGreaterThan(0.95)
    expect(avg).toBeLessThan(1.05)
  })

  it('normal(0,1) has mean and stddev near expected values', () => {
    const dist = makeDistributions('normal-stats')
    const values = Array.from({ length: 10_000 }, () => dist.normal(0, 1))

    const avg = mean(values)
    const sd = stdDev(values)

    expect(Math.abs(avg)).toBeLessThan(0.05)
    expect(sd).toBeGreaterThan(0.95)
    expect(sd).toBeLessThan(1.05)
  })

  it('logNormal(0, 1) is positive and right-skewed', () => {
    const dist = makeDistributions('lognormal-stats')
    const values = Array.from({ length: 10_000 }, () => dist.logNormal(0, 1))
    const avg = mean(values)
    const med = median(values)

    expect(values.every((value) => value > 0)).toBe(true)
    expect(avg).toBeGreaterThan(med)
  })

  it('supports poisson, weibull, gamma, beta, pareto, empirical, mixture and binomial', () => {
    const dist = makeDistributions('all-distributions')

    const poissonValues = Array.from({ length: 10_000 }, () => dist.poisson(4))
    expect(poissonValues.every((value) => Number.isInteger(value) && value >= 0)).toBe(true)
    expect(mean(poissonValues)).toBeGreaterThan(3.6)
    expect(mean(poissonValues)).toBeLessThan(4.4)

    const weibullValues = Array.from({ length: 1000 }, () => dist.weibull(1.5, 2.0))
    expect(weibullValues.every((value) => value >= 0)).toBe(true)

    const gammaValues = Array.from({ length: 10_000 }, () => dist.gamma(2, 3))
    expect(gammaValues.every((value) => value > 0)).toBe(true)
    expect(mean(gammaValues)).toBeGreaterThan(5.4)
    expect(mean(gammaValues)).toBeLessThan(6.6)

    const betaValues = Array.from({ length: 2000 }, () => dist.beta(2, 5))
    expect(betaValues.every((value) => value >= 0 && value <= 1)).toBe(true)

    const paretoValues = Array.from({ length: 2000 }, () => dist.pareto(2, 3))
    expect(paretoValues.every((value) => value >= 3)).toBe(true)

    const empiricalWeighted = Array.from({ length: 1000 }, () =>
      dist.empirical([10, 20, 30], [0, 1, 0])
    )
    expect(empiricalWeighted.every((value) => value === 20)).toBe(true)

    const mixtureValues = Array.from({ length: 10_000 }, () =>
      dist.mixture([() => 0, () => 1], [0.8, 0.2])
    )
    const onesRatio = mean(mixtureValues)
    expect(onesRatio).toBeGreaterThan(0.17)
    expect(onesRatio).toBeLessThan(0.23)

    const binomialValues = Array.from({ length: 2000 }, () => dist.binomial(10, 0.3))
    expect(
      binomialValues.every((value) => Number.isInteger(value) && value >= 0 && value <= 10)
    ).toBe(true)
  })

  it('dispatches through fromConfig including log-normal and mixture', () => {
    const dist = makeDistributions('from-config')

    const logNormalConfig: DistributionConfig = { type: 'log-normal', mu: 2.3, sigma: 0.8 }
    expect(dist.fromConfig(logNormalConfig)).toBeGreaterThan(0)

    const configs: DistributionConfig[] = [
      { type: 'constant', value: 7 },
      { type: 'deterministic', value: 7 },
      { type: 'uniform', min: 1, max: 2 },
      { type: 'exponential', lambda: 1.2 },
      { type: 'normal', mean: 1, stdDev: 2 },
      { type: 'poisson', lambda: 2 },
      { type: 'weibull', shape: 2, scale: 3 },
      { type: 'gamma', shape: 2, scale: 3 },
      { type: 'beta', alpha: 2, beta: 3 },
      { type: 'pareto', shape: 2, scale: 3 },
      { type: 'binomial', n: 10, p: 0.2 },
      { type: 'empirical', samples: [10, 20, 30], interpolation: 'step' },
      { type: 'empirical', samples: [10, 20, 30], interpolation: 'linear' },
      {
        type: 'mixture',
        components: [
          { weight: 1, distribution: { type: 'constant', value: 5 } },
          { weight: 0, distribution: { type: 'constant', value: 9 } }
        ]
      }
    ]

    for (const config of configs) {
      const value = dist.fromConfig(config)
      expect(Number.isFinite(value)).toBe(true)
    }

    expect(
      dist.fromConfig({
        type: 'mixture',
        components: [
          { weight: 1, distribution: { type: 'constant', value: 5 } },
          { weight: 0, distribution: { type: 'constant', value: 9 } }
        ]
      })
    ).toBe(5)
  })
})
