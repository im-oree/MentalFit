import { Motion } from '@capacitor/motion'
import type { PluginListenerHandle } from '@capacitor/core'

export interface StepCounter {
  readonly steps: number
  readonly cadence: number
  pause(): void
  resume(): void
  stop(): void
}

const MIN_STEP_INTERVAL_MS = 250
const THRESHOLD = 1.2

// Peak detection on gravity-removed acceleration magnitude (m/s²).
export async function startStepCounter(): Promise<StepCounter> {
  const DME = (globalThis as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent
  if (DME?.requestPermission) {
    try { await DME.requestPermission() } catch { /* denied: counter stays at 0 */ }
  }

  let steps = 0
  let paused = false
  let lastStep = 0
  let smoothed = 0
  let rising = false
  const recent: number[] = []

  let handle: PluginListenerHandle | null = null
  try {
    handle = await Motion.addListener('accel', (e) => {
      if (paused) return
      const a = e.acceleration
      if (!a || a.x == null) return
      const mag = Math.hypot(a.x, a.y, a.z)
      const prev = smoothed
      smoothed = smoothed * 0.8 + mag * 0.2
      const now = Date.now()
      if (smoothed > prev) rising = true
      else if (rising && prev > THRESHOLD && now - lastStep > MIN_STEP_INTERVAL_MS) {
        rising = false
        steps++
        lastStep = now
        recent.push(now)
        while (recent.length && now - recent[0] > 10000) recent.shift()
      }
    })
  } catch {
    handle = null
  }

  return {
    get steps() { return steps },
    get cadence() {
      if (recent.length < 2) return 0
      return Math.round(((recent.length - 1) / (recent[recent.length - 1] - recent[0])) * 60000)
    },
    pause() { paused = true },
    resume() { paused = false },
    stop() { handle?.remove() },
  }
}
