import divisions from '../../../../../data/vietnam-divisions.json'
import { normalize } from './text'

type ProvinceDivision = {
  Code: string
  FullName: string
  Wards?: Array<{
    Code: string
    FullName: string
    ProvinceCode: string
  }>
}

type ProvinceEntry = {
  code: string
  label: string
  normalizedLabel: string
  aliases: string[]
}

type WardEntry = {
  code: string
  label: string
  normalizedLabel: string
  provinceCode: string
  aliases: string[]
}

const SPECIAL_ALIASES: Record<string, string[]> = {
  '79': ['tphcm', 'tp hcm', 'tp.hcm', 'hcm', 'sai gon', 'sg', 'ho chi minh'],
  '01': ['tp ha noi', 'tphn', 'ha noi', 'hn'],
  '48': ['tp da nang', 'tpdn', 'da nang', 'dn'],
  '92': ['can tho', 'tp can tho'],
  '31': ['hai phong', 'tp hai phong', 'hp'],
}

const PREFIX_RE = /^(thanh\s*pho|tp\.?|tinh)\s+/u

const createAliases = (fullName: string, code: string): string[] => {
  const normalized = normalize(fullName)
  const withoutPrefix = normalized.replace(PREFIX_RE, '').trim()

  const aliases = new Set<string>([normalized])
  if (withoutPrefix) aliases.add(withoutPrefix)

  const special = SPECIAL_ALIASES[code]
  if (special) {
    special.forEach((alias) => aliases.add(normalize(alias)))
  }

  return [...aliases].filter(Boolean)
}

export const PROVINCE_CATALOG: ProvinceEntry[] = (divisions as ProvinceDivision[])
  .map((province) => ({
    code: String(province.Code),
    label: province.FullName,
    normalizedLabel: normalize(province.FullName),
    aliases: createAliases(province.FullName, String(province.Code)),
  }))
  .sort((left, right) => right.aliases.join(' ').length - left.aliases.join(' ').length)

const WARD_PREFIX_RE = /^(phuong|p\.?|xa|x\.?|thi\s*tran|tt\.?)\s+/u

const createWardAliases = (fullName: string): string[] => {
  const normalized = normalize(fullName)
  const withoutPrefix = normalized.replace(WARD_PREFIX_RE, '').trim()
  const aliases = new Set<string>([normalized])
  if (withoutPrefix) aliases.add(withoutPrefix)
  return [...aliases].filter(Boolean)
}

export const WARD_CATALOG: WardEntry[] = (divisions as ProvinceDivision[])
  .flatMap((province) =>
    (province.Wards || []).map((ward) => ({
      code: String(ward.Code),
      label: ward.FullName,
      normalizedLabel: normalize(ward.FullName),
      provinceCode: String(ward.ProvinceCode || province.Code),
      aliases: createWardAliases(ward.FullName),
    })),
  )
  .sort((left, right) => right.aliases.join(' ').length - left.aliases.join(' ').length)

const matchAliasInText = (input: string, alias: string): boolean => {
  const pattern = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
  return new RegExp(`(^|\\s)${pattern}(?=\\s|$)`, 'u').test(input)
}

export const parseProvinceFromNormalizedText = (
  normalizedInput: string,
): { code: string; label: string; aliases: string[] } | undefined => {
  if (!normalizedInput) return undefined

  for (const province of PROVINCE_CATALOG) {
    const matchedAliases = province.aliases.filter((alias) => matchAliasInText(normalizedInput, alias))
    if (matchedAliases.length === 0) continue

    return {
      code: province.code,
      label: province.label,
      aliases: matchedAliases,
    }
  }

  return undefined
}

export const parseWardFromNormalizedText = (
  normalizedInput: string,
  provinceCode?: string,
): { code: string; label: string; provinceCode: string; aliases: string[] } | undefined => {
  if (!normalizedInput) return undefined

  const candidates = provinceCode
    ? WARD_CATALOG.filter((ward) => ward.provinceCode === provinceCode)
    : WARD_CATALOG

  for (const ward of candidates) {
    const matchedAliases = ward.aliases.filter((alias) => matchAliasInText(normalizedInput, alias))
    if (matchedAliases.length === 0) continue

    return {
      code: ward.code,
      label: ward.label,
      provinceCode: ward.provinceCode,
      aliases: matchedAliases,
    }
  }

  return undefined
}

export const getProvinceLabelByCode = (code: string): string | undefined => {
  return PROVINCE_CATALOG.find((province) => province.code === code)?.label
}
