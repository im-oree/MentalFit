import type { Exercise } from '../types/exercise'

export const EXERCISES: Exercise[] = [
  {
    id: 'pushup',
    name: 'Push-ups',
    description: 'Classic upper body exercise targeting chest, shoulders, and triceps.',
    category: 'calisthenics',
    muscles: ['chest', 'shoulders', 'arms'],
    difficulty: 1,
    trackingMode: 'reps',
    defaultTarget: 15,
    icon: 'ArrowDown',
    detectorId: 'pushup',
  },
  {
    id: 'squat',
    name: 'Squats',
    description: 'Fundamental lower body exercise for legs and glutes.',
    category: 'calisthenics',
    muscles: ['legs', 'core'],
    difficulty: 1,
    trackingMode: 'reps',
    defaultTarget: 20,
    icon: 'ArrowDownUp',
    detectorId: 'squat',
  },
  {
    id: 'lunge',
    name: 'Lunges',
    description: 'Alternating leg lunges for balance and leg strength.',
    category: 'calisthenics',
    muscles: ['legs', 'core'],
    difficulty: 2,
    trackingMode: 'reps',
    defaultTarget: 20,
    icon: 'Footprints',
    detectorId: 'lunge',
  },
  {
    id: 'jumping_jack',
    name: 'Jumping Jacks',
    description: 'Full body cardio exercise to get your heart rate up.',
    category: 'cardio',
    muscles: ['full_body'],
    difficulty: 1,
    trackingMode: 'reps',
    defaultTarget: 30,
    icon: 'Zap',
    detectorId: 'jumping_jack',
  },
  {
    id: 'high_knees',
    name: 'High Knees',
    description: 'Running in place with knees raised above hip level.',
    category: 'cardio',
    muscles: ['legs', 'core'],
    difficulty: 1,
    trackingMode: 'reps',
    defaultTarget: 40,
    icon: 'TrendingUp',
    detectorId: 'high_knees',
  },
  {
    id: 'plank',
    name: 'Plank',
    description: 'Isometric core exercise. Hold position with proper form.',
    category: 'calisthenics',
    muscles: ['core', 'shoulders'],
    difficulty: 1,
    trackingMode: 'timed',
    defaultTarget: 60,
    icon: 'Minus',
    detectorId: 'plank',
  },
  {
    id: 'burpee',
    name: 'Burpees',
    description: 'Full body exercise combining squat, push-up, and jump.',
    category: 'cardio',
    muscles: ['full_body'],
    difficulty: 3,
    trackingMode: 'reps',
    defaultTarget: 10,
    icon: 'Flame',
    detectorId: 'burpee',
  },
  {
    id: 'running',
    name: 'Running',
    description: 'Outdoor GPS-tracked running session.',
    category: 'cardio',
    muscles: ['legs', 'core'],
    difficulty: 2,
    trackingMode: 'gps',
    defaultTarget: 1800,
    icon: 'MapPin',
    detectorId: 'gps',
  },
  {
    id: 'walking',
    name: 'Walking',
    description: 'Outdoor GPS-tracked walking session.',
    category: 'cardio',
    muscles: ['legs'],
    difficulty: 1,
    trackingMode: 'gps',
    defaultTarget: 1800,
    icon: 'Navigation',
    detectorId: 'gps',
  },
]

export function getExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id)
}

export function getExercisesByCategory(category: Exercise['category']): Exercise[] {
  return EXERCISES.filter((e) => e.category === category)
}

export const MET_VALUES: Record<string, number> = {
  pushup: 3.8,
  squat: 5.0,
  lunge: 5.0,
  jumping_jack: 8.0,
  high_knees: 8.0,
  plank: 3.0,
  burpee: 8.0,
  running: 9.8,
  walking: 3.5,
}

export function estimateCalories(exerciseId: string, durationSec: number, weightKg = 70): number {
  const met = MET_VALUES[exerciseId] ?? 4.0
  return Math.round(met * weightKg * (durationSec / 3600))
}
