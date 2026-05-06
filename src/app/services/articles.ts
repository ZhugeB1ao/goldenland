import type { AxiosRequestConfig } from 'axios'
import type { Article } from '@/payload-types'
import { buildQuery } from '@/app/lib/query'
import { getJSON, getServerBaseURL } from '@/app/lib/http'

// Payload find response shape
type PayloadFindResponse<T> = {
  docs: T[]
}

type RawFeaturedArticle = Pick<Article, 'id' | 'title' | 'excerpt' | 'updatedAt' | 'thumbnailUrl'>

export type FeaturedArticleSummary = Pick<Article, 'id' | 'title' | 'excerpt' | 'updatedAt'> & {
  imageUrl?: string | null
}

const resolveMediaURL = (thumbnailUrl?: string | null): string | undefined => {
  if (!thumbnailUrl) return undefined
  if (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://')) {
    return thumbnailUrl
  }

  return `${getServerBaseURL()}${thumbnailUrl}`
}

// Fetch featured articles by category id
export async function fetchFeaturedArticlesBasedOnCategoryId(
  category: string | number,
  config?: AxiosRequestConfig,
): Promise<FeaturedArticleSummary[]> {
  // Normalize numeric category values from UI params.
  const categoryValue = /^\d+$/.test(String(category)) ? Number(category) : category

  // Request only fields used by the featured section.
  const query = buildQuery({
      select: {
          title: true,
          excerpt: true,
          updatedAt: true,
          thumbnailUrl: true,
      },
      where: {
          category: {
          equals: categoryValue,
          },
      },
      limit: 6,
      sort: '-createdAt',
  })

  const response = await getJSON<PayloadFindResponse<RawFeaturedArticle>>(
    `/api/articles${query}`,
    config,
  )

  // Keep only fields used by the homepage section.
  return response.docs.map(({ id, title, excerpt, updatedAt, thumbnailUrl }) => ({
    id,
    title,
    excerpt,
    updatedAt,
    imageUrl: resolveMediaURL(thumbnailUrl),
  }))
}

// Fetch 6 published real-estate news articles (category = 6) sorted by highest view count.
export async function fetchTopViewedRealEstateNews(
  config?: AxiosRequestConfig,
): Promise<FeaturedArticleSummary[]> {
  const query = buildQuery({
    select: {
      title: true,
      excerpt: true,
      updatedAt: true,
      thumbnailUrl: true,
    },
    where: {
      and: [
        {
          category: {
            equals: 6,
          },
        },
        {
          status: {
            equals: 'published',
          },
        },
      ],
    },
    limit: 6,
    sort: '-viewCount',
  })

  const response = await getJSON<PayloadFindResponse<RawFeaturedArticle>>(
    `/api/articles${query}`,
    config,
  )

  return response.docs.map(({ id, title, excerpt, updatedAt, thumbnailUrl }) => ({
    id,
    title,
    excerpt,
    updatedAt,
    imageUrl: resolveMediaURL(thumbnailUrl),
  }))
}




