import { RandomGenerator } from './types'

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length

  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }

  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a >>>= 0
    b >>>= 0
    c >>>= 0
    d >>>= 0

    const t = (a + b + d) >>> 0
    d = (d + 1) >>> 0
    a = (b ^ (b >>> 9)) >>> 0
    b = (c + (c << 3)) >>> 0
    c = ((c << 21) | (c >>> 11)) >>> 0
    c = (c + t) >>> 0

    return t / 4294967296
  }
}

export function createRandom(seedString: string): RandomGenerator {
  const seed = xmur3(seedString)
  const rand = sfc32(seed(), seed(), seed(), seed())

  return {
    next() {
      return rand()
    },

    between(min, max) {
      if (min > max) {
        throw new Error(`between(min, max): min (${min}) must be <= max (${max})`)
      }

      return rand() * (max - min) + min
    },

    integer(min, max) {
      if (!Number.isInteger(min) || !Number.isInteger(max)) {
        throw new Error(`integer(min, max): both min and max must be integers`)
      }

      if (min > max) {
        throw new Error(`integer(min, max): min (${min}) must be <= max (${max})`)
      }

      return Math.floor(rand() * (max - min + 1)) + min
    },

    boolean(probability = 0.5) {
      if (probability < 0 || probability > 1) {
        throw new Error(`boolean(probability): probability must be between 0 and 1`)
      }

      return rand() < probability
    }
  }
}
