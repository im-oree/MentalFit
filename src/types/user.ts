import type { PoseModel } from '../pose/poseTracker'

export type FitnessGoal = 'strength' | 'flexibility' | 'cardio' | 'weight_loss' | 'general'
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'

export interface UserProfile {
  name: string
  goals: FitnessGoal[]
  level: FitnessLevel
  createdAt: number
  onboardingComplete: boolean
  settings: {
    hapticEnabled: boolean
    soundEnabled: boolean
    poseModel: PoseModel
  }
}

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  goals: [],
  level: 'beginner',
  createdAt: Date.now(),
  onboardingComplete: false,
  settings: {
    hapticEnabled: true,
    soundEnabled: true,
    poseModel: 'lite',
  },
}
