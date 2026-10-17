import type { ExerciseDetector } from './types'
import { PushupDetector } from './PushupDetector'
import { SquatDetector } from './SquatDetector'
import { LungeDetector } from './LungeDetector'
import { JumpingJackDetector } from './JumpingJackDetector'
import { HighKneesDetector } from './HighKneesDetector'
import { PlankDetector } from './PlankDetector'
import { BurpeeDetector } from './BurpeeDetector'

const DETECTORS: Record<string, () => ExerciseDetector> = {
  pushup: () => new PushupDetector(),
  squat: () => new SquatDetector(),
  lunge: () => new LungeDetector(),
  jumping_jack: () => new JumpingJackDetector(),
  high_knees: () => new HighKneesDetector(),
  plank: () => new PlankDetector(),
  burpee: () => new BurpeeDetector(),
}

export function createDetector(id: string): ExerciseDetector | null {
  return DETECTORS[id]?.() ?? null
}
