import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Activity } from 'lucide-react'
import { useStore } from '../data/store'
import { DEFAULT_PROFILE, type FitnessGoal, type FitnessLevel } from '../types/user'
import { Button } from '../components/ui/Button'
import { Screen } from '../components/layout/Screen'

const GOALS: { id: FitnessGoal; label: string }[] = [
  { id: 'strength', label: 'Build Strength' },
  { id: 'flexibility', label: 'Improve Flexibility' },
  { id: 'cardio', label: 'Boost Cardio' },
  { id: 'weight_loss', label: 'Lose Weight' },
  { id: 'general', label: 'Stay Active' },
]

const LEVELS: { id: FitnessLevel; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'Just getting started' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Regular exercise routine' },
  { id: 'advanced', label: 'Advanced', desc: 'Experienced athlete' },
]

const ease = [0.16, 1, 0.3, 1] as const
const slide = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.45, ease },
}

export function OnboardingPage() {
  const { saveProfile } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [goals, setGoals] = useState<FitnessGoal[]>([])
  const [level, setLevel] = useState<FitnessLevel>('beginner')

  const next = () => setStep((s) => s + 1)
  const toggleGoal = (g: FitnessGoal) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))

  const finish = async () => {
    await saveProfile({
      ...DEFAULT_PROFILE,
      name: name.trim() || 'Athlete',
      goals,
      level,
      createdAt: Date.now(),
      onboardingComplete: true,
    })
    navigate('/home', { replace: true })
  }

  return (
    <Screen className="bg-paper">
      <div className="flex flex-col h-full safe-top px-5 pb-8">
        {/* Progress bar */}
        <div className="flex gap-1.5 py-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-dark' : 'bg-ink/[0.08]'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="welcome" {...slide} className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="mb-4 grid h-20 w-20 place-items-center rounded-[28%] bg-dark text-white">
                <Activity className="h-10 w-10" />
              </div>
              <h1 className="text-[36px] font-black leading-[.92] tracking-[-0.065em] text-center">MentalFit</h1>
              <p className="text-center text-[15px] font-semibold leading-relaxed text-muted max-w-[300px]">
                AI-powered exercise tracking. Counts your reps, checks your form, stays on device.
              </p>
              <div className="mt-8">
                <Button size="lg" shimmer rightIcon={<ArrowRight className="h-4 w-4" />} onClick={next}>Get Started</Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="name" {...slide} className="flex-1 flex flex-col justify-center gap-5">
              <p className="text-[11px] font-black uppercase tracking-[.18em] text-muted">Step 1</p>
              <h2 className="text-[34px] font-black leading-none tracking-[-0.055em]">What's your name?</h2>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && next()}
                placeholder="Your name"
                className="h-12 rounded-2xl border border-white/70 bg-white/85 px-4 text-base font-bold shadow-[var(--shadow-soft)] backdrop-blur-xl outline-none placeholder:text-muted"
              />
              <div className="self-end mt-2">
                <Button rightIcon={<ArrowRight className="h-4 w-4" />} onClick={next}>Continue</Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="goals" {...slide} className="flex-1 flex flex-col gap-3 pt-2">
              <p className="text-[11px] font-black uppercase tracking-[.18em] text-muted">Step 2</p>
              <h2 className="text-[34px] font-black leading-none tracking-[-0.055em]">Your goals</h2>
              <p className="text-sm font-semibold text-muted">Select all that apply</p>
              <div className="flex flex-col gap-2.5 mt-3">
                {GOALS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => toggleGoal(id)}
                    className={`tap text-left p-4 rounded-2xl font-black tracking-[-0.01em] transition-all ${
                      goals.includes(id)
                        ? 'bg-dark text-white shadow-[var(--shadow-lift)]'
                        : 'glass-card'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-auto self-end pb-2">
                <Button disabled={goals.length === 0} rightIcon={<ArrowRight className="h-4 w-4" />} onClick={next}>Continue</Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="level" {...slide} className="flex-1 flex flex-col gap-3 pt-2">
              <p className="text-[11px] font-black uppercase tracking-[.18em] text-muted">Step 3</p>
              <h2 className="text-[34px] font-black leading-none tracking-[-0.055em]">Fitness level</h2>
              <div className="flex flex-col gap-2.5 mt-3">
                {LEVELS.map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => setLevel(id)}
                    className={`tap text-left p-4 rounded-2xl transition-all ${
                      level === id
                        ? 'bg-dark text-white shadow-[var(--shadow-lift)]'
                        : 'glass-card'
                    }`}
                  >
                    <div className="font-black tracking-[-0.01em]">{label}</div>
                    <div className={`text-sm font-semibold mt-0.5 ${level === id ? 'text-white/65' : 'text-muted'}`}>{desc}</div>
                  </button>
                ))}
              </div>
              <div className="mt-auto self-end pb-2">
                <Button rightIcon={<ArrowRight className="h-4 w-4" />} onClick={next}>Continue</Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="camera" {...slide} className="flex-1 flex flex-col items-center justify-center gap-3">
              <h2 className="text-[34px] font-black leading-none tracking-[-0.055em] text-center">Camera Access</h2>
              <p className="text-center text-[15px] font-semibold leading-relaxed text-muted max-w-[300px]">
                We use your camera to track exercises and count reps in real-time. Everything stays on your device.
              </p>
              <div className="mt-8">
                <Button size="lg" shimmer rightIcon={<ArrowRight className="h-4 w-4" />} onClick={finish}>Let's Go</Button>
              </div>
              <button onClick={finish} className="mt-3 text-sm font-black text-muted">Skip for now</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Screen>
  )
}
