#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SimulationEngine } from '../engine/engine'
import type { SimulationOutput } from '../engine/analysis/output'
import { validateTopology } from '../engine/validation/validator'
import process from 'node:process'

// ─── ANSI ─────────────────────────────────────────────────────────────────────
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'

// ─── ENTRY ────────────────────────────────────────────────────────────────────
function main(): void {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage()
    process.exit(0)
  }

  const topologyPath = args[0]
  const outputJson = args.includes('--json')
  const outputFlagIndex = args.indexOf('--output')
  const outputPath = outputFlagIndex !== -1 ? args[outputFlagIndex + 1] : undefined

  // ─── LOAD ──────────────────────────────────────────────────────────────────
  let raw: unknown
  try {
    const content = readFileSync(resolve(topologyPath), 'utf-8')
    raw = JSON.parse(content)
  } catch (err) {
    die(`Could not read topology file: ${(err as Error).message}`)
  }

  // ─── VALIDATE ─────────────────────────────────────────────────────────────
  const validation = validateTopology(raw)

  if (!validation.valid || !validation.data) {
    console.error(`${RED}${BOLD}Topology validation failed${RESET}`)
    for (const error of validation.errors ?? []) {
      const prefix = error.path ? `${DIM}${error.path}${RESET}: ` : ''
      console.error(`  ${RED}✗${RESET} ${prefix}${error.message}`)
    }
    process.exit(1)
  }

  for (const warning of validation.warnings ?? []) {
    console.error(`${YELLOW}⚠  ${warning}${RESET}`)
  }

  const topology = validation.data

  if (!outputJson) {
    const dur = topology.global.simulationDuration / 1000
    const warmup = topology.global.warmupDuration / 1000
    console.error(`\n${BOLD}${CYAN}NS Simulator${RESET}`)
    console.error(`${DIM}Topology : ${topology.name} (${topology.id})`)
    console.error(
      `Duration : ${dur}s   Warmup: ${warmup}s   Seed: ${topology.global.seed}${RESET}\n`
    )
  }

  // ─── RUN ──────────────────────────────────────────────────────────────────
  const engine = new SimulationEngine(topology)
  let lastPct = -1

  engine.onProgress = (percent, eventsProcessed) => {
    if (outputJson) return
    const pct = Math.floor(percent)
    if (pct === lastPct) return
    lastPct = pct
    const filled = Math.floor(pct / 5)
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled)
    process.stderr.write(
      `\r  ${bar} ${String(pct).padStart(3)}%  ${eventsProcessed.toLocaleString()} events`
    )
  }

  const wallStart = Date.now()
  const output = engine.run()
  const wallMs = Date.now() - wallStart

  if (!outputJson) {
    const total = output.eventsProcessed.toLocaleString()
    process.stderr.write(`\r  ${'█'.repeat(20)} 100%  ${total} events\n\n`)
  }

  // ─── OUTPUT ───────────────────────────────────────────────────────────────
  if (outputPath) {
    const json = JSON.stringify(output, null, 2)
    writeFileSync(resolve(outputPath), json, 'utf-8')
    if (!outputJson) {
      console.error(`${GREEN}✓ Results written to ${outputPath}${RESET}\n`)
    }
  } else if (outputJson) {
    process.stdout.write(JSON.stringify(output, null, 2) + '\n')
  } else {
    printResults(output, wallMs)
  }
}

// ─── FORMATTED RESULTS ────────────────────────────────────────────────────────
function printResults(output: SimulationOutput, wallMs: number): void {
  const { summary, perNode, sloBreaches, littlesLawCheck } = output

  // Summary
  const speedup = (summary.duration / wallMs).toFixed(0)
  console.log(`${BOLD}Summary${RESET}`)
  console.log(
    `  Requests   ${summary.totalRequests.toLocaleString()} total` +
      `  |  ${GREEN}${summary.successfulRequests.toLocaleString()} ok${RESET}` +
      `  |  ${RED}${summary.failedRequests.toLocaleString()} failed${RESET}` +
      `  |  ${YELLOW}${summary.timedOutRequests.toLocaleString()} timeout${RESET}` +
      `  |  ${summary.rejectedRequests.toLocaleString()} rejected`
  )
  console.log(`  Throughput ${summary.throughput.toFixed(1)} req/s  (post-warmup)`)
  console.log(`  Error rate ${(summary.errorRate * 100).toFixed(2)}%`)
  console.log(
    `  Wall time  ${wallMs}ms for ${(summary.duration / 1000).toFixed(0)}s simulated` +
      `  ${DIM}(${speedup}x real-time)${RESET}`
  )

  // Latency
  const l = summary.latency
  console.log(`\n${BOLD}End-to-end Latency${RESET}`)
  console.log(
    `  p50 ${fmtMs(l.p50).padEnd(10)}` +
      `p90 ${fmtMs(l.p90).padEnd(10)}` +
      `p95 ${fmtMs(l.p95).padEnd(10)}` +
      `p99 ${fmtMs(l.p99).padEnd(10)}` +
      `max ${fmtMs(l.max)}`
  )

  // Per-node table
  console.log(`\n${BOLD}Per-node Metrics${RESET}`)
  const entries = Object.entries(perNode)
  const labelW = Math.max(...entries.map(([id, m]) => (m.nodeLabel ?? id).length), 14)
  const header =
    `  ${'Node'.padEnd(labelW)}` +
    `  ${'Arrived'.padStart(8)}` +
    `  ${'Done'.padStart(8)}` +
    `  ${'Rejected'.padStart(8)}` +
    `  ${'Timed out'.padStart(9)}` +
    `  ${'Util'.padStart(6)}` +
    `  ${'p99'.padStart(9)}`
  console.log(header)
  console.log('  ' + '-'.repeat(header.length - 2))

  for (const [nodeId, m] of entries) {
    const label = (m.nodeLabel ?? nodeId).padEnd(labelW)
    const rawUtil = (m.utilization * 100).toFixed(1) + '%'
    const util =
      m.utilization > 0.9
        ? `${RED}${rawUtil.padStart(6)}${RESET}`
        : m.utilization > 0.7
          ? `${YELLOW}${rawUtil.padStart(6)}${RESET}`
          : rawUtil.padStart(6)
    console.log(
      `  ${label}` +
        `  ${String(m.totalArrived).padStart(8)}` +
        `  ${String(m.totalProcessed).padStart(8)}` +
        `  ${String(m.totalRejected).padStart(8)}` +
        `  ${String(m.totalTimedOut).padStart(9)}` +
        `  ${util}` +
        `  ${fmtMs(m.latencyP99).padStart(9)}`
    )
  }

  // SLO breaches
  if (sloBreaches.length > 0) {
    console.log(`\n${BOLD}SLO Breaches${RESET}`)
    for (const b of sloBreaches) {
      const sev =
        b.severity === 'critical' ? `${RED}${BOLD}CRITICAL${RESET}` : `${YELLOW}WARNING${RESET} `
      const metricStr =
        b.metric === 'latencyP99'
          ? `p99 latency: target ${fmtMs(b.target)}  actual ${fmtMs(b.actual)}`
          : `availability: target ${(b.target * 100).toFixed(2)}%  actual ${(b.actual * 100).toFixed(2)}%`
      console.log(`  [${sev}]  ${b.nodeLabel}  —  ${metricStr}`)
    }
  } else {
    console.log(`\n${GREEN}✓ No SLO breaches${RESET}`)
  }

  // Little's Law
  const llViolations = littlesLawCheck.filter((r) => !r.withinTolerance)
  if (llViolations.length > 0) {
    console.log(`\n${BOLD}Little's Law Violations${RESET} ${DIM}(error > 10%)${RESET}`)
    for (const r of llViolations) {
      console.log(
        `  ${r.nodeId}: L=${r.observedL.toFixed(2)}  expected=${r.expectedL.toFixed(2)}` +
          `  error=${(r.error * 100).toFixed(1)}%`
      )
    }
  }

  console.log(
    `\n${DIM}Seed: ${output.seed}` +
      `  |  Events processed: ${output.eventsProcessed.toLocaleString()}` +
      `  |  Reproducible: ${output.reproducible}${RESET}\n`
  )
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmtMs(ms: number): string {
  if (ms === 0) return '—'
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function printUsage(): void {
  console.log(`
${BOLD}ns-simulator CLI${RESET}

${BOLD}Usage${RESET}
  npm run simulate -- <topology.json> [options]

${BOLD}Options${RESET}
  --json              Print full SimulationOutput as JSON to stdout
  --output <file>     Write full SimulationOutput as JSON to a file
  -h, --help          Show this message

${BOLD}Examples${RESET}
  npm run simulate -- topology.json
  npm run simulate -- topology.json --json
  npm run simulate -- topology.json --output results.json
  npm run simulate -- topology.json --json | jq '.summary'
`)
}

function die(msg: string): never {
  console.error(`${RED}${BOLD}Error:${RESET} ${msg}`)
  process.exit(1)
}

main()
