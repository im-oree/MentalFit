import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { GeoPoint } from '../hooks/useGPS'

interface RunMapProps {
  route: GeoPoint[]
  currentPosition: GeoPoint | null
  interactive?: boolean
  className?: string
}

const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'openfreemap': {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
    },
  },
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#131110' },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'openfreemap',
      'source-layer': 'water',
      paint: { 'fill-color': '#1a1816' },
    },
    {
      id: 'landuse-park',
      type: 'fill',
      source: 'openfreemap',
      'source-layer': 'landuse',
      filter: ['==', 'class', 'park'],
      paint: { 'fill-color': '#1c1a15' },
    },
    {
      id: 'roads-minor',
      type: 'line',
      source: 'openfreemap',
      'source-layer': 'transportation',
      filter: ['all', ['!=', 'class', 'motorway'], ['!=', 'class', 'trunk']],
      paint: {
        'line-color': '#201e19',
        'line-width': 1,
      },
    },
    {
      id: 'roads-major',
      type: 'line',
      source: 'openfreemap',
      'source-layer': 'transportation',
      filter: ['any', ['==', 'class', 'motorway'], ['==', 'class', 'trunk'], ['==', 'class', 'primary']],
      paint: {
        'line-color': '#2a2721',
        'line-width': 2,
      },
    },
    {
      id: 'buildings',
      type: 'fill',
      source: 'openfreemap',
      'source-layer': 'building',
      paint: {
        'fill-color': '#1a1816',
        'fill-opacity': 0.6,
      },
    },
  ],
}

export function RunMap({ route, currentPosition, interactive = false, className = '' }: RunMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: currentPosition ? [currentPosition.lng, currentPosition.lat] : [3.3792, 6.5244],
      zoom: 16,
      attributionControl: false,
      interactive,
    })

    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
      })

      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#d9c395',
          'line-width': 8,
          'line-opacity': 0.3,
          'line-blur': 6,
        },
      })

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#d9c395',
          'line-width': 3,
          'line-opacity': 0.9,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      })
    })

    mapRef.current = map

    const el = document.createElement('div')
    el.style.cssText = 'width:14px;height:14px;background:#d9c395;border-radius:50%;border:3px solid #131110;box-shadow:0 0 12px #d9c39580;'
    markerRef.current = new maplibregl.Marker({ element: el }).setLngLat([0, 0]).addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [interactive])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const coords = route.map((p) => [p.lng, p.lat] as [number, number])
    const src = map.getSource('route') as maplibregl.GeoJSONSource | undefined
    if (src) {
      src.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: {},
      })
    }

    if (currentPosition) {
      const lngLat: [number, number] = [currentPosition.lng, currentPosition.lat]
      markerRef.current?.setLngLat(lngLat)
      map.easeTo({ center: lngLat, duration: 500 })
    }
  }, [route, currentPosition])

  return <div ref={containerRef} className={`w-full h-full ${className}`} />
}
