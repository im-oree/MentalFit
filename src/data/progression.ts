import type { WorkoutSession } from '../types/workout'

export interface ProgressionLevel {
  tier: number
  label: string
  torsoScale: [number, number, number]
  limbScale: [number, number, number]
  shoulderScale: [number, number, number]
}

const TIERS: ProgressionLevel[] = [
  { tier: 0, label: 'Getting Started', torsoScale: [1.15, 1, 1.15], limbScale: [1.1, 1, 1.1], shoulderScale: [1, 1, 1] },
  { tier: 1, label: 'Warming Up', torsoScale: [1.1, 1, 1.1], limbScale: [1.06, 1, 1.06], shoulderScale: [1.02, 1, 1.02] },
  { tier: 2, label: 'Building Habit', torsoScale: [1.05, 1, 1.05], limbScale: [1.03, 1, 1.03], shoulderScale: [1.04, 1, 1.04] },
  { tier: 3, label: 'Getting Fit', torsoScale: [1, 1, 1], limbScale: [1, 1, 1], shoulderScale: [1.06, 1, 1.06] },
  { tier: 4, label: 'In Shape', torsoScale: [0.95, 1, 0.95], limbScale: [1.02, 1, 1.02], shoulderScale: [1.08, 1, 1.08] },
  { tier: 5, label: 'Athlete', torsoScale: [0.92, 1, 0.92], limbScale: [1.05, 1, 1.05], shoulderScale: [1.1, 1, 1.1] },
]

export function getProgressionFromWorkouts(workouts: WorkoutSession[]): ProgressionLevel {
  const last30Days = Date.now() - 30 * 86400000
  const recentWorkouts = workouts.filter((w) => w.date >= last30Days)
  const totalReps = recentWorkouts.reduce(
    (s, w) => s + w.exercises.reduce((s2, e) => s2 + e.reps, 0),
    0,
  )
  const totalMinutes = recentWorkouts.reduce((s, w) => s + w.totalDurationSec, 0) / 60

  const score = recentWorkouts.length * 10 + totalReps * 0.5 + totalMinutes * 0.3

  if (score >= 200) return TIERS[5]
  if (score >= 120) return TIERS[4]
  if (score >= 70) return TIERS[3]
  if (score >= 35) return TIERS[2]
  if (score >= 10) return TIERS[1]
  return TIERS[0]
}
