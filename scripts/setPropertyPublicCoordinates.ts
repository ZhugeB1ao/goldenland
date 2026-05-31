import dotenv from 'dotenv'

dotenv.config()

import divisions from '../src/app/data/vietnam-divisions.json'
import { getPayload } from 'payload'
import type { Project, Property } from '../src/payload-types'

type DivisionWard = {
  Code: string
  FullName: string
}

type DivisionProvince = {
  Code: string
  FullName: string
  Wards: DivisionWard[]
}

type Coordinates = {
  lat: number
  lng: number
}

const APPLY = process.argv.includes('--apply')
const DRY_RUN = !APPLY
const PAGE_SIZE = 500
const MAX_SAMPLE = 30
const GEOCODE_DELAY_MS = 1200
const GEOCODE_TIMEOUT_MS = 12000

const divisionData = divisions as DivisionProvince[]

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim()

const stripLeadingHouseNumber = (value: string): string => {
  let next = value.trim().replace(/\s+/g, ' ')
  if (!next) return ''

  next = next.replace(/^(số|so)\s*/i, '')

  if (/^\d+\s*th(a|á)ng\s*\d+/i.test(next)) return next
  if (/^\d+\s*\/\s*\d+\b/.test(next) && !/\s/.test(next.replace(/^\d+\s*\/\s*\d+\b/, ''))) {
    return next.replace(/\s+/g, '')
  }

  next = next.replace(/^(lô|lo)\s*[a-z0-9\-\/]+\s+/i, '')
  next = next.replace(/^\d+[a-z0-9\-\/]*\s+/i, '')
  return next.trim()
}

const looksLikeAdminToken = (value: string): boolean => {
  const normalized = normalizeText(value)
  return (
    normalized.startsWith('phuong ') ||
    normalized.startsWith('xa ') ||
    normalized.startsWith('thi tran ') ||
    normalized.startsWith('quan ') ||
    normalized.startsWith('huyen ') ||
    normalized.startsWith('thanh pho ') ||
    normalized.startsWith('tp ') ||
    normalized.startsWith('tinh ')
  )
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const coordsEqual = (
  currentLat: number | null | undefined,
  currentLng: number | null | undefined,
  nextLat: number,
  nextLng: number,
): boolean => {
  if (!isFiniteNumber(currentLat) || !isFiniteNumber(currentLng)) return false
  return Math.abs(currentLat - nextLat) < 1e-7 && Math.abs(currentLng - nextLng) < 1e-7
}

async function fetchAllProjects(payload: Awaited<ReturnType<typeof getPayload>>): Promise<Project[]> {
  const docs: Project[] = []
  let page = 1

  while (true) {
    const response = await payload.find({
      collection: 'projects',
      depth: 0,
      page,
      limit: PAGE_SIZE,
      pagination: true,
      overrideAccess: true,
      select: {
        id: true,
        latitude: true,
        longitude: true,
      },
    })

    docs.push(...(response.docs as Project[]))
    if (page >= response.totalPages) break
    page += 1
  }

  return docs
}

async function fetchAllProperties(payload: Awaited<ReturnType<typeof getPayload>>): Promise<Property[]> {
  const docs: Property[] = []
  let page = 1

  while (true) {
    const response = await payload.find({
      collection: 'properties',
      depth: 0,
      page,
      limit: PAGE_SIZE,
      pagination: true,
      overrideAccess: true,
      select: {
        id: true,
        title: true,
        street: true,
        address: true,
        provinceCode: true,
        wardCode: true,
        latitude: true,
        longitude: true,
        project: true,
      },
    })

    docs.push(...(response.docs as Property[]))
    if (page >= response.totalPages) break
    page += 1
  }

  return docs
}

function buildDivisionMaps() {
  const provinceNameByCode = new Map<string, string>()
  const wardNameByProvinceWardCode = new Map<string, string>()

  for (const province of divisionData) {
    provinceNameByCode.set(String(province.Code), province.FullName)
    for (const ward of province.Wards || []) {
      wardNameByProvinceWardCode.set(`${province.Code}:${ward.Code}`, ward.FullName)
    }
  }

  return {
    provinceNameByCode,
    wardNameByProvinceWardCode,
  }
}

function extractStreetName(property: Property): string | null {
  const direct = stripLeadingHouseNumber(String(property.street || '').trim())
  if (direct && !looksLikeAdminToken(direct)) return direct

  const firstAddressPart = String(property.address || '')
    .split(',')
    .map((segment) => segment.trim())
    .find(Boolean)

  if (!firstAddressPart) return null
  const extracted = stripLeadingHouseNumber(firstAddressPart)
  if (!extracted || looksLikeAdminToken(extracted)) return null
  return extracted
}

function extractWardProvinceNames(
  property: Property,
  provinceNameByCode: Map<string, string>,
  wardNameByProvinceWardCode: Map<string, string>,
): { wardName: string | null; provinceName: string | null } {
  const provinceCode = String(property.provinceCode || '')
  const wardCode = String(property.wardCode || '')

  const provinceName = provinceNameByCode.get(provinceCode) || null
  const wardName = wardNameByProvinceWardCode.get(`${provinceCode}:${wardCode}`) || null

  if (wardName && provinceName) {
    return { wardName, provinceName }
  }

  const parts = String(property.address || '')
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)

  const fallbackProvince = provinceName || (parts.length >= 1 ? parts[parts.length - 1] : null)
  const fallbackWard = wardName || (parts.length >= 2 ? parts[parts.length - 2] : null)

  return {
    wardName: fallbackWard,
    provinceName: fallbackProvince,
  }
}

async function geocodeStreetQuery(query: string): Promise<Coordinates | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'vn')

  const contactEmail = process.env.NOMINATIM_EMAIL || process.env.GEOCODER_CONTACT_EMAIL || ''
  if (contactEmail) {
    url.searchParams.set('email', contactEmail)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS)

  try {

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'user-agent': `goldenland-public-coords/1.0${contactEmail ? ` (${contactEmail})` : ''}`,
        accept: 'application/json',
      },
    })
    if (!response.ok) return null

    const results = (await response.json()) as Array<{ lat: string; lon: string }>
    const first = results?.[0]
    if (!first) return null

    const lat = Number(first.lat)
    const lng = Number(first.lon)
    if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null

    return { lat, lng }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
    await sleep(GEOCODE_DELAY_MS)
  }
}

async function run() {
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config: await config })

  const { provinceNameByCode, wardNameByProvinceWardCode } = buildDivisionMaps()
  const [projects, properties] = await Promise.all([fetchAllProjects(payload), fetchAllProperties(payload)])

  const projectCoordsById = new Map<string, Coordinates>()
  for (const project of projects) {
    if (!isFiniteNumber(project.latitude) || !isFiniteNumber(project.longitude)) continue
    projectCoordsById.set(String(project.id), {
      lat: project.latitude,
      lng: project.longitude,
    })
  }

  const geocodeCache = new Map<string, Coordinates | null>()

  let updated = 0
  let unchanged = 0
  let projectCoordApplied = 0
  let streetCoordApplied = 0
  let skippedProjectNoCoords = 0
  let skippedNoStreetQuery = 0
  let skippedNoGeocode = 0
  let geocodeRequests = 0
  let geocodeHits = 0
  const sampleChanges: Array<Record<string, unknown>> = []

  for (const property of properties) {
    const projectId =
      typeof property.project === 'number' || typeof property.project === 'string'
        ? String(property.project)
        : null

    let target: Coordinates | null = null
    let source: 'project' | 'street' | null = null

    if (projectId) {
      target = projectCoordsById.get(projectId) || null
      if (!target) {
        skippedProjectNoCoords += 1
        continue
      }
      source = 'project'
    } else {
      const streetName = extractStreetName(property)
      const { wardName, provinceName } = extractWardProvinceNames(
        property,
        provinceNameByCode,
        wardNameByProvinceWardCode,
      )

      if (!streetName || !provinceName) {
        skippedNoStreetQuery += 1
        continue
      }

      const primaryQuery = [streetName, wardName, provinceName, 'Vietnam'].filter(Boolean).join(', ')
      const fallbackQuery = [streetName, provinceName, 'Vietnam'].filter(Boolean).join(', ')

      const tryQueries = [primaryQuery]
      if (fallbackQuery !== primaryQuery) tryQueries.push(fallbackQuery)

      for (const query of tryQueries) {
        if (geocodeCache.has(query)) {
          target = geocodeCache.get(query) || null
          continue
        }

        geocodeRequests += 1
        const resolved = await geocodeStreetQuery(query)
        geocodeCache.set(query, resolved)
        if (resolved) geocodeHits += 1
        target = resolved
        if (resolved) break
      }

      if (!target) {
        skippedNoGeocode += 1
        continue
      }

      source = 'street'
    }

    if (!source || !target) continue

    if (coordsEqual(property.latitude, property.longitude, target.lat, target.lng)) {
      unchanged += 1
      continue
    }

    if (!DRY_RUN) {
      await payload.update({
        collection: 'properties',
        id: property.id,
        overrideAccess: true,
        data: {
          latitude: target.lat,
          longitude: target.lng,
        },
      })
    }

    updated += 1
    if (source === 'project') projectCoordApplied += 1
    if (source === 'street') streetCoordApplied += 1

    if (sampleChanges.length < MAX_SAMPLE) {
      sampleChanges.push({
        id: property.id,
        title: property.title,
        projectId,
        source,
        before: {
          latitude: property.latitude,
          longitude: property.longitude,
        },
        after: {
          latitude: target.lat,
          longitude: target.lng,
        },
      })
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: DRY_RUN ? 'dry-run' : 'apply',
        totalProjects: projects.length,
        totalProperties: properties.length,
        geocodeCacheSize: geocodeCache.size,
        geocodeRequests,
        geocodeHits,
        updated,
        unchanged,
        projectCoordApplied,
        streetCoordApplied,
        skippedProjectNoCoords,
        skippedNoStreetQuery,
        skippedNoGeocode,
        sampleChanges,
      },
      null,
      2,
    ),
  )
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('SET_PROPERTY_PUBLIC_COORDINATES_FAILED:', error)
    process.exit(1)
  })
