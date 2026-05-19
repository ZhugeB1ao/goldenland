import type { Endpoint } from 'payload'
import divisions from '../app/data/vietnam-divisions.json'

type Division = {
  Code: string
  FullName: string
  Wards?: Array<{
    Code: string
    FullName: string
  }>
}

type PropertyFilterResponse = {
  success: boolean
  propertyTypes: string[]
  regions: Array<{ code: string; label: string }>
  wards: Array<{ code: string; label: string; provinceCode: string }>
  streets: Array<{ name: string; provinceCode: string; wardCode: string }>
  projects: Array<{ id: string; name: string; provinceCode: string; wardCode: string }>
  priceRange: { min: number | null; max: number | null }
  areaRange: { min: number | null; max: number | null }
  dynamicAttributes: Array<{
    key: string
    values: string[]
  }>
}

const getDivisionMaps = () => {
  const provinceMap = new Map<string, string>()
  const wardMap = new Map<string, string>()
  for (const division of divisions as Division[]) {
    const provinceCode = String(division.Code)
    provinceMap.set(provinceCode, division.FullName)
    for (const ward of division.Wards || []) {
      wardMap.set(`${provinceCode}:${String(ward.Code)}`, ward.FullName)
    }
  }
  return { provinceMap, wardMap }
}

const updateMinMax = (value: unknown, current: { min: number | null; max: number | null }) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return
  if (current.min === null || value < current.min) current.min = value
  if (current.max === null || value > current.max) current.max = value
}

const DYNAMIC_KEYS = [
  'listingType',
  'postType',
  'direction',
  'legalStatus',
  'furnitureStatus',
  'bedrooms',
  'bathrooms',
] as const

export const propertyFilters: Endpoint = {
  path: '/search/properties/filters',
  method: 'get',
  handler: async (req) => {
    const { payload } = req

    const propertyTypes = new Set<string>()
    const provinceCodes = new Set<string>()
    const wards = new Map<string, { code: string; provinceCode: string }>()
    const streets = new Map<string, { name: string; provinceCode: string; wardCode: string }>()
    const projectIds = new Set<string>()
    const priceRange = { min: null as number | null, max: null as number | null }
    const areaRange = { min: null as number | null, max: null as number | null }
    const dynamicValues = new Map<string, Set<string>>()

    for (const key of DYNAMIC_KEYS) {
      dynamicValues.set(key, new Set<string>())
    }

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
            wardCode: true,
            street: true,
            project: true,
            price: true,
            area: true,
            listingType: true,
            postType: true,
            direction: true,
            legalStatus: true,
            furnitureStatus: true,
            bedrooms: true,
            bathrooms: true,
          },
        })

        for (const doc of result.docs) {
          if (typeof doc.propertyType === 'string' && doc.propertyType.length > 0) {
            propertyTypes.add(doc.propertyType)
          }
          if (typeof doc.provinceCode === 'string' && doc.provinceCode.length > 0) {
            provinceCodes.add(doc.provinceCode)
          }
          if (
            typeof doc.provinceCode === 'string' &&
            doc.provinceCode.length > 0 &&
            typeof doc.wardCode === 'string' &&
            doc.wardCode.length > 0
          ) {
            wards.set(`${doc.provinceCode}:${doc.wardCode}`, {
              code: doc.wardCode,
              provinceCode: doc.provinceCode,
            })
          }
          if (
            typeof doc.provinceCode === 'string' &&
            doc.provinceCode.length > 0 &&
            typeof doc.wardCode === 'string' &&
            doc.wardCode.length > 0 &&
            typeof doc.street === 'string' &&
            doc.street.trim().length > 0
          ) {
            const streetName = doc.street.trim()
            streets.set(`${doc.provinceCode}:${doc.wardCode}:${streetName}`, {
              name: streetName,
              provinceCode: doc.provinceCode,
              wardCode: doc.wardCode,
            })
          }
          if (typeof doc.project === 'number' || typeof doc.project === 'string') {
            projectIds.add(String(doc.project))
          }
          updateMinMax(doc.price, priceRange)
          updateMinMax(doc.area, areaRange)

          for (const key of DYNAMIC_KEYS) {
            const value = doc[key]
            if (value === null || value === undefined) continue
            const stringValue = String(value).trim()
            if (!stringValue) continue
            dynamicValues.get(key)?.add(stringValue)
          }
        }

        hasNextPage = Boolean(result.hasNextPage)
        page = (result.page ?? page) + 1
      }

      const { provinceMap, wardMap } = getDivisionMaps()
      const regions = Array.from(provinceCodes)
        .map((code) => ({ code, label: provinceMap.get(code) || code }))
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
      const wardList = Array.from(wards.values())
        .map((ward) => ({
          ...ward,
          label: wardMap.get(`${ward.provinceCode}:${ward.code}`) || ward.code,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
      const streetList = Array.from(streets.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'))

      const projects: Array<{ id: string; name: string; provinceCode: string; wardCode: string }> = []
      if (projectIds.size > 0) {
        const projectResult = await payload.find({
          collection: 'projects',
          where: { id: { in: Array.from(projectIds) } },
          depth: 0,
          limit: projectIds.size,
          overrideAccess: false,
          req,
          select: {
            id: true,
            name: true,
            provinceCode: true,
            wardCode: true,
          },
        })
        for (const project of projectResult.docs) {
          if (!project.id || !project.name) continue
          projects.push({
            id: String(project.id),
            name: String(project.name),
            provinceCode: String(project.provinceCode || ''),
            wardCode: String(project.wardCode || ''),
          })
        }
      }

      const response: PropertyFilterResponse = {
        success: true,
        propertyTypes: Array.from(propertyTypes).sort((a, b) => a.localeCompare(b, 'vi')),
        regions,
        wards: wardList,
        streets: streetList,
        projects: projects.sort((a, b) => a.name.localeCompare(b.name, 'vi')),
        priceRange,
        areaRange,
        dynamicAttributes: DYNAMIC_KEYS.map((key) => ({
          key,
          values: Array.from(dynamicValues.get(key) ?? []).sort((a, b) => a.localeCompare(b, 'vi')),
        })),
      }

      return Response.json(response)
    } catch (error: any) {
      return Response.json({ error: error.message }, { status: 500 })
    }
  },
}
