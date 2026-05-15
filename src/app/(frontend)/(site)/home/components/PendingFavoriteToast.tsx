'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { Property } from '@/payload-types'
import { fetchPropertyDetail } from '../services/properties'
import divisions from '@/app/data/vietnam-divisions.json'
import type { AppDispatch, RootState } from '@/app/store'
import { selectIsLoggedIn } from '@/app/store/slices/authSlice'
import {
  resolvePendingFavoriteThunk,
  selectPendingFavoriteIds,
} from '@/app/store/slices/favoritesSlice'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=80'

type PendingProperty = {
  id: number
  title: string
  image: string
  location: string
  price: string
  area: string
}

type DivisionProvince = {
  Code: string
  FullName: string
  Wards: Array<{
    Code: string
    FullName: string
    ProvinceCode: string
  }>
}

const divisionData = divisions as DivisionProvince[]

const normalizeCode = (value: unknown): string => {
  if (value === null || value === undefined) return ''

  const raw = String(value).trim()
  if (!raw) return ''

  const trimmed = raw.replace(/^0+/, '')
  return trimmed || '0'
}

const provinceNameByCode = new Map<string, string>()
const wardNameByProvinceAndCode = new Map<string, string>()

for (const province of divisionData) {
  const provinceKey = normalizeCode(province.Code)
  if (!provinceKey) continue

  provinceNameByCode.set(provinceKey, province.FullName)

  for (const ward of province.Wards) {
    const wardKey = normalizeCode(ward.Code)
    if (!wardKey) continue

    wardNameByProvinceAndCode.set(`${provinceKey}:${wardKey}`, ward.FullName)
  }
}

const formatPrice = (property: Property): string => {
  if (property.priceUnit === 'negotiable') {
    return 'Thỏa thuận'
  }

  const price = property.price
  let amountStr = ''

  if (price >= 1000000000) {
    const billions = price / 1000000000
    amountStr = `${billions.toFixed(billions % 1 === 0 ? 0 : 1).replace('.0', '')} tỷ`
  } else if (price >= 1000000) {
    const millions = price / 1000000
    amountStr = `${millions.toFixed(millions % 1 === 0 ? 0 : 1).replace('.0', '')} triệu`
  } else {
    amountStr =
      price >= 1000 ? `${(price / 1000).toFixed(1).replace('.0', '')} tỷ` : `${price} triệu`
  }

  if (property.priceUnit === 'per_month') {
    return `${amountStr}/tháng`
  }

  if (property.priceUnit === 'per_m2') {
    return `${amountStr}/m²`
  }

  return amountStr
}

const formatLocation = (property: Property): string => {
  const provinceKey = normalizeCode(property.provinceCode)
  const wardKey = normalizeCode(property.wardCode)

  const provinceName = provinceKey ? provinceNameByCode.get(provinceKey) : undefined
  const wardName =
    provinceKey && wardKey ? wardNameByProvinceAndCode.get(`${provinceKey}:${wardKey}`) : undefined

  const street = property.street?.trim()
  const mappedLocation = [street, wardName, provinceName].filter(Boolean).join(', ')

  return mappedLocation || property.address || 'Đang cập nhật'
}

export default function PendingFavoriteToast() {
  const dispatch = useDispatch<AppDispatch>()
  const isLoggedIn = useSelector((state: RootState) => selectIsLoggedIn(state as any))
  const pendingIds = useSelector((state: RootState) => selectPendingFavoriteIds(state as any))
  const [currentProperty, setCurrentProperty] = useState<PendingProperty | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const currentId = pendingIds[0]

  useEffect(() => {
    let isCancelled = false

    const loadProperty = async () => {
      if (!currentId || !isLoggedIn) {
        setCurrentProperty(null)
        return
      }

      setIsLoading(true)

      try {
        const response = await fetchPropertyDetail(String(currentId))
        const property = response.property
        const image = property.images?.[0]?.image

        if (!isCancelled) {
          setCurrentProperty({
            id: property.id,
            title: property.title,
            image: typeof image === 'string' ? image : FALLBACK_IMAGE,
            location: formatLocation(property),
            price: formatPrice(property),
            area: property.area ? `${property.area} m²` : 'Đang cập nhật',
          })
        }
      } catch {
        if (!isCancelled) {
          setCurrentProperty({
            id: currentId,
            title: `Bất động sản #${currentId}`,
            image: FALLBACK_IMAGE,
            location: 'Đang cập nhật',
            price: 'Đang cập nhật',
            area: 'Đang cập nhật',
          })
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadProperty()

    return () => {
      isCancelled = true
    }
  }, [currentId, isLoggedIn])

  const handleSave = () => {
    if (!currentId) return
    void dispatch(resolvePendingFavoriteThunk({ propertyId: currentId, decision: 'save' }))
  }

  const handleDiscard = () => {
    if (!currentId) return
    void dispatch(resolvePendingFavoriteThunk({ propertyId: currentId, decision: 'discard' }))
  }

  if (!isLoggedIn || !currentId) {
    return null
  }

  return (
    <div className="fixed right-6 top-24 z-[90] w-[340px] max-w-[90vw]">
      <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-white shadow-[0px_24px_48px_rgba(27,28,28,0.16)]">
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3">
          <span className="text-sm font-semibold text-on-surface">Lưu yêu thích?</span>
          <button
            type="button"
            onClick={handleDiscard}
            className="text-lg text-secondary transition-colors hover:text-on-surface"
            aria-label="Bỏ qua lưu yêu thích"
          >
            ×
          </button>
        </div>

        <div className="flex gap-3 px-4 py-3">
          <div className="h-16 w-20 overflow-hidden rounded-lg bg-surface-variant">
            <img
              src={currentProperty?.image || FALLBACK_IMAGE}
              alt={currentProperty?.title || 'Bất động sản'}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold text-on-surface">
              {currentProperty?.title || (isLoading ? 'Đang tải...' : 'Bất động sản')}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-primary">
              <span>{currentProperty?.price || 'Đang cập nhật'}</span>
              <span className="text-secondary">·</span>
              <span className="text-secondary">{currentProperty?.area || 'Đang cập nhật'}</span>
            </div>
            <p className="mt-1 truncate text-xs text-secondary">
              {currentProperty?.location || 'Đang cập nhật'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-outline-variant/20 px-4 py-3">
          <button
            type="button"
            onClick={handleDiscard}
            className="rounded-full border border-outline px-3 py-1 text-xs font-semibold text-secondary transition-colors hover:border-outline-variant hover:text-on-surface"
          >
            Không lưu
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}
