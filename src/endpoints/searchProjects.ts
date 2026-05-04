import type { Endpoint } from 'payload'

const parseIntInRange = (value: string | undefined, min: number, max: number): number | undefined => {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return undefined
  if (parsed < min || parsed > max) return undefined
  return parsed
}

type SearchProjectsQuery = {
  keyword?: string
  district?: string
  page?: string
  limit?: string
  sort?: string
}

export const searchProjects: Endpoint = {
  path: '/search/projects',
  method: 'get',
  handler: async (req) => {
    const { payload } = req
    const query = (req.query || {}) as SearchProjectsQuery

    const {
      keyword,
      district,
      page = '1',
      limit = '20',
      sort = '-createdAt',
    } = query

    const pageNumber = parseIntInRange(page, 1, 200) ?? 1
    const limitNumber = parseIntInRange(limit, 1, 50) ?? 20
    const districtNumber = parseIntInRange(district, 1, 30)

    const where: any = {
      and: [{ status: { equals: 'active' } }],
    }

    if (keyword) {
      where.and.push({
        or: [
          { name: { like: keyword } },
          { address: { like: keyword } },
          { slug: { like: keyword } },
        ],
      })
    }

    if (districtNumber) {
      where.and.push({
        or: [
          { address: { like: `quận ${districtNumber}` } },
          { address: { like: `quan ${districtNumber}` } },
          { address: { like: `q.${districtNumber}` } },
          { address: { like: `q ${districtNumber}` } },
          { address: { like: ` q${districtNumber}` } },
        ],
      })
    }

    try {
      const result = await payload.find({
        collection: 'projects',
        where,
        page: pageNumber,
        limit: limitNumber,
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
      const message = error instanceof Error ? error.message : 'Project search failed'
      return Response.json({ error: message }, { status: 500 })
    }
  },
}
