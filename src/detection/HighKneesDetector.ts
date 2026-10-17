import type { ExerciseDetector, DetectionResult } from './types'
import { L } from '../pose/landmarks'

export class HighKneesDetector implements ExerciseDetector {
  private lastLeg: 'left' | 'right' | null = null
  private reps = 0
  private startTime = 0

  update(landmarks: { x: number; y: number; visibility: number }[]): DetectionResult {
    if (!this.startTime) this.startTime = Date.now()

    const hipY = (landmarks[L.LEFT_HIP].y + landmarks[L.RIGHT_HIP].y) / 2
    const leftKneeUp = landmarks[L.LEFT_KNEE].y < hipY
    const rightKneeUp = landmarks[L.RIGHT_KNEE].y < hipY

    let repCompleted = false

    if (leftKneeUp && this.lastLeg !== 'left') {
      this.lastLeg = 'left'
      this.reps++
      repCompleted = true
    } else if (rightKneeUp && this.lastLeg !== 'right') {
      this.lastLeg = 'right'
      this.reps++
      repCompleted = true
    } else if (!leftKneeUp && !rightKneeUp) {
      this.lastLeg = null
    }

    return {
      repCount: this.reps,
      phase: leftKneeUp || rightKneeUp ? 'UP' : 'DOWN',
      formScore: 100,
      feedback: null,
      repCompleted,
      elapsed: (Date.now() - this.startTime) / 1000,
    }
  }

  reset() {
    this.lastLeg = null
    this.reps = 0
    this.startTime = 0
  }
}
