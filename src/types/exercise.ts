export type ExerciseCategory = 'calisthenics' | 'cardio' | 'flexibility'
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'legs' | 'full_body'
export type TrackingMode = 'reps' | 'timed' | 'gps'

export interface Exercise {
  id: string
  name: string
  description: string
  category: ExerciseCategory
  muscles: MuscleGroup[]
  difficulty: 1 | 2 | 3
  trackingMode: TrackingMode
  defaultTarget: number
  icon: string
  detectorId: string
}
