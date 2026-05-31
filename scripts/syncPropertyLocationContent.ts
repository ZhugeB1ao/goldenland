import dotenv from 'dotenv'

dotenv.config()

import { getPayload } from 'payload'
import type { Project, Property } from '../src/payload-types'

const APPLY = process.argv.includes('--apply')
const DRY_RUN = !APPLY
const PAGE_SIZE = 500
const MAX_SAMPLE_LOG = 30

const PROPERTY_TYPE_LABELS: Partial<Record<NonNullable<Property['propertyType']>, string>> = {
  house: 'nhà riêng',
  apartment: 'căn hộ',
  land: 'đất nền',
  villa: 'biệt thự',
  townhouse: 'nhà phố',
  shophouse: 'shophouse',
  penthouse: 'penthouse',
  condotel: 'condotel',
  warehouse: 'kho xưởng',
  commercial: 'mặt bằng',
}

const DIRECTION_LABELS: Partial<Record<NonNullable<Property['direction']>, string>> = {
  east: 'Đông',
  west: 'Tây',
  south: 'Nam',
  north: 'Bắc',
  northeast: 'Đông Bắc',
  southeast: 'Đông Nam',
  northwest: 'Tây Bắc',
  southwest: 'Tây Nam',
}

const LEGAL_STATUS_LABELS: Partial<Record<NonNullable<Property['legalStatus']>, string>> = {
  red_book: 'Sổ đỏ/Sổ hồng',
  sale_contract: 'Hợp đồng mua bán',
  pending: 'Đang chờ sổ',
  other: 'Giấy tờ khác',
}

const FURNITURE_STATUS_LABELS: Partial<Record<NonNullable<Property['furnitureStatus']>, string>> = {
  luxury: 'Nội thất cao cấp',
  full: 'Nội thất đầy đủ',
  basic: 'Nội thất cơ bản',
  none: 'Không nội thất',
}

const normalizeProjectID = (project: unknown): string | null => {
  if (typeof project === 'string' || typeof project === 'number') return String(project)
  if (project && typeof project === 'object' && 'id' in project) {
    const id = (project as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return null
}

const makeSlug = (value: string, id: string | number): string =>
  `${value}-${id}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 300)

const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) return value
  return value.slice(0, maxLength).replace(/\s+\S*$/, '').trim()
}

const getProjectName = (project: unknown, projectById: Map<string, Project>): string | null => {
  if (project && typeof project === 'object' && 'name' in project) {
    const name = (project as { name?: unknown }).name
    if (typeof name === 'string' && name.trim()) return name.trim()
  }

  const projectId = normalizeProjectID(project)
  if (!projectId) return null

  const found = projectById.get(projectId)
  return found?.name?.trim() || null
}

const getLocationText = (property: Property): string => {
  const address = property.address?.trim()
  if (address) return address

  const street = property.street?.trim()
  return street || 'vị trí đang cập nhật'
}

const buildTitle = (property: Property, projectName: string | null): string => {
  const action = 'Bán'
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] || 'bất động sản'
  const bedroomText =
    typeof property.bedrooms === 'number' && property.bedrooms > 0 ? ` ${property.bedrooms}PN` : ''
  const areaText = typeof property.area === 'number' && property.area > 0 ? ` ${property.area}m2` : ''
  const locationText = projectName ? `${projectName}, ${getLocationText(property)}` : getLocationText(property)

  return truncate(`${action} ${typeLabel}${bedroomText}${areaText} tại ${locationText}`, 255)
}

const buildDescription = (property: Property, projectName: string | null): string => {
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] || 'bất động sản'
  const action = 'cần bán'
  const locationText = getLocationText(property)
  const projectText = projectName ? ` thuộc dự án ${projectName}` : ''
  const facts = [
    typeof property.area === 'number' && property.area > 0 ? `diện tích ${property.area}m2` : null,
    typeof property.bedrooms === 'number' && property.bedrooms > 0 ? `${property.bedrooms} phòng ngủ` : null,
    typeof property.bathrooms === 'number' && property.bathrooms > 0 ? `${property.bathrooms} phòng tắm` : null,
    property.direction ? `hướng ${DIRECTION_LABELS[property.direction] || property.direction}` : null,
    property.legalStatus ? `pháp lý ${LEGAL_STATUS_LABELS[property.legalStatus] || property.legalStatus}` : null,
    property.furnitureStatus
      ? `nội thất ${FURNITURE_STATUS_LABELS[property.furnitureStatus] || property.furnitureStatus}`
      : null,
  ].filter(Boolean)

  const factSentence = facts.length ? ` Thông tin nổi bật: ${facts.join(', ')}.` : ''

  return truncate(
    `${typeLabel.charAt(0).toUpperCase()}${typeLabel.slice(1)} ${action}${projectText} tại ${locationText}.${factSentence} Vị trí được đồng bộ theo dữ liệu dự án/khu vực hiện tại.`,
    500,
  )
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
        slug: true,
        description: true,
        propertyType: true,
        area: true,
        bedrooms: true,
        bathrooms: true,
        direction: true,
        legalStatus: true,
        furnitureStatus: true,
        street: true,
        address: true,
        project: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
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

  let updated = 0
  let unchanged = 0
  const sampleChanges: Array<Record<string, unknown>> = []

  for (const property of properties) {
    const projectName = getProjectName(property.project, projectById)
    const nextTitle = buildTitle(property, projectName)
    const nextDescription = buildDescription(property, projectName)
    const nextSeoTitle = truncate(nextTitle, 70)
    const nextSeoDescription = truncate(nextDescription, 160)
    const nextSeoKeywords = [
      'bán bất động sản',
      PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType,
      projectName,
      property.address,
    ]
      .filter(Boolean)
      .join(', ')

    const nextData = {
      title: nextTitle,
      slug: makeSlug(nextTitle, property.id),
      description: nextDescription,
      seoTitle: nextSeoTitle,
      seoDescription: nextSeoDescription,
      seoKeywords: truncate(nextSeoKeywords, 255),
    }

    const isSame =
      property.title === nextData.title &&
      property.slug === nextData.slug &&
      property.description === nextData.description &&
      property.seoTitle === nextData.seoTitle &&
      property.seoDescription === nextData.seoDescription &&
      property.seoKeywords === nextData.seoKeywords

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
        before: {
          title: property.title,
          slug: property.slug,
          description: property.description,
          seoTitle: property.seoTitle,
          seoDescription: property.seoDescription,
          seoKeywords: property.seoKeywords,
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
        updated,
        unchanged,
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
    console.error('SYNC_PROPERTY_LOCATION_CONTENT_FAILED:', error)
    process.exit(1)
  })
