import { SimulationEngine } from '../engine'
import type { DebugEvent } from '../core/event-stream'
import type { WorkerInboundMessage, WorkerOutboundMessage } from './protocols'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Events processed per chunk before yielding to allow incoming messages. */
const CHUNK_SIZE = 20_000
const EVENT_BATCH_SIZE = 500

// ─── State ────────────────────────────────────────────────────────────────────

let engine: SimulationEngine | null = null
let paused = false
let stopped = false
let running = false
let debugEventBuffer: DebugEvent[] = []

// ─── Helpers ──────────────────────────────────────────────────────────────────

function post(msg: WorkerOutboundMessage): void {
  self.postMessage(msg)
}

function flushDebugEvents(): void {
  if (debugEventBuffer.length === 0) {
    return
  }

  post({ type: 'event-batch', payload: { events: debugEventBuffer } })
  debugEventBuffer = []
}

function reset(): void {
  engine = null
  paused = false
  stopped = false
  running = false
  debugEventBuffer = []
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Chunked execution loop ───────────────────────────────────────────────────
// engine.run() is fully synchronous and cannot be interrupted. Instead, we
// drive the engine with step() in CHUNK_SIZE increments and yield between
// each chunk so that pause/stop messages can be processed.

async function runChunked(): Promise<void> {
  if (!engine) return

  try {
    while (engine.hasPendingEvents() && !stopped) {
      // Honour pause: spin-wait (in 50ms increments) until resumed or stopped
      while (paused && !stopped) {
        await sleep(50)
      }
      if (stopped) break

      engine.step(CHUNK_SIZE)
      flushDebugEvents()

      // Yield to the message loop so incoming messages are processed
      await sleep(0)
    }

    if (engine) {
      flushDebugEvents()
      const output = engine.getResults()
      post({ type: 'complete', payload: { output, stopped } })
    }
  } catch (err) {
    const e = err as Error
    post({ type: 'error', payload: { message: e.message, stack: e.stack } })
  } finally {
    reset()
  }
}

// ─── Message loop ─────────────────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
  const msg = event.data

  switch (msg.type) {
    case 'run': {
      if (running) {
        post({ type: 'error', payload: { message: 'Simulation already running.' } })
        return
      }

      reset()
      running = true

      try {
        engine = new SimulationEngine(msg.payload.topology)
      } catch (err) {
        const e = err as Error
        post({ type: 'error', payload: { message: e.message, stack: e.stack } })
        reset()
        return
      }

      // Wire progress and snapshot callbacks — these fire inside engine.step()
      engine.onProgress = (percent, eventsProcessed) => {
        post({ type: 'progress', payload: { percent, eventsProcessed } })
      }

      engine.onSnapshot = (snapshot) => {
        post({ type: 'snapshot', payload: { snapshot } })
      }

      engine.onDebugEvent = (debugEvent) => {
        debugEventBuffer.push(debugEvent)
        if (debugEventBuffer.length >= EVENT_BATCH_SIZE) {
          flushDebugEvents()
        }
      }

      engine.onAdmissionDecision = (decision) => {
        post({ type: 'admission-decision', payload: { decision } })
      }

      // Kick off the chunked execution loop (async, doesn't block the thread)
      runChunked()
      break
    }

    case 'pause': {
      paused = true
      break
    }

    case 'resume': {
      paused = false
      break
    }

    case 'stop': {
      stopped = true
      paused = false // unblock any spin-wait
      break
    }

    case 'step': {
      if (!engine) {
        post({ type: 'error', payload: { message: 'No simulation loaded. Send "run" first.' } })
        return
      }
      if (running && !paused) {
        post({ type: 'error', payload: { message: 'Step only works while paused.' } })
        return
      }

      try {
        engine.step(msg.payload.count)
        flushDebugEvents()
        if (!engine.hasPendingEvents()) {
          const output = engine.getResults()
          post({ type: 'complete', payload: { output } })
          reset()
        }
      } catch (err) {
        const e = err as Error
        post({ type: 'error', payload: { message: e.message, stack: e.stack } })
        reset()
      }
      break
    }
  }
}
