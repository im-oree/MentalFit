import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Play, Pause, SkipForward, RotateCcw } from 'lucide-react'
import { ExerciseModelViewer } from './ExerciseModel'
import { Button } from '../ui/Button'
import type { Exercise } from '../../types/exercise'
import type { ProgressionLevel } from '../../data/progression'

const EXERCISE_STEPS: Record<string, { label: string; cue: string }[]> = {
  pushup: [
    { label: 'Start Position', cue: 'Hands shoulder-width, body straight' },
    { label: 'Lower Down', cue: 'Bend elbows to 90°, keep core tight' },
    { label: 'Push Up', cue: 'Extend arms fully, squeeze chest' },
  ],
  squat: [
    { label: 'Stand Tall', cue: 'Feet shoulder-width, chest up' },
    { label: 'Sit Back', cue: 'Push hips back, knees track toes' },
    { label: 'Drive Up', cue: 'Push through heels, squeeze glutes' },
  ],
  lunge: [
    { label: 'Stand Tall', cue: 'Feet hip-width apart' },
    { label: 'Step Forward', cue: 'Lower until both knees at 90°' },
    { label: 'Push Back', cue: 'Drive through front heel to start' },
  ],
  jumping_jack: [
    { label: 'Start', cue: 'Stand with arms at sides' },
    { label: 'Jump Out', cue: 'Spread feet wide, arms overhead' },
    { label: 'Jump In', cue: 'Return to starting position' },
  ],
  high_knees: [
    { label: 'Ready', cue: 'Stand tall, arms bent at 90°' },
    { label: 'Drive Knee', cue: 'Lift knee above hip level' },
    { label: 'Alternate', cue: 'Quick switch, pump arms' },
  ],
  burpee: [
    { label: 'Stand', cue: 'Feet shoulder-width apart' },
    { label: 'Drop Down', cue: 'Squat, place hands on floor' },
    { label: 'Kick Back', cue: 'Jump feet back to plank' },
    { label: 'Push Up', cue: 'Lower chest, push back up' },
    { label: 'Jump Up', cue: 'Jump feet forward, explode up' },
  ],
  plank: [
    { label: 'Get Set', cue: 'Forearms on ground, shoulders over elbows' },
    { label: 'Hold', cue: 'Straight line from head to heels' },
  ],
}

const ease = [0.16, 1, 0.3, 1] as const

interface ExerciseGuideProps {
  exercise: Exercise
  modelUrl: string
  progression?: ProgressionLevel
  onStartSession: () => void
  onBack: () => void
}

export function ExerciseGuide({ exercise, modelUrl, progression, onStartSession, onBack }: ExerciseGuideProps) {
  const steps = EXERCISE_STEPS[exercise.id] ?? [{ label: 'Perform', cue: exercise.description }]
  const [currentStep, setCurrentStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)

  useEffect(() => {
    if (!autoPlay || !playing) return
    const interval = setInterval(() => {
      setCurrentStep((s) => (s + 1) % steps.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [autoPlay, playing, steps.length])

  const nextStep = () => setCurrentStep((s) => (s + 1) % steps.length)
  const resetSteps = () => {
    setCurrentStep(0)
    setPlaying(false)
    setAutoPlay(false)
  }

  return (
    <div className="flex flex-col h-full bg-paper">
      {/* Top bar */}
      <div className="safe-top px-5">
        <div className="flex items-center py-3">
          <button onClick={onBack} className="tap grid h-11 w-11 place-items-center rounded-full bg-dark text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="flex-1 text-center text-sm font-black">{exercise.name}</span>
          <div className="w-11" />
        </div>
      </div>

      {/* 3D Model viewer */}
      <ExerciseModelViewer
        modelUrl={modelUrl}
        animationName={exercise.id}
        playing={playing}
        currentStep={playing ? undefined : currentStep}
        totalSteps={steps.length}
        progression={progression}
        className="flex-1 min-h-0"
      />

      {/* Step controls */}
      <div className="px-5 pb-2">
        {/* Step indicator dots */}
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentStep(i); setPlaying(false); setAutoPlay(false) }}
              className={`h-2 rounded-full transition-all ${
                i === currentStep ? 'w-6 bg-dark' : 'w-2 bg-dark/20'
              }`}
            />
          ))}
        </div>

        {/* Current step info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="text-center mb-4"
          >
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-muted">
              Step {currentStep + 1} of {steps.length}
            </p>
            <h3 className="text-xl font-black tracking-[-0.04em] mt-1">{steps[currentStep].label}</h3>
            <p className="text-sm font-semibold text-muted mt-0.5">{steps[currentStep].cue}</p>
          </motion.div>
        </AnimatePresence>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button onClick={resetSteps} className="tap grid h-10 w-10 place-items-center rounded-full bg-dark/8">
            <RotateCcw className="h-4 w-4 text-muted" />
          </button>
          <button
            onClick={() => { setPlaying(!playing); setAutoPlay(!playing) }}
            className="tap grid h-14 w-14 place-items-center rounded-full bg-dark text-white shadow-[var(--shadow-lift)]"
          >
            {playing ? <Pause className="h-6 w-6" fill="currentColor" /> : <Play className="h-6 w-6" fill="currentColor" />}
          </button>
          <button onClick={nextStep} className="tap grid h-10 w-10 place-items-center rounded-full bg-dark/8">
            <SkipForward className="h-4 w-4 text-muted" />
          </button>
        </div>
      </div>

      {/* Start button */}
      <div className="px-5 safe-bottom pb-4">
        <Button fullWidth size="lg" onClick={onStartSession}>
          Start Exercise
        </Button>
      </div>
    </div>
  )
}
