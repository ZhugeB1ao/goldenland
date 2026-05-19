'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Property } from '@/payload-types'
import {
  fetchPropertiesByPostType,
  fetchPropertyFilterOptions,
  type PropertyFiltersState,
  type PropertySortValue,
} from './services/properties'
import { PropertiesFilterBar } from './components/PropertiesFilterBar'
import { PropertiesHeader } from './components/PropertiesHeader'
import { PropertiesList } from './components/PropertiesList'
import { PropertiesSidebar } from './components/PropertiesSidebar'

type RangeOption = {
  id: string
  label: string
  min: number
  max: number
}

type SelectOption = {
  value: string
  label: string
}

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

const dynamicLabelMap: Record<string, { groupLabel: string; valueLabel: Record<string, string> }> = {
  direction: {
    groupLabel: 'Hướng',
    valueLabel: {
      east: 'Đông',
      west: 'Tây',
      south: 'Nam',
      north: 'Bắc',
      northeast: 'Đông Bắc',
      southeast: 'Đông Nam',
      northwest: 'Tây Bắc',
      southwest: 'Tây Nam',
    },
  },
  legalStatus: {
    groupLabel: 'Pháp lý',
    valueLabel: {
      red_book: 'Sổ đỏ/Sổ hồng',
      sale_contract: 'Hợp đồng mua bán',
      pending: 'Đang chờ sổ',
      other: 'Khác',
    },
  },
  furnitureStatus: {
    groupLabel: 'Nội thất',
    valueLabel: {
      luxury: 'Cao cấp',
      full: 'Đầy đủ',
      basic: 'Cơ bản',
      none: 'Không nội thất',
    },
  },
  bedrooms: { groupLabel: 'Phòng ngủ', valueLabel: {} },
  bathrooms: { groupLabel: 'Phòng tắm', valueLabel: {} },
}

const numberFormatter = new Intl.NumberFormat('vi-VN')
const tyFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })

const buildRanges = (
  range: { min: number | null; max: number | null },
  steps: number,
  idPrefix: string,
  suffix?: string,
): RangeOption[] => {
  if (range.min === null || range.max === null) return []
  if (range.min === range.max) {
    return [
      {
        id: `${idPrefix}-0`,
        min: range.min,
        max: range.max,
        label: `${numberFormatter.format(range.min)}${suffix ? ` ${suffix}` : ''}`,
      },
    ]
  }

  const diff = range.max - range.min
  const step = diff <= 0 ? 1 : Math.ceil(diff / steps)
  const labels: RangeOption[] = []

  for (let index = 0; index < steps; index += 1) {
    const start = range.min + step * index
    const end = index === steps - 1 ? range.max : Math.min(range.max, start + step)
    labels.push({
      id: `${idPrefix}-${index}`,
      min: start,
      max: end,
      label: `${numberFormatter.format(start)} - ${numberFormatter.format(end)}${suffix ? ` ${suffix}` : ''}`,
    })
  }

  return labels
}

const buildPriceRanges = (
  range: { min: number | null; max: number | null },
  steps: number,
): RangeOption[] => {
  if (range.min === null || range.max === null) return []
  if (range.min === range.max) {
    return [
      {
        id: 'price-0',
        min: range.min,
        max: range.max,
        label: `${tyFormatter.format(range.min / 1_000_000_000)} tỷ`,
      },
    ]
  }

  const diff = range.max - range.min
  const step = diff <= 0 ? 1 : Math.ceil(diff / steps)
  const labels: RangeOption[] = []

  for (let index = 0; index < steps; index += 1) {
    const start = range.min + step * index
    const end = index === steps - 1 ? range.max : Math.min(range.max, start + step)
    labels.push({
      id: `price-${index}`,
      min: start,
      max: end,
      label: `${tyFormatter.format(start / 1_000_000_000)} - ${tyFormatter.format(end / 1_000_000_000)} tỷ`,
    })
  }

  return labels
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [propertyTypeOptions, setPropertyTypeOptions] = useState<SelectOption[]>([])
  const [regionOptions, setRegionOptions] = useState<SelectOption[]>([])
  const [wardOptions, setWardOptions] = useState<Array<SelectOption & { provinceCode: string }>>([])
  const [streetOptions, setStreetOptions] = useState<
    Array<SelectOption & { provinceCode: string; wardCode: string }>
  >([])
  const [projectOptions, setProjectOptions] = useState<
    Array<SelectOption & { provinceCode: string; wardCode: string }>
  >([])
  const [priceRangeOptions, setPriceRangeOptions] = useState<RangeOption[]>([])
  const [areaRangeOptions, setAreaRangeOptions] = useState<RangeOption[]>([])
  const [dynamicAttributeOptions, setDynamicAttributeOptions] = useState<
    Array<{ key: string; label: string; options: SelectOption[] }>
  >([])

  const [keywordInput, setKeywordInput] = useState('')
  const [sortValue, setSortValue] = useState<PropertySortValue>('default')
  const [filters, setFilters] = useState({
    verifiedOnly: false,
    propertyTypes: [] as string[],
    priceRangeIds: [] as string[],
    areaRangeIds: [] as string[],
    minPriceInput: '',
    maxPriceInput: '',
    minAreaInput: '',
    maxAreaInput: '',
    provinceCodes: [] as string[],
    wardCodes: [] as string[],
    streets: [] as string[],
    projectIds: [] as string[],
    directions: [] as string[],
    legalStatuses: [] as string[],
    bedroomsList: [] as number[],
    bathroomsList: [] as number[],
  })
  const [keyword, setKeyword] = useState('')

  const requestFilters = useMemo<PropertyFiltersState>(() => {
    const selectedPriceRanges = priceRangeOptions.filter((option) => filters.priceRangeIds.includes(option.id))
    const selectedAreaRanges = areaRangeOptions.filter((option) => filters.areaRangeIds.includes(option.id))
    const inputMinPrice = Number(filters.minPriceInput)
    const inputMaxPrice = Number(filters.maxPriceInput)
    const inputMinArea = Number(filters.minAreaInput)
    const inputMaxArea = Number(filters.maxAreaInput)
    const listMinPrice =
      selectedPriceRanges.length > 0 ? Math.min(...selectedPriceRanges.map((item) => item.min)) : undefined
    const listMaxPrice =
      selectedPriceRanges.length > 0 ? Math.max(...selectedPriceRanges.map((item) => item.max)) : undefined
    const listMinArea =
      selectedAreaRanges.length > 0 ? Math.min(...selectedAreaRanges.map((item) => item.min)) : undefined
    const listMaxArea =
      selectedAreaRanges.length > 0 ? Math.max(...selectedAreaRanges.map((item) => item.max)) : undefined

    return {
      keyword: keyword || undefined,
      verifiedOnly: filters.verifiedOnly,
      propertyTypes: filters.propertyTypes,
      provinceCodes: filters.provinceCodes,
      wardCodes: filters.wardCodes,
      streets: filters.streets,
      projectIds: filters.projectIds,
      minPrice: Number.isFinite(inputMinPrice) && inputMinPrice > 0 ? inputMinPrice : listMinPrice,
      maxPrice: Number.isFinite(inputMaxPrice) && inputMaxPrice > 0 ? inputMaxPrice : listMaxPrice,
      minArea: Number.isFinite(inputMinArea) && inputMinArea > 0 ? inputMinArea : listMinArea,
      maxArea: Number.isFinite(inputMaxArea) && inputMaxArea > 0 ? inputMaxArea : listMaxArea,
      directions: filters.directions,
      legalStatuses: filters.legalStatuses,
      bedroomsList: filters.bedroomsList,
      bathroomsList: filters.bathroomsList,
    }
  }, [areaRangeOptions, filters, keyword, priceRangeOptions])

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const filtersResponse = await fetchPropertyFilterOptions()
        if (!filtersResponse?.success) return

        setPropertyTypeOptions(
          filtersResponse.propertyTypes.map((type) => ({
            value: type,
            label: propertyTypeLabels[type] ?? type,
          })),
        )
        setPriceRangeOptions(buildPriceRanges(filtersResponse.priceRange, 5))
        setAreaRangeOptions(buildRanges(filtersResponse.areaRange, 5, 'area', 'm²'))
        setRegionOptions(filtersResponse.regions.map((region) => ({ value: region.code, label: region.label })))
        setWardOptions(
          filtersResponse.wards.map((ward) => ({
            value: ward.code,
            label: ward.label,
            provinceCode: ward.provinceCode,
          })),
        )
        setStreetOptions(
          filtersResponse.streets.map((street) => ({
            value: street.name,
            label: street.name,
            provinceCode: street.provinceCode,
            wardCode: street.wardCode,
          })),
        )
        setProjectOptions(
          filtersResponse.projects.map((project) => ({
            value: project.id,
            label: project.name,
            provinceCode: project.provinceCode,
            wardCode: project.wardCode,
          })),
        )
        setDynamicAttributeOptions(
          filtersResponse.dynamicAttributes
            .filter((group) => dynamicLabelMap[group.key])
            .map((group) => ({
              key: group.key,
              label: dynamicLabelMap[group.key].groupLabel,
              options: group.values.map((value) => ({
                value,
                label: dynamicLabelMap[group.key].valueLabel[value] ?? value,
              })),
            })),
        )
      } catch (error) {
        console.error('Failed to fetch filters:', error)
      }
    }

    void loadFilterOptions()
  }, [])

  useEffect(() => {
    async function loadProperties() {
      setIsLoading(true)
      try {
        const response = await fetchPropertiesByPostType({
          limit: 10,
          page,
          sort: sortValue,
          filters: requestFilters,
        })
        setProperties(response.data)
        setTotalDocs(response.totalDocs)
        setTotalPages(response.totalPages)
      } catch (error) {
        console.error('Failed to fetch properties:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadProperties()
  }, [page, requestFilters, sortValue])

  const handlePageChange = (nextPage: number) => {
    if (isLoading || nextPage === page || nextPage < 1 || nextPage > totalPages) return
    setPage(nextPage)
  }

  const handleSortChange = (nextSort: PropertySortValue) => {
    setSortValue(nextSort)
    setPage(1)
  }

  const handleFiltersChange = (nextFilters: typeof filters) => {
    setFilters(nextFilters)
    setPage(1)
  }

  const handleSearch = () => {
    setKeyword(keywordInput.trim())
    setPage(1)
  }

  const pageNumbers = (() => {
    const maxPagesToShow = 5
    if (totalPages <= maxPagesToShow) return Array.from({ length: totalPages }, (_, i) => i + 1)

    const start = Math.max(1, Math.min(page - 2, totalPages - (maxPagesToShow - 1)))
    return Array.from({ length: maxPagesToShow }, (_, i) => start + i)
  })()

  const headline = (() => {
    if (filters.propertyTypes.length === 1) {
      const selected = propertyTypeOptions.find((option) => option.value === filters.propertyTypes[0])
      if (selected) return `Bán ${selected.label.toLowerCase()} trên toàn quốc`
    }
    return 'Bán nhà đất trên toàn quốc'
  })()

  return (
    <main className="mx-auto max-w-screen-2xl px-8 pb-16 pt-8">
      <PropertiesFilterBar
        areaRangeOptions={areaRangeOptions}
        dynamicAttributeOptions={dynamicAttributeOptions}
        filters={filters}
        keywordInput={keywordInput}
        onFiltersChange={handleFiltersChange}
        onKeywordInputChange={setKeywordInput}
        onSearch={handleSearch}
        priceRangeOptions={priceRangeOptions}
        propertyTypeOptions={propertyTypeOptions}
        regionOptions={regionOptions}
        wardOptions={wardOptions}
        streetOptions={streetOptions}
        projectOptions={projectOptions}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PropertiesHeader
            headline={headline}
            onSortChange={handleSortChange}
            sortValue={sortValue}
            totalDocs={totalDocs}
          />

          <PropertiesList
            isLoading={isLoading}
            onPageChange={handlePageChange}
            page={page}
            pageNumbers={pageNumbers}
            properties={properties}
            totalPages={totalPages}
          />
        </div>
        <PropertiesSidebar
          areaRanges={areaRangeOptions.map((range) => range.label)}
          news={newsItems}
          priceRanges={priceRangeOptions.map((range) => range.label)}
          regions={regionOptions.map((region) => region.label)}
        />
      </div>
    </main>
  )
}
