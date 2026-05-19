import type { Property, User } from '@/payload-types'
import type { Payload } from 'payload'

import type { AxiosRequestConfig } from 'axios'
import { buildQuery } from '@/app/lib/query'
import { getJSON } from '@/app/lib/http'

type PropertiesCountByLocationApiResponse = {
  totalDocs: number
}

type PayloadFindResponse<T> = {
  docs: T[]
  page: number
  totalPages: number
  totalDocs: number
  hasNextPage: boolean
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

export type PropertiesResponse = {
  properties: Property[]
}

export type PropertyDetailResponse = {
  property: Property
}

export type NewPropertiesResponse = {
  data: Property[]
  page: number
  totalPages: number
  totalDocs: number
  hasMore: boolean
}

export type PropertiesByPostTypeResponse = NewPropertiesResponse

export type PropertiesByIdsResponse = Property[]

export type PropertyFilterOptionsResponse = {
  success: boolean
  propertyTypes: string[]
  regions: Array<{ code: string; label: string }>
  priceRange: { min: number | null; max: number | null }
  areaRange: { min: number | null; max: number | null }
}

// Exporting list of properties, limit to 100 properties.
export async function fetchProperties(config?: AxiosRequestConfig): Promise<PropertiesResponse> {
  return getJSON<PropertiesResponse>('/api/properties', config)
}
// Exporting property detail by id.
export async function fetchPropertyDetail(id: string, config?: AxiosRequestConfig): Promise<PropertyDetailResponse> {
  const query = buildQuery({
    depth: 2, // Get associated user/project data
  })
  const response = await getJSON<Property | PropertyDetailResponse>(`/api/properties/${id}${query ? `?${query}` : ''}`, config)


  if (response && typeof response === 'object' && 'property' in response) {
    return response as PropertyDetailResponse
  }

  return { property: response as Property }
}

export async function fetchForYouProperties(
  property: Property,
  limit = 6,
  config?: AxiosRequestConfig,
): Promise<Property[]> {
  const baseQuery: any = {
    where: {
      and: [
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
      ],
    },
  }

  if (property.wardCode) {
    baseQuery.where.and.push({
      or: [
        { wardCode: { equals: property.wardCode } },
        { provinceCode: { equals: property.provinceCode } },
      ],
    })
  } else if (property.provinceCode) {
    baseQuery.where.and.push({
      provinceCode: {
        equals: property.provinceCode,
      },
    })
  }

  // Get VIP properties first
  const vipQuery = buildQuery({
    ...baseQuery,
    where: {
      and: [...baseQuery.where.and, { postType: { equals: 'vip' } }],
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

  // Get normal properties for the remaining slots
  const normalQuery = buildQuery({
    ...baseQuery,
    where: {
      and: [...baseQuery.where.and, { postType: { not_equals: 'vip' } }],
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

// Exporting new properties base on createdAt field, sorted by createdAt in descending order, limit to 8 properties. Client can sent limit = 8 to get next 8 properties, and so on. If limit is not sent, default to 8 properties.
export async function fetchNewProperties(
  params?: {
    limit?: number
    page?: number
  },
  config?: AxiosRequestConfig,
): Promise<NewPropertiesResponse> {
  const query = buildQuery({
    sort: '-createdAt',
    limit: typeof params?.limit === 'number' ? params.limit : 8,
    page: typeof params?.page === 'number' ? params.page : 1,
    depth: 2, // Ensure we get the associated user data
  })

  const response = await getJSON<PayloadFindResponse<Property>>(`/api/properties${query}`, config)

  return {
    data: response.docs,
    page: response.page,
    totalPages: response.totalPages,
    totalDocs: response.totalDocs,
    hasMore: response.hasNextPage,
  }
}

export async function fetchPropertiesByPostType(
  params?: {
    limit?: number
    page?: number
  },
  config?: AxiosRequestConfig,
): Promise<PropertiesByPostTypeResponse> {
  const query = buildQuery({
    sort: '-postType,-createdAt',
    limit: typeof params?.limit === 'number' ? params.limit : 10,
    page: typeof params?.page === 'number' ? params.page : 1,
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

export async function fetchPropertiesByIds(
  ids: Array<number | string>,
  config?: AxiosRequestConfig,
): Promise<PropertiesByIdsResponse> {
  if (!ids.length) return []

  const query = buildQuery({
    where: {
      id: {
        in: ids,
      },
    },
    limit: ids.length,
    depth: 0,
  })

  const response = await getJSON<PayloadFindResponse<Property>>(`/api/properties${query}`, config)

  return response.docs
}

export async function fetchPropertyFilterOptions(
  config?: AxiosRequestConfig,
): Promise<PropertyFilterOptionsResponse> {
  return getJSON<PropertyFilterOptionsResponse>('/api/search/properties/filters', config)
}

export type PropertiesCountByLocationResponse = number

type CountWhereClause = {
  or?: Array<Record<string, unknown>>
  provinceCode?: {
    equals: string
  }
}

function buildLocationCountWhere(locationId: string): CountWhereClause {
  const normalized = String(locationId).trim()

  // Hà Nội can appear as either "01" or "1" in different datasets.
  if (normalized === '01' || normalized === '1') {
    return {
      or: [
        { provinceCode: { equals: '01' } },
        { provinceCode: { equals: '1' } },
      ],
    }
  }

  // Đồng Nai old/new code compatibility.
  if (normalized === '77' || normalized === '75') {
    return {
      or: [
        { provinceCode: { equals: '75' } },
        { provinceCode: { equals: '77' } },
        { address: { contains: 'Đồng Nai' } },
        { address: { contains: 'Dong Nai' } },
      ],
    }
  }

  // Bình Dương may be represented by legacy code or merged-code datasets.
  if (normalized === '74') {
    return {
      or: [
        { provinceCode: { equals: '74' } },
        { address: { contains: 'Bình Dương' } },
        { address: { contains: 'Binh Duong' } },
      ],
    }
  }

  return {
    provinceCode: {
      equals: normalized,
    },
  }
}

// Exporting count of properties base on location id
export async function fetchPropertiesCountByLocation(locationId: string, config?: AxiosRequestConfig): Promise<PropertiesCountByLocationResponse> {
  // Payload count endpoint returns matched document count in totalDocs.
  const query = buildQuery({
    where: buildLocationCountWhere(locationId),
  })

  const response = await getJSON<PropertiesCountByLocationApiResponse>(
    `/api/properties/count${query}`,
    config,
  )

  return response.totalDocs
}
