import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Card } from './ui/Card'
import type { Exercise } from '../types/exercise'

const diffLabel = (d: number) => ['', 'Beginner', 'Intermediate', 'Advanced'][d]

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const navigate = useNavigate()

  const handleTap = () => {
    if (exercise.trackingMode === 'gps') navigate('/run')
    else navigate(`/session/${exercise.id}`)
  }

  return (
    <Card
      as="button"
      onClick={handleTap}
      className="tap flex w-full items-center gap-3 border-t-0 px-5 py-3.5 text-left"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-dark text-white text-sm font-black">
        {exercise.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <b className="block truncate text-sm font-black">{exercise.name}</b>
        <span className="block truncate text-xs font-semibold text-muted">
          {diffLabel(exercise.difficulty)} ·{' '}
          {exercise.trackingMode === 'reps'
            ? `${exercise.defaultTarget} reps`
            : exercise.trackingMode === 'timed'
              ? `${exercise.defaultTarget}s hold`
              : 'GPS tracked'}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
    </Card>
  )
}
