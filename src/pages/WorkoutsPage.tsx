import { motion } from 'framer-motion'
import { EXERCISES } from '../data/exercises'
import { ExerciseCard } from '../components/ExerciseCard'
import { SectionTitle } from '../components/ui/SectionTitle'
import { TopBar } from '../components/layout/TopBar'
import type { ExerciseCategory } from '../types/exercise'

const CATEGORIES: { id: ExerciseCategory; label: string }[] = [
  { id: 'calisthenics', label: 'Calisthenics' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'flexibility', label: 'Flexibility' },
]

const ease = [0.16, 1, 0.3, 1] as const

export function WorkoutsPage() {
  return (
    <>
      <TopBar title="Workouts" subtitle="Exercise Library" compact />
      <section className="px-5 py-6 space-y-7">
        {CATEGORIES.map(({ id, label }) => {
          const items = EXERCISES.filter((e) => e.category === id)
          if (items.length === 0) return null
          return (
            <div key={id}>
              <SectionTitle>{label}</SectionTitle>
              <div className="grid gap-3">
                {items.map((e, i) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.045, duration: 0.3, ease }}
                  >
                    <ExerciseCard exercise={e} />
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })}
      </section>
    </>
  )
}
