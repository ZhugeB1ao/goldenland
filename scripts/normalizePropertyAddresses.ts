import dotenv from 'dotenv'

dotenv.config()

import divisions from '../src/app/data/vietnam-divisions.json'
import { getPayload } from 'payload'
import type { Project, Property } from '../src/payload-types'

type DivisionWard = {
  Code: string
  FullName: string
  ProvinceCode: string
}

type DivisionProvince = {
  Code: string
  FullName: string
  Wards: DivisionWard[]
}

type CoordStats = {
  sumLat: number
  sumLng: number
  count: number
}

type GeocodeResult = {
  lat: number
  lng: number
  road: string | null
  address: Record<string, string>
  displayName: string
}

const APPLY = process.argv.includes('--apply')
const DRY_RUN = !APPLY
const GEOCODE_MISSING = process.argv.includes('--geocode-missing')
const MAX_SAMPLE_LOG = 30
const PAGE_SIZE = 500
const NOMINATIM_DELAY_MS = 1200

const divisionData = divisions as DivisionProvince[]

const normalizeCode = (value: unknown): string => {
  if (value === null || value === undefined) return ''

  const raw = String(value).trim()
  if (!raw) return ''

  const trimmed = raw.replace(/^0+/, '')
  return trimmed || '0'
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const removeAdminPrefix = (value: string): string => {
  const normalized = normalizeText(value)
  return normalized
    .replace(/^(thanh pho|tp|tinh)\s+/, '')
    .replace(/^(phuong|xa|thi tran)\s+/, '')
    .trim()
}

const looksLikeLocationToken = (value: string): boolean => {
  const normalized = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim()

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

const stripLeadingHouseNumber = (value: string): string => {
  let next = value.trim().replace(/\s+/g, ' ')
  if (!next) return ''

  next = next.replace(/^(số|so)\s*/i, '')

  // Preserve streets like "30 Tháng 4", "3 Tháng 2", "2 Tháng 9".
  if (/^\d+\s*th(a|á)ng\s*\d+/i.test(next)) {
    return next
  }

  // Preserve streets like "3/2", "30/4" when used as street names.
  if (/^\d+\s*\/\s*\d+\b/.test(next) && !/\s/.test(next.replace(/^\d+\s*\/\s*\d+\b/, ''))) {
    return next.replace(/\s+/g, '')
  }

  next = next.replace(/^(lô|lo)\s*[a-z0-9\-\/]+\s+/i, '')
  next = next.replace(/^\d+[a-z0-9\-\/]*\s+/i, '')

  return next.trim()
}

const extractStreetFromAddress = (address: string | null | undefined): string | null => {
  if (!address) return null

  const firstPart = address
    .split(',')
    .map((segment) => segment.trim())
    .find((segment) => segment.length > 0)

  if (!firstPart) return null

  const cleaned = stripLeadingHouseNumber(firstPart)
  if (!cleaned) return null
  if (looksLikeLocationToken(cleaned)) return null
  return cleaned
}

const normalizeStreet = (
  street: string | null | undefined,
  address: string | null | undefined,
  projectAddress: string | null | undefined,
): string | null => {
  const direct = stripLeadingHouseNumber(String(street || '').trim())
  if (direct && !looksLikeLocationToken(direct)) return direct

  const fromAddress = extractStreetFromAddress(address)
  if (fromAddress) return fromAddress

  const fromProjectAddress = extractStreetFromAddress(projectAddress)
  if (fromProjectAddress) return fromProjectAddress

  return null
}

const addCoordStats = (map: Map<string, CoordStats>, key: string, lat: number, lng: number) => {
  if (!key) return
  const current = map.get(key) || { sumLat: 0, sumLng: 0, count: 0 }
  current.sumLat += lat
  current.sumLng += lng
  current.count += 1
  map.set(key, current)
}

const getCentroid = (map: Map<string, CoordStats>, key: string): { lat: number; lng: number } | null => {
  const stats = map.get(key)
  if (!stats || stats.count === 0) return null

  return {
    lat: stats.sumLat / stats.count,
    lng: stats.sumLng / stats.count,
  }
}

const coordinatesEqual = (
  currentLat: number | null | undefined,
  currentLng: number | null | undefined,
  nextLat: number,
  nextLng: number,
): boolean => {
  if (!isFiniteNumber(currentLat) || !isFiniteNumber(currentLng)) return false
  return Math.abs(currentLat - nextLat) < 1e-7 && Math.abs(currentLng - nextLng) < 1e-7
}

const buildAddress = (street: string, wardName: string, provinceName: string): string =>
  [street, wardName, provinceName].join(', ')

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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
        provinceCode: true,
        wardCode: true,
        address: true,
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
        address: true,
        street: true,
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

function inferProvinceFromAddress(
  address: string | null | undefined,
  provinceByAlias: Map<string, DivisionProvince>,
): DivisionProvince | undefined {
  if (!address) return undefined

  const segments = address
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reverse()

  for (const segment of segments) {
    const normalized = normalizeText(segment)
    const compact = removeAdminPrefix(segment)

    if (provinceByAlias.has(normalized)) return provinceByAlias.get(normalized)
    if (provinceByAlias.has(compact)) return provinceByAlias.get(compact)
  }

  return undefined
}

function inferWardFromAddress(
  address: string | null | undefined,
  provinceNorm: string,
  wardByProvinceAlias: Map<string, DivisionWard>,
): DivisionWard | undefined {
  if (!address || !provinceNorm) return undefined

  const segments = address
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reverse()

  for (const segment of segments) {
    const normalized = normalizeText(segment)
    const compact = removeAdminPrefix(segment)

    const fullKey = `${provinceNorm}:${normalized}`
    if (wardByProvinceAlias.has(fullKey)) return wardByProvinceAlias.get(fullKey)

    const compactKey = `${provinceNorm}:${compact}`
    if (wardByProvinceAlias.has(compactKey)) return wardByProvinceAlias.get(compactKey)
  }

  return undefined
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', address)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', 'vn')

    const response = await fetch(url.toString(), {
      headers: {
        'user-agent': 'goldenland-address-normalizer/1.0',
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
    await sleep(NOMINATIM_DELAY_MS)
  }
}

async function geocodeAddressDetails(address: string): Promise<GeocodeResult | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', address)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('limit', '1')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('countrycodes', 'vn')

    const response = await fetch(url.toString(), {
      headers: {
        'user-agent': 'goldenland-address-normalizer/1.0',
        accept: 'application/json',
      },
    })

    if (!response.ok) return null

    const results = (await response.json()) as Array<{
      lat: string
      lon: string
      display_name?: string
      address?: Record<string, string>
    }>
    const first = results?.[0]
    if (!first) return null

    const lat = Number(first.lat)
    const lng = Number(first.lon)
    if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null

    const addressDetails = first.address || {}
    const road =
      addressDetails.road ||
      addressDetails.pedestrian ||
      addressDetails.residential ||
      addressDetails.path ||
      null

    return {
      lat,
      lng,
      road: road ? String(road).trim() : null,
      address: addressDetails,
      displayName: String(first.display_name || ''),
    }
  } catch {
    return null
  } finally {
    await sleep(NOMINATIM_DELAY_MS)
  }
}

const uniqueNonEmpty = (values: Array<string | null | undefined>): string[] => {
  const out: string[] = []
  const seen = new Set<string>()

  for (const value of values) {
    const next = String(value || '').trim()
    if (!next) continue
    const key = normalizeText(next)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(next)
  }

  return out
}

const parseWardProvinceFromAddress = (
  address: string | null | undefined,
): { wardName: string | null; provinceName: string | null } => {
  if (!address) return { wardName: null, provinceName: null }

  const segments = address
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (!segments.length) return { wardName: null, provinceName: null }

  let wardName: string | null = null
  let provinceName: string | null = null

  for (const segment of segments) {
    const normalized = normalizeText(segment)
    if (!wardName && /^(phuong|xa|thi tran)\b/.test(normalized)) {
      wardName = segment
    }
    if (!provinceName && /^(thanh pho|tp|tinh)\b/.test(normalized)) {
      provinceName = segment
    }
  }

  if (!provinceName) {
    const last = segments[segments.length - 1]
    const normalized = normalizeText(last)
    if (!/^(viet nam|vietnam)\b/.test(normalized)) {
      provinceName = last
    }
  }

  return { wardName, provinceName }
}

const inferProvinceFromCandidates = (
  candidates: string[],
  provinceByAlias: Map<string, DivisionProvince>,
): DivisionProvince | undefined => {
  for (const item of candidates) {
    const normalized = normalizeText(item)
    const compact = removeAdminPrefix(item)
    if (provinceByAlias.has(normalized)) return provinceByAlias.get(normalized)
    if (provinceByAlias.has(compact)) return provinceByAlias.get(compact)
  }
  return undefined
}

const inferWardFromCandidates = (
  provinceNorm: string,
  candidates: string[],
  wardByProvinceAlias: Map<string, DivisionWard>,
): DivisionWard | undefined => {
  if (!provinceNorm) return undefined

  for (const item of candidates) {
    const normalized = normalizeText(item)
    const compact = removeAdminPrefix(item)
    const fullKey = `${provinceNorm}:${normalized}`
    if (wardByProvinceAlias.has(fullKey)) return wardByProvinceAlias.get(fullKey)

    const compactKey = `${provinceNorm}:${compact}`
    if (wardByProvinceAlias.has(compactKey)) return wardByProvinceAlias.get(compactKey)
  }

  return undefined
}

async function run() {
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config: await config })

  const provinceByNorm = new Map<string, DivisionProvince>()
  const wardByProvinceAndNorm = new Map<string, DivisionWard>()
  const provinceByAlias = new Map<string, DivisionProvince>()
  const wardByProvinceAlias = new Map<string, DivisionWard>()

  for (const province of divisionData) {
    const provinceNorm = normalizeCode(province.Code)
    if (!provinceNorm) continue
    provinceByNorm.set(provinceNorm, province)
    provinceByAlias.set(normalizeText(province.FullName), province)
    provinceByAlias.set(removeAdminPrefix(province.FullName), province)

    for (const ward of province.Wards || []) {
      const wardNorm = normalizeCode(ward.Code)
      if (!wardNorm) continue
      wardByProvinceAndNorm.set(`${provinceNorm}:${wardNorm}`, ward)
      wardByProvinceAlias.set(`${provinceNorm}:${normalizeText(ward.FullName)}`, ward)
      wardByProvinceAlias.set(`${provinceNorm}:${removeAdminPrefix(ward.FullName)}`, ward)
    }
  }

  const [projects, properties] = await Promise.all([fetchAllProjects(payload), fetchAllProperties(payload)])
  const projectById = new Map<string, Project>()

  for (const project of projects) {
    projectById.set(String(project.id), project)
  }

  const wardCoordStats = new Map<string, CoordStats>()
  const provinceCoordStats = new Map<string, CoordStats>()

  for (const project of projects) {
    if (!isFiniteNumber(project.latitude) || !isFiniteNumber(project.longitude)) continue
    const provinceNorm = normalizeCode(project.provinceCode)
    const wardNorm = normalizeCode(project.wardCode)
    if (provinceNorm) addCoordStats(provinceCoordStats, provinceNorm, project.latitude, project.longitude)
    if (provinceNorm && wardNorm) {
      addCoordStats(wardCoordStats, `${provinceNorm}:${wardNorm}`, project.latitude, project.longitude)
    }
  }

  for (const property of properties) {
    if (!isFiniteNumber(property.latitude) || !isFiniteNumber(property.longitude)) continue
    const provinceNorm = normalizeCode(property.provinceCode)
    const wardNorm = normalizeCode(property.wardCode)
    if (provinceNorm) addCoordStats(provinceCoordStats, provinceNorm, property.latitude, property.longitude)
    if (provinceNorm && wardNorm) {
      addCoordStats(wardCoordStats, `${provinceNorm}:${wardNorm}`, property.latitude, property.longitude)
    }
  }

  let updated = 0
  let unchanged = 0
  let skippedNoCodes = 0
  let skippedNoStreet = 0
  let geocodedCount = 0
  let matchedProjectCount = 0
  let coordsFromProjectCount = 0
  let coordsFromCentroidCount = 0
  let coordsFromGeocodeCount = 0
  const sampleChanges: Array<Record<string, unknown>> = []

  for (const property of properties) {
    const projectId =
      typeof property.project === 'number' || typeof property.project === 'string'
        ? String(property.project)
        : null
    const project = projectId ? projectById.get(projectId) : undefined
    const matchedProject = Boolean(project)

    if (matchedProject) matchedProjectCount += 1

    let geocodedDetails: GeocodeResult | null = null
    let geocodedForAdmin = false
    const sourceProvinceCode = project?.provinceCode || property.provinceCode
    const sourceWardCode = project?.wardCode || property.wardCode

    let sourceProvinceNorm = normalizeCode(sourceProvinceCode)
    let sourceWardNorm = normalizeCode(sourceWardCode)

    let province = sourceProvinceNorm ? provinceByNorm.get(sourceProvinceNorm) : undefined
    if (!province) {
      province = inferProvinceFromAddress(
        project?.address || property.address,
        provinceByAlias,
      )
      sourceProvinceNorm = province ? normalizeCode(province.Code) : ''
    }

    let ward =
      sourceProvinceNorm && sourceWardNorm
        ? wardByProvinceAndNorm.get(`${sourceProvinceNorm}:${sourceWardNorm}`)
        : undefined

    if (!ward && province) {
      ward = inferWardFromAddress(
        project?.address || property.address,
        sourceProvinceNorm,
        wardByProvinceAlias,
      )
      sourceWardNorm = ward ? normalizeCode(ward.Code) : ''
    }

    if ((!province || !ward) && GEOCODE_MISSING) {
      const geocodeQuery =
        project?.address ||
        property.address ||
        [property.street, property.title].filter(Boolean).join(', ')

      if (geocodeQuery && geocodeQuery.trim()) {
        geocodedDetails = await geocodeAddressDetails(geocodeQuery)
      }

      if (geocodedDetails) {
        geocodedForAdmin = true

        const provinceCandidates = uniqueNonEmpty([
          geocodedDetails.address.state,
          geocodedDetails.address.city,
          geocodedDetails.address.county,
          geocodedDetails.address.region,
          geocodedDetails.address.state_district,
          ...geocodedDetails.displayName.split(',').map((s) => s.trim()),
        ])
        province = inferProvinceFromCandidates(provinceCandidates, provinceByAlias) || province
        sourceProvinceNorm = province ? normalizeCode(province.Code) : sourceProvinceNorm

        const wardCandidates = uniqueNonEmpty([
          geocodedDetails.address.suburb,
          geocodedDetails.address.quarter,
          geocodedDetails.address.city_district,
          geocodedDetails.address.district,
          geocodedDetails.address.borough,
          geocodedDetails.address.village,
          geocodedDetails.address.town,
          geocodedDetails.address.neighbourhood,
          ...geocodedDetails.displayName.split(',').map((s) => s.trim()),
        ])
        ward =
          inferWardFromCandidates(sourceProvinceNorm, wardCandidates, wardByProvinceAlias) || ward
        sourceWardNorm = ward ? normalizeCode(ward.Code) : sourceWardNorm
      }
    }

    const textualLocation = parseWardProvinceFromAddress(project?.address || property.address)
    const fallbackWardName = ward?.FullName || textualLocation.wardName
    const fallbackProvinceName = province?.FullName || textualLocation.provinceName

    if (!fallbackWardName || !fallbackProvinceName) {
      skippedNoCodes += 1
      continue
    }

    let nextStreet = normalizeStreet(property.street, property.address, project?.address || null)
    if (!nextStreet && GEOCODE_MISSING) {
      if (!geocodedDetails) {
        const geocodeQuery =
          project?.address ||
          property.address ||
          [property.street, property.title].filter(Boolean).join(', ')
        if (geocodeQuery && geocodeQuery.trim()) {
          geocodedDetails = await geocodeAddressDetails(geocodeQuery)
        }
      }
      const geocodedRoad = geocodedDetails?.road
      if (geocodedRoad) {
        const strippedRoad = stripLeadingHouseNumber(geocodedRoad)
        if (strippedRoad && !looksLikeLocationToken(strippedRoad)) {
          nextStreet = strippedRoad
        }
      }
    }

    if (!nextStreet) {
      skippedNoStreet += 1
      continue
    }

    const nextAddress = buildAddress(nextStreet, fallbackWardName, fallbackProvinceName)
    const nextProvinceCode = province?.Code
    const nextWardCode = ward?.Code

    let nextLat: number | null = null
    let nextLng: number | null = null
    let coordSource: 'project' | 'centroid' | 'geocode' | 'keep' | 'none' = 'none'

    if (project && isFiniteNumber(project.latitude) && isFiniteNumber(project.longitude)) {
      nextLat = project.latitude
      nextLng = project.longitude
      coordSource = 'project'
    } else if (isFiniteNumber(property.latitude) && isFiniteNumber(property.longitude)) {
      nextLat = property.latitude
      nextLng = property.longitude
      coordSource = 'keep'
    } else {
      const wardCentroid = getCentroid(wardCoordStats, `${sourceProvinceNorm}:${sourceWardNorm}`)
      const provinceCentroid = getCentroid(provinceCoordStats, sourceProvinceNorm)
      const fallback = wardCentroid || provinceCentroid

      if (fallback) {
        nextLat = fallback.lat
        nextLng = fallback.lng
        coordSource = 'centroid'
      } else if (GEOCODE_MISSING) {
        const geocoded =
          geocodedDetails ||
          (await geocodeAddressDetails(nextAddress)) ||
          (await geocodeAddress(nextAddress))
        if (geocoded && 'lat' in geocoded && 'lng' in geocoded) {
          nextLat = geocoded.lat
          nextLng = geocoded.lng
          coordSource = 'geocode'
          geocodedCount += 1
        }
      }
    }

    const nextData: Record<string, unknown> = {
      street: nextStreet,
      address: nextAddress,
    }

    if (nextProvinceCode) nextData.provinceCode = nextProvinceCode
    if (nextWardCode) nextData.wardCode = nextWardCode

    if (isFiniteNumber(nextLat) && isFiniteNumber(nextLng)) {
      nextData.latitude = nextLat
      nextData.longitude = nextLng
    }

    const sameStreet = String(property.street || '').trim() === nextStreet
    const sameAddress = String(property.address || '').trim() === nextAddress
    const sameProvince = nextProvinceCode
      ? String(property.provinceCode || '') === String(nextProvinceCode)
      : true
    const sameWard = nextWardCode
      ? String(property.wardCode || '') === String(nextWardCode)
      : true
    const sameCoords =
      isFiniteNumber(nextLat) && isFiniteNumber(nextLng)
        ? coordinatesEqual(property.latitude, property.longitude, nextLat, nextLng)
        : !isFiniteNumber(property.latitude) && !isFiniteNumber(property.longitude)

    if (sameStreet && sameAddress && sameProvince && sameWard && sameCoords) {
      unchanged += 1
      continue
    }

    if (!DRY_RUN) {
      await payload.update({
        collection: 'properties',
        id: property.id,
        overrideAccess: true,
        data: nextData,
      })
    }

    updated += 1

    if (coordSource === 'project') coordsFromProjectCount += 1
    if (coordSource === 'centroid') coordsFromCentroidCount += 1
    if (coordSource === 'geocode') coordsFromGeocodeCount += 1
    if (geocodedForAdmin && coordSource !== 'geocode') geocodedCount += 1

    if (sampleChanges.length < MAX_SAMPLE_LOG) {
      sampleChanges.push({
        id: property.id,
        title: property.title,
        projectId: projectId || null,
        before: {
          street: property.street,
          address: property.address,
          provinceCode: property.provinceCode,
          wardCode: property.wardCode,
          latitude: property.latitude,
          longitude: property.longitude,
        },
        after: nextData,
        coordSource,
      })
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: DRY_RUN ? 'dry-run' : 'apply',
        totalProjects: projects.length,
        totalProperties: properties.length,
        matchedProjectCount,
        updated,
        unchanged,
        skippedNoCodes,
        skippedNoStreet,
        geocodedCount,
        coordsFromProjectCount,
        coordsFromCentroidCount,
        coordsFromGeocodeCount,
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
    console.error('NORMALIZE_PROPERTY_ADDRESS_FAILED:', error)
    process.exit(1)
  })
