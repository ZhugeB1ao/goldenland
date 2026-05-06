import type { Article, Project, Property } from '@/payload-types'
import { buildQuery } from '@/app/lib/query'
import type { ParsedSearchResult, SearchTab } from '@/app/lib/hybridSearch'
import { getJSON } from '@/app/lib/http'

type SearchPagination = {
  page: number
  totalPages: number
  totalDocs: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

type SearchResponse<T> = {
  success: boolean
  data: T[]
  pagination: SearchPagination
}

export type HybridSearchGroup<T> = {
  items: T[]
  total: number
  error?: string
}

export type HybridSearchResult = {
  tab: SearchTab
  parsed: ParsedSearchResult
  property: HybridSearchGroup<Property>
  project: HybridSearchGroup<Project>
  news: HybridSearchGroup<Article>
}

type SearchOptions = {
  page?: number
  limit?: number
}

const DEFAULT_LIMIT = 6

const emptyGroup = <T>(): HybridSearchGroup<T> => ({
  items: [],
  total: 0,
})

export async function searchPropertiesByParsed(
  parsed: ParsedSearchResult,
  options?: SearchOptions,
): Promise<HybridSearchGroup<Property>> {
  const query = buildQuery({
    keyword: parsed.keyword || undefined,
    district: parsed.filters.district || undefined,
    listingType: parsed.filters.listingType || undefined,
    propertyType: parsed.filters.propertyType || undefined,
    bedrooms: parsed.filters.bedrooms || undefined,
    bathrooms: parsed.filters.bathrooms || undefined,
    minPrice: parsed.filters.minPrice || undefined,
    maxPrice: parsed.filters.maxPrice || undefined,
    minArea: parsed.filters.minArea || undefined,
    maxArea: parsed.filters.maxArea || undefined,
    direction: parsed.filters.direction || undefined,
    legalStatus: parsed.filters.legalStatus || undefined,
    postType: parsed.filters.postType || undefined,
    furnitureStatus: parsed.filters.furnitureStatus || undefined,
    page: options?.page ?? 1,
    limit: options?.limit ?? DEFAULT_LIMIT,
    sort: '-createdAt',
  })

  const response = await getJSON<SearchResponse<Property>>(`/api/search/properties${query}`)

  return {
    items: response.data,
    total: response.pagination.totalDocs,
  }
}

export async function searchProjectsByParsed(
  parsed: ParsedSearchResult,
  options?: SearchOptions,
): Promise<HybridSearchGroup<Project>> {
  const query = buildQuery({
    keyword: parsed.keyword || undefined,
    district: parsed.filters.district || undefined,
    page: options?.page ?? 1,
    limit: options?.limit ?? DEFAULT_LIMIT,
    sort: '-createdAt',
  })

  const response = await getJSON<SearchResponse<Project>>(`/api/search/projects${query}`)

  return {
    items: response.data,
    total: response.pagination.totalDocs,
  }
}

export async function searchNewsByParsed(
  parsed: ParsedSearchResult,
  options?: SearchOptions,
): Promise<HybridSearchGroup<Article>> {
  const query = buildQuery({
    keyword: parsed.keyword || undefined,
    page: options?.page ?? 1,
    limit: options?.limit ?? DEFAULT_LIMIT,
    sort: '-publishedAt',
  })

  const response = await getJSON<SearchResponse<Article>>(`/api/search/news${query}`)

  return {
    items: response.data,
    total: response.pagination.totalDocs,
  }
}

export async function runHybridSearch(
  parsed: ParsedSearchResult,
  options?: SearchOptions,
): Promise<HybridSearchResult> {
  const baseResult: HybridSearchResult = {
    tab: parsed.tab,
    parsed,
    property: emptyGroup<Property>(),
    project: emptyGroup<Project>(),
    news: emptyGroup<Article>(),
  }

  if (parsed.tab === 'property') {
    return {
      ...baseResult,
      property: await searchPropertiesByParsed(parsed, options),
    }
  }

  if (parsed.tab === 'project') {
    return {
      ...baseResult,
      project: await searchProjectsByParsed(parsed, options),
    }
  }

  if (parsed.tab === 'news') {
    return {
      ...baseResult,
      news: await searchNewsByParsed(parsed, options),
    }
  }

  const [property, project, news] = await Promise.allSettled([
    searchPropertiesByParsed(parsed, options),
    searchProjectsByParsed(parsed, options),
    searchNewsByParsed(parsed, options),
  ])

  return {
    ...baseResult,
    property:
      property.status === 'fulfilled'
        ? property.value
        : { ...emptyGroup<Property>(), error: property.reason?.message || 'Search failed' },
    project:
      project.status === 'fulfilled'
        ? project.value
        : { ...emptyGroup<Project>(), error: project.reason?.message || 'Search failed' },
    news:
      news.status === 'fulfilled'
        ? news.value
        : { ...emptyGroup<Article>(), error: news.reason?.message || 'Search failed' },
  }
}
