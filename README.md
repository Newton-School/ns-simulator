# NS System Design Simulator

> Draw a distributed system. Press Run. Watch it break — before you ship it.

A desktop application for simulating, stress-testing, and analysing high-level system designs using **Discrete Event Simulation (DES)**. Built on Electron + React, powered by a G/G/c/K queueing engine under the hood.

---

## What It Does

You drag nodes onto a canvas (API servers, databases, caches, load balancers), connect them with edges, configure traffic and failure scenarios, and then press **Run**. The engine simulates thousands of requests flowing through your architecture — tracking latency, queue depth, throughput, and cascading failures — all without a real server in sight.

The result: P50/P95/P99 latency breakdowns, per-node utilization heatmaps, request waterfall traces, failure cascade graphs, and cost estimates — before you write a line of production code.

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Users   │────────►│ Gateway  │────────►│   API    │
│  source  │  https  │  lb-l7   │  grpc   │  micro   │
│ 980 rps  │  1ms    │ ██░░ 40% │  0.5ms  │ ████ 85% │
└──────────┘         └──────────┘         └─────┬────┘
                                                 │  tcp  2ms
                                          ┌──────▼────┐
                                          │    DB     │
                                          │ postgres  │
                                          │ ██████ 97%│  ← bottleneck
                                          └───────────┘
```

---

## Three Phases

### 1 — BUILD
Drag nodes from the palette onto the canvas. Connect them. Configure each node's queue parameters (workers, capacity, service time distribution, timeout), resilience settings (circuit breaker, rate limiter, retry policy), and SLO targets. Set up traffic patterns and fault injections in the scenario bar.

### 2 — SIMULATE
Press Run. The engine runs in a Web Worker — a discrete event loop that processes millions of events in time order, sampling service times from probability distributions (log-normal, exponential, Poisson, etc.). The canvas updates live: nodes shift from green to yellow to red as they saturate; edges pulse with traffic load.

### 3 — ANALYSE
When the simulation completes, a results tray expands with:
- **Summary** — P50 / P90 / P95 / P99 latency, throughput, error rate, availability, Little's Law check
- **Per-Node** — utilization, avg queue depth, RPS, rejection count, P99 per node
- **Traces** — waterfall views of individual requests (like Chrome DevTools' Network tab)
- **Failures** — causal cascade graph when failure injection triggers
- **Cost** — per-node and total cloud cost estimate (AWS / GCP / Azure)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 38 |
| Build system | electron-vite + Vite 7 |
| UI framework | React 19 + TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Canvas | React Flow 11 |
| State management | Zustand 5 |
| Icons | Lucide React |
| Simulation engine | Discrete Event Simulation (DES) — planned Web Worker |

---

## Node Types

| Node | Type | Description |
|---|---|---|
| API Server | `computeNode` | Long-running process, configurable CPU/queue |
| Serverless Fn | `computeNode` | Event-driven, low baseline utilization |
| Job Worker | `computeNode` | Background task processing |
| Cron Job | `computeNode` | Scheduled execution |
| Primary DB | `serviceNode` | Relational SQL datastore |
| Redis Cache | `serviceNode` | In-memory key/value store |
| Load Balancer | `serviceNode` | L7 request routing |
| VPC Region | `vpcNode` | Isolated network boundary / grouping |

---

## Simulation Engine (Planned)

The engine is a **Discrete Event Simulation loop** — no real clocks, no real servers, only a priority queue of timestamped events processed in order.

Each node is modelled as a **G/G/c/K queue**:
- `c` — concurrent workers
- `K` — max queue capacity (excess arrivals are rejected)
- Service time sampled from a configurable probability distribution (log-normal, exponential, Poisson, Weibull, etc.)

Key engine components being built (see `ns-simulator-docs/planning/`):

| Component | Role |
|---|---|
| Min-Heap | O(log n) event priority queue |
| SFC32 PRNG | Deterministic random (same seed = identical results every time) |
| G/G/c/K Node | Per-node queue model with workers and capacity |
| Workload Generator | Constant / Poisson / Spike / Diurnal / Bursty traffic |
| Network Edge | Latency distributions, congestion, packet loss |
| Failure Injector | Crash / latency spike / error rate faults at configurable times |
| Failure Propagation | Cascade walk through the dependency graph |
| Circuit Breaker | CLOSED / OPEN / HALF_OPEN state machine |
| Metrics Collector | Latency percentiles, throughput, error rate, Little's Law check |
| Request Tracer | Per-request waterfall data |
| Web Worker | Runs engine off the main thread; streams snapshots to UI |

---

## Submodule: `ns-simulator-docs`

The `ns-simulator-docs/` directory is a Git submodule containing all design documentation:

```
ns-simulator-docs/
├── docs/
│   ├── SYSTEM_OVERVIEW.md             # End-to-end system reference
│   ├── theoretical-foundations.md     # Queueing theory, DEVS, reliability
│   ├── 01-system-diagrams.md          # Nodes, edges, graph patterns
│   ├── 02-simulation-fundamentals.md  # Events, time, the event loop
│   ├── 03-data-structures-and-mechanics.md  # Min-heap, PRNG, G/G/c/K
│   ├── 04-distributed-systems-and-failures.md  # Network physics, failure modes
│   └── 05-devs-chaos-and-analysis.md  # DEVS formalism, chaos, output analysis
├── schema/
│   └── complete_simulator_schema.ts   # 2300+ line TypeScript type system
├── canonical-catalogue/               # 17 CSV reference files covering:
│   │                                  #   component taxonomy (110+ types)
│   │                                  #   failure modes & propagation rules
│   │                                  #   architectural patterns & anti-patterns
│   │                                  #   metrics & SLIs
│   │                                  #   pre-built scenarios
│   │                                  #   AWS / GCP / Azure provider mapping
│   └── README.md
├── planning/
│   ├── IMPLEMENTATION_PLAN.md         # 10-phase build plan
│   └── TICKETS.md                     # 46 engineering tickets with acceptance criteria
└── design-decisions/
    ├── adr-internal-modularity-over-plugin-system.md
    └── adr-no-custom-change-detection.md
```

To initialise the submodule after cloning:

```bash
git submodule update --init --recursive
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Type check

```bash
npm run typecheck
```

### Build

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

---

## Design Principles

- **Deterministic by default** — every simulation run is seeded; the same seed always produces identical output
- **No decorative animation** — every visual (colour change, edge pulse, queue bar) represents real simulation data
- **Mathematical transparency** — metrics show their formula on hover (e.g. `utilization = activeWorkers / maxWorkers`)
- **Desktop-first** — minimum 1280px viewport; no mobile layout compromise
- **Single source of truth** — canvas, inspector panel, and JSON topology viewer all read from and write to one Zustand store

---

## Implementation Status

| Area | Status |
|---|---|
| React Flow canvas (nodes + edges) | Done |
| Drag-and-drop node palette | Done |
| Node types (Compute, Service, VPC) | Done |
| Atomic design system (atoms → organisms) | Done |
| Zustand topology store | Done |
| File save / load via Electron IPC | Done |
| Simulation engine (DES loop) | Planned |
| Inspector panel | Planned |
| Scenario bar (workload + faults + controls) | Planned |
| Web Worker + live canvas coloring | Planned |
| Results tray (summary, traces, failures, cost) | Planned |
| CLI (`simulator run / validate / compare`) | Planned |

See `ns-simulator-docs/planning/TICKETS.md` for the full 46-ticket breakdown.
