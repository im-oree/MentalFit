import { useCallback, useEffect, useRef, useState } from 'react'
import { Geolocation } from '@capacitor/geolocation'

interface GeoPoint {
  lat: number
  lng: number
  timestamp: number
}

interface GPSState {
  tracking: boolean
  distance: number
  duration: number
  pace: number
  route: GeoPoint[]
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

export function useGPS() {
  const [state, setState] = useState<GPSState>({
    tracking: false,
    distance: 0,
    duration: 0,
    pace: 0,
    route: [],
    error: null,
  })

  const watchIdRef = useRef<string | null>(null)
  const startTimeRef = useRef(0)
  const timerRef = useRef(0)

  const start = useCallback(async () => {
    try {
      const perm = await Geolocation.requestPermissions()
      if (perm.location !== 'granted') {
        setState((s) => ({ ...s, error: 'Location permission denied' }))
        return
      }

      startTimeRef.current = Date.now()
      setState({ tracking: true, distance: 0, duration: 0, pace: 0, route: [], error: null })

      timerRef.current = window.setInterval(() => {
        setState((s) => ({
          ...s,
          duration: (Date.now() - startTimeRef.current) / 1000,
        }))
      }, 1000)

      const id = await Geolocation.watchPosition({ enableHighAccuracy: true }, (pos, err) => {
        if (err || !pos) return
        const point: GeoPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: pos.timestamp,
        }
        setState((prev) => {
          const route = [...prev.route, point]
          let distance = prev.distance
          if (route.length >= 2) {
            const last = route[route.length - 2]
            const d = haversineMeters(last, point)
            if (d > 2 && d < 100) distance += d
          }
          const durationMin = (Date.now() - startTimeRef.current) / 60000
          const distKm = distance / 1000
          const pace = distKm > 0.01 ? durationMin / distKm : 0
          return { ...prev, route, distance, pace }
        })
      })
      watchIdRef.current = id
    } catch {
      setState((s) => ({ ...s, error: 'Could not start GPS tracking' }))
    }
  }, [])

  const stop = useCallback(() => {
    if (watchIdRef.current) {
      Geolocation.clearWatch({ id: watchIdRef.current })
      watchIdRef.current = null
    }
    clearInterval(timerRef.current)
    setState((s) => ({ ...s, tracking: false }))
  }, [])

  useEffect(() => {
    return () => {
      if (watchIdRef.current) Geolocation.clearWatch({ id: watchIdRef.current })
      clearInterval(timerRef.current)
    }
  }, [])

  return { ...state, start, stop }
}
