import { AnimatePresence, motion } from 'framer-motion'
import type { TrackingState } from '../hooks/usePoseTracking'

const LABEL: Record<TrackingState, string> = {
  loading: 'Preparing',
  searching: 'Step into frame',
  tracking: 'Tracking',
  error: 'Tracking unavailable',
}

const DOT: Record<TrackingState, string> = {
  loading: 'bg-white/60',
  searching: 'bg-[#ffd60a]',
  tracking: 'bg-ios-green',
  error: 'bg-ios-red',
}

export function StatusPill({ state, fps, onPress }: { state: TrackingState; fps: number; onPress: () => void }) {
  return (
    <motion.button
      layout
      whileTap={{ scale: 0.95 }}
      onClick={onPress}
      onPointerDown={(e) => e.stopPropagation()}
      className="glass flex h-9 items-center gap-2 rounded-full px-3.5 text-[15px] font-medium"
    >
      <span className="relative flex h-2 w-2">
        {state === 'tracking' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ios-green opacity-60" />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${DOT[state]}`} />
      </span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {LABEL[state]}
        </motion.span>
      </AnimatePresence>
      {state === 'tracking' && (
        <span className="ml-0.5 text-[13px] tabular-nums text-ios-label-2">{fps} fps</span>
      )}
    </motion.button>
  )
}
