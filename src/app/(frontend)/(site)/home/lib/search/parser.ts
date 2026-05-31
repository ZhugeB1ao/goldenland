import type { ParsedSearchFilters, ParsedSearchResult, SearchChip, SearchChipKey, SearchTab } from './types'
import { compactWhitespace, normalize, removeAliasTokens } from './text'
import { getMatchedFilterTags, PROPERTY_ATTRIBUTE_TAGS, removeMatchedFilterTagText } from './tagCatalog'
import {
  buildKeyword,
  formatPrice,
  parseArea,
  parseBathrooms,
  parseBedrooms,
  parseDirection,
  parseDistrict,
  parseFurnitureStatus,
  parseLegalStatus,
  parsePostType,
  parsePrice,
  parsePropertyType,
} from './parserUtils'
import {
  getProvinceLabelByCode,
  parseProvinceFromNormalizedText,
  parseWardFromNormalizedText,
} from './provinceCatalog'

// Parse free text into keyword, structured filters, and UI chips.
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

  if (tab === 'property' || tab === 'all') {
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

  // Step 3: Build the final keyword and chips for UI display.
  let keywordInput = removeMatchedFilterTagText(rawInput, matchedFilterTags)
  if (matchedProvince) {
    keywordInput = removeAliasTokens(keywordInput, matchedProvince.aliases)
  }
  if (matchedWard) {
    keywordInput = removeAliasTokens(keywordInput, matchedWard.aliases)
  }
  // Build keyword from normalized text so Vietnamese combining accents do not leave stray tokens.
  const rawKeyword = buildKeyword(normalize(keywordInput), tab)
  const keyword = normalize(rawKeyword).length >= 2 ? rawKeyword : ''
  const chips: SearchChip[] = []

  if (filters.district) {
    chips.push({
      key: 'district',
      label: `Quận ${filters.district}`,
      value: String(filters.district),
      editText: `quận ${filters.district}`,
    })
  }

  if (filters.provinceCode) {
    const provinceLabel = getProvinceLabelByCode(filters.provinceCode)
    if (provinceLabel) {
      chips.push({
        key: 'province',
        label: provinceLabel,
        value: filters.provinceCode,
        editText: provinceLabel.toLowerCase(),
      })
    }
  }

  if (filters.wardCode && matchedWard) {
    chips.push({
      key: 'ward',
      label: matchedWard.label,
      value: matchedWard.code,
      editText: matchedWard.label.toLowerCase(),
    })
  }

  if (filters.bedrooms) {
    chips.push({
      key: 'bedrooms',
      label: `${filters.bedrooms} phòng ngủ`,
      value: String(filters.bedrooms),
      editText: `${filters.bedrooms} phòng ngủ`,
    })
  }

  if (filters.bathrooms) {
    chips.push({
      key: 'bathrooms',
      label: `${filters.bathrooms} phòng tắm`,
      value: String(filters.bathrooms),
      editText: `${filters.bathrooms} phòng tắm`,
    })
  }

  if (filters.minArea || filters.maxArea) {
    const label =
      typeof filters.minArea === 'number' && typeof filters.maxArea === 'number'
        ? `${filters.minArea} - ${filters.maxArea} m²`
        : typeof filters.maxArea === 'number'
          ? `Dưới ${filters.maxArea} m²`
          : `Từ ${filters.minArea} m²`

    chips.push({
      key: 'area',
      label,
      value: label,
      editText: label.toLowerCase(),
    })
  }

  if (filters.minPrice || filters.maxPrice) {
    const label =
      typeof filters.minPrice === 'number' && typeof filters.maxPrice === 'number'
        ? `${formatPrice(filters.minPrice)} - ${formatPrice(filters.maxPrice)}`
        : `Dưới ${formatPrice(filters.maxPrice as number)}`

    chips.push({
      key: 'price',
      label,
      value: label,
      editText: label.toLowerCase(),
    })
  }

  const filterChipLabels: Partial<Record<SearchChipKey, string>> = {
    propertyType: PROPERTY_ATTRIBUTE_TAGS.find(
      (tag) => tag.filter?.propertyType === filters.propertyType,
    )?.label,
    direction: PROPERTY_ATTRIBUTE_TAGS.find((tag) => tag.filter?.direction === filters.direction)
      ?.label,
    legalStatus: PROPERTY_ATTRIBUTE_TAGS.find(
      (tag) => tag.filter?.legalStatus === filters.legalStatus,
    )?.label,
    furnitureStatus: PROPERTY_ATTRIBUTE_TAGS.find(
      (tag) => tag.filter?.furnitureStatus === filters.furnitureStatus,
    )?.label,
    postType:
      filters.postType === 'silver'
        ? 'VIP bạc'
        : filters.postType === 'gold'
          ? 'VIP vàng'
          : filters.postType === 'diamond'
            ? 'VIP kim cương'
            : undefined,
  }

  ;(
    [
      ['propertyType', filters.propertyType],
      ['direction', filters.direction],
      ['legalStatus', filters.legalStatus],
      ['furnitureStatus', filters.furnitureStatus],
      ['postType', filters.postType],
    ] as const
  ).forEach(([key, value]) => {
    const label = filterChipLabels[key]
    if (!value || !label) return

    chips.push({
      key,
      label,
      value,
      editText: label.toLowerCase(),
    })
  })

  if (keyword) {
    chips.push({
      key: 'keyword',
      label: `Từ khóa: ${keyword}`,
      value: keyword,
      editText: keyword,
    })
  }

  return {
    tab,
    keyword,
    filters,
    chips,
  }
  
//  "nhà riêng quận 7 2 phòng ngủ dưới 3 tỷ"
//   {
//   tab: 'property',
//   keyword: '',
//   filters: {
//     district: 7,
//     propertyType: 'house',
//     bedrooms: 2,
//     maxPrice: 3000000000
//   },
//   chips: [
//     { key: 'district', label: 'Quận 7', value: '7', editText: 'quận 7' },
//     { key: 'propertyType', label: 'nhà riêng', value: 'house', editText: 'nhà riêng' },
//     { key: 'bedrooms', label: '2 phòng ngủ', value: '2', editText: '2 phòng ngủ' },
//     { key: 'price', label: 'Dưới 3 tỷ', value: 'Dưới 3 tỷ', editText: 'dưới 3 tỷ' }
//   ]
// }
}

// Return a tab-specific example placeholder for the search box.
export function getSearchPlaceholder(tab: SearchTab): string {
  if (tab === 'property') return 'VD: căn hộ quận 7 2 phòng ngủ 2 tỷ'
  if (tab === 'project') return 'VD: Vinhomes quận 9'
  if (tab === 'news') return 'VD: lãi suất vay mua nhà 2026'

  return 'VD: quận 7 2 phòng ngủ 2 tỷ hoặc tên dự án, tin tức'
}

// Suggest useful filters that are missing from the current search.
export function suggestMissingFilters(parsed: ParsedSearchResult, tab: SearchTab): string[] {
  const suggestions: string[] = []

  if ((tab === 'property' || tab === 'all') && !parsed.filters.district) suggestions.push('quận 7')
  if ((tab === 'property' || tab === 'all') && !parsed.filters.bedrooms) {
    suggestions.push('2 phòng ngủ')
  }
  if (
    (tab === 'property' || tab === 'all') &&
    !parsed.filters.minPrice &&
    !parsed.filters.maxPrice
  ) {
    suggestions.push('2 tỷ')
  }

  if ((tab === 'project' || tab === 'all') && !parsed.keyword) suggestions.push('Vinhomes')

  if (tab === 'news' && !parsed.keyword) suggestions.push('thị trường căn hộ')

  return suggestions
}
