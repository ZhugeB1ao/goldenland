import type { ParsedSearchFilters, ParsedSearchResult, SearchTab } from './types'
import { compactWhitespace, normalize, removeAliasTokens } from './text'
import { getMatchedFilterTags, removeMatchedFilterTagText } from './tagCatalog'
import {
  buildKeyword,
  parseArea,
  parseBathrooms,
  parseBedrooms,
  parseDirection,
  parseDistrict,
  parseFurnitureStatus,
  parseLegalStatus,
  parseListingType,
  parsePostType,
  parsePrice,
  parsePropertyType,
} from './parserUtils'
import {
  parseProvinceFromNormalizedText,
  parseWardFromNormalizedText,
} from './provinceCatalog'

// Parse free text into keyword and structured filters.
export function parseSearch(input: string, tab: SearchTab): ParsedSearchResult {
  // Step 1: Normalize and parse structured filters from the input.
  const rawInput = compactWhitespace(input)
  const normalized = normalize(rawInput)

  const filters: ParsedSearchFilters = {}

  if (tab !== 'news') {
    const district = parseDistrict(normalized)
    if (typeof district === 'number' && district > 0) filters.district = district
  }

  const matchedProvince = parseProvinceFromNormalizedText(normalized)
  if (matchedProvince) {
    filters.provinceCode = matchedProvince.code
  }
  const matchedWard = parseWardFromNormalizedText(normalized, matchedProvince?.code)
  if (matchedWard) {
    filters.wardCode = matchedWard.code
    if (!filters.provinceCode) {
      filters.provinceCode = matchedWard.provinceCode
    }
  }

  if (tab === 'property') {
    const listingType = parseListingType(normalized)
    if (listingType) filters.listingType = listingType

    const propertyType = parsePropertyType(normalized)
    if (propertyType) filters.propertyType = propertyType

    const direction = parseDirection(normalized)
    if (direction) filters.direction = direction

    const legalStatus = parseLegalStatus(normalized)
    if (legalStatus) filters.legalStatus = legalStatus

    const furnitureStatus = parseFurnitureStatus(normalized)
    if (furnitureStatus) filters.furnitureStatus = furnitureStatus

    const postType = parsePostType(normalized)
    if (postType) filters.postType = postType

    const bedrooms = parseBedrooms(normalized)
    if (typeof bedrooms === 'number' && bedrooms > 0) filters.bedrooms = bedrooms

    const bathrooms = parseBathrooms(normalized)
    if (typeof bathrooms === 'number' && bathrooms > 0) filters.bathrooms = bathrooms

    const area = parseArea(normalized)
    if (area?.minArea) filters.minArea = area.minArea
    if (area?.maxArea) filters.maxArea = area.maxArea

    const price = parsePrice(normalized)
    if (price?.minPrice) filters.minPrice = price.minPrice
    if (price?.maxPrice) filters.maxPrice = price.maxPrice
  }

  // Step 2: Remove filter tokens from the input to isolate the keyword.
  const matchedFilterTags = getMatchedFilterTags(rawInput, tab)

  matchedFilterTags.forEach((tag) => {
    Object.assign(filters, tag.filter)
  })

  // Step 3: Build the final keyword.
  let keywordInput = removeMatchedFilterTagText(rawInput, matchedFilterTags)
  if (matchedProvince) {
    keywordInput = removeAliasTokens(keywordInput, matchedProvince.aliases)
  }
  if (matchedWard) {
    keywordInput = removeAliasTokens(keywordInput, matchedWard.aliases)
  }
  // Build keyword from normalized text so Vietnamese combining accents do not leave stray tokens.
  const rawKeyword = buildKeyword(normalize(keywordInput))
  const keyword = normalize(rawKeyword).length >= 2 ? rawKeyword : ''

  return {
    keyword,
    filters,
  }
}

// Return a tab-specific example placeholder for the search box.
export function getSearchPlaceholder(tab: SearchTab): string {
  if (tab === 'property') return 'VD: căn hộ quận 7 2 phòng ngủ 2 tỷ'
  if (tab === 'project') return 'VD: Vinhomes quận 9'
  if (tab === 'news') return 'VD: lãi suất vay mua nhà 2026'

  return 'VD: lãi suất vay mua nhà 2026'
}
