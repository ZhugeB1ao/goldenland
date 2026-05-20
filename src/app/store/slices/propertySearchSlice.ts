import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ParsedSearchResult, SearchTab } from '@/app/(frontend)/(site)/home/lib/search/types'

export type PropertySearchState = {
  activeTab: SearchTab
  homeInput: string
  keyword: string
  district?: number
  provinceCodes: string[]
  wardCodes: string[]
  streets: string[]
  projectIds: string[]
  listingTypes: string[]
  propertyTypes: string[]
  postTypes: string[]
  directions: string[]
  legalStatuses: string[]
  furnitureStatuses: string[]
  bedroomsList: number[]
  bathroomsList: number[]
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  verifiedOnly: boolean
}

const initialState: PropertySearchState = {
  activeTab: 'property',
  homeInput: '',
  keyword: '',
  provinceCodes: [],
  wardCodes: [],
  streets: [],
  projectIds: [],
  listingTypes: [],
  propertyTypes: [],
  postTypes: [],
  directions: [],
  legalStatuses: [],
  furnitureStatuses: [],
  bedroomsList: [],
  bathroomsList: [],
  verifiedOnly: false,
}

const propertySearchSlice = createSlice({
  name: 'propertySearch',
  initialState,
  reducers: {
    setSearchTab(state, action: PayloadAction<SearchTab>) {
      state.activeTab = action.payload
    },
    setHomeInput(state, action: PayloadAction<string>) {
      state.homeInput = action.payload
    },
    setPropertySearchState(state, action: PayloadAction<Partial<PropertySearchState>>) {
      return {
        ...state,
        ...action.payload,
      }
    },
    hydrateFromParsed(
      state,
      action: PayloadAction<{
        tab: SearchTab
        rawInput: string
        parsed: ParsedSearchResult
      }>,
    ) {
      const { tab, rawInput, parsed } = action.payload
      state.activeTab = tab
      state.homeInput = rawInput
      state.keyword = parsed.keyword || ''
      state.district = parsed.filters.district
      state.provinceCodes = parsed.filters.provinceCode ? [parsed.filters.provinceCode] : []
      state.wardCodes = parsed.filters.wardCode ? [parsed.filters.wardCode] : []
      state.listingTypes = parsed.filters.listingType ? [parsed.filters.listingType] : []
      state.propertyTypes = parsed.filters.propertyType ? [parsed.filters.propertyType] : []
      state.postTypes = parsed.filters.postType ? [parsed.filters.postType] : []
      state.directions = parsed.filters.direction ? [parsed.filters.direction] : []
      state.legalStatuses = parsed.filters.legalStatus ? [parsed.filters.legalStatus] : []
      state.furnitureStatuses = parsed.filters.furnitureStatus ? [parsed.filters.furnitureStatus] : []
      state.bedroomsList =
        typeof parsed.filters.bedrooms === 'number' ? [parsed.filters.bedrooms] : []
      state.bathroomsList =
        typeof parsed.filters.bathrooms === 'number' ? [parsed.filters.bathrooms] : []
      state.minPrice = parsed.filters.minPrice
      state.maxPrice = parsed.filters.maxPrice
      state.minArea = parsed.filters.minArea
      state.maxArea = parsed.filters.maxArea
    },
    resetPropertySearchState() {
      return initialState
    },
  },
})

export const {
  setSearchTab,
  setHomeInput,
  setPropertySearchState,
  hydrateFromParsed,
  resetPropertySearchState,
} = propertySearchSlice.actions

export default propertySearchSlice.reducer

export const selectPropertySearch = (state: { propertySearch: PropertySearchState }) =>
  state.propertySearch
