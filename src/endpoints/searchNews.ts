import type { Endpoint } from 'payload'

type SearchNewsQuery = {
  keyword?: string
  category?: string
  isFeatured?: string
  page?: string
  limit?: string
  sort?: string
}

const parseBoolean = (value: string | undefined): boolean | undefined => {
  if (typeof value !== 'string') return undefined
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  return undefined
}

export const searchNews: Endpoint = {
  path: '/search/news',
  method: 'get',
  handler: async (req) => {
    const { payload } = req
    const query = (req.query || {}) as SearchNewsQuery

    const {
      keyword,
      category,
      isFeatured,
      page = '1',
      limit = '20',
      sort = '-publishedAt',
    } = query

    const isFeaturedBool = parseBoolean(isFeatured)

    const where: any = {
      and: [{ status: { equals: 'published' } }],
    }

    const keywordLike = keyword?.trim() ? `%${keyword.trim()}%` : undefined

    if (keywordLike) {
      where.and.push({
        or: [
          { title: { like: keywordLike } },
          { excerpt: { like: keywordLike } },
        ],
      })
    }

    if (category) {
      where.and.push({ category: { equals: category } })
    }

    if (typeof isFeaturedBool === 'boolean') {
      where.and.push({ isFeatured: { equals: isFeaturedBool } })
    }

    try {
      const result = await payload.find({
        collection: 'articles',
        where,
        page: Number(page),
        limit: Number(limit),
        sort: String(sort),
        depth: 1,
        overrideAccess: false,
        req,
      })

      return Response.json({
        success: true,
        data: result.docs,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          totalDocs: result.totalDocs,
          limit: result.limit,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'News search failed'
      return Response.json({ error: message }, { status: 500 })
    }
  },
}
