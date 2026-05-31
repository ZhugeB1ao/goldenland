export type SearchTab = 'all' | 'property' | 'project' | 'news'

export type SearchChipKey =
  | 'district'
  | 'province'
  | 'ward'
  | 'bedrooms'
  | 'bathrooms'
  | 'price'
  | 'area'
  | 'propertyType'
  | 'direction'
  | 'legalStatus'
  | 'furnitureStatus'
  | 'postType'
  | 'keyword'

export type SearchChip = {
  key: SearchChipKey
  label: string
  value: string
  editText: string
}

export type ParsedSearchFilters = {
  district?: number
  provinceCode?: string
  wardCode?: string
  bedrooms?: number
  bathrooms?: number
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  propertyType?: string
  direction?: string
  legalStatus?: string
  furnitureStatus?: string
  postType?: string
}

export type ParsedSearchResult = {
  tab: SearchTab
  keyword: string
  filters: ParsedSearchFilters
  chips: SearchChip[]
}

export type SearchHistoryItem = {
  id: string
  input: string
  tab: SearchTab
  keyword: string
  filters: ParsedSearchFilters
  chips: SearchChip[]
  tags?: SearchHistoryTag[]
  count: number
  lastUsedAt: number
}

export type SearchSuggestionSource = 'history' | 'related' | 'popular'

export type SearchHistoryTag = {
  label: string
  normalized: string
}

export type SearchTagSuggestion = {
  id: string
  label: string
  normalized: string
  tab: SearchTab
  source: SearchSuggestionSource
  score: number
  aliases: string[]
  matchedInput: string
}

export type SearchProjectSuggestionInput = {
  id: string | number
  name?: string | null
}
