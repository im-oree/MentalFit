import type { ExerciseDetector, DetectionResult } from './types'
import { avgAngle } from './angles'
import { L } from '../pose/landmarks'

export class PlankDetector implements ExerciseDetector {
  private startTime = 0
  private lastFormScore = 100

  update(landmarks: { x: number; y: number; visibility: number }[]): DetectionResult {
    if (!this.startTime) this.startTime = Date.now()

    const bodyAngle = avgAngle(
      landmarks,
      L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_ANKLE,
      L.RIGHT_SHOULDER, L.RIGHT_HIP, L.RIGHT_ANKLE,
    )

    let feedback: string | null = null
    if (bodyAngle < 150) feedback = 'Keep body straight'
    if (bodyAngle > 185) feedback = 'Don\'t pike up'

    this.lastFormScore = Math.min(100, Math.max(0, Math.round(((bodyAngle - 130) / 40) * 100)))

    return {
      repCount: 0,
      phase: 'HOLD',
      formScore: this.lastFormScore,
      feedback,
      repCompleted: false,
      elapsed: (Date.now() - this.startTime) / 1000,
    }
  }

  reset() {
    this.startTime = 0
    this.lastFormScore = 100
  }
}
