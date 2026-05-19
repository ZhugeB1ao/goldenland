'use client'
import type { Property } from '@/payload-types'
import { fetchNewProperties } from '../services/properties'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PropertyGridItem, type PropertyItem } from '../../components/PropertyGridItem'
import { formatLocation, formatPrice, FALLBACK_IMAGE } from '../../properties/lib/utils'

const PAGE_SIZE = 8
const MAX_FETCH_COUNT = 2

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
    updatedAt: property.updatedAt,
  }
}

export function PropertyForYouSection() {
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
            <Link className="text-secondary transition-colors hover:text-primary" href="/properties">
              Tin nhà đất bán mới nhất
            </Link>
          </div>
        </div>
      </div>

      {isInitialLoading && (
        <div className="py-10 text-center text-secondary">Đang tải danh sách bất động sản...</div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {properties.map((property) => (
          <PropertyGridItem key={property.id} property={property} />
        ))}
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
