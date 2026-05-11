import type { Endpoint } from 'payload'
import divisions from '../app/data/vietnam-divisions.json'

type Division = {
  Code: string
  FullName: string
}

type PropertyFilterResponse = {
  success: boolean
  propertyTypes: string[]
  regions: Array<{ code: string; label: string }>
  priceRange: { min: number | null; max: number | null }
  areaRange: { min: number | null; max: number | null }
}

const getDivisionMap = () => {
  const map = new Map<string, string>()
  for (const division of divisions as Division[]) {
    map.set(String(division.Code), division.FullName)
  }
  return map
}

const updateMinMax = (value: unknown, current: { min: number | null; max: number | null }) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return
  if (current.min === null || value < current.min) current.min = value
  if (current.max === null || value > current.max) current.max = value
}

export const propertyFilters: Endpoint = {
  path: '/search/properties/filters',
  method: 'get',
  handler: async (req) => {
    const { payload } = req

    const propertyTypes = new Set<string>()
    const provinceCodes = new Set<string>()
    const priceRange = { min: null as number | null, max: null as number | null }
    const areaRange = { min: null as number | null, max: null as number | null }

    let page = 1
    let hasNextPage = true

    try {
      while (hasNextPage) {
        const result = await payload.find({
          collection: 'properties',
          where: {
            status: { equals: 'active' },
          },
          page,
          limit: 200,
          depth: 0,
          overrideAccess: false,
          req,
          select: {
            propertyType: true,
            provinceCode: true,
            price: true,
            area: true,
          },
        })

        for (const doc of result.docs) {
          if (typeof doc.propertyType === 'string' && doc.propertyType.length > 0) {
            propertyTypes.add(doc.propertyType)
          }
          if (typeof doc.provinceCode === 'string' && doc.provinceCode.length > 0) {
            provinceCodes.add(doc.provinceCode)
          }
          updateMinMax(doc.price, priceRange)
          updateMinMax(doc.area, areaRange)
        }

        hasNextPage = Boolean(result.hasNextPage)
        page = result.page + 1
      }

      const divisionMap = getDivisionMap()
      const regions = Array.from(provinceCodes)
        .map((code) => ({ code, label: divisionMap.get(code) || code }))
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'))

      const response: PropertyFilterResponse = {
        success: true,
        propertyTypes: Array.from(propertyTypes).sort((a, b) => a.localeCompare(b, 'vi')),
        regions,
        priceRange,
        areaRange,
      }

      return Response.json(response)
    } catch (error: any) {
      return Response.json({ error: error.message }, { status: 500 })
    }
  },
}
