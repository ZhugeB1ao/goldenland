'use client'

import { useEffect, useState } from 'react'
import type { FormData } from '../page'

type Province = { code: string; name: string }
type Ward = { code: string; name: string }
type ProjectOption = {
  id: string
  name: string
  provinceCode?: string | null
  wardCode?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
}

type Props = {
  data: FormData
  onChange: (field: keyof FormData, value: string | number | null) => void
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
    />
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
    />
  )
}

export default function Step3Location({ data, onChange }: Props) {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(true)
  const [loadingWards, setLoadingWards] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)

  useEffect(() => {
    fetch('/api/divisions/provinces')
      .then((r) => r.json())
      .then(setProvinces)
      .catch(() => {})
      .finally(() => setLoadingProvinces(false))
  }, [])

  useEffect(() => {
    if (!data.provinceCode) {
      setWards([])
      return
    }
    setLoadingWards(true)
    fetch(`/api/divisions/wards/${data.provinceCode}`)
      .then((r) => r.json())
      .then(setWards)
      .catch(() => setWards([]))
      .finally(() => setLoadingWards(false))
  }, [data.provinceCode])

  useEffect(() => {
    setLoadingProjects(true)
    const params = new URLSearchParams()
    params.set('depth', '0')
    params.set('limit', '100')
    params.set('sort', 'name')

    if (data.provinceCode && data.wardCode) {
      params.set('where[and][0][provinceCode][equals]', data.provinceCode)
      params.set('where[and][1][wardCode][equals]', data.wardCode)
    } else if (data.provinceCode) {
      params.set('where[provinceCode][equals]', data.provinceCode)
    }

    fetch(`/api/projects?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        const docs: any[] = Array.isArray(res?.docs) ? res.docs : []
        const mapped: ProjectOption[] = docs.map((project) => ({
          id: String(project.id),
          name: String(project.name || ''),
          provinceCode: typeof project.provinceCode === 'string' ? project.provinceCode : null,
          wardCode: typeof project.wardCode === 'string' ? project.wardCode : null,
          address: typeof project.address === 'string' ? project.address : null,
          latitude: typeof project.latitude === 'number' ? project.latitude : null,
          longitude: typeof project.longitude === 'number' ? project.longitude : null,
        }))
        setProjects(mapped)

        if (data.project && !mapped.some((item) => item.id === data.project)) {
          onChange('project', '')
        }
      })
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false))
  }, [data.provinceCode, data.wardCode, data.project])

  useEffect(() => {
    if (data.project) return
    if (!data.street.trim() || !data.provinceCode || !data.wardCode) return

    const provinceName = provinces.find((p) => p.code === data.provinceCode)?.name || ''
    const wardName = wards.find((w) => w.code === data.wardCode)?.name || ''
    const query = [data.street.trim(), wardName, provinceName, 'Việt Nam'].filter(Boolean).join(', ')

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          format: 'json',
          limit: '1',
          countrycodes: 'vn',
          q: query,
        })

        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`)
        const dataRes = await res.json()
        const first = Array.isArray(dataRes) ? dataRes[0] : null
        const lat = first?.lat ? Number(first.lat) : null
        const lng = first?.lon ? Number(first.lon) : null

        onChange('latitude', Number.isFinite(lat as number) ? lat : null)
        onChange('longitude', Number.isFinite(lng as number) ? lng : null)
      } catch {
        onChange('latitude', null)
        onChange('longitude', null)
      }
    }, 700)

    return () => window.clearTimeout(timer)
  }, [data.project, data.street, data.provinceCode, data.wardCode, provinces, wards])

  const handleProvinceChange = (code: string) => {
    onChange('provinceCode', code)
    onChange('wardCode', '')
    onChange('latitude', null)
    onChange('longitude', null)
  }

  const handleWardChange = (code: string) => {
    onChange('wardCode', code)
    onChange('latitude', null)
    onChange('longitude', null)
  }

  const handleStreetChange = (value: string) => onChange('street', value)

  const handleProjectChange = (projectId: string) => {
    onChange('project', projectId)
    if (!projectId) return

    const project = projects.find((item) => item.id === projectId)
    if (!project) return

    if (project.provinceCode) onChange('provinceCode', project.provinceCode)
    if (project.wardCode) onChange('wardCode', project.wardCode)
    onChange('address', project.address || '')
    if (typeof project.latitude === 'number') onChange('latitude', project.latitude)
    if (typeof project.longitude === 'number') onChange('longitude', project.longitude)
    if (!data.propertyType) onChange('propertyType', 'apartment')
  }

  const mapLat = typeof data.latitude === 'number' ? data.latitude : null
  const mapLng = typeof data.longitude === 'number' ? data.longitude : null

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label required>Tỉnh / Thành phố</Label>
          <Select
            value={data.provinceCode}
            onChange={(e) => handleProvinceChange(e.target.value)}
            disabled={loadingProvinces}
          >
            <option value="">{loadingProvinces ? 'Đang tải...' : '-- Chọn tỉnh/thành --'}</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Phường / Xã</Label>
          <Select
            value={data.wardCode}
            onChange={(e) => handleWardChange(e.target.value)}
            disabled={!data.provinceCode || loadingWards}
          >
            <option value="">
              {loadingWards ? 'Đang tải...' : !data.provinceCode ? '-- Chọn tỉnh trước --' : '-- Chọn phường/xã --'}
            </option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>{w.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label>Dự án (nếu có)</Label>
        <Select
          value={data.project}
          onChange={(e) => handleProjectChange(e.target.value)}
          disabled={loadingProjects}
        >
          <option value="">
            {loadingProjects ? 'Đang tải dự án...' : '-- Không thuộc dự án --'}
          </option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
        <p className="text-xs text-gray-400 mt-1">
          {!data.provinceCode
            ? 'Đang hiển thị toàn bộ dự án.'
            : !data.wardCode
              ? 'Đang hiển thị dự án theo tỉnh/thành đã chọn.'
              : 'Đang hiển thị dự án theo tỉnh/thành và phường/xã đã chọn.'}
        </p>
      </div>

      <div>
        <Label>Tên đường</Label>
        <Input
          type="text"
          maxLength={255}
          placeholder="VD: Nguyễn Trãi"
          value={data.street}
          onChange={(e) => handleStreetChange(e.target.value)}
          disabled={Boolean(data.project)}
        />
      </div>

      <div>
        <Label>Địa chỉ công khai</Label>
        <Input
          type="text"
          maxLength={500}
          placeholder="VD: Số 12, hẻm 45 Nguyễn Trãi"
          value={data.address}
          onChange={(e) => onChange('address', e.target.value)}
          disabled={Boolean(data.project)}
        />
        {data.project ? (
          <p className="text-xs text-gray-400 mt-1">Địa chỉ được lấy theo dự án đã chọn.</p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">Địa chỉ này sẽ hiển thị công khai trên tin đăng.</p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="text-sm font-medium text-gray-700 mb-2">Vị trí xem trước</div>
        {mapLat !== null && mapLng !== null ? (
          <div className="space-y-2">
            <iframe
              title="map-preview"
              src={`https://maps.google.com/maps?q=${mapLat},${mapLng}&z=15&output=embed`}
              className="h-56 w-full rounded-lg border-0"
              loading="lazy"
            />
            <p className="text-xs text-gray-500">
              Tọa độ: {mapLat.toFixed(6)}, {mapLng.toFixed(6)}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Chọn dự án hoặc nhập đủ đường + phường + tỉnh để hệ thống ước lượng vị trí bản đồ.
          </p>
        )}
      </div>
    </div>
  )
}
