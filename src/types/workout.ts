export interface ExerciseLog {
  exerciseId: string
  reps: number
  durationSec: number
  formScore: number
  timestamp: number
}

export interface RunLog {
  distanceMeters: number
  durationSec: number
  paceMinPerKm: number
  route: { lat: number; lng: number; timestamp: number }[]
  timestamp: number
}

export interface WorkoutSession {
  id: string
  date: number
  exercises: ExerciseLog[]
  run?: RunLog
  totalDurationSec: number
  caloriesEstimate: number
}
