import type { Property } from '@/payload-types'
import type { AxiosRequestConfig } from 'axios'
import { buildQuery } from '@/app/lib/query'
import { getJSON } from '@/app/lib/http'

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

export type PropertyFilterOptionsResponse = {
  success: boolean
  propertyTypes: string[]
  regions: Array<{ code: string; label: string }>
  priceRange: { min: number | null; max: number | null }
  areaRange: { min: number | null; max: number | null }
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

export async function fetchPropertyFilterOptions(
  config?: AxiosRequestConfig,
): Promise<PropertyFilterOptionsResponse> {
  return getJSON<PropertyFilterOptionsResponse>('/api/search/properties/filters', config)
}
