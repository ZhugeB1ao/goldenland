'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'

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

export default function MapSection({ lat, lng, name }: { lat: number; lng: number; name: string }) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const nearbyLayerRef = useRef<any>(null)
    const [activeTab, setActiveTab] = useState(0)
    const [places, setPlaces] = useState<Place[]>([])
    const [loadingPlaces, setLoadingPlaces] = useState(false)

    // Init map
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return

        import('leaflet').then((L) => {
            // Fix default marker icons in webpack/Next.js
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            })

            const map = L.map(mapRef.current!).setView([lat, lng], 15)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
            }).addTo(map)

            L.marker([lat, lng])
                .addTo(map)
                .bindPopup(`<strong>${name}</strong>`)
                .openPopup()

            mapInstanceRef.current = map
            nearbyLayerRef.current = L.layerGroup().addTo(map)
        })

        return () => {
            mapInstanceRef.current?.remove()
            mapInstanceRef.current = null
        }
    }, [lat, lng, name])

    // Fetch nearby places on tab change
    useEffect(() => {
        const tab = TABS[activeTab]
        setLoadingPlaces(true)
        setPlaces([])

        const [key, val] = tab.query.split('=')
        const overpassQuery = `[out:json][timeout:10];
        (
        node["${key}"="${val}"](around:2000,${lat},${lng});
        way["${key}"="${val}"](around:2000,${lat},${lng});
        );
        out center 8;`

        fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery,
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

                // Update nearby markers on map
                import('leaflet').then((L) => {
                    nearbyLayerRef.current?.clearLayers()
                    const icon = L.divIcon({
                        className: '',
                        html: `<div style="background:#10b981;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.3)">${tab.icon}</div>`,
                        iconSize: [28, 28],
                        iconAnchor: [14, 14],
                    })
                    results.forEach((p) => {
                        L.marker([p.lat, p.lng], { icon })
                            .addTo(nearbyLayerRef.current)
                            .bindPopup(p.name)
                    })
                })
            })
            .catch(() => setPlaces([]))
            .finally(() => setLoadingPlaces(false))
            
    }, [activeTab, lat, lng])

    return (
        <div>
            {/* Map */}
            <div className="w-full rounded-xl overflow-hidden shadow-sm" style={{ height: 400 }}>
                <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 overflow-x-auto">
                {TABS.map((tab, i) => (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => setActiveTab(i)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                            activeTab === i
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-600'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Place list */}
            <div className="mt-3 bg-white rounded-xl shadow-sm overflow-hidden">
                {loadingPlaces ? (
                    <div className="p-6 text-center text-sm text-gray-400 animate-pulse">Đang tải...</div>
                ) : places.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400">Không tìm thấy trong vòng 2 km</div>
                ) : (
                    places.map((p, i) => {
                        const mins = Math.ceil(p.distance / 80)
                        return (
                            <div
                                key={p.id}
                                className={`flex items-center justify-between px-4 py-3 text-sm ${i < places.length - 1 ? 'border-b border-gray-100' : ''}`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-base flex-shrink-0">{TABS[activeTab].icon}</span>
                                    <span className="font-medium text-gray-800 truncate">{p.name}</span>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0 ml-4 text-gray-500">
                                    <span>{formatDist(p.distance)}</span>
                                    <span className="text-gray-300">|</span>
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
