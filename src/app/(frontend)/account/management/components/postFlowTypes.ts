export type PostDraftImage = {
  file: File
  previewUrl: string
  sort: number
}

export type PostDraft = {
  provinceCode: string
  wardCode: string
  project: string
  street: string
  address: string
  latitude: number | null
  longitude: number | null
  propertyType: string
  area: number
  price: number
  legalStatus: string
  furnitureStatus: string
  direction: string
  bedrooms: number
  bathrooms: number
  title: string
  description: string
  images: PostDraftImage[]
}

export const INITIAL_POST_DRAFT: PostDraft = {
  provinceCode: '',
  wardCode: '',
  project: '',
  street: '',
  address: '',
  latitude: null,
  longitude: null,
  propertyType: '',
  area: 0,
  price: 0,
  legalStatus: '',
  furnitureStatus: '',
  direction: '',
  bedrooms: 0,
  bathrooms: 0,
  title: '',
  description: '',
  images: [],
}
