import type { Property } from '@/payload-types'
import divisions from '@/app/data/vietnam-divisions.json'

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

export function formatPrice(property: Property): string {
  if (property.priceUnit === 'negotiable') {
    return 'Thỏa thuận'
  }

  const price = property.price
  let amountStr = ''

  if (price >= 1000000000) {
    const billions = price / 1000000000
    amountStr = `${billions.toFixed(billions % 1 === 0 ? 0 : 1).replace('.0', '')} tỷ`
  } else if (price >= 1000000) {
    const millions = price / 1000000
    amountStr = `${millions.toFixed(millions % 1 === 0 ? 0 : 1).replace('.0', '')} triệu`
  } else {
    amountStr = price >= 1000 ? `${(price / 1000).toFixed(1).replace('.0', '')} tỷ` : `${price} triệu`
  }

  if (property.priceUnit === 'per_month') {
    return `${amountStr}/tháng`
  }
  if (property.priceUnit === 'per_m2') {
    return `${amountStr}/m²`
  }
  return amountStr
}

export function formatLocation(property: Property): string {
  const provinceKey = normalizeCode(property.provinceCode)
  const wardKey = normalizeCode(property.wardCode)

  const provinceName = provinceKey ? provinceNameByCode.get(provinceKey) : undefined
  const wardName = provinceKey && wardKey ? wardNameByProvinceAndCode.get(`${provinceKey}:${wardKey}`) : undefined

  const street = property.street?.trim()
  const mappedLocation = [street, wardName, provinceName].filter(Boolean).join(', ')

  return mappedLocation || property.address || 'Đang cập nhật'
}

export function formatProvince(property: Property): string {
  const provinceKey = normalizeCode(property.provinceCode)
  const provinceName = provinceKey ? provinceNameByCode.get(provinceKey) : undefined
  return provinceName || 'Đang cập nhật'
}

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=80'
