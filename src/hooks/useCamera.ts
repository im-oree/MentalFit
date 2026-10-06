import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'checking' | 'prompt' | 'requesting' | 'live' | 'denied' | 'unavailable'
export type Facing = 'user' | 'environment'

export function useCamera(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [status, setStatus] = useState<CameraStatus>('checking')
  const [facing, setFacing] = useState<Facing>('user')
  const streamRef = useRef<MediaStream | null>(null)

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const start = useCallback(
    async (mode: Facing) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unavailable')
        return
      }
      setStatus('requesting')
      stop()
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        })
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play()
        }
        setFacing(mode)
        setStatus('live')
      } catch (err) {
        const name = (err as DOMException).name
        setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable')
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
      stop()
    }
  }, [start])

  return {
    status,
    facing,
    request: () => start(facing),
    flip: () => start(facing === 'user' ? 'environment' : 'user'),
  }
}
