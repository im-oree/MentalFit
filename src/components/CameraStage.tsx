import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SwitchCamera } from 'lucide-react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useCamera } from '../hooks/useCamera'
import { usePoseTracking } from '../hooks/usePoseTracking'
import { PermissionSheet } from './PermissionSheet'
import { StatusPill } from './StatusPill'

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
  const camera = useCamera(videoRef)
  const live = camera.status === 'live'
  const { state, fps } = usePoseTracking(videoRef, canvasRef, { active: live, showSkeleton })
  const mirror = camera.facing === 'user' ? '-scale-x-100' : ''

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
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
            <div className="flex justify-center px-4">
              <StatusPill state={state} fps={fps} />
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
        {!live && <PermissionSheet key="permission" status={camera.status} onAllow={camera.request} />}
      </AnimatePresence>
    </div>
  )
}
