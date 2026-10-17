import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, Square } from 'lucide-react'
import { useGPS } from '../hooks/useGPS'
import { useStore } from '../data/store'
import { estimateCalories } from '../data/exercises'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Screen } from '../components/layout/Screen'

const ease = [0.16, 1, 0.3, 1] as const

export function RunPage() {
  const navigate = useNavigate()
  const gps = useGPS()
  const { saveWorkout } = useStore()
  const [finished, setFinished] = useState(false)

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
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

  return (
    <Screen className="bg-paper">
      <div className="flex flex-col h-full safe-top px-5 pb-8">
        {/* Top bar */}
        <div className="flex items-center py-3">
          <button onClick={() => navigate(-1)} className="tap grid h-11 w-11 place-items-center rounded-full bg-dark text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="flex-1 text-center text-sm font-black">Run</span>
          <div className="w-11" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          {!finished ? (
            <>
              <div className="text-[64px] font-black tabular-nums tracking-[-0.05em] leading-none text-ink">
                {formatTime(gps.duration)}
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-[280px] mt-8">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-black tracking-[-0.04em]">{(gps.distance / 1000).toFixed(2)}</div>
                  <div className="text-[10px] font-black uppercase tracking-[.14em] text-muted mt-1">km</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-black tracking-[-0.04em]">{gps.pace > 0 ? gps.pace.toFixed(1) : '–'}</div>
                  <div className="text-[10px] font-black uppercase tracking-[.14em] text-muted mt-1">min/km</div>
                </Card>
              </div>

              {gps.error && <div className="mt-4 text-sm font-black text-accent-red">{gps.error}</div>}

              <div className="mt-12">
                {!gps.tracking ? (
                  <button onClick={gps.start} className="tap grid h-20 w-20 place-items-center rounded-full bg-dark text-white shadow-[var(--shadow-lift)]">
                    <Play className="h-8 w-8" fill="currentColor" />
                  </button>
                ) : (
                  <button onClick={handleStop} className="tap grid h-20 w-20 place-items-center rounded-full bg-accent-red text-white shadow-[var(--shadow-lift)]">
                    <Square className="h-7 w-7" fill="currentColor" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease }}
              className="flex flex-col items-center"
            >
              <Card className="p-8 text-center">
                <h2 className="text-[34px] font-black tracking-[-0.055em] mb-1">Run Complete</h2>
                <p className="text-sm font-semibold text-muted mb-5">{formatTime(gps.duration)}</p>
                <div className="flex gap-8 mb-6">
                  <div>
                    <div className="text-2xl font-black">{(gps.distance / 1000).toFixed(2)}</div>
                    <div className="text-[10px] font-black uppercase tracking-[.14em] text-muted">km</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black">{gps.pace > 0 ? gps.pace.toFixed(1) : '–'}</div>
                    <div className="text-[10px] font-black uppercase tracking-[.14em] text-muted">min/km</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black">{estimateCalories('running', Math.round(gps.duration))}</div>
                    <div className="text-[10px] font-black uppercase tracking-[.14em] text-muted">cal</div>
                  </div>
                </div>
                <Button fullWidth size="lg" onClick={() => navigate('/home', { replace: true })}>Done</Button>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </Screen>
  )
}
