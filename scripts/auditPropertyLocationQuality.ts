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

const normalizeCode = (value: unknown): string => {
  if (value === null || value === undefined) return ''

  const raw = String(value).trim()
  if (!raw) return ''

  const trimmed = raw.replace(/^0+/, '')
  return trimmed || '0'
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

async function run() {
  const provinceNameByCode = new Map<string, string>()
  const wardNameByProvinceAndCode = new Map<string, string>()

  for (const province of divisionData) {
    const provinceCode = normalizeCode(province.Code)
    provinceNameByCode.set(provinceCode, province.FullName)

    for (const ward of province.Wards || []) {
      const wardCode = normalizeCode(ward.Code)
      wardNameByProvinceAndCode.set(`${provinceCode}:${wardCode}`, ward.FullName)
    }
  }

  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'properties',
    depth: 0,
    limit: 10000,
    pagination: false,
  })

  let badAddressCount = 0
  let badTitleCount = 0
  const samples: unknown[] = []

  for (const property of docs) {
    const provinceCode = normalizeCode(property.provinceCode)
    const wardCode = normalizeCode(property.wardCode)
    const provinceName = provinceNameByCode.get(provinceCode) || ''
    const wardName = wardNameByProvinceAndCode.get(`${provinceCode}:${wardCode}`) || ''

    const provinceAlias = aliasFromText(provinceName)
    const addressAlias = aliasFromText(property.address || '')
    const titleAlias = aliasFromText(property.title || '')

    const addressMismatch = Boolean(provinceAlias && addressAlias && provinceAlias !== addressAlias)
    const titleMismatch = Boolean(provinceAlias && titleAlias && provinceAlias !== titleAlias)

    if (addressMismatch) badAddressCount += 1
    if (titleMismatch) badTitleCount += 1

    if ((addressMismatch || titleMismatch) && samples.length < 25) {
      samples.push({
        id: property.id,
        provinceCode: property.provinceCode,
        wardCode: property.wardCode,
        provinceName,
        wardName,
        title: property.title,
        address: property.address,
        provinceAlias,
        titleAlias,
        addressAlias,
      })
    }
  }

  console.log(
    JSON.stringify(
      {
        total: docs.length,
        badAddressCount,
        badTitleCount,
        sampleMismatches: samples,
      },
      null,
      2,
    ),
  )
}

run().catch((error) => {
  console.error('AUDIT_FAILED:', error)
  process.exit(1)
})
