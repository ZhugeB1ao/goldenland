import divisions from './src/app/data/vietnam-divisions.json'

type DivisionWard = {
  Code: string
  FullName: string
}

type Division = DivisionWard & {
  Wards: DivisionWard[]
}

type LocationProperty = {
  provinceCode?: string | number | null
  wardCode?: string | number | null
  address?: string | null
}

const normalizeCode = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return ''
  const raw = String(value).trim()
  if (!raw) return ''
  const trimmed = raw.replace(/^0+/, '')
  return trimmed || '0'
}

const divisionData = divisions as Division[]
const provinceNameByCode = new Map<string, string>()
const wardNameByProvinceAndCode = new Map<string, string>()

for (const province of divisionData) {
  const provinceKey = normalizeCode(province.Code)
  if (!provinceKey) continue
  provinceNameByCode.set(provinceKey, province.FullName)
  for (const ward of province.Wards) {
    const wardKey = normalizeCode(ward.Code)
    if (!wardKey) continue
    wardNameByProvinceAndCode.set(`${provinceKey}:${wardKey}`, ward.FullName)
  }
}

function formatLocation(property: LocationProperty): string {
  const provinceKey = normalizeCode(property.provinceCode)
  const wardKey = normalizeCode(property.wardCode)
  const provinceName = provinceKey ? provinceNameByCode.get(provinceKey) : undefined
  const wardName = provinceKey && wardKey ? wardNameByProvinceAndCode.get(`${provinceKey}:${wardKey}`) : undefined
  const mappedLocation = [wardName, provinceName].filter(Boolean).join(', ')
  return mappedLocation || property.address || 'Đang cập nhật'
}

const property477 = {
  provinceCode: "48",
  wardCode: "20194",
  address: "Quan Hai Chau, Da Nang - Lo dat 15"
}

console.log('Result for 477:', formatLocation(property477))
