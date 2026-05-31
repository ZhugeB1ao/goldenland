'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
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
import { parseSearch } from '../home/lib/search/parser'
import type { AppDispatch, RootState } from '@/app/store'
import {
  selectPropertySearch,
  setPropertySearchState,
} from '@/app/store/slices/propertySearchSlice'

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

const parsePositiveNumber = (value: string | null): number | undefined => {
  if (!value) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined
  return parsed
}

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

function PropertiesPageInner() {
  const searchParams = useSearchParams()
  const dispatch = useDispatch<AppDispatch>()
  const sharedSearch = useSelector(selectPropertySearch)
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
  const [searchDistrict, setSearchDistrict] = useState<number | undefined>(undefined)
  const [urlOnlyFilters, setUrlOnlyFilters] = useState<{
    furnitureStatuses?: string[]
    postTypes?: string[]
  }>({})
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
  const [hasAppliedUrlFilters, setHasAppliedUrlFilters] = useState(false)

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
      district: searchDistrict,
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
      postTypes: urlOnlyFilters.postTypes,
      directions: filters.directions,
      legalStatuses: filters.legalStatuses,
      furnitureStatuses: urlOnlyFilters.furnitureStatuses,
      bedroomsList: filters.bedroomsList,
      bathroomsList: filters.bathroomsList,
    }
  }, [areaRangeOptions, filters, keyword, priceRangeOptions, searchDistrict, urlOnlyFilters])

  useEffect(() => {
    if (hasAppliedUrlFilters) return

    const keywordFromUrl = searchParams.get('keyword') || ''
    const districtFromUrl = searchParams.get('district') || ''
    const provinceCodeFromUrl = searchParams.get('provinceCode') || ''
    const wardCodeFromUrl = searchParams.get('wardCode') || ''
    const propertyTypeFromUrl = searchParams.get('propertyType') || ''
    const directionFromUrl = searchParams.get('direction') || ''
    const legalStatusFromUrl = searchParams.get('legalStatus') || ''
    const furnitureStatusFromUrl = searchParams.get('furnitureStatus') || ''
    const postTypeFromUrl = searchParams.get('postType') || ''
    const bedroomsFromUrl = parsePositiveNumber(searchParams.get('bedrooms'))
    const bathroomsFromUrl = parsePositiveNumber(searchParams.get('bathrooms'))
    const minPriceFromUrl = parsePositiveNumber(searchParams.get('minPrice'))
    const maxPriceFromUrl = parsePositiveNumber(searchParams.get('maxPrice'))
    const minAreaFromUrl = parsePositiveNumber(searchParams.get('minArea'))
    const maxAreaFromUrl = parsePositiveNumber(searchParams.get('maxArea'))

    const hasAnyUrlFilter =
      !keywordFromUrl &&
      !districtFromUrl &&
      !provinceCodeFromUrl &&
      !wardCodeFromUrl &&
      !propertyTypeFromUrl &&
      !directionFromUrl &&
      !legalStatusFromUrl &&
      !furnitureStatusFromUrl &&
      !postTypeFromUrl &&
      !bedroomsFromUrl &&
      !bathroomsFromUrl &&
      !minPriceFromUrl &&
      !maxPriceFromUrl &&
      !minAreaFromUrl &&
      !maxAreaFromUrl

    if (hasAnyUrlFilter) {
      setKeywordInput(sharedSearch.homeInput || sharedSearch.keyword || '')
      setKeyword(sharedSearch.keyword || '')
      setSearchDistrict(sharedSearch.district)
      setUrlOnlyFilters({
        furnitureStatuses: sharedSearch.furnitureStatuses,
        postTypes: sharedSearch.postTypes,
      })
      setFilters((previous) => ({
        ...previous,
        propertyTypes: sharedSearch.propertyTypes,
        provinceCodes: sharedSearch.provinceCodes,
        wardCodes: sharedSearch.wardCodes,
        streets: sharedSearch.streets,
        projectIds: sharedSearch.projectIds,
        directions: sharedSearch.directions,
        legalStatuses: sharedSearch.legalStatuses,
        bedroomsList: sharedSearch.bedroomsList,
        bathroomsList: sharedSearch.bathroomsList,
        minPriceInput: sharedSearch.minPrice ? String(sharedSearch.minPrice) : previous.minPriceInput,
        maxPriceInput: sharedSearch.maxPrice ? String(sharedSearch.maxPrice) : previous.maxPriceInput,
        minAreaInput: sharedSearch.minArea ? String(sharedSearch.minArea) : previous.minAreaInput,
        maxAreaInput: sharedSearch.maxArea ? String(sharedSearch.maxArea) : previous.maxAreaInput,
        verifiedOnly: sharedSearch.verifiedOnly,
      }))
      setHasAppliedUrlFilters(true)
      return
    }

    setKeywordInput(keywordFromUrl)
    setKeyword(keywordFromUrl)
    setSearchDistrict(parsePositiveNumber(districtFromUrl))
    setUrlOnlyFilters({
      furnitureStatuses: furnitureStatusFromUrl ? [furnitureStatusFromUrl] : undefined,
      postTypes: postTypeFromUrl ? [postTypeFromUrl] : undefined,
    })
    setFilters((previous) => ({
      ...previous,
      propertyTypes: propertyTypeFromUrl ? [propertyTypeFromUrl] : previous.propertyTypes,
      provinceCodes: provinceCodeFromUrl ? [provinceCodeFromUrl] : previous.provinceCodes,
      wardCodes: wardCodeFromUrl ? [wardCodeFromUrl] : previous.wardCodes,
      directions: directionFromUrl ? [directionFromUrl] : previous.directions,
      legalStatuses: legalStatusFromUrl ? [legalStatusFromUrl] : previous.legalStatuses,
      bedroomsList: bedroomsFromUrl ? [bedroomsFromUrl] : previous.bedroomsList,
      bathroomsList: bathroomsFromUrl ? [bathroomsFromUrl] : previous.bathroomsList,
      minPriceInput: minPriceFromUrl ? String(minPriceFromUrl) : previous.minPriceInput,
      maxPriceInput: maxPriceFromUrl ? String(maxPriceFromUrl) : previous.maxPriceInput,
      minAreaInput: minAreaFromUrl ? String(minAreaFromUrl) : previous.minAreaInput,
      maxAreaInput: maxAreaFromUrl ? String(maxAreaFromUrl) : previous.maxAreaInput,
    }))
    setPage(1)
    dispatch(
      setPropertySearchState({
        keyword: keywordFromUrl,
        district: parsePositiveNumber(districtFromUrl),
        provinceCodes: provinceCodeFromUrl ? [provinceCodeFromUrl] : [],
        wardCodes: wardCodeFromUrl ? [wardCodeFromUrl] : [],
        propertyTypes: propertyTypeFromUrl ? [propertyTypeFromUrl] : [],
        directions: directionFromUrl ? [directionFromUrl] : [],
        legalStatuses: legalStatusFromUrl ? [legalStatusFromUrl] : [],
        furnitureStatuses: furnitureStatusFromUrl ? [furnitureStatusFromUrl] : [],
        postTypes: postTypeFromUrl ? [postTypeFromUrl] : [],
        bedroomsList: bedroomsFromUrl ? [bedroomsFromUrl] : [],
        bathroomsList: bathroomsFromUrl ? [bathroomsFromUrl] : [],
        minPrice: minPriceFromUrl,
        maxPrice: maxPriceFromUrl,
        minArea: minAreaFromUrl,
        maxArea: maxAreaFromUrl,
      }),
    )
    setHasAppliedUrlFilters(true)
  }, [dispatch, hasAppliedUrlFilters, searchParams, sharedSearch])

  useEffect(() => {
    if (!hasAppliedUrlFilters) return

    dispatch(
      setPropertySearchState({
        activeTab: 'property',
        homeInput: keywordInput,
        keyword: keyword || '',
        district: searchDistrict,
        provinceCodes: filters.provinceCodes,
        wardCodes: filters.wardCodes,
        streets: filters.streets,
        projectIds: filters.projectIds,
        propertyTypes: filters.propertyTypes,
        directions: filters.directions,
        legalStatuses: filters.legalStatuses,
        furnitureStatuses: urlOnlyFilters.furnitureStatuses ?? [],
        postTypes: urlOnlyFilters.postTypes ?? [],
        bedroomsList: filters.bedroomsList,
        bathroomsList: filters.bathroomsList,
        minPrice: requestFilters.minPrice,
        maxPrice: requestFilters.maxPrice,
        minArea: requestFilters.minArea,
        maxArea: requestFilters.maxArea,
        verifiedOnly: filters.verifiedOnly,
      }),
    )
  }, [
    dispatch,
    filters,
    hasAppliedUrlFilters,
    keyword,
    keywordInput,
    requestFilters.maxArea,
    requestFilters.maxPrice,
    requestFilters.minArea,
    requestFilters.minPrice,
    searchDistrict,
    urlOnlyFilters.furnitureStatuses,
    urlOnlyFilters.postTypes,
  ])

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
    dispatch(
      setPropertySearchState({
        activeTab: 'property',
        homeInput: keywordInput,
        keyword: keyword || '',
        district: searchDistrict,
        provinceCodes: nextFilters.provinceCodes,
        wardCodes: nextFilters.wardCodes,
        streets: nextFilters.streets,
        projectIds: nextFilters.projectIds,
        propertyTypes: nextFilters.propertyTypes,
        directions: nextFilters.directions,
        legalStatuses: nextFilters.legalStatuses,
        furnitureStatuses: urlOnlyFilters.furnitureStatuses ?? [],
        postTypes: urlOnlyFilters.postTypes ?? [],
        bedroomsList: nextFilters.bedroomsList,
        bathroomsList: nextFilters.bathroomsList,
        verifiedOnly: nextFilters.verifiedOnly,
      }),
    )
  }

  const handleSidebarPriceRangeSelect = (rangeId: string) => {
    setFilters((previous) => ({
      ...previous,
      priceRangeIds: [rangeId],
      minPriceInput: '',
      maxPriceInput: '',
    }))
    setPage(1)
  }

  const handleSidebarAreaRangeSelect = (rangeId: string) => {
    setFilters((previous) => ({
      ...previous,
      areaRangeIds: [rangeId],
      minAreaInput: '',
      maxAreaInput: '',
    }))
    setPage(1)
  }

  const handleSidebarRegionSelect = (provinceCode: string) => {
    setFilters((previous) => ({
      ...previous,
      provinceCodes: [provinceCode],
      wardCodes: [],
      streets: [],
      projectIds: [],
    }))
    setPage(1)
  }

  const handleSearch = () => {
    const parsed = parseSearch(keywordInput, 'property')
    const nextKeyword = parsed.keyword.trim()

    setSearchDistrict(parsed.filters.district)
    setUrlOnlyFilters({
      furnitureStatuses: parsed.filters.furnitureStatus ? [parsed.filters.furnitureStatus] : [],
      postTypes: parsed.filters.postType ? [parsed.filters.postType] : [],
    })
    setFilters((previous) => ({
      ...previous,
      propertyTypes: parsed.filters.propertyType ? [parsed.filters.propertyType] : [],
      provinceCodes: parsed.filters.provinceCode ? [parsed.filters.provinceCode] : [],
      wardCodes: parsed.filters.wardCode ? [parsed.filters.wardCode] : [],
      directions: parsed.filters.direction ? [parsed.filters.direction] : [],
      legalStatuses: parsed.filters.legalStatus ? [parsed.filters.legalStatus] : [],
      bedroomsList: typeof parsed.filters.bedrooms === 'number' ? [parsed.filters.bedrooms] : [],
      bathroomsList:
        typeof parsed.filters.bathrooms === 'number' ? [parsed.filters.bathrooms] : [],
      minPriceInput:
        typeof parsed.filters.minPrice === 'number' ? String(parsed.filters.minPrice) : '',
      maxPriceInput:
        typeof parsed.filters.maxPrice === 'number' ? String(parsed.filters.maxPrice) : '',
      minAreaInput: typeof parsed.filters.minArea === 'number' ? String(parsed.filters.minArea) : '',
      maxAreaInput: typeof parsed.filters.maxArea === 'number' ? String(parsed.filters.maxArea) : '',
      streets: previous.streets,
      projectIds: previous.projectIds,
    }))
    setKeywordInput(keywordInput)
    setKeyword(nextKeyword)
    setPage(1)
    dispatch(
      setPropertySearchState({
        activeTab: 'property',
        homeInput: keywordInput,
        keyword: nextKeyword,
        district: parsed.filters.district,
        provinceCodes: parsed.filters.provinceCode ? [parsed.filters.provinceCode] : [],
        wardCodes: parsed.filters.wardCode ? [parsed.filters.wardCode] : [],
        propertyTypes: parsed.filters.propertyType ? [parsed.filters.propertyType] : [],
        directions: parsed.filters.direction ? [parsed.filters.direction] : [],
        legalStatuses: parsed.filters.legalStatus ? [parsed.filters.legalStatus] : [],
        furnitureStatuses: parsed.filters.furnitureStatus ? [parsed.filters.furnitureStatus] : [],
        postTypes: parsed.filters.postType ? [parsed.filters.postType] : [],
        bedroomsList: typeof parsed.filters.bedrooms === 'number' ? [parsed.filters.bedrooms] : [],
        bathroomsList:
          typeof parsed.filters.bathrooms === 'number' ? [parsed.filters.bathrooms] : [],
        minPrice: parsed.filters.minPrice,
        maxPrice: parsed.filters.maxPrice,
        minArea: parsed.filters.minArea,
        maxArea: parsed.filters.maxArea,
      }),
    )
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
          areaRanges={areaRangeOptions.map((range) => ({ id: range.id, label: range.label }))}
          news={newsItems}
          onAreaRangeSelect={handleSidebarAreaRangeSelect}
          onPriceRangeSelect={handleSidebarPriceRangeSelect}
          onRegionSelect={handleSidebarRegionSelect}
          priceRanges={priceRangeOptions.map((range) => ({ id: range.id, label: range.label }))}
          regions={regionOptions.map((region) => ({ value: region.value, label: region.label }))}
          selectedAreaRangeIds={filters.areaRangeIds}
          selectedPriceRangeIds={filters.priceRangeIds}
          selectedRegionCodes={filters.provinceCodes}
        />
      </div>
    </main>
  )
}

export default function PropertiesPage() {
  return (
    <Suspense>
      <PropertiesPageInner />
    </Suspense>
  )
}
