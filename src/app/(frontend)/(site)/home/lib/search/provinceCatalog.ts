import divisions from '../../../../../data/vietnam-divisions.json'
import { normalize } from './text'

type ProvinceDivision = {
  Code: string
  FullName: string
}

type ProvinceEntry = {
  code: string
  label: string
  normalizedLabel: string
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

export const getProvinceLabelByCode = (code: string): string | undefined => {
  return PROVINCE_CATALOG.find((province) => province.code === code)?.label
}
