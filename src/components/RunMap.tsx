import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { GeoPoint } from '../hooks/useGPS'
import type { Feature, LineString } from 'geojson'

interface RunMapProps {
  route: GeoPoint[]
  currentPosition: GeoPoint | null
  follow?: boolean
  fitRoute?: boolean
  className?: string
}

const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark'

const cssVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

const emptyLine = (): Feature<LineString> => ({
  type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {},
})

export function RunMap({ route, currentPosition, follow = true, fitRoute = false, className = '' }: RunMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const readyRef = useRef(false)
  const centeredRef = useRef(false)
  const latest = useRef({ route, currentPosition })
  latest.current = { route, currentPosition }

  const sync = () => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    const { route, currentPosition } = latest.current
    const coords = route.map((p) => [p.lng, p.lat])
    ;(map.getSource('route') as maplibregl.GeoJSONSource | undefined)?.setData({ ...emptyLine(), geometry: { type: 'LineString', coordinates: coords } })

    if (fitRoute && coords.length > 1) {
      const bounds = coords.reduce((b, c) => b.extend(c as [number, number]), new maplibregl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number]))
      map.fitBounds(bounds, { padding: 48, duration: 0 })
    }

    if (currentPosition) {
      const ll: [number, number] = [currentPosition.lng, currentPosition.lat]
      markerRef.current?.setLngLat(ll).addTo(map)
      if (!centeredRef.current) {
        map.jumpTo({ center: ll, zoom: 16.5 })
        centeredRef.current = true
      } else if (follow) {
        map.easeTo({ center: ll, duration: 600 })
      }
    }
  }

  useEffect(() => {
    if (!containerRef.current) return
    const gold = cssVar('--color-accent-gold', '#d9c395')
    const bg = cssVar('--color-dark-soft', '#15130f')

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [0, 20],
      zoom: 1.5,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    })
    mapRef.current = map

    map.on('load', () => {
      if (map.getLayer('background')) map.setPaintProperty('background', 'background-color', bg)
      map.addSource('route', { type: 'geojson', data: emptyLine() })
      map.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': gold, 'line-width': 12, 'line-opacity': 0.25, 'line-blur': 6 } })
      map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': gold, 'line-width': 4 } })
      readyRef.current = true
      sync()
    })

    const el = document.createElement('div')
    el.className = 'h-4 w-4 rounded-full bg-accent-gold ring-4 ring-dark-soft shadow-[0_0_16px_var(--color-accent-gold)]'
    markerRef.current = new maplibregl.Marker({ element: el })

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      readyRef.current = false
      centeredRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(sync, [route, currentPosition, follow, fitRoute])

  return <div ref={containerRef} className={`absolute inset-0 ${className}`} />
}
