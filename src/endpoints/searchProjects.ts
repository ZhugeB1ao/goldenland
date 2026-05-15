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
  provinceCode?: string
  propertyType?: string
  saleStatus?: string
  minPrice?: string
  maxPrice?: string
  minArea?: string
  maxArea?: string
  page?: string
  limit?: string
  sort?: string
}

const parseNumberMin = (value: string | undefined, min: number): number | undefined => {
  if (!value) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  if (parsed < min) return undefined
  return parsed
}

const projectDistrictFallback = (districtNumber: number) => ({
  or: [
    { address: { like: `quận ${districtNumber}` } },
    { address: { like: `quan ${districtNumber}` } },
    { address: { like: `q.${districtNumber}` } },
    { address: { like: `q ${districtNumber}` } },
    { name: { like: `quận ${districtNumber}` } },
    { name: { like: `quan ${districtNumber}` } },
  ],
})

export const searchProjects: Endpoint = {
  path: '/search/projects',
  method: 'get',
  handler: async (req) => {
    const { payload } = req
    const query = (req.query || {}) as SearchProjectsQuery

    const {
      keyword,
      district,
      provinceCode,
      propertyType,
      saleStatus,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      page = '1',
      limit = '20',
      sort = '-createdAt',
    } = query

    const pageNumber = parseIntInRange(page, 1, 200) ?? 1
    const limitNumber = parseIntInRange(limit, 1, 50) ?? 20
    const districtNumber = parseIntInRange(district, 1, 30)
    let minPriceNumber = parseNumberMin(minPrice, 0)
    let maxPriceNumber = parseNumberMin(maxPrice, 0)
    let minAreaNumber = parseNumberMin(minArea, 0)
    let maxAreaNumber = parseNumberMin(maxArea, 0)

    if (
      typeof minPriceNumber === 'number' &&
      typeof maxPriceNumber === 'number' &&
      minPriceNumber > maxPriceNumber
    ) {
      ;[minPriceNumber, maxPriceNumber] = [maxPriceNumber, minPriceNumber]
    }

    if (
      typeof minAreaNumber === 'number' &&
      typeof maxAreaNumber === 'number' &&
      minAreaNumber > maxAreaNumber
    ) {
      ;[minAreaNumber, maxAreaNumber] = [maxAreaNumber, minAreaNumber]
    }

    const where: any = {
      and: [{ status: { equals: 'active' } }],
    }

    if (keyword) {
      where.and.push({
        or: [
          { name: { like: keyword } },
          { address: { like: keyword } },
          { slug: { like: keyword } },
          { videoUrl: { like: keyword } },
          { seoTitle: { like: keyword } },
          { seoDescription: { like: keyword } },
          { saleStatus: { like: keyword } },
          { propertyTypes: { like: keyword } },
          { provinceCode: { like: keyword } },
          { wardCode: { like: keyword } },
          { 'zones.name': { like: keyword } },
          { 'zones.description': { like: keyword } },
        ],
      })
    }

    if (provinceCode) {
      where.and.push({ provinceCode: { equals: provinceCode } })
    }

    if (propertyType) {
      where.and.push({ propertyTypes: { in: [propertyType] } })
    }

    if (saleStatus) {
      where.and.push({ saleStatus: { equals: saleStatus } })
    }

    if (districtNumber) {
      // Collection currently has no dedicated district field, so we fallback to searchable text fields.
      where.and.push(projectDistrictFallback(districtNumber))
    }

    if (typeof minPriceNumber === 'number') {
      where.and.push({ priceTo: { greater_than_equal: minPriceNumber } })
    }

    if (typeof maxPriceNumber === 'number') {
      where.and.push({ priceFrom: { less_than_equal: maxPriceNumber } })
    }

    if (typeof minAreaNumber === 'number') {
      where.and.push({ totalArea: { greater_than_equal: minAreaNumber } })
    }

    if (typeof maxAreaNumber === 'number') {
      where.and.push({ totalArea: { less_than_equal: maxAreaNumber } })
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
