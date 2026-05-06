import type { Project } from '@/payload-types'
import type { AxiosRequestConfig } from 'axios'
import { buildQuery } from '@/app/lib/query'
import { getJSON } from '@/app/lib/http'

type PayloadFindResponse<T> = {
  docs: T[]
  page: number
  totalPages: number
  totalDocs: number
  hasNextPage: boolean
}

export type ProjectsResponse = {
  data: Project[]
  page: number
  totalPages: number
  totalDocs: number
  hasMore: boolean
}

/**
 * Fetches the top 4 real estate projects based on the highest view count.
 */
export async function fetchFeaturedProjects(
  config?: AxiosRequestConfig,
): Promise<ProjectsResponse> {
  const query = buildQuery({
    sort: '-views',
    limit: 4,
    page: 1,
    where: {
      status: {
        equals: 'active',
      },
    },
  })

  const response = await getJSON<PayloadFindResponse<Project>>(`/api/projects${query}`, config)

  return {
    data: response.docs,
    page: response.page,
    totalPages: response.totalPages,
    totalDocs: response.totalDocs,
    hasMore: response.hasNextPage,
  }
}

/**
 * Fetches the 7 most recent projects based on the creation date.
 */
export async function fetchNewestProjects(
  config?: AxiosRequestConfig,
): Promise<ProjectsResponse> {
  const query = buildQuery({
    sort: '-createdAt',
    limit: 7,
    page: 1,
    where: {
      status: {
        equals: 'active',
      },
    },
  })

  const response = await getJSON<PayloadFindResponse<Project>>(`/api/projects${query}`, config)

  return {
    data: response.docs,
    page: response.page,
    totalPages: response.totalPages,
    totalDocs: response.totalDocs,
    hasMore: response.hasNextPage,
  }
}
