// Time Utilities

const MICRO_PER_MS = 1_000n
const MICRO_PER_SEC = 1_000_000n

/* Convert miliseconds to microseconds (BigInt) */
export function msToMicro(ms: number): bigint {
  return BigInt(Math.round(ms * 1000))
}

/* Convert microseconds to milliseconds (number) */
export function microToMs(us: bigint): number {
  return Number(us) / 1000
}

/* Convert seconds to microseconds (BigInt) */
export function secToMicro(sec: number): bigint {
  return BigInt(Math.round(sec * 1_000_000))
}

/* Convert microseconds to seconds (BigInt) */
export function microToSec(us: bigint): number {
  return Number(us) / 1_000_000
}

/**
 * Format time automatically choosing best unit
 * < 1000µs  → µs
 * < 1_000_000µs → ms
 * >= 1_000_000µs → s
 */
export function formatTime(us: bigint): string {
  if (us < MICRO_PER_MS) {
    return `${us}µs`
  }

  if (us < MICRO_PER_SEC) {
    const ms = Number(us) / 1000
    return `${trim(ms)}ms`
  }

  const sec = Number(us) / 1_000_000
  return `${trim(sec)}s`
}

/**
 * Trim trailing zeros up to 3 decimal places
 */
function trim(value: number): string {
  return parseFloat(value.toFixed(3)).toString()
}
