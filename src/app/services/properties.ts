import type { Property } from '@/payload-types'
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

export type PropertiesByIdsResponse = Property[]

// Exporting list of properties, limit to 100 properties.
export async function fetchProperties(config?: AxiosRequestConfig): Promise<PropertiesResponse> {
  return getJSON<PropertiesResponse>('/api/properties', config)
}
// Exporting property detail by id.
export async function fetchPropertyDetail(id: string, config?: AxiosRequestConfig): Promise<PropertyDetailResponse> {
  const response = await getJSON<Property | PropertyDetailResponse>(`/api/properties/${id}`, config)

  if (response && typeof response === 'object' && 'property' in response) {
    return response as PropertyDetailResponse
  }

  return { property: response as Property }
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
