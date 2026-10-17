import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, Flame, Trophy, Zap } from 'lucide-react'
import { useStore } from '../data/store'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SectionTitle } from '../components/ui/SectionTitle'
import { EXERCISES } from '../data/exercises'
import { StreakCalendar } from '../components/StreakCalendar'
import { ExerciseCard } from '../components/ExerciseCard'
import { TopBar } from '../components/layout/TopBar'

const ease = [0.16, 1, 0.3, 1] as const

export function HomePage() {
  const { profile, workouts } = useStore()
  const navigate = useNavigate()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todaysWorkouts = workouts.filter((w) => w.date >= todayStart.getTime())

  const todayReps = todaysWorkouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.reps, 0), 0)
  const todayMinutes = Math.round(todaysWorkouts.reduce((sum, w) => sum + w.totalDurationSec, 0) / 60)
  const todayCalories = todaysWorkouts.reduce((sum, w) => sum + w.caloriesEstimate, 0)

  const totalWorkouts = workouts.length
  const quickStart = EXERCISES.filter((e) => e.trackingMode === 'reps').slice(0, 4)

  return (
    <>
      <TopBar
        title={profile?.name || 'Athlete'}
        subtitle="Welcome back"
      />

      <section className="space-y-7 px-5 py-6">
        {/* Today's stats — dark card with gold glow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          <motion.div
            whileTap={{ scale: 0.985 }}
            className="relative overflow-hidden rounded-[24px] bg-dark-card p-5 text-white shadow-[var(--shadow-lift)]"
          >
            <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-accent-gold-glow/15 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[11px] font-black uppercase tracking-[.18em] text-white/55 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" /> Today's Activity
                </p>
                <span className="ml-auto text-[10px] font-black uppercase tracking-[.14em] text-white/45">
                  {totalWorkouts} total workouts
                </span>
              </div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="block text-[38px] font-black leading-none tracking-[-0.05em]">{todayReps}</span>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[.14em] text-white/55">Reps</p>
                </div>
                <span className="pb-1.5 text-xl font-black text-white/25">·</span>
                <div className="text-center">
                  <span className="block text-[38px] font-black leading-none tracking-[-0.05em]">{todayMinutes}</span>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[.14em] text-white/55">Min</p>
                </div>
                <span className="pb-1.5 text-xl font-black text-white/25">·</span>
                <div className="text-right">
                  <span className="block text-[38px] font-black leading-none tracking-[-0.05em]">{todayCalories}</span>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[.14em] text-white/55">Cal</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06, ease }}
        >
          <Card className="p-5">
            <StreakCalendar workouts={workouts} />
          </Card>
        </motion.div>

        {/* Quick start */}
        <div>
          <SectionTitle
            action={
              <button
                className="flex items-center gap-0.5 text-sm font-black text-muted transition hover:text-ink"
                onClick={() => navigate('/workouts')}
              >
                All exercises <ChevronRight className="h-4 w-4" />
              </button>
            }
          >
            Quick start
          </SectionTitle>
          <div className="grid gap-3">
            {quickStart.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3, ease }}
              >
                <ExerciseCard exercise={e} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Start run CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease }}
        >
          <Button
            fullWidth
            size="lg"
            shimmer
            rightIcon={<ArrowRight className="h-4 w-4" />}
            onClick={() => navigate('/run')}
          >
            Start a Run
          </Button>
        </motion.div>
      </section>
    </>
  )
}
