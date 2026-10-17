import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'checking' | 'prompt' | 'requesting' | 'live' | 'denied' | 'unavailable'
export type Facing = 'user' | 'environment'

const TIMEOUT_MS = 12000

const withTimeout = <T,>(p: Promise<T>, label: string) =>
  Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new DOMException(`${label} timed out`, 'TimeoutError')), TIMEOUT_MS),
    ),
  ])

async function openStream(mode: Facing) {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
    })
  } catch (err) {
    if ((err as DOMException).name !== 'OverconstrainedError') throw err
    return navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: mode } })
  }
}

// Resolves once frames are flowing; play() alone can stay pending forever on iOS.
function attach(video: HTMLVideoElement, stream: MediaStream) {
  video.muted = true
  video.playsInline = true
  video.setAttribute('playsinline', '')
  video.setAttribute('muted', '')
  video.srcObject = stream
  return new Promise<void>((resolve) => {
    const done = () => {
      video.removeEventListener('loadeddata', done)
      resolve()
    }
    if (video.readyState >= 2) return resolve()
    video.addEventListener('loadeddata', done)
    video.play().catch(() => {})
  })
}

export function useCamera(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [status, setStatus] = useState<CameraStatus>('checking')
  const [facing, setFacing] = useState<Facing>('user')
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const requestId = useRef(0)

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const start = useCallback(
    async (mode: Facing) => {
      const id = ++requestId.current
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(window.isSecureContext ? 'Camera API not available' : 'Page is not served over HTTPS')
        setStatus('unavailable')
        return
      }
      setError(null)
      setStatus('requesting')
      stop()
      try {
        const stream = await withTimeout(openStream(mode), 'Camera request')
        if (id !== requestId.current) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) throw new DOMException('Video element missing', 'AbortError')
        await withTimeout(attach(video, stream), 'Camera start')
        if (id !== requestId.current) return
        setFacing(mode)
        setStatus('live')
      } catch (err) {
        if (id !== requestId.current) return
        const e = err as DOMException
        stop()
        setError(`${e.name}: ${e.message}`)
        setStatus(e.name === 'NotAllowedError' || e.name === 'SecurityError' ? 'denied' : 'unavailable')
      }
    },
    [videoRef],
  )

  useEffect(() => {
    let cancelled = false
    const query = navigator.permissions?.query({ name: 'camera' as PermissionName }) ?? Promise.reject()
    query
      .then((p) => {
        if (cancelled) return
        if (p.state === 'granted') start('user')
        else setStatus(p.state === 'denied' ? 'denied' : 'prompt')
      })
      .catch(() => !cancelled && setStatus('prompt'))
    return () => {
      cancelled = true
      requestId.current++
      stop()
    }
  }, [start])

  return {
    status,
    facing,
    error,
    request: () => start(facing),
    flip: () => start(facing === 'user' ? 'environment' : 'user'),
  }
}
