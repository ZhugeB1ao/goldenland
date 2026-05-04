import type { Endpoint } from 'payload'

const parseIntInRange = (value: string | undefined, min: number, max: number): number | undefined => {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return undefined
  if (parsed < min || parsed > max) return undefined
  return parsed
}

const parseNumberMin = (value: string | undefined, min: number): number | undefined => {
  if (!value) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  if (parsed < min) return undefined
  return parsed
}

type SearchPropertiesQuery = {
  keyword?: string
  listingType?: string
  propertyType?: string
  provinceCode?: string
  wardCode?: string
  district?: string
  minPrice?: string
  maxPrice?: string
  minArea?: string
  maxArea?: string
  bedrooms?: string
  bathrooms?: string
  direction?: string
  legalStatus?: string
  furnitureStatus?: string
  postType?: string
  page?: string
  limit?: string
  sort?: string
}

export const searchProperties: Endpoint = {
  path: '/search/properties',
  method: 'get',
  handler: async (req) => {
    const { payload } = req
    const query = (req.query || {}) as SearchPropertiesQuery

    const {
      keyword,
      listingType,
      propertyType,
      provinceCode,
      wardCode,
      district,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      bedrooms,
      bathrooms,
      direction,
      legalStatus,
      furnitureStatus,
      postType,
      page = '1',
      limit = '20',
      sort = '-createdAt',
    } = query

    const pageNumber = parseIntInRange(page, 1, 200) ?? 1
    const limitNumber = parseIntInRange(limit, 1, 50) ?? 20
    const districtNumber = parseIntInRange(district, 1, 30)
    const bedroomsNumber = parseIntInRange(bedrooms, 1, 20)
    const bathroomsNumber = parseIntInRange(bathrooms, 1, 20)
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

    // Build where clause
    const where: any = {
      and: [{ status: { equals: 'active' } }],
    }

    if (keyword) {
      where.and.push({
        or: [
          { title: { like: keyword } },
          { description: { like: keyword } },
          { address: { like: keyword } },
        ],
      })
    }

    if (listingType) where.and.push({ listingType: { equals: listingType } })
    if (propertyType) where.and.push({ propertyType: { equals: propertyType } })
    if (provinceCode) where.and.push({ provinceCode: { equals: provinceCode } })
    if (wardCode) where.and.push({ wardCode: { equals: wardCode } })
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
    if (direction) where.and.push({ direction: { equals: direction } })
    if (legalStatus) where.and.push({ legalStatus: { equals: legalStatus } })
    if (furnitureStatus) where.and.push({ furnitureStatus: { equals: furnitureStatus } })
    if (postType) where.and.push({ postType: { equals: postType } })

    if (typeof minPriceNumber === 'number') {
      where.and.push({ price: { greater_than_equal: minPriceNumber } })
    }
    if (typeof maxPriceNumber === 'number') {
      where.and.push({ price: { less_than_equal: maxPriceNumber } })
    }
    if (typeof minAreaNumber === 'number') {
      where.and.push({ area: { greater_than_equal: minAreaNumber } })
    }
    if (typeof maxAreaNumber === 'number') {
      where.and.push({ area: { less_than_equal: maxAreaNumber } })
    }
    if (typeof bedroomsNumber === 'number') {
      where.and.push({ bedrooms: { equals: bedroomsNumber } })
    }
    if (typeof bathroomsNumber === 'number') {
      where.and.push({ bathrooms: { equals: bathroomsNumber } })
    }

    try {
      const result = await payload.find({
        collection: 'properties',
        where,
        page: pageNumber,
        limit: limitNumber,
        sort: String(sort),
        depth: 2,
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
    } catch (error: any) {
      return Response.json({ error: error.message }, { status: 500 })
    }
  },
}
