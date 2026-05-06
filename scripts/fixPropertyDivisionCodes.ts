import dotenv from 'dotenv'

dotenv.config()

import divisions from '../src/app/data/vietnam-divisions.json'
import { getPayload } from 'payload'

type DivisionProvince = {
  Code: string
  FullName: string
  Wards: Array<{
    Code: string
    FullName: string
    ProvinceCode: string
  }>
}

const divisionData = divisions as DivisionProvince[]

type StreetRule = {
  street: string
  provinceCode: string
  wardCode: string
  baseLat: number
  baseLng: number
}

const STREET_RULES: StreetRule[] = [
  { street: 'Nguyễn Huệ', provinceCode: '79', wardCode: '26740', baseLat: 10.7732, baseLng: 106.7034 },
  { street: 'Lê Duẩn', provinceCode: '79', wardCode: '26743', baseLat: 10.7828, baseLng: 106.6993 },
  {
    street: 'Nguyễn Thị Minh Khai',
    provinceCode: '79',
    wardCode: '26875',
    baseLat: 10.7769,
    baseLng: 106.6951,
  },
  { street: 'Tràng Tiền', provinceCode: '01', wardCode: '00001', baseLat: 21.0253, baseLng: 105.8524 },
  { street: 'Kim Mã', provinceCode: '01', wardCode: '00025', baseLat: 21.0315, baseLng: 105.8202 },
  { street: 'Võ Nguyên Giáp', provinceCode: '48', wardCode: '20230', baseLat: 16.0601, baseLng: 108.2435 },
  { street: 'Bạch Đằng', provinceCode: '48', wardCode: '20194', baseLat: 16.0664, baseLng: 108.2231 },
  {
    street: 'Đại lộ Bình Dương',
    provinceCode: '79',
    wardCode: '25834',
    baseLat: 10.9806,
    baseLng: 106.6745,
  },
  {
    street: 'Phạm Ngọc Thạch',
    provinceCode: '79',
    wardCode: '25846',
    baseLat: 11.0022,
    baseLng: 106.6661,
  },
  { street: 'Đồng Khởi', provinceCode: '75', wardCode: '26155', baseLat: 10.9575, baseLng: 106.8427 },
  {
    street: 'Phạm Văn Thuận',
    provinceCode: '75',
    wardCode: '26161',
    baseLat: 10.9416,
    baseLng: 106.8306,
  },
]

const normalizeCode = (value: unknown): string => {
  if (value === null || value === undefined) return ''

  const raw = String(value).trim()
  if (!raw) return ''

  const trimmed = raw.replace(/^0+/, '')
  return trimmed || '0'
}

const normalizeText = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const aliases = [
  { key: 'ha_noi', patterns: ['hà nội', 'ha noi'] },
  { key: 'hcm', patterns: ['hồ chí minh', 'ho chi minh', 'tp. hồ chí minh', 'tphcm'] },
  { key: 'da_nang', patterns: ['đà nẵng', 'da nang'] },
  { key: 'binh_duong', patterns: ['bình dương', 'binh duong'] },
  { key: 'dong_nai', patterns: ['đồng nai', 'dong nai'] },
] as const

const aliasFromText = (text: string): string | null => {
  const normalized = text.toLowerCase()

  for (const item of aliases) {
    if (item.patterns.some((pattern) => normalized.includes(pattern))) {
      return item.key
    }
  }

  return null
}

const compactProvinceName = (fullName: string): string => {
  return fullName.replace(/^Thành phố\s+/i, '').replace(/^Tỉnh\s+/i, '').trim()
}

const inferStreetRule = (street: string | null | undefined, address: string | null | undefined, title: string): StreetRule | null => {
  const corpus = normalizeText([street || '', address || '', title || ''].join(' | '))

  for (const rule of STREET_RULES) {
    const normalizedStreet = normalizeText(rule.street)
    if (normalizedStreet && corpus.includes(normalizedStreet)) {
      return rule
    }
  }

  return null
}

const extractHouseNumber = (address: string | null | undefined, fallbackFromId: number): string => {
  if (address) {
    const match = address.match(/Số\s*(\d+)/i)
    if (match?.[1]) return match[1]
  }

  return String((fallbackFromId % 200) + 1)
}

const extractStreet = (street: string | null | undefined, address: string | null | undefined): string => {
  if (street && street.trim()) return street.trim()

  if (address) {
    const match = address.match(/^Số\s*\d+\s*(.+?)(?:,|$)/i)
    if (match?.[1]?.trim()) return match[1].trim()
  }

  return 'Đường trung tâm'
}

async function run() {
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config: await config })

  const provinceByNorm = new Map<string, DivisionProvince>()
  const wardsByProvinceNorm = new Map<string, DivisionProvince['Wards']>()
  const wardProvinceSetByWardNorm = new Map<string, Set<string>>()

  for (const province of divisionData) {
    const provinceNorm = normalizeCode(province.Code)
    if (!provinceNorm) continue

    provinceByNorm.set(provinceNorm, province)
    wardsByProvinceNorm.set(provinceNorm, province.Wards || [])

    for (const ward of province.Wards || []) {
      const wardNorm = normalizeCode(ward.Code)
      if (!wardNorm) continue

      const set = wardProvinceSetByWardNorm.get(wardNorm) || new Set<string>()
      set.add(provinceNorm)
      wardProvinceSetByWardNorm.set(wardNorm, set)
    }
  }

  const defaultProvince = divisionData[0]
  const defaultWard = defaultProvince?.Wards?.[0]

  if (!defaultProvince || !defaultWard) {
    throw new Error('Division dataset is missing default province/ward entries')
  }

  const { docs: properties } = await payload.find({
    collection: 'properties',
    depth: 0,
    limit: 10000,
    pagination: false,
  })

  let updated = 0
  let alreadyValid = 0
  let repairedByWard = 0
  let fallbackAssigned = 0
  let locationTextUpdated = 0
  let inferredByStreet = 0

  for (const property of properties) {
    const provinceNorm = normalizeCode(property.provinceCode)
    const wardNorm = normalizeCode(property.wardCode)

    const inferredRule = inferStreetRule(property.street, property.address, property.title || '')

    let targetProvince = inferredRule
      ? provinceByNorm.get(normalizeCode(inferredRule.provinceCode))
      : provinceByNorm.get(provinceNorm)
    let usedWardBackfill = false

    if (inferredRule && targetProvince) {
      inferredByStreet += 1
    }

    if (!targetProvince && wardNorm) {
      const candidateProvinceSet = wardProvinceSetByWardNorm.get(wardNorm)

      if (candidateProvinceSet && candidateProvinceSet.size > 0) {
        const derivedProvinceNorm = [...candidateProvinceSet][0]
        targetProvince = provinceByNorm.get(derivedProvinceNorm)
        usedWardBackfill = Boolean(targetProvince)
      }
    }

    if (!targetProvince) {
      targetProvince = defaultProvince
      fallbackAssigned += 1
    }

    const targetProvinceNorm = normalizeCode(targetProvince.Code)
    const wards = wardsByProvinceNorm.get(targetProvinceNorm) || []

    const inferredWardNorm = normalizeCode(inferredRule?.wardCode)

    let targetWard = inferredWardNorm
      ? wards.find((ward) => normalizeCode(ward.Code) === inferredWardNorm)
      : wards.find((ward) => normalizeCode(ward.Code) === wardNorm)

    if (!targetWard) {
      targetWard = wards[0]
    }

    if (!targetWard) {
      targetWard = defaultWard
    }

    const nextProvinceCode = targetProvince.Code
    const nextWardCode = targetWard.Code

    const sameProvince = String(property.provinceCode || '') === String(nextProvinceCode)
    const sameWard = String(property.wardCode || '') === String(nextWardCode)
    const needsCodeUpdate = !sameProvince || !sameWard

    const provinceAlias = aliasFromText(targetProvince.FullName)
    const addressAlias = aliasFromText(property.address || '')
    const titleAlias = aliasFromText(property.title || '')

    const compactProvince = compactProvinceName(targetProvince.FullName)
    const lowerCompactProvince = compactProvince.toLowerCase()
    const titleHasTargetProvince = (property.title || '').toLowerCase().includes(lowerCompactProvince)
    const addressHasTargetProvince = (property.address || '').toLowerCase().includes(lowerCompactProvince)

    const hasLocationTextMismatch = Boolean(
      provinceAlias &&
        ((addressAlias && addressAlias !== provinceAlias) || (titleAlias && titleAlias !== provinceAlias)),
    )

    const inferredRuleTextMismatch = Boolean(inferredRule && (!titleHasTargetProvince || !addressHasTargetProvince))

    const numericId = Number(property.id) || 1
    const nextStreet = inferredRule?.street || extractStreet(property.street, property.address)
    const nextHouseNumber = extractHouseNumber(property.address, numericId)
    const nextAddress = `Số ${nextHouseNumber} ${nextStreet}, ${targetWard.FullName}, ${targetProvince.FullName}`
    const titlePrefix = (property.title?.split(' tại ')[0] || property.title || 'Bất động sản').trim()
    const nextTitle = `${titlePrefix} tại ${nextStreet}, ${compactProvince}`
    const needsTextUpdate =
      (hasLocationTextMismatch || inferredRuleTextMismatch) &&
      (property.address !== nextAddress || property.title !== nextTitle || property.street !== nextStreet)

    if (!needsCodeUpdate && !needsTextUpdate) {
      alreadyValid += 1
      continue
    }

    const data: Record<string, unknown> = {}

    if (needsCodeUpdate) {
      data.provinceCode = nextProvinceCode
      data.wardCode = nextWardCode
    }

    if (needsTextUpdate) {
      data.street = nextStreet
      data.address = nextAddress
      data.title = nextTitle
      locationTextUpdated += 1
    }

    if (inferredRule) {
      // Keep coordinates aligned with the inferred street location and add tiny deterministic jitter.
      const jitterSeed = ((numericId % 11) - 5) * 0.0002
      data.latitude = inferredRule.baseLat + jitterSeed
      data.longitude = inferredRule.baseLng + jitterSeed
    }

    await payload.update({
      collection: 'properties',
      id: property.id,
      data,
    })

    updated += 1

    if (needsCodeUpdate && usedWardBackfill) {
      repairedByWard += 1
    }
  }

  const { docs: after } = await payload.find({
    collection: 'properties',
    depth: 0,
    limit: 10000,
    pagination: false,
  })

  let mismatchCountAfter = 0
  let locationTextMismatchAfter = 0

  for (const property of after) {
    const provinceNorm = normalizeCode(property.provinceCode)
    const wardNorm = normalizeCode(property.wardCode)

    const province = provinceByNorm.get(provinceNorm)

    if (!province) {
      mismatchCountAfter += 1
      continue
    }

    const wardMatchesProvince = province.Wards.some((ward) => normalizeCode(ward.Code) === wardNorm)

    if (!wardMatchesProvince) {
      mismatchCountAfter += 1
    }

    const provinceAlias = aliasFromText(province.FullName)
    const addressAlias = aliasFromText(property.address || '')
    const titleAlias = aliasFromText(property.title || '')

    if (
      provinceAlias &&
      ((addressAlias && addressAlias !== provinceAlias) || (titleAlias && titleAlias !== provinceAlias))
    ) {
      locationTextMismatchAfter += 1
    }
  }

  console.log(
    JSON.stringify(
      {
        totalProperties: properties.length,
        updated,
        alreadyValid,
        repairedByWard,
        fallbackAssigned,
        locationTextUpdated,
        inferredByStreet,
        mismatchCountAfter,
        locationTextMismatchAfter,
      },
      null,
      2,
    ),
  )
}

run().catch((error) => {
  console.error('FIX_DIVISION_CODES_FAILED:', error)
  process.exit(1)
})
