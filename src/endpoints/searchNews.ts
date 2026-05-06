import type { Endpoint } from 'payload'

type SearchNewsQuery = {
  keyword?: string
  page?: string
  limit?: string
  sort?: string
}

export const searchNews: Endpoint = {
  path: '/search/news',
  method: 'get',
  handler: async (req) => {
    const { payload } = req
    const query = (req.query || {}) as SearchNewsQuery

    const {
      keyword,
      page = '1',
      limit = '20',
      sort = '-publishedAt',
    } = query

    const where: any = {
      and: [{ status: { equals: 'published' } }],
    }

    if (keyword) {
      where.and.push({
        or: [
          { title: { like: keyword } },
          { excerpt: { like: keyword } },
          { tags: { like: keyword } },
        ],
      })
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
