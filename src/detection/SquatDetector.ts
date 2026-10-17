import type { ExerciseDetector, DetectionResult } from './types'
import { avgAngle } from './angles'
import { L } from '../pose/landmarks'

export class SquatDetector implements ExerciseDetector {
  private phase: 'UP' | 'DOWN' = 'UP'
  private reps = 0
  private lastFormScore = 100
  private startTime = 0

  update(landmarks: { x: number; y: number; visibility: number }[]): DetectionResult {
    if (!this.startTime) this.startTime = Date.now()

    const kneeAngle = avgAngle(
      landmarks,
      L.LEFT_HIP, L.LEFT_KNEE, L.LEFT_ANKLE,
      L.RIGHT_HIP, L.RIGHT_KNEE, L.RIGHT_ANKLE,
    )

    const torsoAngle = avgAngle(
      landmarks,
      L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_KNEE,
      L.RIGHT_SHOULDER, L.RIGHT_HIP, L.RIGHT_KNEE,
    )

    let feedback: string | null = null
    let repCompleted = false

    if (torsoAngle < 60) feedback = 'Keep chest up'

    if (this.phase === 'UP' && kneeAngle < 90) {
      this.phase = 'DOWN'
      const depthScore = Math.min(50, Math.max(0, ((90 - kneeAngle) / 30) * 50))
      const torsoScore = Math.min(50, Math.max(0, ((torsoAngle - 50) / 40) * 50))
      this.lastFormScore = Math.round(depthScore + torsoScore)
    } else if (this.phase === 'DOWN' && kneeAngle > 160) {
      this.phase = 'UP'
      this.reps++
      repCompleted = true
    }

    return {
      repCount: this.reps,
      phase: this.phase,
      formScore: this.lastFormScore,
      feedback,
      repCompleted,
      elapsed: (Date.now() - this.startTime) / 1000,
    }
  }

  reset() {
    this.phase = 'UP'
    this.reps = 0
    this.lastFormScore = 100
    this.startTime = 0
  }
}
