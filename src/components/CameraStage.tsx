import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SwitchCamera } from 'lucide-react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useCamera } from '../hooks/useCamera'
import { usePoseTracking } from '../hooks/usePoseTracking'
import type { PoseModel } from '../pose/poseTracker'
import { PermissionSheet } from './PermissionSheet'
import { StatsPanel } from './StatsPanel'
import { StatusPill } from './StatusPill'

const MODEL_KEY = 'mentalfit.poseModel'
const loadModel = (): PoseModel => {
  try {
    const m = localStorage.getItem(MODEL_KEY)
    if (m === 'lite' || m === 'full' || m === 'heavy') return m
  } catch {
    /* storage unavailable */
  }
  return 'full'
}

function GlassButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      aria-label={label}
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      className="glass flex h-14 w-14 items-center justify-center rounded-full text-white"
    >
      {children}
    </motion.button>
  )
}

export function CameraStage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const [model, setModel] = useState<PoseModel>(loadModel)
  const camera = useCamera(videoRef)
  const live = camera.status === 'live'
  const { state, stats } = usePoseTracking(videoRef, canvasRef, { active: live, showSkeleton, model })
  const chooseModel = (m: PoseModel) => {
    setModel(m)
    try {
      localStorage.setItem(MODEL_KEY, m)
    } catch {
      /* storage unavailable */
    }
  }
  const mirror = camera.facing === 'user' ? '-scale-x-100' : ''

  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-black"
      onPointerDown={() => {
        if (live && videoRef.current?.paused) videoRef.current.play().catch(() => {})
        setShowStats(false)
      }}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 h-full w-full object-cover ${mirror}`}
      />
      <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 h-full w-full ${mirror}`} />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />

      <AnimatePresence>
        {live && (
          <motion.div
            key="chrome"
            className="absolute inset-0 flex flex-col justify-between pt-safe pb-safe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex flex-col items-center gap-2 px-4">
              <StatusPill state={state} fps={stats.fps} onPress={() => setShowStats((v) => !v)} />
              <AnimatePresence>
                {showStats && <StatsPanel key="stats" stats={stats} model={model} onModel={chooseModel} />}
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-center gap-6 px-6">
              <GlassButton
                label={showSkeleton ? 'Hide skeleton' : 'Show skeleton'}
                onClick={() => setShowSkeleton((s) => !s)}
              >
                {showSkeleton ? <EyeIcon className="h-6 w-6" /> : <EyeSlashIcon className="h-6 w-6" />}
              </GlassButton>
              <GlassButton label="Flip camera" onClick={camera.flip}>
                <SwitchCamera className="h-6 w-6" strokeWidth={1.75} />
              </GlassButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!live && <PermissionSheet key="permission" status={camera.status} error={camera.error} onAllow={camera.request} />}
      </AnimatePresence>
    </div>
  )
}
