import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Share2, Settings } from 'lucide-react'
import { useStore } from '../data/store'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { MetricCard } from '../components/ui/MetricCard'
import { TopBar } from '../components/layout/TopBar'
import type { FitnessLevel } from '../types/user'

const LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced']
const ease = [0.16, 1, 0.3, 1] as const

export function ProfilePage() {
  const { profile, saveProfile, resetAll, workouts } = useStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.name ?? '')

  if (!profile) return null

  const saveName = async () => {
    await saveProfile({ ...profile, name: name.trim() || 'Athlete' })
    setEditing(false)
  }

  const toggleHaptic = () =>
    saveProfile({ ...profile, settings: { ...profile.settings, hapticEnabled: !profile.settings.hapticEnabled } })
  const toggleSound = () =>
    saveProfile({ ...profile, settings: { ...profile.settings, soundEnabled: !profile.settings.soundEnabled } })
  const changeLevel = (level: FitnessLevel) => saveProfile({ ...profile, level })

  const handleReset = async () => {
    await resetAll()
    navigate('/onboarding', { replace: true })
  }

  const totalWorkouts = workouts.length
  const totalReps = workouts.reduce((s, w) => s + w.exercises.reduce((s2, e) => s2 + e.reps, 0), 0)
  const totalMinutes = Math.round(workouts.reduce((s, w) => s + w.totalDurationSec, 0) / 60)

  return (
    <>
      <TopBar title="Profile" compact />

      <section className="px-5 py-6 space-y-5">
        {/* Profile hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="relative overflow-hidden rounded-[24px] bg-dark-soft p-5 text-white shadow-[var(--shadow-lift)] shimmer-sweep"
        >
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-accent-gold-glow/15 blur-2xl" />
          <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-accent-gold-glow/8 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-black text-white text-2xl font-black ring-2 ring-white shadow-[var(--shadow-lift)]">
                {(profile.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                {editing ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveName()}
                      className="flex-1 h-10 rounded-xl bg-white/10 px-3 text-white font-bold outline-none backdrop-blur-xl"
                    />
                    <button onClick={saveName} className="text-sm font-black text-accent-gold">Save</button>
                  </div>
                ) : (
                  <button onClick={() => setEditing(true)} className="block">
                    <h2 className="text-2xl font-black tracking-[-0.055em] truncate">{profile.name}</h2>
                    <p className="text-[11px] font-black uppercase tracking-[.18em] text-white/55 mt-0.5">
                      {profile.level} · {profile.goals.length} goals
                    </p>
                  </button>
                )}
              </div>
            </div>

            {/* Form bar */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-accent-gold" style={{ width: `${Math.min(100, totalWorkouts * 10)}%` }} />
              </div>
              <span className="text-[10px] font-black text-white/45">{totalWorkouts}/10</span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <MetricCard value={totalWorkouts} label="Workouts" />
          <MetricCard value={totalReps} label="Reps" />
          <MetricCard value={totalMinutes} label="Minutes" />
        </div>

        {/* Fitness level */}
        <Card className="p-4">
          <p className="text-[11px] font-black uppercase tracking-[.18em] text-muted mb-3">Fitness Level</p>
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white/70 p-1 shadow-[var(--shadow-soft)] backdrop-blur-xl">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => changeLevel(l)}
                className={`tap relative py-2.5 rounded-xl text-sm font-black capitalize transition-colors ${
                  profile.level === l ? 'bg-dark text-white shadow-[var(--shadow-soft)]' : 'text-muted'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </Card>

        {/* Settings */}
        <Card className="overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-[11px] font-black uppercase tracking-[.18em] text-muted">Settings</p>
          </div>
          <ToggleRow label="Haptic Feedback" on={profile.settings.hapticEnabled} onToggle={toggleHaptic} />
          <ToggleRow label="Sound Effects" on={profile.settings.soundEnabled} onToggle={toggleSound} last />
        </Card>

        {/* Reset */}
        <button onClick={handleReset} className="tap w-full py-3 text-sm font-black text-accent-red">
          Reset App Data
        </button>
      </section>
    </>
  )
}

function ToggleRow({ label, on, onToggle, last }: { label: string; on: boolean; onToggle: () => void; last?: boolean }) {
  return (
    <button
      onClick={onToggle}
      className={`tap flex w-full items-center justify-between px-5 py-4 text-left ${last ? '' : 'border-b border-ink/[0.05]'}`}
    >
      <span className="text-sm font-black">{label}</span>
      <div className={`h-8 w-14 rounded-full p-1 transition-colors ${on ? 'bg-dark' : 'bg-neutral-200'}`}>
        <div className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </button>
  )
}
