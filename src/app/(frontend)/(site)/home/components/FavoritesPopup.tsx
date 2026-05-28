'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { Property } from '@/payload-types'
import { fetchPropertiesByIds } from '../services/properties'
import type { AppDispatch, RootState } from '@/app/store'
import { selectFavoriteIds, toggleFavoriteThunk } from '@/app/store/slices/favoritesSlice'
import { formatLocation } from '../../properties/lib/utils'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=80'

type FavoriteItem = {
  id: number
  title: string
  price: string
  area: string
  location: string
  image: string
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

export default function FavoritesPopup() {
  const dispatch = useDispatch<AppDispatch>()
  const favoriteIds = useSelector((state: RootState) => selectFavoriteIds(state as any))
  const [items, setItems] = useState<FavoriteItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sortedIds = useMemo(() => [...favoriteIds], [favoriteIds])

  useEffect(() => {
    let isCancelled = false

    const loadFavorites = async () => {
      if (!sortedIds.length) {
        setItems([])
        return
      }

      setIsLoading(true)

      try {
        const docs = await fetchPropertiesByIds(sortedIds)
        const mapById = new Map<number, Property>()

        for (const doc of docs) {
          mapById.set(Number(doc.id), doc)
        }

        const nextItems: FavoriteItem[] = sortedIds
          .map((id) => mapById.get(Number(id)))
          .filter(Boolean)
          .map((property) => ({
            id: Number(property!.id),
            title: property!.title,
            price: formatPrice(property!),
            area: property!.area ? `${property!.area} m²` : 'Đang cập nhật',
            location: formatLocation(property!),
            image:
              typeof property!.images?.[0]?.image === 'string'
                ? property!.images?.[0]?.image
                : FALLBACK_IMAGE,
          }))

        if (!isCancelled) {
          setItems(nextItems)
        }
      } catch {
        if (!isCancelled) {
          setItems([])
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadFavorites()

    return () => {
      isCancelled = true
    }
  }, [sortedIds])

  return (
    <div className="w-[360px] max-w-[90vw] rounded-2xl border border-outline-variant/20 bg-white shadow-[0px_24px_48px_rgba(27,28,28,0.16)]">
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3">
        <span className="text-sm font-semibold text-on-surface">Danh sách yêu thích</span>
        <span className="text-xs text-secondary">{favoriteIds.length} tin</span>
      </div>

      <div className="max-h-[420px] overflow-y-auto px-4 py-3">
        {isLoading ? (
          <p className="text-sm text-secondary">Đang tải...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-secondary">Chưa có bất động sản yêu thích.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-xl border border-outline-variant/20 p-3"
              >
                <div className="h-14 w-16 overflow-hidden rounded-lg bg-surface-variant">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-on-surface">{item.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-primary">
                    <span>{item.price}</span>
                    <span className="text-secondary">·</span>
                    <span className="text-secondary">{item.area}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-secondary">{item.location}</p>
                </div>

                <button
                  type="button"
                  aria-label={`Xóa khỏi yêu thích: ${item.title}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-outline text-xs text-secondary transition-colors hover:border-red-300 hover:text-red-500"
                  onClick={() => {
                    void dispatch(toggleFavoriteThunk(item.id))
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
