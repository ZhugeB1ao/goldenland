'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'

type Props = {
  lat: number
  lng: number
  label: string
}

type Place = {
  id: string
  name: string
  lat: number
  lng: number
  distance: number
}

type Tab = {
  label: string
  icon: string
  query: string
  value: string
}

const TABS: Tab[] = [
  { label: 'Trường học', icon: '🏫', query: 'amenity=school', value: 'school' },
  { label: 'Siêu thị', icon: '🛒', query: 'shop=supermarket', value: 'supermarket' },
  { label: 'Công viên', icon: '🌳', query: 'leisure=park', value: 'park' },
  { label: 'Bệnh viện', icon: '🏥', query: 'amenity=hospital', value: 'hospital' },
  { label: 'Nhà hàng', icon: '🍜', query: 'amenity=restaurant', value: 'restaurant' },
]

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`
}

export default function PropertyLocationMap({ lat, lng, label }: Props) {
  const mapRootRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const baseLayerRef = useRef<any>(null)
  const nearbyLayerRef = useRef<any>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [places, setPlaces] = useState<Place[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState(false)

  useEffect(() => {
    if (!mapRootRef.current || mapRef.current) return
    let cancelled = false

    import('leaflet').then((L) => {
      if (cancelled || !mapRootRef.current || mapRef.current) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRootRef.current, {
        zoomControl: true,
      }).setView([lat, lng], 15)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      const baseLayer = L.layerGroup().addTo(map)
      L.circle([lat, lng], {
        radius: 300,
        color: '#10b981',
        weight: 2,
        fillColor: '#34d399',
        fillOpacity: 0.2,
      })
        .addTo(baseLayer)
        .bindPopup('Vị trí hiển thị mang tính tham khảo')
      L.marker([lat, lng]).addTo(baseLayer).bindPopup(`<strong>${label}</strong><br/>Vị trí tham khảo`)

      mapRef.current = map
      baseLayerRef.current = baseLayer
      nearbyLayerRef.current = L.layerGroup().addTo(map)
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      baseLayerRef.current = null
      nearbyLayerRef.current = null
    }
  }, [lat, lng, label])

  useEffect(() => {
    const tab = TABS[activeTab]
    const [key, val] = tab.query.split('=')
    const controller = new AbortController()
    setLoadingPlaces(true)
    setPlaces([])

    const overpassQuery = `[out:json][timeout:10];
(
node["${key}"="${val}"](around:2000,${lat},${lng});
way["${key}"="${val}"](around:2000,${lat},${lng});
);
out center 8;`

    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        const results: Place[] = (data.elements || [])
          .map((el: any) => {
            const elLat = el.lat ?? el.center?.lat
            const elLng = el.lon ?? el.center?.lon
            if (!elLat || !elLng) return null
            return {
              id: String(el.id),
              name: el.tags?.name || el.tags?.['name:vi'] || 'Không rõ tên',
              lat: elLat,
              lng: elLng,
              distance: haversine(lat, lng, elLat, elLng),
            }
          })
          .filter(Boolean)
          .sort((a: Place, b: Place) => a.distance - b.distance)
          .slice(0, 8)

        setPlaces(results)
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return
        setPlaces([])
      })
      .finally(() => setLoadingPlaces(false))

    return () => controller.abort()
  }, [activeTab, lat, lng])

  useEffect(() => {
    if (!mapRef.current || !nearbyLayerRef.current) return

    import('leaflet').then((L) => {
      if (!mapRef.current || !nearbyLayerRef.current) return

      nearbyLayerRef.current.clearLayers()
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#10b981;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.3)">${TABS[activeTab].icon}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
      places.forEach((place) => {
        L.marker([place.lat, place.lng], { icon })
          .addTo(nearbyLayerRef.current)
          .bindPopup(place.name)
      })
    })
  }, [places, activeTab])

  return (
    <div>
      <div className="w-full rounded-xl overflow-hidden shadow-sm bg-surface-container" style={{ height: 400 }}>
        <div ref={mapRootRef} className="h-full w-full" />
      </div>

      <div className="flex gap-1 mt-4 overflow-x-auto">
        {TABS.map((tab, index) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(index)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              activeTab === index
                ? 'bg-emerald-600 text-white'
                : 'bg-surface-container-lowest border border-outline-variant/30 text-on-secondary-container hover:border-emerald-400 hover:text-emerald-600'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-3 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/15">
        {loadingPlaces ? (
          <div className="p-6 text-center text-sm text-on-secondary-container animate-pulse">Đang tải...</div>
        ) : places.length === 0 ? (
          <div className="p-6 text-center text-sm text-on-secondary-container">Không tìm thấy trong vòng 2 km</div>
        ) : (
          places.map((place, index) => {
            const mins = Math.ceil(place.distance / 80)
            return (
              <div
                key={place.id}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  index < places.length - 1 ? 'border-b border-outline-variant/20' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">{TABS[activeTab].icon}</span>
                  <span className="font-medium text-on-surface truncate">{place.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4 text-on-secondary-container">
                  <span>{formatDist(place.distance)}</span>
                  <span className="text-outline">|</span>
                  <span>🚶 {mins} phút</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
