import type { ExerciseDetector, DetectionResult } from './types'

import { L } from '../pose/landmarks'

export class BurpeeDetector implements ExerciseDetector {
  private phase: 'STANDING' | 'DOWN' | 'RISING' = 'STANDING'
  private reps = 0
  private lastFormScore = 100
  private startTime = 0

  update(landmarks: { x: number; y: number; visibility: number }[]): DetectionResult {
    if (!this.startTime) this.startTime = Date.now()

    const hipY = (landmarks[L.LEFT_HIP].y + landmarks[L.RIGHT_HIP].y) / 2
    const shoulderY = (landmarks[L.LEFT_SHOULDER].y + landmarks[L.RIGHT_SHOULDER].y) / 2
    const ankleY = (landmarks[L.LEFT_ANKLE].y + landmarks[L.RIGHT_ANKLE].y) / 2

    const bodyLow = hipY > 0.7
    const standing = hipY < shoulderY && Math.abs(hipY - ankleY) > 0.2

    let repCompleted = false

    if (this.phase === 'STANDING' && bodyLow) {
      this.phase = 'DOWN'
    } else if (this.phase === 'DOWN' && !bodyLow) {
      this.phase = 'RISING'
    } else if (this.phase === 'RISING' && standing) {
      this.phase = 'STANDING'
      this.reps++
      repCompleted = true
      this.lastFormScore = 85
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
    this.phase = 'STANDING'
    this.reps = 0
    this.lastFormScore = 100
    this.startTime = 0
  }
}
