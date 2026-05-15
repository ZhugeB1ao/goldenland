import type { SearchTab } from './types'

export const SEARCH_HISTORY_STORAGE_KEY = 'goldenland.heroSearchHistory'
export const MAX_SEARCH_HISTORY_ITEMS = 12
export const SEARCH_HISTORY_TTL_MS = 1000 * 60 * 60 * 24 * 30
export const SEARCH_TAG_PROMOTION_COUNT = 2
export const SEARCH_TABS: SearchTab[] = ['all', 'property', 'project', 'news']
export const MAX_SUGGESTION_FRAGMENT_TOKENS = 4

// Regexes to parse structured filters from the free-text input.
// Accept common Vietnamese Telex typos for "quận" such as "quanj", "quanf", "quans", etc.
export const DISTRICT_PARSE_RE = /\b(?:q\.?|dist(?:rict)?\.?|quận|quan\.?(?:[sfrxj])?)\s*(\d{1,2})\b/i
export const DISTRICT_TAG_RE = /^(?:q\.?|dist(?:rict)?\.?|quận|quan\.?(?:[sfrxj])?)\s*(\d{1,2})$/i
export const BEDROOMS_PARSE_RE = /\b(\d{1,2})\s*(?:pn|p\s*n|br|bed(?:room)?s?|phong\s*ngu|phong\s*ng|phong)\b/i
export const BATHROOMS_PARSE_RE = /\b(\d{1,2})\s*(?:wc|w\s*c|toilet|bath(?:room)?s?|phong\s*tam|phong\s*tm)\b/i
export const AREA_RANGE_PARSE_RE =
  /(?:dt|dien\s*tich|di[eệ]n\s*t[ií]ch)?\s*(\d+(?:[.,]\d+)?)\s*(?:m2|m²|m|met\s*vuong|m\s*vuong|sqm)\s*(?:-|–|—|den|toi|toi da|~)\s*(\d+(?:[.,]\d+)?)\s*(?:m2|m²|m|met\s*vuong|m\s*vuong|sqm)?/i
export const AREA_SINGLE_PARSE_RE =
  /(?:dt|dien\s*tich|di[eệ]n\s*t[ií]ch)?\s*(\d+(?:[.,]\d+)?)\s*(?:m2|m²|m|met\s*vuong|m\s*vuong|sqm)\b/i
export const PRICE_RANGE_PARSE_RE =
  /(?:\btu\b\s*)?(\d+(?:[.,]\d+)?)\s*(ty|t|trieu|tr|m|billion|million)\s*(?:-|–|—|den|toi|toi da|~)\s*(\d+(?:[.,]\d+)?)\s*(ty|t|trieu|tr|m|billion|million)?/i
export const PRICE_SINGLE_PARSE_RE = /(\d+(?:[.,]\d+)?)\s*(ty|t|trieu|tr|m|billion|million)\b/i
export const LISTING_TYPE_PARSE_RE = /\b(?:ban|mua\s*ban|cho\s*thue|thue)\b/i
export const PROPERTY_TYPE_PARSE_RE =
  /\b(?:nha\s*rieng|nha\s*pho|chung\s*cu|can\s*ho|dat\s*nen|biet\s*thu|shophouse|penthouse|condotel|kho|xuong|mat\s*bang)\b/i
export const DIRECTION_PARSE_RE =
  /\b(?:huong\s*)?(dong|tay|nam|bac|dong\s*bac|dong\s*nam|tay\s*bac|tay\s*nam)\b/i
export const LEGAL_STATUS_PARSE_RE =
  /\b(?:so\s*do|so\s*hong|hdmb|hop\s*dong\s*mua\s*ban|dang\s*cho\s*so|cho\s*so)\b/i
export const FURNITURE_STATUS_PARSE_RE =
  /\b(?:noi\s*that\s*cao\s*cap|full\s*noi\s*that|noi\s*that\s*day\s*du|noi\s*that\s*co\s*ban|khong\s*noi\s*that|nha\s*trong)\b/i
export const POST_TYPE_PARSE_RE = /\b(?:vip|tin\s*vip)\b/i

// Regexes to strip parsed tokens so keyword search stays clean.
export const DISTRICT_REMOVE_RE = /\b(?:q\.?|dist(?:rict)?\.?|quận|quan\.?(?:[sfrxj])?)\s*\d{1,2}\b/giu
export const BEDROOMS_REMOVE_RE =
  /\b\d{1,2}\s*(?:pn|p\s*n|br|bed(?:room)?s?|phong\s*ngu|phòng\s*ngủ|phong\s*ng|phòng\s*ng)\b/giu
export const BATHROOMS_REMOVE_RE =
  /\b\d{1,2}\s*(?:wc|w\s*c|toilet|bath(?:room)?s?|phong\s*tam|phòng\s*tắm|phong\s*tm|phòng\s*tm)\b/giu
export const AREA_RANGE_REMOVE_RE =
  /(?:dt|dien\s*tich|di[eệ]n\s*t[ií]ch)?\s*\d+(?:[.,]\d+)?\s*(?:m2|m²|m|met\s*vuong|m\s*vuong|sqm)\s*(?:-|–|—|den|đến|toi|tới|toi da|tối đa|~)\s*\d+(?:[.,]\d+)?\s*(?:m2|m²|m|met\s*vuong|m\s*vuong|sqm)?/giu
export const AREA_SINGLE_REMOVE_RE =
  /(?:dt|dien\s*tich|di[eệ]n\s*t[ií]ch)?\s*\d+(?:[.,]\d+)?\s*(?:m2|m²|m|met\s*vuong|m\s*vuong|sqm)\b/giu
export const PRICE_RANGE_REMOVE_RE =
  /(?:\btu\b\s*)?\d+(?:[.,]\d+)?\s*(?:ty|tỷ|t|trieu|triệu|tr|m|billion|million)\s*(?:-|–|—|đến|den|toi|tới|toi da|tối đa|~)\s*\d+(?:[.,]\d+)?\s*(?:ty|tỷ|t|trieu|triệu|tr|m|billion|million)?/giu
export const PRICE_SINGLE_REMOVE_RE =
  /\d+(?:[.,]\d+)?\s*(?:ty|tỷ|t|trieu|triệu|tr|m|billion|million)\b/giu
export const LISTING_TYPE_REMOVE_RE = /\b(?:ban|mua\s*ban|cho\s*thue|thue)\b/giu
export const PROPERTY_TYPE_REMOVE_RE =
  /\b(?:nha\s*rieng|nha\s*pho|chung\s*cu|can\s*ho|dat\s*nen|biet\s*thu|shophouse|penthouse|condotel|kho|xuong|mat\s*bang)\b/giu
export const DIRECTION_REMOVE_RE =
  /\b(?:huong\s*)?(?:dong|tay|nam|bac|dong\s*bac|dong\s*nam|tay\s*bac|tay\s*nam)\b/giu
export const LEGAL_STATUS_REMOVE_RE =
  /\b(?:so\s*do|so\s*hong|hdmb|hop\s*dong\s*mua\s*ban|dang\s*cho\s*so|cho\s*so)\b/giu
export const FURNITURE_STATUS_REMOVE_RE =
  /\b(?:noi\s*that\s*cao\s*cap|full\s*noi\s*that|noi\s*that\s*day\s*du|noi\s*that\s*co\s*ban|khong\s*noi\s*that|nha\s*trong)\b/giu
export const POST_TYPE_REMOVE_RE = /\b(?:vip|tin\s*vip)\b/giu
