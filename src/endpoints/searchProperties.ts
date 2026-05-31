import type { Endpoint } from 'payload'
import type { User } from '@/payload-types'

const parseIntInRange = (
  value: string | undefined,
  min: number,
  max: number,
): number | undefined => {
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
  propertyType?: string
  propertyTypes?: string
  provinceCode?: string
  provinceCodes?: string
  wardCode?: string
  wardCodes?: string
  streets?: string
  projectIds?: string
  district?: string
  minPrice?: string
  maxPrice?: string
  minArea?: string
  maxArea?: string
  bedrooms?: string
  bedroomsList?: string
  bathrooms?: string
  bathroomsList?: string
  direction?: string
  directions?: string
  legalStatus?: string
  legalStatuses?: string
  furnitureStatus?: string
  furnitureStatuses?: string
  postType?: string
  postTypes?: string
  verifiedOnly?: string
  page?: string
  limit?: string
  sort?: string
}

const parseCsv = (value: string | undefined): string[] => {
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const propertyDistrictFallback = (districtNumber: number) => ({
  or: [
    { address: { like: `quận ${districtNumber}` } },
    { address: { like: `quan ${districtNumber}` } },
    { address: { like: `q.${districtNumber}` } },
    { address: { like: `q ${districtNumber}` } },
    { title: { like: `quận ${districtNumber}` } },
    { title: { like: `quan ${districtNumber}` } },
    { description: { like: `quận ${districtNumber}` } },
    { description: { like: `quan ${districtNumber}` } },
  ],
})

export const searchProperties: Endpoint = {
  path: '/search/properties',
  method: 'get',
  handler: async (req) => {
    const { payload } = req
    const query = (req.query || {}) as SearchPropertiesQuery

    const {
      keyword,
      propertyType,
      propertyTypes,
      provinceCode,
      provinceCodes,
      wardCode,
      wardCodes,
      streets,
      projectIds,
      district,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      bedrooms,
      bedroomsList,
      bathrooms,
      bathroomsList,
      direction,
      directions,
      legalStatus,
      legalStatuses,
      furnitureStatus,
      furnitureStatuses,
      postType,
      postTypes,
      verifiedOnly,
      page = '1',
      limit = '20',
      sort = '-createdAt',
    } = query

    const pageNumber = parseIntInRange(page, 1, 200) ?? 1
    const limitNumber = parseIntInRange(limit, 1, 50) ?? 20
    const districtNumber = parseIntInRange(district, 1, 30)
    const bedroomsNumber = parseIntInRange(bedrooms, 1, 20)
    const bathroomsNumber = parseIntInRange(bathrooms, 1, 20)
    const propertyTypeList = parseCsv(propertyTypes)
    const provinceCodeList = parseCsv(provinceCodes)
    const directionList = parseCsv(directions)
    const wardCodeList = parseCsv(wardCodes)
    const streetList = parseCsv(streets)
    const projectIdList = parseCsv(projectIds)
    const legalStatusList = parseCsv(legalStatuses)
    const furnitureStatusList = parseCsv(furnitureStatuses)
    const postTypeList = parseCsv(postTypes)
    const bedroomsListParsed = parseCsv(bedroomsList)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value) && value >= 0 && value <= 99)
    const bathroomsListParsed = parseCsv(bathroomsList)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value) && value >= 0 && value <= 99)
    const verifiedOnlyFlag = ['1', 'true', 'yes'].includes(String(verifiedOnly).toLowerCase())
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
          { slug: { like: keyword } },
          { description: { like: keyword } },
          { address: { like: keyword } },
          { street: { like: keyword } },
          { videoUrl: { like: keyword } },
          { seoTitle: { like: keyword } },
          { seoDescription: { like: keyword } },
          { seoKeywords: { like: keyword } },
        ],
      })
    }

    if (propertyTypeList.length > 0) {
      where.and.push({ propertyType: { in: propertyTypeList } })
    } else if (propertyType) {
      where.and.push({ propertyType: { equals: propertyType } })
    }

    if (provinceCodeList.length > 0) {
      where.and.push({ provinceCode: { in: provinceCodeList } })
    } else if (provinceCode) {
      where.and.push({ provinceCode: { equals: provinceCode } })
    }

    if (wardCodeList.length > 0) {
      where.and.push({ wardCode: { in: wardCodeList } })
    } else if (wardCode) {
      where.and.push({ wardCode: { equals: wardCode } })
    }
    if (streetList.length > 0) {
      where.and.push({ street: { in: streetList } })
    }
    if (projectIdList.length > 0) {
      where.and.push({ project: { in: projectIdList } })
    }
    if (districtNumber) {
      // Collection currently has no dedicated district field, so we fallback to searchable text fields.
      where.and.push(propertyDistrictFallback(districtNumber))
    }
    if (directionList.length > 0) {
      where.and.push({ direction: { in: directionList } })
    } else if (direction) {
      where.and.push({ direction: { equals: direction } })
    }

    if (legalStatusList.length > 0) {
      where.and.push({ legalStatus: { in: legalStatusList } })
    } else if (legalStatus) {
      where.and.push({ legalStatus: { equals: legalStatus } })
    }

    if (furnitureStatusList.length > 0) {
      where.and.push({ furnitureStatus: { in: furnitureStatusList } })
    } else if (furnitureStatus) {
      where.and.push({ furnitureStatus: { equals: furnitureStatus } })
    }

    if (postTypeList.length > 0) {
      where.and.push({ postType: { in: postTypeList } })
    } else if (postType) {
      where.and.push({ postType: { equals: postType } })
    }

    if (verifiedOnlyFlag) {
      where.and.push({ isVerified: { equals: true } })
    }

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
    if (bedroomsListParsed.length > 0) {
      where.and.push({ bedrooms: { in: bedroomsListParsed } })
    } else if (typeof bedroomsNumber === 'number') {
      where.and.push({ bedrooms: { equals: bedroomsNumber } })
    }
    if (bathroomsListParsed.length > 0) {
      where.and.push({ bathrooms: { in: bathroomsListParsed } })
    } else if (typeof bathroomsNumber === 'number') {
      where.and.push({ bathrooms: { equals: bathroomsNumber } })
    }

    try {
      const sortParts = String(sort)
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0 && part !== 'postType' && part !== '-postType')
      const resolvedSort = ['-postType', ...sortParts]

      const result = await payload.find({
        collection: 'properties',
        where,
        page: pageNumber,
        limit: limitNumber,
        sort: resolvedSort,
        depth: 2,
        overrideAccess: false,
        req,
      })

      const userIds = result.docs
        .map((doc) => (typeof doc.user === 'object' && doc.user ? doc.user.id : doc.user))
        .filter((id) => id !== null && id !== undefined)
        .map((id) => String(id))

      const uniqueUserIds = Array.from(new Set(userIds))
      const userMap = new Map<string, User>()

      if (uniqueUserIds.length > 0) {
        const users = await payload.find({
          collection: 'users',
          where: {
            id: {
              in: uniqueUserIds,
            },
          },
          limit: uniqueUserIds.length,
          depth: 0,
          overrideAccess: true,
          select: {
            id: true,
            fullName: true,
            phone: true,
            avatar_id: true,
          },
        })

        for (const user of users.docs as User[]) {
          userMap.set(String(user.id), user)
        }
      }

      const data = result.docs.map((doc) => {
        const userId = typeof doc.user === 'object' && doc.user ? doc.user.id : doc.user
        if (!userId) return doc

        const safeUser = userMap.get(String(userId))
        if (!safeUser) return doc

        return {
          ...doc,
          user: safeUser,
        }
      })

      return Response.json({
        success: true,
        data,
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
