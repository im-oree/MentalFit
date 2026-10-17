import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, Pause, Square, MapPin } from 'lucide-react'
import { useGPS } from '../hooks/useGPS'
import { useStore } from '../data/store'
import { estimateCalories } from '../data/exercises'
import { RunMap } from '../components/RunMap'
import { SpeedGauge } from '../components/SpeedGauge'
import { Button } from '../components/ui/Button'

const ease = [0.16, 1, 0.3, 1] as const

export function RunPage() {
  const navigate = useNavigate()
  const gps = useGPS()
  const { saveWorkout } = useStore()
  const [finished, setFinished] = useState(false)

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = Math.floor(sec % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatPace = (pace: number) => {
    if (pace <= 0 || pace > 60) return '–:––'
    const m = Math.floor(pace)
    const s = Math.round((pace - m) * 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleStop = async () => {
    gps.stop()
    setFinished(true)
    const durationSec = Math.round(gps.duration)
    await saveWorkout({
      id: crypto.randomUUID(),
      date: Date.now(),
      exercises: [],
      run: {
        distanceMeters: gps.distance,
        durationSec,
        paceMinPerKm: gps.pace,
        route: gps.route,
        timestamp: Date.now(),
      },
      totalDurationSec: durationSec,
      caloriesEstimate: estimateCalories('running', durationSec),
    })
  }

  if (finished) {
    return (
      <div className="app-height bg-dark-soft text-white flex flex-col">
        {/* Summary map */}
        <div className="relative h-[45%] shrink-0">
          <RunMap route={gps.route} currentPosition={null} follow={false} fitRoute className="opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-soft" />
          <div className="absolute top-0 left-0 right-0 safe-top px-5 z-10">
            <div className="flex items-center py-3">
              <button onClick={() => navigate('/home', { replace: true })} className="tap grid h-11 w-11 place-items-center rounded-full bg-white/10 backdrop-blur-xl text-white">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="flex-1 px-5 -mt-6 relative z-10"
        >
          <h2 className="text-[34px] font-black tracking-[-0.055em]">Run Complete</h2>
          <p className="text-sm font-semibold text-white/40 mt-0.5">{formatTime(gps.duration)}</p>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <StatTile value={(gps.distance / 1000).toFixed(2)} unit="km" label="Distance" />
            <StatTile value={formatPace(gps.pace)} unit="min/km" label="Avg Pace" />
            <StatTile value={String(estimateCalories('running', Math.round(gps.duration)))} unit="kcal" label="Calories" />
          </div>

          {gps.route.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <StatTile
                value={gps.route[gps.route.length - 1]?.speed != null
                  ? (Math.max(...gps.route.map(p => (p.speed ?? 0) * 3.6))).toFixed(1)
                  : '–'}
                unit="km/h"
                label="Top Speed"
              />
              <StatTile
                value={String(gps.steps)}
                unit="steps"
                label="Steps"
              />
            </div>
          )}

          <div className="mt-8 safe-bottom pb-4">
            <Button fullWidth size="lg" onClick={() => navigate('/home', { replace: true })}>
              Done
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative app-height bg-dark-soft text-white overflow-hidden">
      {/* Full-screen map background */}
      <div className="absolute inset-0">
        <RunMap
          route={gps.route}
          currentPosition={gps.currentPosition}
        />
      </div>

      {/* Top gradient overlay */}
      <div className="absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-dark-soft via-dark-soft/80 to-transparent pointer-events-none" />

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-dark-soft via-dark-soft/90 to-transparent pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 safe-top px-5 z-10">
        <div className="flex items-center justify-between py-3">
          <button onClick={() => navigate(-1)} className="tap grid h-11 w-11 place-items-center rounded-full bg-white/10 backdrop-blur-xl text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-accent-gold" />
            <span className="text-[10px] font-black uppercase tracking-[.14em] text-white/50">
              {gps.status === 'running' ? 'Tracking' : gps.status === 'paused' ? 'Paused' : gps.currentPosition ? 'GPS Ready' : 'Finding GPS'}
            </span>
          </div>
          <div className="w-11" />
        </div>
      </div>

      {/* Timer */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 safe-top z-10 flex flex-col items-center pt-16">
        <div className="text-[56px] font-black tabular-nums tracking-[-0.05em] leading-none text-white drop-shadow-[0_2px_16px_rgba(0,0,0,.5)]">
          {formatTime(gps.duration)}
        </div>
      </div>

      {/* Metrics row */}
      <div className="pointer-events-none absolute left-0 right-0 z-10" style={{ bottom: '45%' }}>
        <div className="flex justify-around px-8">
          <div className="text-center">
            <div className="text-2xl font-black tabular-nums tracking-[-0.04em]">
              {(gps.distance / 1000).toFixed(2)}
            </div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/40 mt-0.5">km</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black tabular-nums tracking-[-0.04em]">
              {formatPace(gps.pace)}
            </div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/40 mt-0.5">min/km</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black tabular-nums tracking-[-0.04em]">{gps.cadence || gps.steps}</div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/40 mt-0.5">{gps.cadence ? 'spm' : 'steps'}</div>
          </div>
        </div>
      </div>

      {/* Speed gauge + controls */}
      <div className="absolute bottom-0 left-0 right-0 safe-bottom z-10 flex flex-col items-center pb-8">
        {gps.tracking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4"
          >
            <SpeedGauge speed={gps.speed} />
          </motion.div>
        )}

        {gps.error && (
          <p className="text-sm font-black text-accent-red mb-4">{gps.error}</p>
        )}

        <div className="flex items-center gap-5">
          {!gps.tracking ? (
            <button
              onClick={gps.start}
              className="tap grid h-20 w-20 place-items-center rounded-full bg-accent-gold text-dark-soft shadow-[0_0_30px_rgba(217,195,149,0.3)]"
            >
              <Play className="h-8 w-8 ml-1" fill="currentColor" />
            </button>
          ) : (
            <>
              <button
                onClick={handleStop}
                className="tap grid h-16 w-16 place-items-center rounded-full bg-white/10 backdrop-blur-xl text-white border border-white/10"
              >
                <Square className="h-6 w-6" fill="currentColor" />
              </button>
              <button
                onClick={gps.status === 'paused' ? gps.resume : gps.pause}
                className="tap grid h-20 w-20 place-items-center rounded-full bg-accent-gold text-dark-soft shadow-[0_0_30px_rgba(217,195,149,0.3)]"
              >
                {gps.status === 'paused' ? <Play className="h-8 w-8 ml-1" fill="currentColor" /> : <Pause className="h-8 w-8" fill="currentColor" />}
              </button>
              <div className="w-16" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatTile({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl p-4 border border-white/5">
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black tabular-nums tracking-[-0.04em]">{value}</span>
        <span className="text-[10px] font-black text-white/35">{unit}</span>
      </div>
      <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/35 mt-1">{label}</div>
    </div>
  )
}
