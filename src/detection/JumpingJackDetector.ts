import type { ExerciseDetector, DetectionResult } from './types'
import { L } from '../pose/landmarks'

export class JumpingJackDetector implements ExerciseDetector {
  private phase: 'CLOSED' | 'OPEN' = 'CLOSED'
  private reps = 0
  private lastFormScore = 100
  private startTime = 0

  update(landmarks: { x: number; y: number; visibility: number }[]): DetectionResult {
    if (!this.startTime) this.startTime = Date.now()

    const leftWristAbove = landmarks[L.LEFT_WRIST].y < landmarks[L.LEFT_SHOULDER].y
    const rightWristAbove = landmarks[L.RIGHT_WRIST].y < landmarks[L.RIGHT_SHOULDER].y
    const armsUp = leftWristAbove && rightWristAbove

    const ankleSpread = Math.abs(landmarks[L.LEFT_ANKLE].x - landmarks[L.RIGHT_ANKLE].x)
    const shoulderWidth = Math.abs(landmarks[L.LEFT_SHOULDER].x - landmarks[L.RIGHT_SHOULDER].x)
    const feetApart = ankleSpread > shoulderWidth * 1.3

    let repCompleted = false

    if (this.phase === 'CLOSED' && armsUp && feetApart) {
      this.phase = 'OPEN'
      this.lastFormScore = leftWristAbove && rightWristAbove ? 100 : 70
    } else if (this.phase === 'OPEN' && !armsUp && !feetApart) {
      this.phase = 'CLOSED'
      this.reps++
      repCompleted = true
    }

    return {
      repCount: this.reps,
      phase: this.phase,
      formScore: this.lastFormScore,
      feedback: null,
      repCompleted,
      elapsed: (Date.now() - this.startTime) / 1000,
    }
  }

  reset() {
    this.phase = 'CLOSED'
    this.reps = 0
    this.lastFormScore = 100
    this.startTime = 0
  }
}
