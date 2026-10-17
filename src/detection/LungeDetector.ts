import type { ExerciseDetector, DetectionResult } from './types'
import { angleDeg } from './angles'
import { L } from '../pose/landmarks'

export class LungeDetector implements ExerciseDetector {
  private phase: 'UP' | 'DOWN' = 'UP'
  private reps = 0
  private lastFormScore = 100
  private startTime = 0

  update(landmarks: { x: number; y: number; visibility: number }[]): DetectionResult {
    if (!this.startTime) this.startTime = Date.now()

    const leftKnee = angleDeg(landmarks[L.LEFT_HIP], landmarks[L.LEFT_KNEE], landmarks[L.LEFT_ANKLE])
    const rightKnee = angleDeg(landmarks[L.RIGHT_HIP], landmarks[L.RIGHT_KNEE], landmarks[L.RIGHT_ANKLE])
    const minKnee = Math.min(leftKnee, rightKnee)
    const maxKnee = Math.max(leftKnee, rightKnee)

    let feedback: string | null = null
    let repCompleted = false

    if (this.phase === 'DOWN' && minKnee < 70) feedback = 'Don\'t go too deep'

    if (this.phase === 'UP' && minKnee < 100) {
      this.phase = 'DOWN'
      const depthScore = Math.min(50, Math.max(0, ((100 - minKnee) / 30) * 50))
      const balanceScore = Math.min(50, Math.max(0, 50 - Math.abs(leftKnee - rightKnee)))
      this.lastFormScore = Math.round(depthScore + balanceScore)
    } else if (this.phase === 'DOWN' && minKnee > 150) {
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
