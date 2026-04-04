import { BaseDistributionConfig, DistributionConfig, RandomGenerator } from './types'

type DistributionSampler = () => number

export class Distributions {
  private spareNormal: number | null = null

  constructor(private readonly rng: RandomGenerator) {}

  random(): number {
    return this.rng.next()
  }

  constant(value: number): number {
    return value
  }

  uniform(min: number, max: number): number {
    if (!(max > min)) {
      throw new Error(`uniform(min, max): max (${max}) must be > min (${min})`)
    }

    return min + this.rng.next() * (max - min)
  }

  exponential(lambda: number): number {
    if (!(lambda > 0)) {
      throw new Error(`exponential(lambda): lambda (${lambda}) must be > 0`)
    }

    return -Math.log(1 - this.rng.next()) / lambda
  }

  normal(mean = 0, stdDev = 1): number {
    if (!(stdDev > 0)) {
      throw new Error(`normal(mean, stdDev): stdDev (${stdDev}) must be > 0`)
    }

    if (this.spareNormal !== null) {
      const z = this.spareNormal
      this.spareNormal = null
      return mean + stdDev * z
    }

    let u1 = this.rng.next()
    while (u1 <= Number.EPSILON) {
      u1 = this.rng.next()
    }

    const u2 = this.rng.next()
    const radius = Math.sqrt(-2 * Math.log(u1))
    const theta = 2 * Math.PI * u2
    const z0 = radius * Math.cos(theta)
    const z1 = radius * Math.sin(theta)
    this.spareNormal = z1

    return mean + stdDev * z0
  }

  logNormal(mu: number, sigma: number): number {
    if (!(sigma > 0)) {
      throw new Error(`logNormal(mu, sigma): sigma (${sigma}) must be > 0`)
    }

    return Math.exp(this.normal(mu, sigma))
  }

  poisson(lambda: number): number {
    if (!(lambda > 0)) {
      throw new Error(`poisson(lambda): lambda (${lambda}) must be > 0`)
    }

    const limit = Math.exp(-lambda)
    let k = 0
    let p = 1

    do {
      k++
      p *= this.nextOpen01()
    } while (p > limit)

    return k - 1
  }

  weibull(shape: number, scale: number): number {
    if (!(shape > 0) || !(scale > 0)) {
      throw new Error(`weibull(shape, scale): shape (${shape}) and scale (${scale}) must be > 0`)
    }

    return scale * Math.pow(-Math.log(1 - this.rng.next()), 1 / shape)
  }

  gamma(shape: number, scale: number): number {
    if (!(shape > 0) || !(scale > 0)) {
      throw new Error(`gamma(shape, scale): shape (${shape}) and scale (${scale}) must be > 0`)
    }

    if (shape < 1) {
      const u = this.nextOpen01()
      return this.gamma(shape + 1, scale) * Math.pow(u, 1 / shape)
    }

    const d = shape - 1 / 3
    const c = 1 / Math.sqrt(9 * d)

    while (true) {
      let x = 0
      let v = 0

      do {
        x = this.normal()
        v = 1 + c * x
      } while (v <= 0)

      v = v * v * v
      const u = this.nextOpen01()

      if (u < 1 - 0.0331 * x * x * x * x) {
        return scale * d * v
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return scale * d * v
      }
    }
  }

  beta(alpha: number, beta: number): number {
    if (!(alpha > 0) || !(beta > 0)) {
      throw new Error(`beta(alpha, beta): alpha (${alpha}) and beta (${beta}) must be > 0`)
    }

    const x = this.gamma(alpha, 1)
    const y = this.gamma(beta, 1)
    return x / (x + y)
  }

  pareto(alpha: number, xMin: number): number {
    if (!(alpha > 0) || !(xMin > 0)) {
      throw new Error(`pareto(alpha, xMin): alpha (${alpha}) and xMin (${xMin}) must be > 0`)
    }

    return xMin / Math.pow(1 - this.rng.next(), 1 / alpha)
  }

  empirical(values: number[], weights?: number[]): number {
    if (values.length === 0) {
      throw new Error(`empirical(values): values must contain at least one element`)
    }

    if (!weights) {
      const index = this.rng.integer(0, values.length - 1)
      return values[index]
    }

    if (weights.length !== values.length) {
      throw new Error(
        `empirical(values, weights): values length (${values.length}) must match weights length (${weights.length})`
      )
    }

    const index = this.pickIndexByWeight(weights)
    return values[index]
  }

  mixture(distributions: DistributionSampler[], weights: number[]): number {
    if (distributions.length === 0) {
      throw new Error(`mixture(distributions, weights): distributions must not be empty`)
    }

    if (distributions.length !== weights.length) {
      throw new Error(
        `mixture(distributions, weights): distributions length (${distributions.length}) must match weights length (${weights.length})`
      )
    }

    const index = this.pickIndexByWeight(weights)
    return distributions[index]()
  }

  binomial(n: number, p: number): number {
    if (!Number.isInteger(n) || n < 0) {
      throw new Error(`binomial(n, p): n (${n}) must be a non-negative integer`)
    }

    if (p < 0 || p > 1) {
      throw new Error(`binomial(n, p): p (${p}) must be in [0, 1]`)
    }

    let successes = 0
    for (let i = 0; i < n; i++) {
      if (this.rng.next() < p) {
        successes++
      }
    }
    return successes
  }

  fromConfig(config: DistributionConfig): number {
    if (config.type === 'mixture') {
      const components = config.components
      if (components.length === 0) {
        throw new Error(`fromConfig(config): mixture components must not be empty`)
      }

      let totalWeight = 0
      for (let i = 0; i < components.length; i++) {
        const weight = components[i].weight
        if (!Number.isFinite(weight) || weight < 0) {
          throw new Error(`fromConfig(config): every mixture weight must be finite and >= 0`)
        }
        totalWeight += weight
      }

      if (!(totalWeight > 0)) {
        throw new Error(`fromConfig(config): mixture total weight must be > 0`)
      }

      const threshold = this.rng.next() * totalWeight
      let cumulative = 0
      for (let i = 0; i < components.length; i++) {
        cumulative += components[i].weight
        if (threshold < cumulative || i === components.length - 1) {
          return this.fromBaseConfig(components[i].distribution)
        }
      }
    }

    return this.fromBaseConfig(config as BaseDistributionConfig)
  }

  private fromBaseConfig(config: BaseDistributionConfig): number {
    switch (config.type) {
      case 'constant':
      case 'deterministic':
        return this.constant(config.value)
      case 'uniform':
        return this.uniform(config.min, config.max)
      case 'exponential':
        return this.exponential(config.lambda)
      case 'normal':
        return this.normal(config.mean, config.stdDev)
      case 'log-normal':
        return this.logNormal(config.mu, config.sigma)
      case 'poisson':
        return this.poisson(config.lambda)
      case 'weibull':
        return this.weibull(config.shape, config.scale)
      case 'gamma':
        return this.gamma(config.shape, config.scale)
      case 'beta':
        return this.beta(config.alpha, config.beta)
      case 'pareto':
        return this.pareto(config.shape, config.scale)
      case 'empirical':
        return config.interpolation === 'linear'
          ? this.empiricalLinear(config.samples)
          : this.empirical(config.samples)
      case 'binomial':
        return this.binomial(config.n, config.p)
      default: {
        const neverConfig: never = config
        throw new Error(`Unknown distribution: ${JSON.stringify(neverConfig)}`)
      }
    }
  }

  private empiricalLinear(values: number[]): number {
    if (values.length === 0) {
      throw new Error(`empiricalLinear(values): values must contain at least one element`)
    }

    if (values.length === 1) {
      return values[0]
    }

    const index = this.rng.integer(0, values.length - 2)
    const t = this.rng.next()
    return values[index] + t * (values[index + 1] - values[index])
  }

  private pickIndexByWeight(weights: number[]): number {
    let total = 0
    for (const weight of weights) {
      if (!Number.isFinite(weight) || weight < 0) {
        throw new Error(`pickIndexByWeight(weights): every weight must be finite and >= 0`)
      }
      total += weight
    }

    if (!(total > 0)) {
      throw new Error(`pickIndexByWeight(weights): sum of weights must be > 0`)
    }

    const target = this.rng.next() * total
    let cumulative = 0
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i]
      if (target < cumulative || i === weights.length - 1) {
        return i
      }
    }

    return weights.length - 1
  }

  private nextOpen01(): number {
    let u = this.rng.next()
    while (u <= 0 || u >= 1) {
      u = this.rng.next()
    }
    return u
  }
}
