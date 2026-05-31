import dotenv from 'dotenv'

dotenv.config()

import { getPayload } from 'payload'
import type { Project, Property } from '../src/payload-types'

const APPLY = process.argv.includes('--apply')
const DRY_RUN = !APPLY
const PAGE_SIZE = 500
const MAX_SAMPLE_LOG = 30

const normalizeProjectID = (project: unknown): string | null => {
  if (typeof project === 'string' || typeof project === 'number') return String(project)
  if (project && typeof project === 'object' && 'id' in project) {
    const id = (project as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return null
}

const extractStreetFromAddress = (address: string | null | undefined): string | null => {
  const firstSegment = address
    ?.split(',')
    .map((segment) => segment.trim())
    .find(Boolean)

  if (!firstSegment) return null

  const normalized = firstSegment
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')

  if (
    normalized.startsWith('phuong ') ||
    normalized.startsWith('xa ') ||
    normalized.startsWith('thi tran ') ||
    normalized.startsWith('thi xa ') ||
    normalized.startsWith('dac khu ') ||
    normalized.startsWith('quan ') ||
    normalized.startsWith('huyen ') ||
    normalized.startsWith('thanh pho ') ||
    normalized.startsWith('tp ') ||
    normalized.startsWith('tinh ')
  ) {
    return null
  }

  return firstSegment
}

const sameNumber = (
  current: number | null | undefined,
  next: number | null | undefined,
): boolean => {
  if (current === null || current === undefined) return next === null || next === undefined
  if (next === null || next === undefined) return false
  return Math.abs(current - next) < 1e-7
}

async function fetchAllProjects(payload: Awaited<ReturnType<typeof getPayload>>): Promise<Project[]> {
  const docs: Project[] = []

  for (let page = 1; ; page += 1) {
    const response = await payload.find({
      collection: 'projects',
      depth: 0,
      page,
      limit: PAGE_SIZE,
      pagination: true,
      overrideAccess: true,
      select: {
        id: true,
        name: true,
        provinceCode: true,
        wardCode: true,
        address: true,
        latitude: true,
        longitude: true,
      },
    })

    docs.push(...(response.docs as Project[]))
    if (page >= response.totalPages) break
  }

  return docs
}

async function fetchAllProperties(payload: Awaited<ReturnType<typeof getPayload>>): Promise<Property[]> {
  const docs: Property[] = []

  for (let page = 1; ; page += 1) {
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
        project: true,
        provinceCode: true,
        wardCode: true,
        street: true,
        address: true,
        latitude: true,
        longitude: true,
      },
    })

    docs.push(...(response.docs as Property[]))
    if (page >= response.totalPages) break
  }

  return docs
}

async function run() {
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config: await config })

  const [projects, properties] = await Promise.all([
    fetchAllProjects(payload),
    fetchAllProperties(payload),
  ])
  const projectById = new Map(projects.map((project) => [String(project.id), project]))

  let withProject = 0
  let updated = 0
  let unchanged = 0
  let skippedMissingProject = 0
  const sampleChanges: Array<Record<string, unknown>> = []

  for (const property of properties) {
    const projectId = normalizeProjectID(property.project)
    if (!projectId) continue

    withProject += 1

    const project = projectById.get(projectId)
    if (!project) {
      skippedMissingProject += 1
      continue
    }

    const nextData = {
      provinceCode: project.provinceCode || null,
      wardCode: project.wardCode || null,
      street: extractStreetFromAddress(project.address) || null,
      address: project.address || null,
      latitude: typeof project.latitude === 'number' ? project.latitude : null,
      longitude: typeof project.longitude === 'number' ? project.longitude : null,
    }

    const isSame =
      String(property.provinceCode || '') === String(nextData.provinceCode || '') &&
      String(property.wardCode || '') === String(nextData.wardCode || '') &&
      String(property.street || '').trim() === String(nextData.street || '').trim() &&
      String(property.address || '').trim() === String(nextData.address || '').trim() &&
      sameNumber(property.latitude, nextData.latitude) &&
      sameNumber(property.longitude, nextData.longitude)

    if (isSame) {
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

    if (sampleChanges.length < MAX_SAMPLE_LOG) {
      sampleChanges.push({
        id: property.id,
        title: property.title,
        projectId,
        projectName: project.name,
        before: {
          provinceCode: property.provinceCode,
          wardCode: property.wardCode,
          street: property.street,
          address: property.address,
          latitude: property.latitude,
          longitude: property.longitude,
        },
        after: nextData,
      })
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: DRY_RUN ? 'dry-run' : 'apply',
        totalProjects: projects.length,
        totalProperties: properties.length,
        withProject,
        updated,
        unchanged,
        skippedMissingProject,
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
    console.error('SYNC_PROPERTY_PROJECT_LOCATIONS_FAILED:', error)
    process.exit(1)
  })
