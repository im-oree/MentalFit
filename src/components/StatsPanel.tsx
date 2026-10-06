import { motion } from 'framer-motion'
import type { TrackingStats } from '../hooks/usePoseTracking'
import type { PoseModel } from '../pose/poseTracker'

const MODELS: { id: PoseModel; label: string }[] = [
  { id: 'lite', label: 'Lite' },
  { id: 'full', label: 'Full' },
  { id: 'heavy', label: 'Heavy' },
]

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-[15px]">
      <span className="text-ios-label-2">{label}</span>
      <span className={`tabular-nums ${warn ? 'text-[#ff9f0a]' : ''}`}>{value}</span>
    </div>
  )
}

export function StatsPanel({
  stats,
  model,
  onModel,
}: {
  stats: TrackingStats
  model: PoseModel
  onModel: (m: PoseModel) => void
}) {
  return (
    <motion.div
      className="glass w-[min(320px,calc(100vw-32px))] rounded-[20px] px-4 pt-3 pb-4"
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="divide-y divide-white/10">
        <Row label="Frame rate" value={`${stats.fps} fps`} warn={stats.fps > 0 && stats.fps < 20} />
        <Row label="Inference" value={`${stats.inferenceMs} ms`} warn={stats.inferenceMs > 40} />
        <Row label="Accelerator" value={stats.delegate ?? '–'} warn={stats.delegate === 'CPU'} />
        <Row label="Camera" value={stats.input} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-0.5 rounded-[9px] bg-ios-fill p-0.5">
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => onModel(m.id)}
            className="relative h-8 rounded-[7px] text-[13px] font-semibold"
          >
            {model === m.id && (
              <motion.span
                layoutId="model-seg"
                className="absolute inset-0 rounded-[7px] bg-[#636366]"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{m.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}
