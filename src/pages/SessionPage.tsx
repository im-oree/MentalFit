import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, SwitchCamera, Minimize2, Maximize2 } from 'lucide-react'
import { useCamera } from '../hooks/useCamera'
import { usePoseTracking } from '../hooks/usePoseTracking'
import { useExerciseDetection } from '../hooks/useExerciseDetection'
import { useStore } from '../data/store'
import { getExercise, estimateCalories } from '../data/exercises'
import { getProgressionFromWorkouts } from '../data/progression'
import { ExerciseModelViewer } from '../components/three/ExerciseModel'
import { PermissionSheet } from '../components/PermissionSheet'
import { Button } from '../components/ui/Button'
import type { SmoothedLandmark } from '../pose/poseTracker'

const ease = [0.16, 1, 0.3, 1] as const
const MODEL_URL = '/models/basemesh.glb'

export function SessionPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const navigate = useNavigate()
  const { profile, saveWorkout, workouts } = useStore()
  const exercise = getExercise(exerciseId ?? '')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const landmarksRef = useRef<SmoothedLandmark[] | null>(null)

  const camera = useCamera(videoRef)
  const poseModel = profile?.settings.poseModel ?? 'lite'
  const { state: trackingState } = usePoseTracking(
    videoRef,
    canvasRef,
    { active: camera.status === 'live', showSkeleton: true, model: poseModel },
    landmarksRef,
  )

  const detection = useExerciseDetection(
    exercise?.detectorId ?? '',
    landmarksRef,
    trackingState === 'tracking',
    profile?.settings.hapticEnabled ?? true,
  )

  const [finished, setFinished] = useState(false)
  const [showModel, setShowModel] = useState(true)

  const progression = getProgressionFromWorkouts(workouts)

  if (!exercise) {
    navigate('/workouts', { replace: true })
    return null
  }

  const isTimed = exercise.trackingMode === 'timed'
  const isGps = exercise.trackingMode === 'gps'
  const targetReached = isTimed
    ? detection.elapsed >= exercise.defaultTarget
    : detection.repCount >= exercise.defaultTarget

  const handleFinish = async () => {
    setFinished(true)
    const durationSec = Math.round(detection.elapsed)
    await saveWorkout({
      id: crypto.randomUUID(),
      date: Date.now(),
      exercises: [
        {
          exerciseId: exercise.id,
          reps: detection.repCount,
          durationSec,
          formScore: detection.formScore,
          timestamp: Date.now(),
        },
      ],
      totalDurationSec: durationSec,
      caloriesEstimate: estimateCalories(exercise.id, durationSec),
    })
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative app-height bg-black overflow-hidden">
      {/* Main view: 3D model or camera */}
      {showModel && !isGps ? (
        <ExerciseModelViewer
          modelUrl={MODEL_URL}
          animationName={exercise.id}
          playing={!finished}
          speed={0.8}
          progression={progression}
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: camera.facing === 'user' ? 'scaleX(-1)' : undefined }}
          />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </>
      )}

      {/* PiP camera feed (lower-right corner) when model is main view */}
      {showModel && !isGps && (
        <div className="absolute bottom-28 right-4 z-20 w-[130px] h-[180px] rounded-2xl overflow-hidden shadow-[var(--shadow-lift)] ring-2 ring-white/20">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: camera.facing === 'user' ? 'scaleX(-1)' : undefined }}
          />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40 pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 safe-top px-5 z-10">
        <div className="flex items-center justify-between py-3">
          <button onClick={() => navigate(-1)} className="tap grid h-11 w-11 place-items-center rounded-full bg-white/12 backdrop-blur-xl text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-black text-white drop-shadow">{exercise.name}</span>
          <div className="flex gap-2">
            {!isGps && (
              <button
                onClick={() => setShowModel(!showModel)}
                className="tap grid h-11 w-11 place-items-center rounded-full bg-white/12 backdrop-blur-xl text-white"
              >
                {showModel ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
            )}
            <button onClick={camera.flip} className="tap grid h-11 w-11 place-items-center rounded-full bg-white/12 backdrop-blur-xl text-white">
              <SwitchCamera className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main counter */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          {!finished ? (
            <motion.div key="counter" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
              <div className="text-[80px] font-black tabular-nums tracking-[-0.05em] leading-none text-white drop-shadow-[0_4px_24px_rgba(0,0,0,.6)]">
                {isTimed ? formatTime(detection.elapsed) : detection.repCount}
              </div>
              <p className="text-[11px] font-black uppercase tracking-[.18em] text-white/55 mt-2">
                {isTimed ? `Hold for ${formatTime(exercise.defaultTarget)}` : `${exercise.defaultTarget} reps`}
              </p>

              {detection.feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 px-4 py-2 rounded-full bg-accent-red/30 backdrop-blur-xl text-white text-sm font-black"
                >
                  {detection.feedback}
                </motion.div>
              )}

              {trackingState === 'tracking' && (
                <p className="mt-3 text-[10px] font-black uppercase tracking-[.14em] text-white/35">{detection.phase}</p>
              )}
              {trackingState === 'loading' && (
                <p className="mt-6 text-sm font-semibold text-white/65">Loading pose model…</p>
              )}
              {trackingState === 'searching' && (
                <p className="mt-6 text-sm font-semibold text-white/65">Step into frame</p>
              )}

              {targetReached && (
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-4 text-[11px] font-black uppercase tracking-[.14em] text-accent-gold"
                >
                  Target reached!
                </motion.p>
              )}

              {/* Progression label */}
              <p className="mt-2 text-[9px] font-black uppercase tracking-[.14em] text-white/25">
                {progression.label}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease }}
              className="pointer-events-auto mx-5"
            >
              <div className="glass-card rounded-[30px] p-8 text-center">
                <h2 className="text-[34px] font-black tracking-[-0.055em] mb-1">Done!</h2>
                <p className="text-sm font-semibold text-muted mb-5">
                  {detection.repCount > 0 && `${detection.repCount} reps · `}{formatTime(detection.elapsed)}
                </p>
                <div className="flex justify-center gap-8 mb-6">
                  <div>
                    <div className="text-2xl font-black">{detection.formScore}</div>
                    <div className="text-[10px] font-black uppercase tracking-[.14em] text-muted">Form</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black">{estimateCalories(exercise.id, Math.round(detection.elapsed))}</div>
                    <div className="text-[10px] font-black uppercase tracking-[.14em] text-muted">Cal</div>
                  </div>
                </div>
                <Button fullWidth size="lg" onClick={() => navigate('/home', { replace: true })}>Done</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      {!finished && (
        <div className="absolute bottom-0 left-0 right-0 safe-bottom px-5 z-10">
          <button
            onClick={handleFinish}
            className="tap w-full glass-dark rounded-2xl py-3.5 text-white font-black mb-2"
          >
            End Workout
          </button>
        </div>
      )}

      {(camera.status === 'prompt' || camera.status === 'denied' || camera.status === 'unavailable') && (
        <PermissionSheet status={camera.status} error={camera.error} onAllow={camera.request} />
      )}
    </div>
  )
}
