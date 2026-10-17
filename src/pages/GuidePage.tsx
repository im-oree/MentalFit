import { useParams, useNavigate } from 'react-router-dom'
import { getExercise } from '../data/exercises'
import { getProgressionFromWorkouts } from '../data/progression'
import { useStore } from '../data/store'
import { ExerciseGuide } from '../components/three/ExerciseGuide'

const MODEL_URL = '/models/basemesh.glb'

export function GuidePage() {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const navigate = useNavigate()
  const { workouts } = useStore()
  const exercise = getExercise(exerciseId ?? '')

  if (!exercise) {
    navigate('/workouts', { replace: true })
    return null
  }

  const progression = getProgressionFromWorkouts(workouts)

  return (
    <ExerciseGuide
      exercise={exercise}
      modelUrl={MODEL_URL}
      progression={progression}
      onStartSession={() => navigate(`/session/${exercise.id}`, { replace: true })}
      onBack={() => navigate(-1)}
    />
  )
}
