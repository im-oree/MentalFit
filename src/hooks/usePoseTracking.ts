import { useEffect, useRef, useState } from 'react'
import type { PoseLandmarker } from '@mediapipe/tasks-vision'
import { createPoseLandmarker, LandmarkSmoother } from '../pose/poseTracker'
import { drawSkeleton } from '../pose/drawSkeleton'

export type TrackingState = 'loading' | 'searching' | 'tracking' | 'error'

export function usePoseTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  { active, showSkeleton }: { active: boolean; showSkeleton: boolean },
) {
  const [state, setState] = useState<TrackingState>('loading')
  const [fps, setFps] = useState(0)
  const landmarkerRef = useRef<PoseLandmarker | null>(null)
  const showRef = useRef(showSkeleton)
  useEffect(() => {
    showRef.current = showSkeleton
  }, [showSkeleton])

  useEffect(() => {
    let disposed = false
    createPoseLandmarker()
      .then((lm) => {
        if (disposed) lm.close()
        else {
          landmarkerRef.current = lm
          setState('searching')
        }
      })
      .catch(() => !disposed && setState('error'))
    return () => {
      disposed = true
      landmarkerRef.current?.close()
      landmarkerRef.current = null
    }
  }, [])

  const ready = state !== 'loading' && state !== 'error'

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
    let fpsWindowStart = performance.now()
    let wasTracking = false

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      const { clientWidth: w, clientHeight: h } = canvas
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
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
        const now = performance.now()
        const result = landmarker.detectForVideo(video, now)
        const pose = result.landmarks[0]
        const smoothed = pose ? smoother.smooth(pose, now) : null
        if (!pose) smoother.reset()

        drawSkeleton(ctx, showRef.current ? smoothed : null, {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          width: canvas.clientWidth,
          height: canvas.clientHeight,
        })

        if (!!pose !== wasTracking) {
          wasTracking = !!pose
          setState(pose ? 'tracking' : 'searching')
        }
        frames++
        if (now - fpsWindowStart >= 1000) {
          setFps(Math.round((frames * 1000) / (now - fpsWindowStart)))
          frames = 0
          fpsWindowStart = now
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
    }
  }, [active, ready, videoRef, canvasRef])

  return { state, fps }
}
