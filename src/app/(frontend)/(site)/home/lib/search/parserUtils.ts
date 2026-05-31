import type { ParsedSearchFilters, SearchTab } from './types'
import {
  AREA_RANGE_PARSE_RE,
  AREA_RANGE_REMOVE_RE,
  AREA_SINGLE_PARSE_RE,
  AREA_SINGLE_REMOVE_RE,
  BATHROOMS_PARSE_RE,
  BATHROOMS_REMOVE_RE,
  BEDROOMS_PARSE_RE,
  BEDROOMS_REMOVE_RE,
  DISTRICT_PARSE_RE,
  DISTRICT_REMOVE_RE,
  DIRECTION_PARSE_RE,
  DIRECTION_REMOVE_RE,
  FURNITURE_STATUS_PARSE_RE,
  FURNITURE_STATUS_REMOVE_RE,
  LEGAL_STATUS_PARSE_RE,
  LEGAL_STATUS_REMOVE_RE,
  POST_TYPE_PARSE_RE,
  POST_TYPE_REMOVE_RE,
  PRICE_RANGE_PARSE_RE,
  PRICE_RANGE_REMOVE_RE,
  PRICE_SINGLE_PARSE_RE,
  PRICE_SINGLE_REMOVE_RE,
  PROPERTY_TYPE_PARSE_RE,
  PROPERTY_TYPE_REMOVE_RE,
} from './constants'
import { compactWhitespace, toNumber, toVnd } from './text'

// Format a VND value into a short Vietnamese price label.
export const formatPrice = (value: number): string => {
  if (value >= 1_000_000_000) {
    const ty = value / 1_000_000_000
    return `${ty % 1 === 0 ? ty.toFixed(0) : ty.toFixed(1)} tỷ`
  }

  const trieu = value / 1_000_000
  return `${trieu % 1 === 0 ? trieu.toFixed(0) : trieu.toFixed(1)} triệu`
}

// Extract a district number from normalized input.
export const parseDistrict = (normalizedInput: string): number | undefined => {
  const match = normalizedInput.match(DISTRICT_PARSE_RE)
  if (!match) return undefined

  return Number(match[1])
}

// Extract the requested bedroom count from normalized input.
export const parseBedrooms = (normalizedInput: string): number | undefined => {
  const match = normalizedInput.match(BEDROOMS_PARSE_RE)
  if (!match) return undefined

  return Number(match[1])
}

// Extract the requested bathroom count from normalized input.
export const parseBathrooms = (normalizedInput: string): number | undefined => {
  const match = normalizedInput.match(BATHROOMS_PARSE_RE)
  if (!match) return undefined

  return Number(match[1])
}

// Extract an area range or upper bound from normalized input.
export const parseArea = (
  normalizedInput: string,
): Pick<ParsedSearchFilters, 'minArea' | 'maxArea'> | undefined => {
  const rangeMatch = normalizedInput.match(AREA_RANGE_PARSE_RE)
  if (rangeMatch) {
    const left = toNumber(rangeMatch[1])
    const right = toNumber(rangeMatch[2])

    return {
      minArea: Math.min(left, right),
      maxArea: Math.max(left, right),
    }
  }

  const singleMatch = normalizedInput.match(AREA_SINGLE_PARSE_RE)
  if (!singleMatch) return undefined

  return {
    maxArea: toNumber(singleMatch[1]),
  }
}

// Extract a price range or upper bound from normalized input.
export const parsePrice = (
  normalizedInput: string,
): Pick<ParsedSearchFilters, 'minPrice' | 'maxPrice'> | undefined => {
  const rangeMatch = normalizedInput.match(PRICE_RANGE_PARSE_RE)
  if (rangeMatch) {
    const left = toNumber(rangeMatch[1])
    const leftUnit = rangeMatch[2]
    const right = toNumber(rangeMatch[3])
    const rightUnit = rangeMatch[4] || leftUnit

    const minPrice = toVnd(left, leftUnit)
    const maxPrice = toVnd(right, rightUnit)

    return {
      minPrice: Math.min(minPrice, maxPrice),
      maxPrice: Math.max(minPrice, maxPrice),
    }
  }

  const singleMatch = normalizedInput.match(PRICE_SINGLE_PARSE_RE)
  if (!singleMatch) return undefined

  const amount = toNumber(singleMatch[1])
  const unit = singleMatch[2]

  return {
    maxPrice: toVnd(amount, unit),
  }
}

export const parsePropertyType = (normalizedInput: string): ParsedSearchFilters['propertyType'] => {
  const match = normalizedInput.match(PROPERTY_TYPE_PARSE_RE)?.[0] ?? ''
  if (/chung\s*cu|can\s*ho/u.test(match)) return 'apartment'
  if (/nha\s*rieng/u.test(match)) return 'house'
  if (/nha\s*pho/u.test(match)) return 'townhouse'
  if (/dat\s*nen/u.test(match)) return 'land'
  if (/biet\s*thu/u.test(match)) return 'villa'
  if (/shophouse/u.test(match)) return 'shophouse'
  if (/penthouse/u.test(match)) return 'penthouse'
  if (/condotel/u.test(match)) return 'condotel'
  if (/kho|xuong/u.test(match)) return 'warehouse'
  if (/mat\s*bang/u.test(match)) return 'commercial'
  return undefined
}

export const parseDirection = (normalizedInput: string): ParsedSearchFilters['direction'] => {
  const match = normalizedInput.match(DIRECTION_PARSE_RE)?.[1] ?? ''
  if (/^dong$/u.test(match)) return 'east'
  if (/^tay$/u.test(match)) return 'west'
  if (/^nam$/u.test(match)) return 'south'
  if (/^bac$/u.test(match)) return 'north'
  if (/dong\s*bac/u.test(match)) return 'northeast'
  if (/dong\s*nam/u.test(match)) return 'southeast'
  if (/tay\s*bac/u.test(match)) return 'northwest'
  if (/tay\s*nam/u.test(match)) return 'southwest'
  return undefined
}

export const parseLegalStatus = (
  normalizedInput: string,
): ParsedSearchFilters['legalStatus'] => {
  const match = normalizedInput.match(LEGAL_STATUS_PARSE_RE)?.[0] ?? ''
  if (/so\s*do|so\s*hong/u.test(match)) return 'red_book'
  if (/hdmb|hop\s*dong\s*mua\s*ban/u.test(match)) return 'sale_contract'
  if (/dang\s*cho\s*so|cho\s*so/u.test(match)) return 'pending'
  return undefined
}

export const parseFurnitureStatus = (
  normalizedInput: string,
): ParsedSearchFilters['furnitureStatus'] => {
  const match = normalizedInput.match(FURNITURE_STATUS_PARSE_RE)?.[0] ?? ''
  if (/noi\s*that\s*cao\s*cap/u.test(match)) return 'luxury'
  if (/full\s*noi\s*that|noi\s*that\s*day\s*du/u.test(match)) return 'full'
  if (/noi\s*that\s*co\s*ban/u.test(match)) return 'basic'
  if (/khong\s*noi\s*that|nha\s*trong/u.test(match)) return 'none'
  return undefined
}

export const parsePostType = (normalizedInput: string): ParsedSearchFilters['postType'] => {
  const match = normalizedInput.match(POST_TYPE_PARSE_RE)?.[0] ?? ''
  if (/kim\s*cuong|kim\s*cương/u.test(match)) return 'diamond'
  if (/vang|vàng/u.test(match)) return 'gold'
  if (/bac|bạc/u.test(match)) return 'silver'
  if (/vip/u.test(match)) return 'diamond'
  return undefined
}

// Remove structured tokens so the remaining text can be used as keyword.
export const buildKeyword = (input: string, tab: SearchTab): string => {
  return compactWhitespace(
    input
      .replace(DISTRICT_REMOVE_RE, ' ')
      .replace(BEDROOMS_REMOVE_RE, ' ')
      .replace(BATHROOMS_REMOVE_RE, ' ')
      .replace(AREA_RANGE_REMOVE_RE, ' ')
      .replace(AREA_SINGLE_REMOVE_RE, ' ')
      .replace(PRICE_RANGE_REMOVE_RE, ' ')
      .replace(PRICE_SINGLE_REMOVE_RE, ' ')
      .replace(PROPERTY_TYPE_REMOVE_RE, ' ')
      .replace(DIRECTION_REMOVE_RE, ' ')
      .replace(LEGAL_STATUS_REMOVE_RE, ' ')
      .replace(FURNITURE_STATUS_REMOVE_RE, ' ')
      .replace(POST_TYPE_REMOVE_RE, ' '),
  )
}
