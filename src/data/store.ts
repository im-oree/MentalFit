import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { get, set, del } from 'idb-keyval'
import type { UserProfile } from '../types/user'
import type { WorkoutSession } from '../types/workout'


type StoreContextValue = {
  profile: UserProfile | null
  workouts: WorkoutSession[]
  loading: boolean
  saveProfile: (p: UserProfile) => Promise<void>
  saveWorkout: (w: WorkoutSession) => Promise<void>
  deleteWorkout: (id: string) => Promise<void>
  resetAll: () => Promise<void>
}

export const StoreContext = createContext<StoreContextValue>(null!)

export function useStore() {
  return useContext(StoreContext)
}

export function useStoreProvider(): StoreContextValue {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([get<UserProfile>('profile'), get<WorkoutSession[]>('workouts')])
      .then(([p, w]) => {
        setProfile(p ?? null)
        setWorkouts(w ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  const saveProfile = useCallback(async (p: UserProfile) => {
    await set('profile', p)
    setProfile(p)
  }, [])

  const saveWorkout = useCallback(async (w: WorkoutSession) => {
    setWorkouts((prev) => {
      const next = [w, ...prev]
      set('workouts', next)
      return next
    })
  }, [])

  const deleteWorkout = useCallback(async (id: string) => {
    setWorkouts((prev) => {
      const next = prev.filter((w) => w.id !== id)
      set('workouts', next)
      return next
    })
  }, [])

  const resetAll = useCallback(async () => {
    await Promise.all([del('profile'), del('workouts')])
    setProfile(null)
    setWorkouts([])
  }, [])

  return { profile, workouts, loading, saveProfile, saveWorkout, deleteWorkout, resetAll }
}
