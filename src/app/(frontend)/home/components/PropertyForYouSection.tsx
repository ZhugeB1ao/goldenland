'use client'
import type { Property } from '@/payload-types'
import { fetchNewProperties } from '@/app/services/properties'
import divisions from '@/app/data/vietnam-divisions.json'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  toggleFavoriteThunk,
  selectFavoriteIdSet,
} from '@/app/(frontend)/store/slices/favoritesSlice'
import type { AppDispatch, RootState } from '@/app/(frontend)/store'

type PropertyItem = {
  id: number
  title: string
  price: string
  area: string
  location: string
  image: string
  imageAlt: string
}

const PAGE_SIZE = 8
const MAX_FETCH_COUNT = 2
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=80'

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

// Removed hasUrl because images are strings now

// Function to format the price of a property based on its price unit and value
function formatPrice(property: Property): string {
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
    // Fallback logic for legacy data or small numbers
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

function formatLocation(property: Property): string {
  const provinceKey = normalizeCode(property.provinceCode)
  const wardKey = normalizeCode(property.wardCode)

  const provinceName = provinceKey ? provinceNameByCode.get(provinceKey) : undefined
  const wardName =
    provinceKey && wardKey ? wardNameByProvinceAndCode.get(`${provinceKey}:${wardKey}`) : undefined

  const mappedLocation = [wardName, provinceName].filter(Boolean).join(', ')

  return mappedLocation || property.address || 'Đang cập nhật'
}

// Function to map a Property object to a PropertyItem object, extracting the necessary fields and formatting them for display
function mapPropertyToItem(property: Property): PropertyItem {
  const firstImage = property.images?.[0]?.image
  const image = typeof firstImage === 'string' ? firstImage : FALLBACK_IMAGE

  return {
    id: property.id,
    title: property.title,
    price: formatPrice(property),
    area: property.area ? `${property.area} m²` : 'Đang cập nhật',
    location: formatLocation(property),
    image,
    imageAlt: property.title,
  }
}

export function PropertyForYouSection() {
  const dispatch = useDispatch<AppDispatch>()
  const favoriteIdSet = useSelector((state: RootState) => selectFavoriteIdSet(state as any))
  const [properties, setProperties] = useState<PropertyItem[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [fetchCount, setFetchCount] = useState(0)

  const reachedFetchLimit = fetchCount >= MAX_FETCH_COUNT
  const showGoToPropertiesButton = reachedFetchLimit && hasMore

  useEffect(() => {
    const loadInitialProperties = async () => {
      try {
        const response = await fetchNewProperties({ limit: PAGE_SIZE, page: 1 })

        setProperties(response.data.map(mapPropertyToItem))
        setCurrentPage(response.page)
        setHasMore(response.hasMore)
      } catch (error) {
        console.error('Fetch new properties failed:', error)
      } finally {
        setFetchCount((prev) => prev + 1)
        setIsInitialLoading(false)
      }
    }

    void loadInitialProperties()
  }, [])

  // Handler function to load more properties when the user clicks the "Load More" button, fetching the next page of properties and appending them to the existing list
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || reachedFetchLimit) {
      return
    }

    setIsLoadingMore(true)
    const nextPage = currentPage + 1

    try {
      const response = await fetchNewProperties({ limit: PAGE_SIZE, page: nextPage })

      setProperties((previous) => [...previous, ...response.data.map(mapPropertyToItem)])
      setCurrentPage(response.page)
      setHasMore(response.hasMore)
    } catch (error) {
      console.error('Load more properties failed:', error)
    } finally {
      setFetchCount((prev) => prev + 1)
      setIsLoadingMore(false)
    }
  }

  return (
    <section className="mx-auto max-w-screen-2xl px-8 pb-24">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <h2 className="font-lexend text-3xl font-bold uppercase tracking-tighter text-on-surface">
          Bất động sản dành cho bạn
        </h2>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-4 text-sm font-medium md:flex">
            <a className="text-secondary transition-colors hover:text-primary" href="/properties">
              Tin nhà đất bán mới nhất
            </a>
          </div>
        </div>
      </div>

      {isInitialLoading && (
        <div className="py-10 text-center text-secondary">Đang tải danh sách bất động sản...</div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {properties.map((property) => {
          const isFavorite = favoriteIdSet.has(property.id)

          return (
            <div
              key={property.id}
              className="group cursor-pointer overflow-hidden rounded-lg border border-outline-variant/20 bg-white transition-all hover:shadow-xl"
            >
              <div className="relative h-[208px] min-h-[208px] max-h-[208px] overflow-hidden">
                <img
                  alt={property.imageAlt}
                  className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={property.image}
                />
              </div>

              <div className="flex h-[180px] flex-col justify-between p-4">
                <div>
                  <h4 className="font-lexend mb-2 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] font-bold text-on-surface transition-colors group-hover:text-primary">
                    {property.title}
                  </h4>

                  <div className="font-lexend text-lg font-bold text-primary">
                    {property.price}
                    <span className="mx-1 font-normal text-secondary">·</span>
                    {property.area}
                  </div>

                  <div className="mt-2 flex min-w-0 items-center gap-1 text-sm text-secondary">
                    <span className="material-symbols-outlined shrink-0 text-base">
                      location_on
                    </span>
                    <span className="min-w-0 flex-1 truncate">{property.location}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between ">
                  <span className="text-xs italic text-secondary">Đăng hôm nay</span>

                  <button
                    aria-label={`${isFavorite ? 'Bỏ khỏi' : 'Thêm vào'} danh sách yêu thích: ${property.title}`}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                      isFavorite
                        ? 'border-red-300 bg-red-50 hover:border-red-400 hover:bg-red-100'
                        : 'border-outline-variant/30 hover:border-primary hover:bg-primary/10'
                    }`}
                    onClick={() => {
                      void dispatch(toggleFavoriteThunk(property.id))
                    }}
                    type="button"
                  >
                    <span
                      className={`material-symbols-outlined text-lg transition-colors ${
                        isFavorite ? 'text-red-500' : 'text-secondary hover:text-primary'
                      }`}
                    >
                      {isFavorite ? 'favorite' : 'favorite_border'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!isInitialLoading && properties.length === 0 && (
        <div className="py-10 text-center text-secondary">Hiện chưa có bất động sản nào.</div>
      )}

      <div className="mt-10 flex justify-center">
        {showGoToPropertiesButton ? (
          <Link
            className="rounded-full border border-primary px-6 py-2 font-semibold text-primary transition-all hover:bg-primary hover:text-white"
            href="/properties"
          >
            Xem tất cả tại trang Bất động sản
          </Link>
        ) : (
          <button
            onClick={handleLoadMore}
            disabled={isInitialLoading || isLoadingMore || !hasMore || reachedFetchLimit}
            className="rounded-full border border-outline px-6 py-2 font-semibold text-on-surface transition-all hover:border-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
          >
            {isLoadingMore ? 'Đang tải...' : hasMore ? 'Xem thêm' : 'Đã hiển thị hết'}
          </button>
        )}
      </div>
    </section>
  )
}
