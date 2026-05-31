'use client'

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { PostDraft } from './postFlowTypes'

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

type PostPopUp1Props = {
  draft: PostDraft
  onChange: Dispatch<SetStateAction<PostDraft>>
  onClose: () => void
  onNext: () => void
}

const PROPERTY_TYPES = [
  { value: 'house', label: 'Nhà riêng' },
  { value: 'apartment', label: 'Căn hộ' },
  { value: 'land', label: 'Đất' },
  { value: 'villa', label: 'Biệt thự' },
  { value: 'townhouse', label: 'Nhà phố' },
  { value: 'shophouse', label: 'Shophouse' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'condotel', label: 'Condotel' },
  { value: 'warehouse', label: 'Kho xưởng' },
  { value: 'commercial', label: 'Thương mại' },
]

const LEGAL_STATUSES = [
  { value: 'red_book', label: 'Sổ đỏ / Sổ hồng' },
  { value: 'sale_contract', label: 'Hợp đồng mua bán' },
  { value: 'pending', label: 'Đang chờ sổ' },
  { value: 'other', label: 'Giấy tờ khác' },
]

const FURNITURE_STATUSES = [
  { value: 'luxury', label: 'Nội thất cao cấp' },
  { value: 'full', label: 'Đầy đủ nội thất' },
  { value: 'basic', label: 'Nội thất cơ bản' },
  { value: 'none', label: 'Không nội thất' },
]

const DIRECTIONS = [
  { value: 'east', label: 'Đông' },
  { value: 'west', label: 'Tây' },
  { value: 'south', label: 'Nam' },
  { value: 'north', label: 'Bắc' },
  { value: 'northeast', label: 'Đông Bắc' },
  { value: 'southeast', label: 'Đông Nam' },
  { value: 'northwest', label: 'Tây Bắc' },
  { value: 'southwest', label: 'Tây Nam' },
]

const selectClassName =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100'

const MAP_LOOKUP_DELAY_MS = 2000

const extractStreetFromAddress = (address?: string | null): string => {
  if (!address) return ''
  const firstSegment = address
    .split(',')
    .map((segment) => segment.trim())
    .find(Boolean)
  return firstSegment || ''
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-zinc-700 mb-1">
      {children}
      {required ? <span className="text-red-500 ml-0.5">*</span> : null}
    </label>
  )
}

function Block({
  title,
  open,
  onToggle,
  summary,
  collapsedContent,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  summary?: string
  collapsedContent?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-zinc-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-zinc-50 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-zinc-900">{title}</p>
          {!open && summary ? <p className="text-xs text-zinc-500 mt-0.5">{summary}</p> : null}
        </div>
        <span
          className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {open ? <div className="p-4 space-y-4">{children}</div> : collapsedContent ? <div className="p-3">{collapsedContent}</div> : null}
    </section>
  )
}

const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(value || 0)
const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\b(phuong|xa|thi tran)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()

export default function PostPopUp1({ draft, onChange, onClose, onNext }: PostPopUp1Props) {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [activeBlock, setActiveBlock] = useState<1 | 2 | 3 | 4 | null>(1)
  const [unlockedBlock2, setUnlockedBlock2] = useState(false)
  const [unlockedBlock3, setUnlockedBlock3] = useState(false)
  const [unlockedBlock4, setUnlockedBlock4] = useState(false)
  const [streetError, setStreetError] = useState('')
  const [mapPreviewSrc, setMapPreviewSrc] = useState('')
  const divisionsRef = useRef({ provinces, wards })
  const lastLocationLookupKeyRef = useRef('')

  useEffect(() => {
    fetch('/api/divisions/provinces')
      .then((r) => r.json())
      .then((res) => setProvinces(Array.isArray(res) ? res : []))
      .catch(() => setProvinces([]))
  }, [])

  useEffect(() => {
    if (!draft.provinceCode) {
      setWards([])
      return
    }

    fetch(`/api/divisions/wards/${draft.provinceCode}`)
      .then((r) => r.json())
      .then((res) => setWards(Array.isArray(res) ? res : []))
      .catch(() => setWards([]))
  }, [draft.provinceCode])

  useEffect(() => {
    setLoadingProjects(true)
    const params = new URLSearchParams()
    params.set('depth', '0')
    params.set('limit', '100')
    params.set('sort', 'name')

    if (draft.provinceCode && draft.wardCode) {
      params.set('where[and][0][provinceCode][equals]', draft.provinceCode)
      params.set('where[and][1][wardCode][equals]', draft.wardCode)
    } else if (draft.provinceCode) {
      params.set('where[provinceCode][equals]', draft.provinceCode)
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
      })
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false))
  }, [draft.provinceCode, draft.wardCode])

  useEffect(() => {
    divisionsRef.current = { provinces, wards }
  }, [provinces, wards])

  useEffect(() => {
    const locationLookupKey = [
      draft.project,
      draft.street.trim(),
      draft.provinceCode,
      draft.wardCode,
    ].join('|')

    if (locationLookupKey === lastLocationLookupKeyRef.current) return
    lastLocationLookupKeyRef.current = locationLookupKey

    const street = draft.street.trim()

    if (draft.project) {
      setStreetError('')
      return
    }
    if (!street || !draft.provinceCode || !draft.wardCode) {
      setStreetError('')
      return
    }

    const { provinces: currentProvinces, wards: currentWards } = divisionsRef.current
    const provinceName = currentProvinces.find((p) => p.code === draft.provinceCode)?.name || ''
    const wardName = currentWards.find((w) => w.code === draft.wardCode)?.name || ''
    const query = [street, wardName, provinceName, 'Việt Nam'].filter(Boolean).join(', ')

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          format: 'json',
          limit: '1',
          countrycodes: 'vn',
          addressdetails: '1',
          q: query,
        })
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`)
        if (!res.ok) {
          setStreetError('')
          return
        }

        const data = await res.json()
        const first = Array.isArray(data) ? data[0] : null
        if (!first) {
          setStreetError('')
          onChange((prev) => ({ ...prev, latitude: null, longitude: null }))
          return
        }
        const details = first.address || {}
        const wardCandidate = String(
          details.suburb || details.city_district || details.quarter || details.neighbourhood || '',
        )
        const selectedWardNormalized = normalizeText(wardName)
        const geocodedWardNormalized = normalizeText(wardCandidate)
        const wardMatched =
          !!selectedWardNormalized &&
          !!geocodedWardNormalized &&
          (geocodedWardNormalized.includes(selectedWardNormalized) ||
            selectedWardNormalized.includes(geocodedWardNormalized))
        if (!wardMatched) {
          setStreetError('')
          onChange((prev) => ({ ...prev, latitude: null, longitude: null }))
          return
        }
        const latitude = first?.lat ? Number(first.lat) : null
        const longitude = first?.lon ? Number(first.lon) : null
        setStreetError('')
        onChange((prev) => ({
          ...prev,
          latitude: Number.isFinite(latitude as number) ? latitude : null,
          longitude: Number.isFinite(longitude as number) ? longitude : null,
        }))
      } catch {
        setStreetError('')
      }
    }, MAP_LOOKUP_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [draft.project, draft.street, draft.provinceCode, draft.wardCode])

  const update = <K extends keyof PostDraft>(key: K, value: PostDraft[K]) => {
    onChange((prev) => ({ ...prev, [key]: value }))
  }

  const locationDone = Boolean(
    draft.provinceCode &&
      draft.wardCode &&
      draft.address.trim() &&
      (draft.project ? true : draft.street.trim()),
  )
  const pricingDone = Boolean(draft.propertyType && draft.area > 0 && draft.price > 0)
  const attributesDone = Boolean(draft.legalStatus && draft.furnitureStatus)
  const contentDone = Boolean(draft.title.trim() && draft.description.trim())
  const canGoPhase2 = locationDone && pricingDone && contentDone

  useEffect(() => {
    if (locationDone) setUnlockedBlock2(true)
  }, [locationDone])

  useEffect(() => {
    if (pricingDone) {
      setUnlockedBlock3(true)
      setUnlockedBlock4(true)
    }
  }, [pricingDone])

  const locationSummary = useMemo(() => {
    if (!locationDone) return 'Chưa hoàn tất vị trí'
    return draft.address
  }, [locationDone, draft.address])

  useEffect(() => {
    if (draft.project) {
      if (typeof draft.latitude === 'number' && typeof draft.longitude === 'number') {
        setMapPreviewSrc(
          `https://maps.google.com/maps?q=${draft.latitude},${draft.longitude}&z=15&output=embed`,
        )
      } else {
        setMapPreviewSrc('')
      }
      return
    }

    const street = draft.street.trim()
    if (!street || !draft.provinceCode || !draft.wardCode) {
      setMapPreviewSrc('')
      return
    }

    const provinceName = provinces.find((p) => p.code === draft.provinceCode)?.name || ''
    const wardName = wards.find((w) => w.code === draft.wardCode)?.name || ''
    const mapQuery = [street, wardName, provinceName, 'Việt Nam'].filter(Boolean).join(', ')

    const timer = window.setTimeout(() => {
      setMapPreviewSrc(
        `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`,
      )
    }, MAP_LOOKUP_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [
    draft.project,
    draft.street,
    draft.provinceCode,
    draft.wardCode,
    draft.latitude,
    draft.longitude,
    provinces,
    wards,
  ])

  const pricingSummary = useMemo(() => {
    if (!pricingDone) return 'Chưa hoàn tất thông tin chính'
    return `${formatMoney(draft.price)} đ • ${draft.area} m²`
  }, [pricingDone, draft.price, draft.area])

  const attributesSummary = useMemo(() => {
    if (!attributesDone) return 'Chưa hoàn tất thuộc tính'
    return `${draft.bedrooms || 0} PN • ${draft.bathrooms || 0} PT`
  }, [attributesDone, draft.bedrooms, draft.bathrooms])

  const contentSummary = useMemo(() => {
    if (!contentDone) return 'Chưa có tiêu đề/mô tả'
    return draft.title.trim()
  }, [contentDone, draft.title])

  const pricePerM2 = draft.area > 0 ? draft.price / draft.area : 0

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-4 pb-5">
        <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Golden Land</p>
        <h2 className="mt-2 text-2xl font-bold text-zinc-900">Bước 1: Thông tin tin đăng</h2>
        </div>

      <Block
        title="Block 1: Vị trí"
        open={activeBlock === 1}
        onToggle={() => setActiveBlock((prev) => (prev === 1 ? null : 1))}
        summary={locationSummary}
        collapsedContent={
          mapPreviewSrc ? (
            <iframe
              title="map-preview-collapsed"
              src={mapPreviewSrc}
              className="h-44 w-full rounded-lg border-0"
              loading="lazy"
            />
          ) : null
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>Tỉnh / Thành phố</Label>
            <select
              value={draft.provinceCode}
              onChange={(e) => {
                const provinceCode = e.target.value
                setStreetError('')
                onChange((prev) => ({
                  ...prev,
                  provinceCode,
                  wardCode: '',
                  project: '',
                  street: '',
                  address: '',
                  latitude: null,
                  longitude: null,
                }))
              }}
              className={selectClassName}
            >
              <option value="">-- Chọn tỉnh/thành --</option>
              {provinces.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label required>Phường / Xã</Label>
            <select
              value={draft.wardCode}
              onChange={(e) => {
                const wardCode = e.target.value
                setStreetError('')
                onChange((prev) => ({
                  ...prev,
                  wardCode,
                  project: '',
                  street: '',
                  address: '',
                  latitude: null,
                  longitude: null,
                }))
              }}
              disabled={!draft.provinceCode}
              className={`${selectClassName} disabled:opacity-60`}
            >
              <option value="">-- Chọn phường/xã --</option>
              {wards.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label>Dự án</Label>
          <select
            value={draft.project}
              onChange={(e) => {
                const projectId = e.target.value
                if (!projectId) {
                  setStreetError('')
                  onChange((prev) => ({
                    ...prev,
                    project: '',
                    street: '',
                    address: '',
                    latitude: null,
                    longitude: null,
                  }))
                  return
              }
              const project = projects.find((item) => item.id === projectId)
              if (!project) return
              setStreetError('')
              onChange((prev) => ({
                ...prev,
                project: projectId,
                provinceCode: project.provinceCode || prev.provinceCode,
                wardCode: project.wardCode || prev.wardCode,
                street: extractStreetFromAddress(project.address) || prev.street,
                address: project.address || prev.address,
                latitude: project.latitude ?? prev.latitude,
                longitude: project.longitude ?? prev.longitude,
                propertyType: prev.propertyType || 'apartment',
              }))
            }}
            className={selectClassName}
          >
            <option value="">-- Không thuộc dự án --</option>
            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {!draft.project ? (
          <div>
            <Label required>Street</Label>
            <input
              value={draft.street}
              onChange={(e) => {
                setStreetError('')
                update('street', e.target.value)
              }}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
              placeholder="VD: Nguyễn Trãi"
            />
            {streetError ? <p className="mt-1 text-xs text-red-600">{streetError}</p> : null}
          </div>
        ) : null}

        <div>
          <Label required>Address</Label>
          <input
            value={draft.address}
            onChange={(e) => update('address', e.target.value)}
            disabled={Boolean(draft.project)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm disabled:opacity-60"
            placeholder="VD: Số 12, hẻm 45 Nguyễn Trãi"
          />
        </div>

        {mapPreviewSrc ? (
          <iframe
            title="map-preview"
            src={mapPreviewSrc}
            className="h-52 w-full rounded-lg border-0"
            loading="lazy"
          />
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!locationDone}
            onClick={() => setActiveBlock(2)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            OK
          </button>
        </div>
      </Block>

      {unlockedBlock2 ? (
        <Block
          title="Block 2: Loại BĐS, diện tích, giá"
          open={activeBlock === 2}
          onToggle={() => setActiveBlock((prev) => (prev === 2 ? null : 2))}
          summary={pricingSummary}
        >
          <div>
            <Label required>Loại BĐS</Label>
            <select
              value={draft.propertyType}
              onChange={(e) => update('propertyType', e.target.value)}
              className={selectClassName}
            >
              <option value="">-- Chọn loại BĐS --</option>
              {PROPERTY_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Diện tích (m²)</Label>
              <input
                type="number"
                min={0}
                value={draft.area || ''}
                onChange={(e) => update('area', Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label required>Mức giá</Label>
              <input
                type="number"
                min={0}
                value={draft.price || ''}
                onChange={(e) => update('price', Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            {draft.price > 0 ? `Giá định dạng: ${formatMoney(draft.price)} đ` : 'Giá định dạng: 0 đ'}
            <br />
            {draft.area > 0 && draft.price > 0 ? `Đơn giá: ${formatMoney(Math.round(pricePerM2))} đ/m²` : 'Đơn giá: —'}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!pricingDone}
              onClick={() => setActiveBlock(3)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              OK
            </button>
          </div>
        </Block>
      ) : null}

      {unlockedBlock3 ? (
        <Block
          title="Block 3: Thuộc tính bổ sung"
          open={activeBlock === 3}
          onToggle={() => setActiveBlock((prev) => (prev === 3 ? null : 3))}
          summary={attributesSummary}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Giấy tờ pháp lý</Label>
              <select
              value={draft.legalStatus}
              onChange={(e) => update('legalStatus', e.target.value)}
                className={selectClassName}
              >
                <option value="">-- Chọn pháp lý --</option>
                {LEGAL_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Nội thất</Label>
              <select
              value={draft.furnitureStatus}
              onChange={(e) => update('furnitureStatus', e.target.value)}
                className={selectClassName}
              >
                <option value="">-- Chọn nội thất --</option>
                {FURNITURE_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Hướng nhà</Label>
            <select
              value={draft.direction}
              onChange={(e) => update('direction', e.target.value)}
              className={selectClassName}
            >
              <option value="">-- Chọn hướng --</option>
              {DIRECTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phòng ngủ</Label>
              <input
                type="number"
                min={0}
                value={draft.bedrooms || ''}
                onChange={(e) => update('bedrooms', Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label>Phòng tắm</Label>
              <input
                type="number"
                min={0}
                value={draft.bathrooms || ''}
                onChange={(e) => update('bathrooms', Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setActiveBlock(4)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              OK
            </button>
          </div>
        </Block>
      ) : null}

        {unlockedBlock4 ? (
        <Block
          title="Block 4: Tiêu đề và mô tả"
          open={activeBlock === 4}
          onToggle={() => setActiveBlock((prev) => (prev === 4 ? null : 4))}
          summary={contentSummary}
        >
          <div>
            <Label required>Tiêu đề</Label>
            <textarea
              rows={2}
              value={draft.title}
              onChange={(e) => update('title', e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm resize-none"
            />
          </div>
          <div>
            <Label required>Mô tả</Label>
            <textarea
              rows={5}
              value={draft.description}
              onChange={(e) => update('description', e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm resize-none"
            />
          </div>
        </Block>
      ) : null}
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-6 flex items-center justify-between gap-3 border-t border-zinc-100 bg-white px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
        >
          Đóng
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoPhase2}
          className="rounded-full bg-red-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          Tiếp theo
        </button>
      </div>
    </div>
  )
}
