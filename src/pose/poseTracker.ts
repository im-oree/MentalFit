import { FilesetResolver, PoseLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision'
import { OneEuroFilter } from './oneEuroFilter'

const base = import.meta.env.BASE_URL

export type PoseModel = 'lite' | 'full' | 'heavy'
export type Delegate = 'GPU' | 'CPU'
export type SmoothedLandmark = { x: number; y: number; visibility: number }

let filesetPromise: ReturnType<typeof FilesetResolver.forVisionTasks> | null = null

export async function createPoseLandmarker(model: PoseModel) {
  filesetPromise ??= FilesetResolver.forVisionTasks(`${base}mediapipe/wasm`)
  const fileset = await filesetPromise
  const options = (delegate: Delegate) => ({
    baseOptions: { modelAssetPath: `${base}mediapipe/models/pose_landmarker_${model}.task`, delegate },
    runningMode: 'VIDEO' as const,
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })
  try {
    return { landmarker: await PoseLandmarker.createFromOptions(fileset, options('GPU')), delegate: 'GPU' as Delegate }
  } catch {
    return { landmarker: await PoseLandmarker.createFromOptions(fileset, options('CPU')), delegate: 'CPU' as Delegate }
  }
}

// Coordinates are normalized (0–1), so speeds are ~1/s; beta is scaled to match.
const MIN_CUTOFF = 1.0
const BETA = 8

export class LandmarkSmoother {
  private filters: { x: OneEuroFilter; y: OneEuroFilter; v: OneEuroFilter }[] = []

  smooth(landmarks: NormalizedLandmark[], timestampMs: number): SmoothedLandmark[] {
    if (this.filters.length !== landmarks.length) {
      this.filters = landmarks.map(() => ({
        x: new OneEuroFilter(MIN_CUTOFF, BETA),
        y: new OneEuroFilter(MIN_CUTOFF, BETA),
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
