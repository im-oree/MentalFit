import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useStore } from '../data/store'
import { getExercise } from '../data/exercises'
import { Card } from '../components/ui/Card'
import { TopBar } from '../components/layout/TopBar'

const ease = [0.16, 1, 0.3, 1] as const

function formatDate(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000
  if (ts >= today) return 'Today'
  if (ts >= yesterday) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatDuration(sec: number) {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function HistoryPage() {
  const { workouts } = useStore()

  return (
    <>
      <TopBar title="Activity" subtitle="Your History" compact />
      <section className="px-5 py-6">
        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-muted">
            <Clock size={48} strokeWidth={1.2} className="mb-4 opacity-40" />
            <p className="text-lg font-black">No workouts yet</p>
            <p className="text-sm font-semibold mt-1">Complete an exercise to see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map((w, i) => {
              const totalReps = w.exercises.reduce((s, e) => s + e.reps, 0)
              const names = w.exercises
                .map((e) => getExercise(e.exerciseId)?.name ?? e.exerciseId)
                .filter((v, idx, a) => a.indexOf(v) === idx)
              return (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.045, duration: 0.4, ease }}
                >
                  <Card className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <b className="block text-sm font-black">{w.run ? 'Run' : names.join(', ')}</b>
                        <span className="text-xs font-semibold text-muted mt-0.5">{formatDate(w.date)}</span>
                      </div>
                      {w.run && (
                        <span className="text-[10px] font-black uppercase tracking-[.12em] bg-dark text-accent-gold px-2 py-0.5 rounded-full">
                          Run
                        </span>
                      )}
                    </div>
                    <div className="flex gap-5 mt-3 text-sm font-semibold text-muted">
                      {totalReps > 0 && <span>{totalReps} reps</span>}
                      <span>{formatDuration(w.totalDurationSec)}</span>
                      {w.caloriesEstimate > 0 && <span>{w.caloriesEstimate} cal</span>}
                    </div>
                    {w.run && (
                      <div className="flex gap-5 mt-1 text-sm font-semibold text-muted">
                        <span>{(w.run.distanceMeters / 1000).toFixed(2)} km</span>
                        <span>{w.run.paceMinPerKm.toFixed(1)} min/km</span>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
