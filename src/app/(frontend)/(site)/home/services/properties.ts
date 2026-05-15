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

export async function fetchPropertyDetail(
  id: string,
  config?: AxiosRequestConfig,
): Promise<PropertyDetailResponse> {
  const response = await getJSON<Property | PropertyDetailResponse>(`/api/properties/${id}`, config)

  if (response && typeof response === 'object' && 'property' in response) {
    return response as PropertyDetailResponse
  }

  return { property: response as Property }
}

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

type CountWhereClause = {
  or?: Array<Record<string, unknown>>
  provinceCode?: {
    equals: string
  }
}

function buildLocationCountWhere(locationId: string): CountWhereClause {
  const normalized = String(locationId).trim()

  if (normalized === '01' || normalized === '1') {
    return {
      or: [{ provinceCode: { equals: '01' } }, { provinceCode: { equals: '1' } }],
    }
  }

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

export async function fetchPropertiesCountByLocation(
  locationId: string,
  config?: AxiosRequestConfig,
): Promise<number> {
  const query = buildQuery({
    where: buildLocationCountWhere(locationId),
  })

  const response = await getJSON<PropertiesCountByLocationApiResponse>(
    `/api/properties/count${query}`,
    config,
  )

  return response.totalDocs
}
