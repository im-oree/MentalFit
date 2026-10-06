import { useEffect, useRef, useState } from 'react'
import type { PoseLandmarker } from '@mediapipe/tasks-vision'
import { createPoseLandmarker, LandmarkSmoother, type Delegate, type PoseModel } from '../pose/poseTracker'
import { drawSkeleton } from '../pose/drawSkeleton'

export type TrackingState = 'loading' | 'searching' | 'tracking' | 'error'

export type TrackingStats = {
  fps: number
  inferenceMs: number
  delegate: Delegate | null
  input: string
}

const EMPTY_STATS = { fps: 0, inferenceMs: 0, input: '–' }

export function usePoseTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  { active, showSkeleton, model }: { active: boolean; showSkeleton: boolean; model: PoseModel },
) {
  const [loaded, setLoaded] = useState<{ model: PoseModel; delegate: Delegate } | null>(null)
  const [failed, setFailed] = useState<PoseModel | null>(null)
  const [tracking, setTracking] = useState(false)
  const [stats, setStats] = useState(EMPTY_STATS)
  const landmarkerRef = useRef<PoseLandmarker | null>(null)
  const showRef = useRef(showSkeleton)
  useEffect(() => {
    showRef.current = showSkeleton
  }, [showSkeleton])

  useEffect(() => {
    let disposed = false
    createPoseLandmarker(model)
      .then(({ landmarker, delegate }) => {
        if (disposed) return landmarker.close()
        landmarkerRef.current = landmarker
        setLoaded({ model, delegate })
      })
      .catch(() => !disposed && setFailed(model))
    return () => {
      disposed = true
      landmarkerRef.current?.close()
      landmarkerRef.current = null
    }
  }, [model])

  const ready = loaded?.model === model

  useEffect(() => {
    if (!active || !ready) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!video || !canvas || !ctx) return

    const smoother = new LandmarkSmoother()
    let running = true
    let handle = 0
    let lastVideoTime = -1
    let frames = 0
    let inferTotal = 0
    let windowStart = performance.now()
    let wasTracking = false

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(canvas.clientWidth * dpr)
      canvas.height = Math.round(canvas.clientHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const useVfc = 'requestVideoFrameCallback' in video
    const schedule = () => {
      if (!running) return
      handle = useVfc ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick)
    }

    const tick = () => {
      const landmarker = landmarkerRef.current
      if (!running || !landmarker) return
      if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime
        const t0 = performance.now()
        const pose = landmarker.detectForVideo(video, t0).landmarks[0]
        const t1 = performance.now()
        const smoothed = pose ? smoother.smooth(pose, t0) : null
        if (!pose) smoother.reset()

        drawSkeleton(ctx, showRef.current ? smoothed : null, {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          width: canvas.clientWidth,
          height: canvas.clientHeight,
        })

        if (!!pose !== wasTracking) {
          wasTracking = !!pose
          setTracking(wasTracking)
        }
        frames++
        inferTotal += t1 - t0
        if (t1 - windowStart >= 1000) {
          setStats({
            fps: Math.round((frames * 1000) / (t1 - windowStart)),
            inferenceMs: Math.round(inferTotal / frames),
            input: `${video.videoWidth}×${video.videoHeight}`,
          })
          frames = 0
          inferTotal = 0
          windowStart = t1
        }
      }
      schedule()
    }
    schedule()

    return () => {
      running = false
      ro.disconnect()
      if (useVfc) video.cancelVideoFrameCallback(handle)
      else cancelAnimationFrame(handle)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setTracking(false)
    }
  }, [active, ready, videoRef, canvasRef])

  const state: TrackingState = failed === model ? 'error' : !ready ? 'loading' : tracking ? 'tracking' : 'searching'
  const fullStats: TrackingStats = { ...stats, delegate: loaded?.delegate ?? null }
  return { state, stats: fullStats }
}
