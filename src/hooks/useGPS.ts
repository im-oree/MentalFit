import { useCallback, useEffect, useRef, useState } from 'react'
import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'
import { startStepCounter, type StepCounter } from '../sensors/stepCounter'

export interface GeoPoint {
  lat: number
  lng: number
  altitude: number | null
  speed: number | null
  accuracy: number
  timestamp: number
}

type Status = 'idle' | 'running' | 'paused' | 'stopped'

interface GPSState {
  status: Status
  distance: number
  duration: number
  pace: number
  speed: number
  steps: number
  cadence: number
  route: GeoPoint[]
  currentPosition: GeoPoint | null
  error: string | null
}

const MAX_ACCURACY_M = 25
const MAX_SPEED_MS = 12

function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

// Constant-position Kalman filter in degrees, weighted by reported accuracy.
class GeoKalman {
  private variance = -1
  private lat = 0
  private lng = 0
  private ts = 0

  filter(p: GeoPoint): GeoPoint {
    const acc = Math.max(p.accuracy, 1)
    if (this.variance < 0) {
      Object.assign(this, { lat: p.lat, lng: p.lng, ts: p.timestamp, variance: acc * acc })
      return p
    }
    const dt = Math.max(0, p.timestamp - this.ts) / 1000
    this.variance += dt * 3 * 3
    this.ts = p.timestamp
    const k = this.variance / (this.variance + acc * acc)
    this.lat += k * (p.lat - this.lat)
    this.lng += k * (p.lng - this.lng)
    this.variance *= 1 - k
    return { ...p, lat: this.lat, lng: this.lng }
  }
}

const isNative = Capacitor.isNativePlatform()

function toPoint(c: GeolocationCoordinates | { latitude: number; longitude: number; altitude: number | null; speed: number | null; accuracy: number }, timestamp: number): GeoPoint {
  return { lat: c.latitude, lng: c.longitude, altitude: c.altitude, speed: c.speed, accuracy: c.accuracy ?? 999, timestamp }
}

async function requestPermission() {
  if (!isNative) return true
  const perm = await Geolocation.requestPermissions()
  return perm.location === 'granted'
}

async function watch(cb: (p: GeoPoint) => void, onError: (msg: string) => void): Promise<() => void> {
  if (isNative) {
    const id = await Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }, (pos, err) => {
      if (err || !pos) return onError(err?.message ?? 'GPS error')
      cb(toPoint(pos.coords, pos.timestamp))
    })
    return () => Geolocation.clearWatch({ id })
  }
  if (!navigator.geolocation) throw new Error('Geolocation not available')
  const id = navigator.geolocation.watchPosition(
    (pos) => cb(toPoint(pos.coords, pos.timestamp)),
    (err) => onError(err.message),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  )
  return () => navigator.geolocation.clearWatch(id)
}

const INITIAL: GPSState = {
  status: 'idle', distance: 0, duration: 0, pace: 0, speed: 0, steps: 0, cadence: 0,
  route: [], currentPosition: null, error: null,
}

export function useGPS() {
  const [state, setState] = useState<GPSState>(INITIAL)

  const stopWatchRef = useRef<(() => void) | null>(null)
  const stepsRef = useRef<StepCounter | null>(null)
  const timerRef = useRef(0)
  const kalmanRef = useRef(new GeoKalman())
  const elapsedRef = useRef(0)
  const resumedAtRef = useRef(0)
  const statusRef = useRef<Status>('idle')

  const elapsed = () => elapsedRef.current + (statusRef.current === 'running' ? (Date.now() - resumedAtRef.current) / 1000 : 0)

  const onPoint = useCallback((raw: GeoPoint) => {
    const point = kalmanRef.current.filter(raw)
    setState((prev) => {
      if (statusRef.current !== 'running' || raw.accuracy > MAX_ACCURACY_M) return { ...prev, currentPosition: point }
      const last = prev.route[prev.route.length - 1]
      let distance = prev.distance
      if (last) {
        const d = haversineMeters(last, point)
        const dt = Math.max((point.timestamp - last.timestamp) / 1000, 0.001)
        if (d / dt > MAX_SPEED_MS) return { ...prev, currentPosition: point }
        if (d < Math.max(2, raw.accuracy * 0.25)) return { ...prev, currentPosition: point }
        distance += d
      }
      const km = distance / 1000
      const minutes = elapsed() / 60
      const pace = km > 0.02 ? minutes / km : 0
      const instant = raw.speed != null && raw.speed >= 0 ? raw.speed * 3.6 : prev.speed
      const speed = prev.speed * 0.7 + instant * 0.3
      return { ...prev, route: [...prev.route, point], distance, pace, speed, currentPosition: point }
    })
  }, [])

  const tick = useCallback(() => {
    setState((s) => ({ ...s, duration: elapsed(), steps: stepsRef.current?.steps ?? s.steps, cadence: stepsRef.current?.cadence ?? 0 }))
  }, [])

  const start = useCallback(async () => {
    try {
      if (!(await requestPermission())) {
        setState((s) => ({ ...s, error: 'Location permission denied' }))
        return
      }
      kalmanRef.current = new GeoKalman()
      elapsedRef.current = 0
      resumedAtRef.current = Date.now()
      statusRef.current = 'running'
      setState({ ...INITIAL, status: 'running' })
      stopWatchRef.current?.()
      stopWatchRef.current = await watch(onPoint, (msg) => setState((s) => ({ ...s, error: msg })))
      stepsRef.current = await startStepCounter()
      clearInterval(timerRef.current)
      timerRef.current = window.setInterval(tick, 500)
    } catch (e) {
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : 'Could not start GPS tracking' }))
    }
  }, [onPoint, tick])

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return
    elapsedRef.current = elapsed()
    statusRef.current = 'paused'
    stepsRef.current?.pause()
    setState((s) => ({ ...s, status: 'paused', duration: elapsedRef.current, speed: 0 }))
  }, [])

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return
    resumedAtRef.current = Date.now()
    statusRef.current = 'running'
    stepsRef.current?.resume()
    setState((s) => ({ ...s, status: 'running' }))
  }, [])

  const stop = useCallback(() => {
    elapsedRef.current = elapsed()
    statusRef.current = 'stopped'
    stopWatchRef.current?.()
    stopWatchRef.current = null
    stepsRef.current?.stop()
    clearInterval(timerRef.current)
    setState((s) => ({ ...s, status: 'stopped', duration: elapsedRef.current }))
  }, [])

  useEffect(() => {
    let cancelled = false
    let stopPreview: (() => void) | null = null
    watch(onPoint, () => {}).then((s) => { if (cancelled) s(); else stopPreview = s }).catch(() => {})
    return () => {
      cancelled = true
      stopPreview?.()
      stopWatchRef.current?.()
      stepsRef.current?.stop()
      clearInterval(timerRef.current)
    }
  }, [onPoint])

  return { ...state, tracking: state.status === 'running' || state.status === 'paused', start, pause, resume, stop }
}
