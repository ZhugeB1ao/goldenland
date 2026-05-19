'use client'

import type { Property } from '@/payload-types'
import { useDispatch, useSelector } from 'react-redux'
import { toggleFavoriteThunk, selectFavoriteIdSet } from '@/app/store/slices/favoritesSlice'
import type { AppDispatch, RootState } from '@/app/store'
import { formatPrice, formatProvince, FALLBACK_IMAGE } from '../lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface PropertyCardProps {
  property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
  const dispatch = useDispatch<AppDispatch>()
  const favoriteIdSet = useSelector((state: RootState) => selectFavoriteIdSet(state))
  const isFavorite = favoriteIdSet.has(property.id)

  const userInfo = typeof property.user === 'object' ? property.user : null
  const userName = userInfo?.fullName || userInfo?.email || 'Người đăng'
  const userPhone = userInfo?.phone || 'Đang cập nhật'
  const avatarUrl = userInfo?.avatar_id

  const firstImage = property.images?.[0]?.image
  const imageUrl = typeof firstImage === 'string' ? firstImage : FALLBACK_IMAGE

  const priceLabel = formatPrice(property)
  const provinceLabel = formatProvince(property)
  const areaLabel = property.area ? `${property.area} m²` : 'Đang cập nhật'
  const descriptionLabel = property.description?.trim() || 'Chưa có mô tả'
  const pricePerM2Label = (() => {
    if (
      !property.price ||
      !property.area ||
      property.area <= 0 ||
      property.priceUnit === 'negotiable'
    ) {
      return 'Đang cập nhật'
    }

    const base = property.priceUnit === 'per_m2' ? property.price : property.price / property.area
    const million = base / 1_000_000
    const formatter = new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: million < 1 ? 2 : 1,
    })

    return `${formatter.format(million)} triệu/m²`
  })()

  return (
    <article className="bg-white rounded-xl overflow-hidden border border-outline-variant/30 flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-64 md:h-[340px] flex gap-1 bg-zinc-100">
        <div className="w-2/3 h-full relative">
          <Image
            alt={property.title}
            className="object-cover"
            fill
            sizes="(min-width: 768px) 45vw, 67vw"
            src={imageUrl}
            unoptimized
          />
          {property.postType === 'vip' && (
            <div className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1 shadow-lg">
              <span className="material-symbols-outlined text-[12px]">award_star</span>
              Tin ưu tiên
            </div>
          )}
        </div>
        <div className="w-1/3 flex flex-col gap-1">
          {property.images?.slice(1, 3).map((img, idx) => (
            <div key={idx} className="h-1/2 relative">
              <Image
                alt={`${property.title} ${idx + 2}`}
                className="object-cover"
                fill
                sizes="(min-width: 768px) 23vw, 33vw"
                src={typeof img.image === 'string' ? img.image : FALLBACK_IMAGE}
                unoptimized
              />
              {idx === 1 && (property.images?.length || 0) > 3 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-medium text-sm">
                  +{(property.images?.length || 0) - 3} ảnh
                </div>
              )}
            </div>
          ))}
          {(!property.images || property.images.length < 2) && (
            <div className="h-full bg-zinc-200 animate-pulse" />
          )}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-4 mb-3">
          <Link
            href={`/properties/${property.id}`}
            className="group-hover:text-primary transition-colors"
          >
            <div className="flex items-center gap-2">
              {property.isVerified && (
                <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-green-700 px-2 py-0.5 text-[11px] font-semibold text-white">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  Xác thực
                </span>
              )}
              <h3 className="text-lg font-bold font-lexend text-on-surface line-clamp-2 leading-snug">
                {property.title}
              </h3>
            </div>
          </Link>
          <button
            aria-label={`${isFavorite ? 'Bỏ khỏi' : 'Thêm vào'} danh sách yêu thích: ${property.title}`}
            onClick={() => {
              void dispatch(toggleFavoriteThunk(property.id))
            }}
            className={`p-2 rounded-full hover:bg-surface-container transition-colors ${
              isFavorite ? 'text-primary' : 'text-secondary'
            }`}
            type="button"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
          </button>
        </div>

        <Link href={`/properties/${property.id}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-primary font-bold font-lexend text-lg">{priceLabel}</div>
            <div className="text-primary font-bold font-lexend text-lg">{areaLabel}</div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-secondary ">
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">square_foot</span>
                {pricePerM2Label}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">bed</span>
                {property.bedrooms ?? '—'} PN
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">bathtub</span>
                {property.bathrooms ?? '—'} WC
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                {provinceLabel}
              </span>
            </div>
          </div>

          <p className="text-sm text-secondary mb-4 line-clamp-2">{descriptionLabel}</p>

          <div className="mt-auto pt-4 border-t border-outline-variant/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center text-xs font-bold text-secondary shrink-0">
                {avatarUrl ? (
                  <Image
                    alt={userName}
                    className="object-cover"
                    fill
                    sizes="36px"
                    src={avatarUrl}
                    unoptimized
                  />
                ) : (
                  <span>{userName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-on-surface truncate">{userName}</p>
                <p className="text-[11px] text-secondary truncate">{userPhone}</p>
              </div>
            </div>
            <span className="text-[11px] text-secondary/60 shrink-0">
              {new Date(property.createdAt).toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </Link>
      </div>
    </article>
  )
}
