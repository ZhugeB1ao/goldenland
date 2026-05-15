import type { Endpoint } from 'payload'
import divisions from '../app/data/vietnam-divisions.json'

type SearchNewsQuery = {
  keyword?: string
  district?: string
  provinceCode?: string
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

const parseIntInRange = (value: string | undefined, min: number, max: number): number | undefined => {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return undefined
  if (parsed < min || parsed > max) return undefined
  return parsed
}

const newsDistrictFallback = (districtNumber: number) => ({
  or: [
    { title: { like: `quận ${districtNumber}` } },
    { title: { like: `quan ${districtNumber}` } },
    { excerpt: { like: `quận ${districtNumber}` } },
    { excerpt: { like: `quan ${districtNumber}` } },
    { tags: { like: `quận ${districtNumber}` } },
    { tags: { like: `quan ${districtNumber}` } },
  ],
})

export const searchNews: Endpoint = {
  path: '/search/news',
  method: 'get',
  handler: async (req) => {
    const { payload } = req
    const query = (req.query || {}) as SearchNewsQuery

    const {
      keyword,
      district,
      provinceCode,
      category,
      isFeatured,
      page = '1',
      limit = '20',
      sort = '-publishedAt',
    } = query

    const districtNumber = parseIntInRange(district, 1, 30)
    const isFeaturedBool = parseBoolean(isFeatured)
    const provinceName = provinceCode
      ? (divisions.find((province) => String(province.Code) === String(provinceCode))?.FullName ?? '')
      : ''

    const where: any = {
      and: [{ status: { equals: 'published' } }],
    }

    if (keyword) {
      where.and.push({
        or: [
          { title: { like: keyword } },
          { slug: { like: keyword } },
          { excerpt: { like: keyword } },
          { tags: { like: keyword } },
          { seoTitle: { like: keyword } },
          { seoDescription: { like: keyword } },
          { seoKeywords: { like: keyword } },
          { thumbnailUrl: { like: keyword } },
        ],
      })
    }

    if (category) {
      where.and.push({ category: { equals: category } })
    }

    if (typeof isFeaturedBool === 'boolean') {
      where.and.push({ isFeatured: { equals: isFeaturedBool } })
    }

    if (provinceName) {
      where.and.push({
        or: [
          { title: { like: provinceName } },
          { excerpt: { like: provinceName } },
          { tags: { like: provinceName } },
          { seoTitle: { like: provinceName } },
          { seoDescription: { like: provinceName } },
        ],
      })
    }

    if (districtNumber) {
      // Collection currently has no dedicated district field, so we fallback to searchable text fields.
      where.and.push(newsDistrictFallback(districtNumber))
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
