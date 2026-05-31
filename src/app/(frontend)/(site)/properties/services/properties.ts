import type { Property } from '@/payload-types'
import type { AxiosRequestConfig } from 'axios'
import { buildQuery } from '@/app/lib/query'
import { getJSON } from '@/app/lib/http'

const VIP_POST_TYPES = ['silver', 'gold', 'diamond']

type PayloadFindResponse<T> = {
  docs: T[]
}

type SearchPropertiesResponse = {
  success: boolean
  data: Property[]
  pagination: {
    page: number
    totalPages: number
    totalDocs: number
    hasNextPage: boolean
  }
}

export type PropertiesByPostTypeResponse = {
  data: Property[]
  page: number
  totalPages: number
  totalDocs: number
  hasMore: boolean
}

export type PropertyFiltersState = {
  keyword?: string
  district?: number
  verifiedOnly?: boolean
  propertyTypes?: string[]
  provinceCodes?: string[]
  wardCodes?: string[]
  streets?: string[]
  projectIds?: string[]
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  postTypes?: string[]
  directions?: string[]
  legalStatuses?: string[]
  furnitureStatuses?: string[]
  bedroomsList?: number[]
  bathroomsList?: number[]
}

export type PropertySortValue =
  | 'default'
  | 'price_asc'
  | 'price_desc'
  | 'area_asc'
  | 'area_desc'

export type PropertyFilterOptionsResponse = {
  success: boolean
  propertyTypes: string[]
  regions: Array<{ code: string; label: string }>
  wards: Array<{ code: string; label: string; provinceCode: string }>
  streets: Array<{ name: string; provinceCode: string; wardCode: string }>
  projects: Array<{ id: string; name: string; provinceCode: string; wardCode: string }>
  priceRange: { min: number | null; max: number | null }
  areaRange: { min: number | null; max: number | null }
  dynamicAttributes: Array<{
    key: string
    values: string[]
  }>
}

export async function fetchPropertiesByPostType(
  params?: {
    limit?: number
    page?: number
    sort?: PropertySortValue
    filters?: PropertyFiltersState
  },
  config?: AxiosRequestConfig,
): Promise<PropertiesByPostTypeResponse> {
  const sortBySelection: Record<PropertySortValue, string> = {
    default: '-createdAt',
    price_asc: 'price',
    price_desc: '-price',
    area_asc: 'area',
    area_desc: '-area',
  }

  const filters = params?.filters
  const query = buildQuery({
    sort: sortBySelection[params?.sort ?? 'default'],
    limit: typeof params?.limit === 'number' ? params.limit : 10,
    page: typeof params?.page === 'number' ? params.page : 1,
    keyword: filters?.keyword || undefined,
    district: typeof filters?.district === 'number' ? filters.district : undefined,
    verifiedOnly: filters?.verifiedOnly ? 'true' : undefined,
    propertyTypes: filters?.propertyTypes?.length ? filters.propertyTypes.join(',') : undefined,
    provinceCodes: filters?.provinceCodes?.length ? filters.provinceCodes.join(',') : undefined,
    wardCodes: filters?.wardCodes?.length ? filters.wardCodes.join(',') : undefined,
    streets: filters?.streets?.length ? filters.streets.join(',') : undefined,
    projectIds: filters?.projectIds?.length ? filters.projectIds.join(',') : undefined,
    minPrice: typeof filters?.minPrice === 'number' ? filters.minPrice : undefined,
    maxPrice: typeof filters?.maxPrice === 'number' ? filters.maxPrice : undefined,
    minArea: typeof filters?.minArea === 'number' ? filters.minArea : undefined,
    maxArea: typeof filters?.maxArea === 'number' ? filters.maxArea : undefined,
    postTypes: filters?.postTypes?.length ? filters.postTypes.join(',') : undefined,
    directions: filters?.directions?.length ? filters.directions.join(',') : undefined,
    legalStatuses: filters?.legalStatuses?.length ? filters.legalStatuses.join(',') : undefined,
    furnitureStatuses: filters?.furnitureStatuses?.length
      ? filters.furnitureStatuses.join(',')
      : undefined,
    bedroomsList: filters?.bedroomsList?.length ? filters.bedroomsList.join(',') : undefined,
    bathroomsList: filters?.bathroomsList?.length ? filters.bathroomsList.join(',') : undefined,
  })

  const response = await getJSON<SearchPropertiesResponse>(`/api/search/properties${query}`, config)

  return {
    data: response.data,
    page: response.pagination.page,
    totalPages: response.pagination.totalPages,
    totalDocs: response.pagination.totalDocs,
    hasMore: response.pagination.hasNextPage,
  }
}

export async function fetchForYouProperties(
  property: Property,
  limit = 6,
  config?: AxiosRequestConfig,
): Promise<Property[]> {
  const baseConditions: Array<Record<string, unknown>> = [
    {
      id: {
        not_equals: property.id,
      },
    },
    {
      status: {
        equals: 'active',
      },
    },
  ]

  if (property.wardCode) {
    baseConditions.push({
      or: [
        { wardCode: { equals: property.wardCode } },
        { provinceCode: { equals: property.provinceCode } },
      ],
    })
  } else if (property.provinceCode) {
    baseConditions.push({
      provinceCode: {
        equals: property.provinceCode,
      },
    })
  }

  const vipQuery = buildQuery({
    where: {
      and: [...baseConditions, { postType: { in: VIP_POST_TYPES } }],
    },
    sort: '-createdAt',
    limit,
    depth: 2,
  })

  const vipResponse = await getJSON<PayloadFindResponse<Property>>(
    `/api/properties${vipQuery}`,
    config,
  )

  const remaining = Math.max(limit - vipResponse.docs.length, 0)

  if (remaining === 0) {
    return vipResponse.docs
  }

  const normalQuery = buildQuery({
    where: {
      and: [...baseConditions, { postType: { equals: 'normal' } }],
    },
    sort: '-createdAt',
    limit: remaining,
    depth: 2,
  })

  const normalResponse = await getJSON<PayloadFindResponse<Property>>(
    `/api/properties${normalQuery}`,
    config,
  )

  return [...vipResponse.docs, ...normalResponse.docs]
}

export async function fetchPropertyFilterOptions(
  config?: AxiosRequestConfig,
): Promise<PropertyFilterOptionsResponse> {
  return getJSON<PropertyFilterOptionsResponse>('/api/search/properties/filters', config)
}
