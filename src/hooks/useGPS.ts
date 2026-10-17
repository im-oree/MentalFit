import { useCallback, useEffect, useRef, useState } from 'react'
import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'

export interface GeoPoint {
  lat: number
  lng: number
  altitude: number | null
  speed: number | null
  accuracy: number
  timestamp: number
}

interface GPSState {
  tracking: boolean
  distance: number
  duration: number
  pace: number
  speed: number
  route: GeoPoint[]
  currentPosition: GeoPoint | null
  error: string | null
}

function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function useNativeGeo() {
  const isNative = Capacitor.isNativePlatform()

  const requestPermission = async () => {
    if (isNative) {
      const perm = await Geolocation.requestPermissions()
      return perm.location === 'granted'
    }
    return true
  }

  const watchPosition = async (
    cb: (point: GeoPoint) => void,
    onError: (msg: string) => void,
  ): Promise<string | number> => {
    if (isNative) {
      return Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000 },
        (pos, err) => {
          if (err || !pos) {
            onError(err?.message ?? 'GPS error')
            return
          }
          cb({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            accuracy: pos.coords.accuracy ?? 999,
            timestamp: pos.timestamp,
          })
        },
      )
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not available'))
        return
      }
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          cb({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          })
        },
        (err) => onError(err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      )
      resolve(id)
    })
  }

  const clearWatch = (id: string | number) => {
    if (isNative) {
      Geolocation.clearWatch({ id: id as string })
    } else {
      navigator.geolocation.clearWatch(id as number)
    }
  }

  return { requestPermission, watchPosition, clearWatch }
}

export function useGPS() {
  const [state, setState] = useState<GPSState>({
    tracking: false,
    distance: 0,
    duration: 0,
    pace: 0,
    speed: 0,
    route: [],
    currentPosition: null,
    error: null,
  })

  const geo = useNativeGeo()
  const watchIdRef = useRef<string | number | null>(null)
  const startTimeRef = useRef(0)
  const timerRef = useRef(0)

  const start = useCallback(async () => {
    try {
      const granted = await geo.requestPermission()
      if (!granted) {
        setState((s) => ({ ...s, error: 'Location permission denied' }))
        return
      }

      startTimeRef.current = Date.now()
      setState({
        tracking: true,
        distance: 0,
        duration: 0,
        pace: 0,
        speed: 0,
        route: [],
        currentPosition: null,
        error: null,
      })

      timerRef.current = window.setInterval(() => {
        setState((s) => ({
          ...s,
          duration: (Date.now() - startTimeRef.current) / 1000,
        }))
      }, 1000)

      const id = await geo.watchPosition(
        (point) => {
          if (point.accuracy > 30) return

          setState((prev) => {
            const route = [...prev.route, point]
            let distance = prev.distance
            if (route.length >= 2) {
              const last = route[route.length - 2]
              const d = haversineMeters(last, point)
              if (d > 1.5 && d < 150) distance += d
            }
            const durationMin = (Date.now() - startTimeRef.current) / 60000
            const distKm = distance / 1000
            const pace = distKm > 0.01 ? durationMin / distKm : 0
            const speed = point.speed != null && point.speed >= 0
              ? point.speed * 3.6
              : distKm > 0.01 ? 60 / pace : 0

            return { ...prev, route, distance, pace, speed, currentPosition: point }
          })
        },
        (msg) => setState((s) => ({ ...s, error: msg })),
      )
      watchIdRef.current = id
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Could not start GPS tracking',
      }))
    }
  }, [geo])

  const stop = useCallback(() => {
    if (watchIdRef.current != null) {
      geo.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    clearInterval(timerRef.current)
    setState((s) => ({ ...s, tracking: false }))
  }, [geo])

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) geo.clearWatch(watchIdRef.current)
      clearInterval(timerRef.current)
    }
  }, [geo])

  return { ...state, start, stop }
}
