import { useEffect, useRef, useState } from 'react'
import type { SmoothedLandmark } from '../pose/poseTracker'
import type { DetectionResult } from '../detection/types'
import { createDetector } from '../detection/detectorFactory'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

const EMPTY: DetectionResult = {
  repCount: 0,
  phase: '',
  formScore: 100,
  feedback: null,
  repCompleted: false,
  elapsed: 0,
}

export function useExerciseDetection(
  detectorId: string,
  landmarksRef: React.MutableRefObject<SmoothedLandmark[] | null>,
  active: boolean,
  hapticEnabled: boolean,
) {
  const [result, setResult] = useState<DetectionResult>(EMPTY)
  const detectorRef = useRef(createDetector(detectorId))
  const prevReps = useRef(0)

  useEffect(() => {
    detectorRef.current = createDetector(detectorId)
    prevReps.current = 0
    setResult(EMPTY)
  }, [detectorId])

  useEffect(() => {
    if (!active || !detectorRef.current) return
    let running = true

    const tick = () => {
      if (!running) return
      const lm = landmarksRef.current
      if (lm && detectorRef.current) {
        const r = detectorRef.current.update(lm)
        setResult(r)
        if (r.repCompleted && r.repCount > prevReps.current) {
          prevReps.current = r.repCount
          if (hapticEnabled) {
            Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {})
          }
        }
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    return () => { running = false }
  }, [active, landmarksRef, hapticEnabled])

  return result
}
