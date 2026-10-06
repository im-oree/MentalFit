import { FilesetResolver, PoseLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision'
import { OneEuroFilter } from './oneEuroFilter'

const base = import.meta.env.BASE_URL

export type SmoothedLandmark = { x: number; y: number; visibility: number }

export async function createPoseLandmarker(): Promise<PoseLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(`${base}mediapipe/wasm`)
  const options = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: `${base}mediapipe/models/pose_landmarker_full.task`, delegate },
    runningMode: 'VIDEO' as const,
    numPoses: 1,
    minPoseDetectionConfidence: 0.6,
    minPosePresenceConfidence: 0.6,
    minTrackingConfidence: 0.6,
  })
  try {
    return await PoseLandmarker.createFromOptions(fileset, options('GPU'))
  } catch {
    return PoseLandmarker.createFromOptions(fileset, options('CPU'))
  }
}

export class LandmarkSmoother {
  private filters: { x: OneEuroFilter; y: OneEuroFilter; v: OneEuroFilter }[] = []

  smooth(landmarks: NormalizedLandmark[], timestampMs: number): SmoothedLandmark[] {
    if (this.filters.length !== landmarks.length) {
      this.filters = landmarks.map(() => ({
        x: new OneEuroFilter(1.2, 0.05),
        y: new OneEuroFilter(1.2, 0.05),
        v: new OneEuroFilter(2.0, 0),
      }))
    }
    return landmarks.map((l, i) => ({
      x: this.filters[i].x.filter(l.x, timestampMs),
      y: this.filters[i].y.filter(l.y, timestampMs),
      visibility: this.filters[i].v.filter(l.visibility ?? 1, timestampMs),
    }))
  }

  reset() {
    this.filters.forEach((f) => {
      f.x.reset()
      f.y.reset()
      f.v.reset()
    })
  }
}
