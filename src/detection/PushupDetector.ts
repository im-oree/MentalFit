import type { ExerciseDetector, DetectionResult } from './types'
import { angleDeg, avgAngle } from './angles'
import { L } from '../pose/landmarks'

export class PushupDetector implements ExerciseDetector {
  private phase: 'UP' | 'DOWN' = 'UP'
  private reps = 0
  private lastFormScore = 100
  private startTime = 0

  update(landmarks: { x: number; y: number; visibility: number }[]): DetectionResult {
    if (!this.startTime) this.startTime = Date.now()

    const elbowAngle = avgAngle(
      landmarks,
      L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST,
      L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST,
    )

    const bodyAngle = avgAngle(
      landmarks,
      L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_ANKLE,
      L.RIGHT_SHOULDER, L.RIGHT_HIP, L.RIGHT_ANKLE,
    )

    let feedback: string | null = null
    let repCompleted = false

    if (bodyAngle < 145) feedback = 'Keep hips up'

    if (this.phase === 'UP' && elbowAngle < 90) {
      this.phase = 'DOWN'
      const depthScore = Math.min(50, Math.max(0, ((90 - elbowAngle) / 30) * 50))
      const hipScore = Math.min(50, Math.max(0, ((bodyAngle - 145) / 25) * 50))
      this.lastFormScore = Math.round(depthScore + hipScore)
    } else if (this.phase === 'DOWN' && elbowAngle > 160) {
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
