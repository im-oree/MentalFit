import { motion } from 'framer-motion'
import { Camera, Lock } from 'lucide-react'
import type { CameraStatus } from '../hooks/useCamera'

const ease = [0.32, 0.72, 0, 1] as const

export function PermissionSheet({ status, onAllow }: { status: CameraStatus; onAllow: () => void }) {
  const denied = status === 'denied'
  const unavailable = status === 'unavailable'
  const busy = status === 'requesting' || status === 'checking'

  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col bg-black px-6 pt-safe pb-safe"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease } }}
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          className="mb-8 flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-b from-[#1c1c1e] to-[#0b0b0c] shadow-[0_20px_60px_-20px_rgba(10,132,255,0.55)] ring-1 ring-white/10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease }}
        >
          <Camera className="h-11 w-11 text-ios-blue" strokeWidth={1.75} />
        </motion.div>

        <motion.h1
          className="text-[34px] leading-[41px] font-bold tracking-tight"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.08, ease }}
        >
          {denied ? 'Camera Access Off' : unavailable ? 'No Camera Found' : 'See Your Movement'}
        </motion.h1>

        <motion.p
          className="mt-3 max-w-[300px] text-[17px] leading-[22px] text-ios-label-2"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.14, ease }}
        >
          {denied
            ? 'Turn on camera access for MentalFit in Settings to track your form in real time.'
            : unavailable
              ? 'MentalFit couldn’t open a camera on this device.'
              : 'MentalFit uses your camera to map your body and guide your form in real time.'}
        </motion.p>
      </div>

      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease }}
      >
        <div className="flex items-center gap-1.5 text-[13px] text-ios-label-3">
          <Lock className="h-3.5 w-3.5" />
          Processed on device. Nothing leaves your phone.
        </div>
        {!unavailable && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onAllow}
            disabled={busy}
            className="h-[50px] w-full max-w-md rounded-[14px] bg-ios-blue text-[17px] font-semibold text-white transition-opacity disabled:opacity-60"
          >
            {busy ? 'Opening Camera…' : denied ? 'Try Again' : 'Continue'}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  )
}
