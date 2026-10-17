export interface DetectionResult {
  repCount: number
  phase: string
  formScore: number
  feedback: string | null
  repCompleted: boolean
  elapsed: number
}

export interface ExerciseDetector {
  update(landmarks: { x: number; y: number; visibility: number }[]): DetectionResult
  reset(): void
}
