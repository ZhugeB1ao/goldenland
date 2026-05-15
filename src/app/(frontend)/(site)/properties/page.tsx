'use client'

import { useState, useEffect } from 'react'
import type { Property } from '@/payload-types'
import { fetchPropertiesByPostType, fetchPropertyFilterOptions } from './services/properties'
import { PropertiesFilterBar } from './components/PropertiesFilterBar'
import { PropertiesHeader } from './components/PropertiesHeader'
import { PropertiesList } from './components/PropertiesList'
import { PropertiesSidebar } from './components/PropertiesSidebar'
import { PropertiesSortBar } from './components/PropertiesSortBar'

const newsItems = [
  { title: 'Dự báo thị trường bất động sản 2026', href: '/articles' },
  { title: 'Nguồn cung nhà ở tiếp tục tăng', href: '/articles' },
  { title: 'Lãi suất vay mua nhà cập nhật mới', href: '/articles' },
  { title: 'Kinh nghiệm chọn mua chung cư', href: '/articles' },
]

const propertyTypeLabels: Record<string, string> = {
  house: 'Nhà riêng',
  apartment: 'Chung cư',
  land: 'Đất nền',
  villa: 'Biệt thự',
  townhouse: 'Nhà phố',
  shophouse: 'Shophouse',
  penthouse: 'Penthouse',
  condotel: 'Condotel',
  warehouse: 'Kho/Xưởng',
  commercial: 'Mặt bằng',
}

const numberFormatter = new Intl.NumberFormat('vi-VN')
const tyFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })

const buildRanges = (
  range: { min: number | null; max: number | null },
  steps: number,
  suffix?: string,
): string[] => {
  if (range.min === null || range.max === null) return []
  if (range.min === range.max) {
    return [`${numberFormatter.format(range.min)}${suffix ? ` ${suffix}` : ''}`]
  }

  const diff = range.max - range.min
  const step = diff <= 0 ? 1 : Math.ceil(diff / steps)
  const labels: string[] = []

  for (let index = 0; index < steps; index += 1) {
    const start = range.min + step * index
    const end = index === steps - 1 ? range.max : Math.min(range.max, start + step)
    labels.push(
      `${numberFormatter.format(start)} - ${numberFormatter.format(end)}${suffix ? ` ${suffix}` : ''}`,
    )
  }

  return labels
}

const buildPriceRanges = (
  range: { min: number | null; max: number | null },
  steps: number,
): string[] => {
  if (range.min === null || range.max === null) return []

  const minTy = range.min / 1_000_000_000
  const maxTy = range.max / 1_000_000_000

  if (minTy === maxTy) {
    return [`${tyFormatter.format(minTy)} tỷ`]
  }

  const diff = maxTy - minTy
  const step = diff <= 0 ? 1 : diff / steps
  const labels: string[] = []

  for (let index = 0; index < steps; index += 1) {
    const start = minTy + step * index
    const end = index === steps - 1 ? maxTy : minTy + step * (index + 1)
    labels.push(`${tyFormatter.format(start)} - ${tyFormatter.format(end)} tỷ`)
  }

  return labels
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [propertyTypes, setPropertyTypes] = useState<string[]>([])
  const [priceRanges, setPriceRanges] = useState<string[]>([])
  const [areaRanges, setAreaRanges] = useState<string[]>([])
  const [regions, setRegions] = useState<string[]>([])

  useEffect(() => {
    async function loadProperties() {
      setIsLoading(true)
      try {
        const [propertiesResponse, filtersResponse] = await Promise.all([
          fetchPropertiesByPostType({ limit: 10, page: 1 }),
          fetchPropertyFilterOptions(),
        ])
        setProperties(propertiesResponse.data)
        setTotalDocs(propertiesResponse.totalDocs)
        setTotalPages(propertiesResponse.totalPages)
        setPage(1)

        if (filtersResponse?.success) {
          setPropertyTypes(
            filtersResponse.propertyTypes.map((type) => propertyTypeLabels[type] ?? type),
          )
          setPriceRanges(buildPriceRanges(filtersResponse.priceRange, 5))
          setAreaRanges(buildRanges(filtersResponse.areaRange, 5, 'm²'))
          setRegions(filtersResponse.regions.map((region) => region.label))
        }
      } catch (error) {
        console.error('Failed to fetch properties:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProperties()
  }, [])

  const handlePageChange = async (nextPage: number) => {
    if (isLoading || nextPage === page || nextPage < 1 || nextPage > totalPages) return
    setIsLoading(true)
    try {
      const response = await fetchPropertiesByPostType({ limit: 10, page: nextPage })
      setProperties(response.data)
      setPage(nextPage)
      setTotalPages(response.totalPages)
      setTotalDocs(response.totalDocs)
    } catch (error) {
      console.error('Failed to change page:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const pageNumbers = (() => {
    const maxPagesToShow = 5
    if (totalPages <= maxPagesToShow) return Array.from({ length: totalPages }, (_, i) => i + 1)

    const start = Math.max(1, Math.min(page - 2, totalPages - (maxPagesToShow - 1)))
    return Array.from({ length: maxPagesToShow }, (_, i) => start + i)
  })()

  return (
    <main className="pt-8 pb-16 max-w-screen-2xl mx-auto px-8">
      <PropertiesFilterBar
        propertyTypes={propertyTypes}
        priceRanges={priceRanges}
        areaRanges={areaRanges}
        regions={regions}
      />

      <PropertiesHeader totalDocs={totalDocs} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <PropertiesSortBar />

          <PropertiesList
            properties={properties}
            isLoading={isLoading}
            totalPages={totalPages}
            page={page}
            pageNumbers={pageNumbers}
            onPageChange={handlePageChange}
          />
        </div>
        <PropertiesSidebar
          priceRanges={priceRanges}
          areaRanges={areaRanges}
          regions={regions}
          news={newsItems}
        />
      </div>
    </main>
  )
}
