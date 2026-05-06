export type SearchTab = 'all' | 'property' | 'project' | 'news'

export type SearchChipKey =
  | 'district'
  | 'bedrooms'
  | 'bathrooms'
  | 'price'
  | 'area'
  | 'listingType'
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
  bedrooms?: number
  bathrooms?: number
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  listingType?: string
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

const SEARCH_HISTORY_STORAGE_KEY = 'goldenland.heroSearchHistory'
const MAX_SEARCH_HISTORY_ITEMS = 12
const SEARCH_HISTORY_TTL_MS = 1000 * 60 * 60 * 24 * 30
const SEARCH_TAG_PROMOTION_COUNT = 2
const SEARCH_TABS: SearchTab[] = ['all', 'property', 'project', 'news']
const MAX_SUGGESTION_FRAGMENT_TOKENS = 4

// Regexes to parse structured filters from the free-text input.
const DISTRICT_PARSE_RE = /\b(?:q\.?|quan|quận)\s*(\d{1,2})\b/i
const DISTRICT_TAG_RE = /^(?:q\.?|quan|quan\.?|quận)\s*(\d{1,2})$/i
const BEDROOMS_PARSE_RE = /\b(\d{1,2})\s*(?:pn|phong\s*ngu)\b/i
const BATHROOMS_PARSE_RE = /\b(\d{1,2})\s*(?:wc|toilet|phong\s*tam|phòng\s*tắm)\b/i
const AREA_RANGE_PARSE_RE =
  /(?:dien\s*tich\s*)?(\d+(?:[.,]\d+)?)\s*(?:m2|m²|met\s*vuong)\s*(?:-|den|toi|~)\s*(\d+(?:[.,]\d+)?)\s*(?:m2|m²|met\s*vuong)?/i
const AREA_SINGLE_PARSE_RE = /(?:dien\s*tich\s*)?(\d+(?:[.,]\d+)?)\s*(?:m2|m²|met\s*vuong)\b/i
const PRICE_RANGE_PARSE_RE =
  /(?:\btu\b\s*)?(\d+(?:[.,]\d+)?)\s*(ty|trieu)\s*(?:-|den|toi|~)\s*(\d+(?:[.,]\d+)?)\s*(ty|trieu)?/i
const PRICE_SINGLE_PARSE_RE = /(\d+(?:[.,]\d+)?)\s*(ty|trieu)\b/i

// Regexes to strip parsed tokens so keyword search stays clean.
const DISTRICT_REMOVE_RE = /\b(?:q\.?|quận|quan)\s*\d{1,2}\b/giu
const BEDROOMS_REMOVE_RE = /\b\d{1,2}\s*(?:pn|phong\s*ngu|phòng\s*ngủ)\b/giu
const BATHROOMS_REMOVE_RE = /\b\d{1,2}\s*(?:wc|toilet|phong\s*tam|phòng\s*tắm)\b/giu
const AREA_RANGE_REMOVE_RE =
  /(?:dien\s*tich\s*)?\d+(?:[.,]\d+)?\s*(?:m2|m²|met\s*vuong)\s*(?:-|den|đến|toi|tới|~)\s*\d+(?:[.,]\d+)?\s*(?:m2|m²|met\s*vuong)?/giu
const AREA_SINGLE_REMOVE_RE = /(?:dien\s*tich\s*)?\d+(?:[.,]\d+)?\s*(?:m2|m²|met\s*vuong)\b/giu
const PRICE_RANGE_REMOVE_RE =
  /(?:\btu\b\s*)?\d+(?:[.,]\d+)?\s*(?:ty|tỷ|trieu|triệu)\s*(?:-|đến|den|toi|tới|~)\s*\d+(?:[.,]\d+)?\s*(?:ty|tỷ|trieu|triệu)?/giu
const PRICE_SINGLE_REMOVE_RE = /\d+(?:[.,]\d+)?\s*(?:ty|tỷ|trieu|triệu)\b/giu

// Normalize input for matching: lowercase, strip diacritics/punctuation, collapse whitespace.
const normalize = (input: string): string => {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

type SearchTagDefinition = {
  label: string
  tab: SearchTab
  aliases: string[]
  related: string[]
  popularity: number
  filter?: Partial<ParsedSearchFilters>
}

type SearchAttributeOption = {
  label: string
  aliases: string[]
  filter?: Partial<ParsedSearchFilters>
  tab?: SearchTab
  related?: string[]
  popularity?: number
}

const createAttributeTags = (
  options: SearchAttributeOption[],
  defaultTab: SearchTab,
): SearchTagDefinition[] =>
  options.map((option) => ({
    label: option.label,
    tab: option.tab ?? defaultTab,
    aliases: option.aliases,
    related: option.related ?? [],
    popularity: option.popularity ?? 65,
    filter: option.filter,
  }))

const PROPERTY_ATTRIBUTE_TAGS = createAttributeTags(
  [
    {
      label: 'bán',
      aliases: ['ban', 'bán', 'mua bán', 'nha dat ban', 'nhà đất bán'],
      filter: { listingType: 'sale' },
      popularity: 88,
    },
    {
      label: 'cho thuê',
      aliases: ['cho thue', 'cho thuê', 'thue', 'thuê', 'nha thue', 'nhà thuê'],
      filter: { listingType: 'rent' },
      popularity: 84,
    },
    {
      label: 'tin VIP',
      aliases: ['vip', 'tin vip', 'bai vip', 'bài vip'],
      filter: { postType: 'vip' },
      popularity: 62,
    },
    { label: 'tin thường', aliases: ['tin thuong', 'tin thường', 'normal'], popularity: 45 },
    { label: 'tin hot', aliases: ['tin hot', 'hot'], popularity: 60 },
    { label: 'tin premium', aliases: ['premium', 'tin premium'], popularity: 57 },
    { label: 'đã xác thực', aliases: ['da xac thuc', 'đã xác thực', 'verified'], popularity: 64 },
    {
      label: 'nhà riêng',
      aliases: ['nha rieng', 'nhà riêng', 'nha o', 'nhà ở'],
      filter: { propertyType: 'house' },
      popularity: 94,
    },
    {
      label: 'chung cư',
      aliases: ['chung cu', 'chung cư', 'can ho', 'căn hộ', 'apartment'],
      filter: { propertyType: 'apartment' },
      popularity: 96,
    },
    {
      label: 'đất nền',
      aliases: ['dat nen', 'đất nền', 'dat tho cu', 'đất thổ cư', 'đất'],
      filter: { propertyType: 'land' },
      popularity: 88,
    },
    {
      label: 'biệt thự',
      aliases: ['biet thu', 'biệt thự', 'villa'],
      filter: { propertyType: 'villa' },
      popularity: 74,
    },
    {
      label: 'nhà phố',
      aliases: ['nha pho', 'nhà phố', 'townhouse'],
      filter: { propertyType: 'townhouse' },
      popularity: 82,
    },
    {
      label: 'shophouse',
      aliases: ['shophouse', 'shop house', 'nhà phố thương mại', 'nha pho thuong mai'],
      filter: { propertyType: 'shophouse' },
      popularity: 72,
    },
    {
      label: 'penthouse',
      aliases: ['penthouse', 'can ho penthouse', 'căn hộ penthouse'],
      filter: { propertyType: 'penthouse' },
      popularity: 61,
    },
    {
      label: 'condotel',
      aliases: ['condotel', 'can ho khach san', 'căn hộ khách sạn'],
      filter: { propertyType: 'condotel' },
      popularity: 58,
    },
    {
      label: 'kho xưởng',
      aliases: ['kho xuong', 'kho xưởng', 'nha xuong', 'nhà xưởng', 'warehouse'],
      filter: { propertyType: 'warehouse' },
      popularity: 55,
    },
    {
      label: 'mặt bằng',
      aliases: ['mat bang', 'mặt bằng', 'commercial', 'mat bang kinh doanh'],
      filter: { propertyType: 'commercial' },
      popularity: 57,
    },
    ...[
      ['Đông', 'east', ['dong', 'đông', 'huong dong', 'hướng đông']],
      ['Tây', 'west', ['tay', 'tây', 'huong tay', 'hướng tây']],
      ['Nam', 'south', ['nam', 'huong nam', 'hướng nam']],
      ['Bắc', 'north', ['bac', 'bắc', 'huong bac', 'hướng bắc']],
      ['Đông Bắc', 'northeast', ['dong bac', 'đông bắc', 'huong dong bac']],
      ['Đông Nam', 'southeast', ['dong nam', 'đông nam', 'huong dong nam']],
      ['Tây Bắc', 'northwest', ['tay bac', 'tây bắc', 'huong tay bac']],
      ['Tây Nam', 'southwest', ['tay nam', 'tây nam', 'huong tay nam']],
    ].map(([label, value, aliases]) => ({
      label: `hướng ${label}`,
      aliases: aliases as string[],
      filter: { direction: value as string },
      popularity: 54,
    })),
    {
      label: 'sổ đỏ sổ hồng',
      aliases: ['so do', 'sổ đỏ', 'so hong', 'sổ hồng', 'phap ly so do', 'pháp lý sổ đỏ'],
      filter: { legalStatus: 'red_book' },
      popularity: 86,
    },
    {
      label: 'hợp đồng mua bán',
      aliases: ['hop dong mua ban', 'hợp đồng mua bán', 'hdmb'],
      filter: { legalStatus: 'sale_contract' },
      popularity: 58,
    },
    {
      label: 'đang chờ sổ',
      aliases: ['dang cho so', 'đang chờ sổ', 'cho so', 'chờ sổ'],
      filter: { legalStatus: 'pending' },
      popularity: 52,
    },
    {
      label: 'nội thất cao cấp',
      aliases: ['noi that cao cap', 'nội thất cao cấp', 'luxury furniture'],
      filter: { furnitureStatus: 'luxury' },
      popularity: 58,
    },
    {
      label: 'full nội thất',
      aliases: ['full noi that', 'full nội thất', 'noi that day du', 'nội thất đầy đủ'],
      filter: { furnitureStatus: 'full' },
      popularity: 78,
    },
    {
      label: 'nội thất cơ bản',
      aliases: ['noi that co ban', 'nội thất cơ bản'],
      filter: { furnitureStatus: 'basic' },
      popularity: 53,
    },
    {
      label: 'không nội thất',
      aliases: ['khong noi that', 'không nội thất', 'nha trong', 'nhà trống'],
      filter: { furnitureStatus: 'none' },
      popularity: 57,
    },
    { label: 'diện tích', aliases: ['dien tich', 'diện tích', 'm2', 'm²'], popularity: 72 },
    { label: 'phòng ngủ', aliases: ['phong ngu', 'phòng ngủ', 'pn'], popularity: 78 },
    { label: 'phòng tắm', aliases: ['phong tam', 'phòng tắm', 'wc', 'toilet'], popularity: 66 },
    { label: 'đường rộng', aliases: ['duong rong', 'đường rộng', 'road width'], popularity: 55 },
    { label: 'mặt tiền', aliases: ['mat tien', 'mặt tiền', 'facade'], popularity: 75 },
    {
      label: 'địa chỉ',
      aliases: ['dia chi', 'địa chỉ', 'address', 'street', 'duong'],
      popularity: 62,
    },
    { label: 'có video', aliases: ['co video', 'có video', 'video youtube'], popularity: 44 },
    {
      label: 'có hình ảnh',
      aliases: ['co hinh anh', 'có hình ảnh', 'co anh', 'có ảnh'],
      popularity: 50,
    },
    {
      label: 'seo bất động sản',
      aliases: ['seo bat dong san', 'seo bất động sản', 'seo title'],
      popularity: 35,
    },
  ],
  'property',
)

const PROJECT_ATTRIBUTE_TAGS = createAttributeTags(
  [
    { label: 'dự án mới', aliases: ['du an moi', 'dự án mới', 'new project', 'mo ban'] },
    { label: 'chủ đầu tư', aliases: ['chu dau tu', 'chủ đầu tư', 'investor'] },
    { label: 'đang mở bán', aliases: ['dang mo ban', 'đang mở bán', 'open sale'] },
    { label: 'sắp mở bán', aliases: ['sap mo ban', 'sắp mở bán', 'upcoming'] },
    { label: 'đã bàn giao', aliases: ['da ban giao', 'đã bàn giao', 'completed'] },
    { label: 'phân khu', aliases: ['phan khu', 'phân khu', 'zone'] },
    { label: 'tên phân khu', aliases: ['ten phan khu', 'tên phân khu', 'zone name'] },
    { label: 'tổng diện tích', aliases: ['tong dien tich', 'tổng diện tích', 'total area'] },
    { label: 'tổng số căn', aliases: ['tong so can', 'tổng số căn', 'total units'] },
    { label: 'giá từ', aliases: ['gia tu', 'giá từ', 'price from'] },
    { label: 'giá đến', aliases: ['gia den', 'giá đến', 'price to'] },
    { label: 'ngày khởi công', aliases: ['ngay khoi cong', 'ngày khởi công', 'start date'] },
    { label: 'ngày bàn giao', aliases: ['ngay ban giao', 'ngày bàn giao', 'completion date'] },
    {
      label: 'mặt bằng tổng thể',
      aliases: ['mat bang tong the', 'mặt bằng tổng thể', 'master plan'],
    },
    { label: 'tiện ích nội khu', aliases: ['tien ich noi khu', 'tiện ích nội khu', 'tiện ích'] },
    { label: 'dự án nổi bật', aliases: ['du an noi bat', 'dự án nổi bật', 'featured project'] },
    { label: 'lượt xem dự án', aliases: ['luot xem du an', 'lượt xem dự án', 'views'] },
    { label: 'ảnh dự án', aliases: ['anh du an', 'ảnh dự án', 'project images'] },
    { label: 'video dự án', aliases: ['video du an', 'video dự án', 'youtube du an'] },
    { label: 'Vinhomes', aliases: ['vinhomes', 'vin home', 'vin', 'khu vin', 'khu vinhomes'] },
  ],
  'project',
)

const NEWS_ATTRIBUTE_TAGS = createAttributeTags(
  [
    { label: 'tin nổi bật', aliases: ['tin noi bat', 'tin nổi bật', 'bai viet noi bat'] },
    { label: 'danh mục tin tức', aliases: ['danh muc tin tuc', 'danh mục tin tức', 'category'] },
    { label: 'tag tin tức', aliases: ['tag tin tuc', 'tag tin tức', 'tags'] },
    { label: 'tác giả', aliases: ['tac gia', 'tác giả', 'author'] },
    { label: 'ngày xuất bản', aliases: ['ngay xuat ban', 'ngày xuất bản', 'published at'] },
    { label: 'tin thị trường', aliases: ['tin thi truong', 'tin thị trường', 'thi truong'] },
    {
      label: 'lãi suất vay mua nhà',
      aliases: ['lai suat vay mua nha', 'lãi suất vay mua nhà', 'lai suat'],
    },
    { label: 'pháp lý bất động sản', aliases: ['phap ly bat dong san', 'pháp lý bất động sản'] },
    { label: 'kinh nghiệm mua nhà', aliases: ['kinh nghiem mua nha', 'kinh nghiệm mua nhà'] },
    { label: 'seo title', aliases: ['seo title', 'tieu de seo', 'tiêu đề seo'] },
    { label: 'seo keywords', aliases: ['seo keywords', 'tu khoa seo', 'từ khóa seo'] },
    { label: 'lượt xem cao', aliases: ['luot xem cao', 'lượt xem cao', 'tin xem nhieu'] },
  ],
  'news',
)

const SEARCH_TAG_CATALOG: SearchTagDefinition[] = [
  ...PROPERTY_ATTRIBUTE_TAGS,
  ...PROJECT_ATTRIBUTE_TAGS,
  ...NEWS_ATTRIBUTE_TAGS,
  {
    label: 'quận',
    tab: 'property',
    aliases: ['quan', 'quận', 'q'],
    related: ['Quận 1', 'Quận 7', 'Quận 10'],
    popularity: 91,
  },
  {
    label: 'nhà ở',
    tab: 'property',
    aliases: ['nha o', 'nhà ở', 'nhao', 'nha pho', 'nhà phố', 'nhà riêng'],
    related: ['nhà phố', 'đất nền', 'sổ hồng'],
    popularity: 98,
  },
  {
    label: 'căn hộ',
    tab: 'property',
    aliases: ['can ho', 'căn hộ', 'chung cu', 'chung cư', 'apartment'],
    related: ['2 phòng ngủ', 'ban công', 'tiện ích nội khu'],
    popularity: 96,
  },
  {
    label: 'đất nền',
    tab: 'property',
    aliases: ['dat nen', 'đất nền', 'dat tho cu', 'đất thổ cư', 'đất'],
    related: ['sổ hồng', 'mặt tiền', 'khu dân cư'],
    popularity: 88,
  },
  {
    label: 'biệt thự',
    tab: 'property',
    aliases: ['biet thu', 'biệt thự', 'villa'],
    related: ['sân vườn', 'hồ bơi', 'compound'],
    popularity: 74,
  },
  {
    label: 'shophouse',
    tab: 'property',
    aliases: ['shophouse', 'shop house', 'nhà phố thương mại', 'nha pho thuong mai'],
    related: ['mặt tiền', 'kinh doanh', 'dự án'],
    popularity: 72,
  },
  {
    label: 'nhà thuê',
    tab: 'property',
    aliases: ['nha thue', 'nhà thuê', 'cho thue nha', 'cho thuê nhà', 'thuê nhà'],
    related: ['full nội thất', 'gần trung tâm', 'hợp đồng dài hạn'],
    popularity: 70,
  },
  {
    label: '2 phòng ngủ',
    tab: 'property',
    aliases: ['2 phong ngu', '2 phòng ngủ', '2pn', 'hai phong ngu'],
    related: ['căn hộ', 'ban công', 'dưới 2 tỷ'],
    popularity: 86,
  },
  {
    label: '3 phòng ngủ',
    tab: 'property',
    aliases: ['3 phong ngu', '3 phòng ngủ', '3pn', 'ba phong ngu'],
    related: ['căn hộ', 'gia đình', 'diện tích lớn'],
    popularity: 78,
  },
  {
    label: 'dưới 2 tỷ',
    tab: 'property',
    aliases: ['duoi 2 ty', 'dưới 2 tỷ', '2 ty', '2 tỷ', 'toi da 2 ty'],
    related: ['căn hộ', 'trả góp', 'sổ hồng'],
    popularity: 82,
  },
  {
    label: 'Quận 7',
    tab: 'property',
    aliases: ['quan 7', 'quận 7', 'q7', 'q 7'],
    related: ['Phú Mỹ Hưng', 'căn hộ', 'nhà phố'],
    popularity: 92,
  },
  {
    label: 'Thủ Đức',
    tab: 'property',
    aliases: ['thu duc', 'thủ đức', 'tp thu duc', 'thành phố thủ đức'],
    related: ['Quận 9', 'căn hộ', 'dự án mới'],
    popularity: 84,
  },
  {
    label: 'dự án mới',
    tab: 'project',
    aliases: ['du an moi', 'dự án mới', 'new project', 'mo ban'],
    related: ['căn hộ', 'chủ đầu tư uy tín', 'tiện ích nội khu'],
    popularity: 90,
  },
  {
    label: 'Vinhomes',
    tab: 'project',
    aliases: ['vinhomes', 'vin home', 'vin', 'khu vin', 'khu vinhomes'],
    related: ['dự án mới', 'căn hộ', 'tiện ích nội khu'],
    popularity: 94,
  },
  {
    label: 'chủ đầu tư uy tín',
    tab: 'project',
    aliases: ['chu dau tu uy tin', 'chủ đầu tư uy tín', 'chu dau tu', 'cđt uy tín'],
    related: ['dự án mới', 'pháp lý rõ ràng', 'tiến độ xây dựng'],
    popularity: 76,
  },
  {
    label: 'lãi suất vay mua nhà',
    tab: 'news',
    aliases: ['lai suat vay mua nha', 'lãi suất vay mua nhà', 'lai suat', 'vay mua nha'],
    related: ['thị trường căn hộ', 'gói vay', 'trả góp'],
    popularity: 89,
  },
  {
    label: 'thị trường căn hộ',
    tab: 'news',
    aliases: ['thi truong can ho', 'thị trường căn hộ', 'tin can ho', 'tin căn hộ'],
    related: ['lãi suất vay mua nhà', 'dự án mới', 'giá bán'],
    popularity: 85,
  },
]

const TAG_BY_NORMALIZED_LABEL = new Map(
  SEARCH_TAG_CATALOG.map((tag) => [normalize(tag.label), tag] as const),
)

// Aggregate label/aliases/related into a searchable text blob per tag.
const getTagSearchText = (tag: SearchTagDefinition): string => {
  return normalize(`${tag.label} ${tag.aliases.join(' ')} ${tag.related.join(' ')}`)
}

const getSuggestionFragments = (input: string): string[] => {
  const normalizedInput = normalize(input)
  const tokens = normalizedInput.split(' ').filter(Boolean)
  const fragments: string[] = []

  for (
    let length = Math.min(MAX_SUGGESTION_FRAGMENT_TOKENS, tokens.length);
    length >= 1;
    length -= 1
  ) {
    fragments.push(tokens.slice(tokens.length - length).join(' '))
  }

  return fragments
}

const toNumber = (raw: string): number => Number(raw.replace(',', '.'))

const toVnd = (value: number, unitRaw?: string): number => {
  const unit = (unitRaw || '').toLowerCase()

  if (unit.includes('ty')) return Math.round(value * 1_000_000_000)
  if (unit.includes('trieu')) return Math.round(value * 1_000_000)

  return Math.round(value)
}

const compactWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim()

const getHistoryStorage = (): Storage | undefined => {
  if (typeof window === 'undefined') return undefined

  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

const createHistoryId = (input: string, tab: SearchTab): string => `${tab}:${normalize(input)}`

const isSearchHistoryItem = (value: unknown): value is SearchHistoryItem => {
  if (!value || typeof value !== 'object') return false

  const item = value as Partial<SearchHistoryItem>

  return (
    typeof item.id === 'string' &&
    typeof item.input === 'string' &&
    SEARCH_TABS.includes(item.tab as SearchTab) &&
    typeof item.keyword === 'string' &&
    typeof item.count === 'number' &&
    typeof item.lastUsedAt === 'number' &&
    typeof item.filters === 'object' &&
    Array.isArray(item.chips)
  )
}

const sortSearchHistory = (history: SearchHistoryItem[]): SearchHistoryItem[] => {
  return [...history].sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count

    return right.lastUsedAt - left.lastUsedAt
  })
}

const isFreshHistoryItem = (item: SearchHistoryItem): boolean => {
  return Date.now() - item.lastUsedAt <= SEARCH_HISTORY_TTL_MS
}

const tabMatches = (candidate: SearchTab, activeTab: SearchTab): boolean => {
  return activeTab === 'all' || candidate === activeTab || candidate === 'all'
}

const uniqueSearchTags = (tags: SearchHistoryTag[]): SearchHistoryTag[] => {
  return [...new Map(tags.map((tag) => [tag.normalized, tag])).values()]
}

const extractSearchTags = (input: string, parsed: ParsedSearchResult): SearchHistoryTag[] => {
  // Build a normalized search text snapshot for tag extraction.
  const searchText = normalize(
    `${input} ${parsed.keyword} ${parsed.chips.map((chip) => chip.label).join(' ')}`,
  )
  const tags = SEARCH_TAG_CATALOG.filter((tag) => {
    if (!tabMatches(tag.tab, parsed.tab)) return false

    return [tag.label, ...tag.aliases].some((alias) => {
      const normalizedAlias = normalize(alias)
      return normalizedAlias && searchText.includes(normalizedAlias)
    })
  })

  const extractedTags = tags.map((tag) => ({
    label: tag.label,
    normalized: normalize(tag.label),
  }))

  if (parsed.filters.district) {
    const label = `Quận ${parsed.filters.district}`
    extractedTags.push({
      label,
      normalized: normalize(label),
    })
  }

  return uniqueSearchTags(extractedTags)
}

const getHistoryTagStats = (history: SearchHistoryItem[], activeTab: SearchTab) => {
  const stats = new Map<
    string,
    {
      label: string
      count: number
      lastUsedAt: number
      tab: SearchTab
    }
  >()

  history.forEach((item) => {
    if (!tabMatches(item.tab, activeTab)) return

    const tags = uniqueSearchTags([...(item.tags ?? []), ...extractSearchTags(item.input, item)])
    tags.forEach((tag) => {
      const previous = stats.get(tag.normalized)
      stats.set(tag.normalized, {
        label: tag.label,
        count: (previous?.count ?? 0) + item.count,
        lastUsedAt: Math.max(previous?.lastUsedAt ?? 0, item.lastUsedAt),
        tab: item.tab,
      })
    })
  })

  return stats
}

const matchesInputTokens = (searchText: string, inputTokens: string[]): boolean => {
  if (inputTokens.length === 0) return true

  return inputTokens.every((token) => searchText.includes(token))
}

const tagStartsWithInput = (
  tag: Pick<SearchTagDefinition, 'label' | 'aliases'>,
  normalizedInput: string,
): boolean => {
  if (!normalizedInput) return false

  return [tag.label, ...tag.aliases].some((value) => normalize(value).startsWith(normalizedInput))
}

const tagCloselyMatchesInput = (
  tag: Pick<SearchTagDefinition, 'label' | 'aliases'>,
  normalizedInput: string,
  inputTokens: string[],
): boolean => {
  if (normalizedInput.length < 2) return false

  const normalizedValues = [tag.label, ...tag.aliases].map(normalize)

  if (inputTokens.length === 1) {
    return normalizedValues.some((value) => {
      const valueTokens = value.split(' ')

      return valueTokens.length === 1 && value.startsWith(inputTokens[0])
    })
  }

  if (
    normalizedValues.some(
      (value) => value.startsWith(normalizedInput) || normalizedInput.startsWith(value),
    )
  ) {
    return true
  }

  return normalizedValues.some((value) => {
    const valueTokens = value.split(' ')
    if (inputTokens.length > valueTokens.length) return false

    return inputTokens.every((token, index) => valueTokens[index]?.startsWith(token))
  })
}

const isDistrictTagMatch = (normalizedLabel: string, normalizedInput: string): boolean => {
  return /^(?:quan|q)$/.test(normalizedInput) && /^quan \d{1,2}$/.test(normalizedLabel)
}

const createDistrictTagSuggestion = (
  normalizedInput: string,
  inputTokens: string[],
  tab: SearchTab,
  matchedInput = normalizedInput,
): SearchTagSuggestion | undefined => {
  if (tab !== 'all' && tab !== 'property') return undefined

  const match = normalizedInput.match(DISTRICT_TAG_RE)
  if (!match) return undefined

  const district = Number(match[1])
  if (!Number.isInteger(district) || district < 1 || district > 12) return undefined

  const label = `Quận ${district}`
  const aliases = [`quan ${district}`, `quận ${district}`, `q${district}`, `q ${district}`]

  if (!tagCloselyMatchesInput({ label, aliases }, normalizedInput, inputTokens)) return undefined

  return {
    id: `dynamic:quan-${district}`,
    label,
    normalized: normalize(label),
    tab: 'property',
    source: 'popular',
    score: 120,
    aliases,
    matchedInput,
  }
}

const formatPrice = (value: number): string => {
  if (value >= 1_000_000_000) {
    const ty = value / 1_000_000_000
    return `${ty % 1 === 0 ? ty.toFixed(0) : ty.toFixed(1)} tỷ`
  }

  const trieu = value / 1_000_000
  return `${trieu % 1 === 0 ? trieu.toFixed(0) : trieu.toFixed(1)} triệu`
}

const parseDistrict = (normalizedInput: string): number | undefined => {
  const match = normalizedInput.match(DISTRICT_PARSE_RE)
  if (!match) return undefined

  return Number(match[1])
}

const parseBedrooms = (normalizedInput: string): number | undefined => {
  const match = normalizedInput.match(BEDROOMS_PARSE_RE)
  if (!match) return undefined

  return Number(match[1])
}

const parseBathrooms = (normalizedInput: string): number | undefined => {
  const match = normalizedInput.match(BATHROOMS_PARSE_RE)
  if (!match) return undefined

  return Number(match[1])
}

const parseArea = (
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

const parsePrice = (
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

const buildKeyword = (input: string, tab: SearchTab): string => {
  // Remove structured filters so keyword search stays relevant.
  return compactWhitespace(
    input
      .replace(DISTRICT_REMOVE_RE, ' ')
      .replace(BEDROOMS_REMOVE_RE, ' ')
      .replace(BATHROOMS_REMOVE_RE, ' ')
      .replace(AREA_RANGE_REMOVE_RE, ' ')
      .replace(AREA_SINGLE_REMOVE_RE, ' ')
      .replace(PRICE_RANGE_REMOVE_RE, ' ')
      .replace(PRICE_SINGLE_REMOVE_RE, ' '),
  )
}

const removeAliasTokens = (input: string, aliases: string[]): string => {
  // Token-based removal to be diacritic/case insensitive and avoid partial matches.
  const inputTokens = compactWhitespace(input).split(/\s+/).filter(Boolean)
  const normalizedTokens = inputTokens.map((token) => normalize(token))

  const aliasTokenSets = aliases
    .map((alias) => compactWhitespace(alias))
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)
    .map((alias) => alias.split(/\s+/).map((token) => normalize(token)))

  if (aliasTokenSets.length === 0) return compactWhitespace(input)

  let tokens = [...inputTokens]
  let normalized = [...normalizedTokens]

  aliasTokenSets.forEach((aliasTokens) => {
    if (aliasTokens.length === 0) return

    let index = 0
    while (index <= normalized.length - aliasTokens.length) {
      const segment = normalized.slice(index, index + aliasTokens.length)
      const isMatch = aliasTokens.every((token, tokenIndex) => token === segment[tokenIndex])

      if (!isMatch) {
        index += 1
        continue
      }

      if (
        aliasTokens.length === 1 &&
        aliasTokens[0] === 'ban' &&
        normalized[index + 1] === 'giao'
      ) {
        index += 1
        continue
      }

      tokens.splice(index, aliasTokens.length)
      normalized.splice(index, aliasTokens.length)
    }
  })

  return compactWhitespace(tokens.join(' '))
}

const clampSuggestionScore = (score: number): number => Math.min(score, 220)

const getMatchedFilterTags = (input: string, tab: SearchTab): SearchTagDefinition[] => {
  const normalizedInput = normalize(input)

  return SEARCH_TAG_CATALOG.filter((tag) => {
    if (!tag.filter || !tabMatches(tag.tab, tab)) return false

    return [tag.label, ...tag.aliases].some((value) => {
      const normalizedValue = normalize(value)

      if (!normalizedValue) return false
      if (normalizedValue === 'ban' && /\bban\s+giao\b/u.test(normalizedInput)) return false

      return new RegExp(`(^|\\s)${normalizedValue.replace(/\s+/g, '\\s+')}(?=\\s|$)`, 'u').test(
        normalizedInput,
      )
    })
  })
}

const removeMatchedFilterTagText = (input: string, matchedTags: SearchTagDefinition[]): string => {
  return matchedTags.reduce((nextInput, tag) => {
    const aliases = [tag.label, ...tag.aliases]
      .map((alias) => alias.trim())
      .filter(Boolean)
      .sort((left, right) => right.length - left.length)

    return aliases.reduce((value, alias) => {
      const pattern = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')

      return value.replace(new RegExp(`(^|\\s)${pattern}(?=\\s|$)`, 'giu'), ' ')
    }, nextInput)
  }, input)
}

export function parseSearch(input: string, tab: SearchTab): ParsedSearchResult {
  const rawInput = compactWhitespace(input)
  const normalized = normalize(rawInput)

  // Parse structured filters based on the active tab.
  const filters: ParsedSearchFilters = {}

  if (tab !== 'news') {
    const district = parseDistrict(normalized)
    if (typeof district === 'number' && district > 0) filters.district = district
  }

  if (tab === 'property' || tab === 'all') {
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

  const matchedFilterTags = getMatchedFilterTags(rawInput, tab)

  matchedFilterTags.forEach((tag) => {
    Object.assign(filters, tag.filter)
  })

  // Build keyword after removing matched tag text to avoid double-counting.
  const keyword = buildKeyword(removeMatchedFilterTagText(rawInput, matchedFilterTags), tab)
  const chips: SearchChip[] = []

  if (filters.district) {
    // Chips are used by the UI to display and edit/remove filters.
    chips.push({
      key: 'district',
      label: `Quận ${filters.district}`,
      value: String(filters.district),
      editText: `quận ${filters.district}`,
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
    listingType:
      filters.listingType === 'rent'
        ? 'Cho thuê'
        : filters.listingType === 'sale'
          ? 'Bán'
          : undefined,
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
    postType: filters.postType === 'vip' ? 'Tin VIP' : undefined,
  }

  ;(
    [
      ['listingType', filters.listingType],
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
}

export function getSearchPlaceholder(tab: SearchTab): string {
  if (tab === 'property') return 'VD: căn hộ quận 7 2 phòng ngủ 2 tỷ'
  if (tab === 'project') return 'VD: Vinhomes quận 9'
  if (tab === 'news') return 'VD: lãi suất vay mua nhà 2026'

  return 'VD: quận 7 2 phòng ngủ 2 tỷ hoặc tên dự án, tin tức'
}

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

export function removeSearchTokenByChip(input: string, chip: SearchChip): string {
  // Remove a single chip from the raw input so re-parse reflects the change.
  if (chip.key === 'keyword') {
    return removeAliasTokens(input, [chip.value])
  }

  if (chip.key === 'district') {
    return compactWhitespace(input.replace(DISTRICT_REMOVE_RE, ' '))
  }

  if (chip.key === 'bedrooms') {
    return compactWhitespace(input.replace(BEDROOMS_REMOVE_RE, ' '))
  }

  if (chip.key === 'bathrooms') {
    return compactWhitespace(input.replace(BATHROOMS_REMOVE_RE, ' '))
  }

  if (chip.key === 'area') {
    return compactWhitespace(
      input.replace(AREA_RANGE_REMOVE_RE, ' ').replace(AREA_SINGLE_REMOVE_RE, ' '),
    )
  }

  if (
    chip.key === 'listingType' ||
    chip.key === 'propertyType' ||
    chip.key === 'direction' ||
    chip.key === 'legalStatus' ||
    chip.key === 'furnitureStatus' ||
    chip.key === 'postType'
  ) {
    const aliases = [chip.label, chip.editText, chip.value].filter(Boolean)
    return removeAliasTokens(input, aliases)
  }

  return compactWhitespace(
    input.replace(PRICE_RANGE_REMOVE_RE, ' ').replace(PRICE_SINGLE_REMOVE_RE, ' '),
  )
}

export function readSearchHistory(storage = getHistoryStorage()): SearchHistoryItem[] {
  if (!storage) return []

  try {
    const rawHistory = storage.getItem(SEARCH_HISTORY_STORAGE_KEY)
    if (!rawHistory) return []

    const parsedHistory: unknown = JSON.parse(rawHistory)
    if (!Array.isArray(parsedHistory)) return []

    const history = parsedHistory.filter(isSearchHistoryItem).filter(isFreshHistoryItem)

    if (history.length !== parsedHistory.length) {
      storage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(history))
    }

    return sortSearchHistory(history).slice(0, MAX_SEARCH_HISTORY_ITEMS)
  } catch {
    return []
  }
}

export function recordSearchHistory(
  input: string,
  parsed: ParsedSearchResult,
  storage = getHistoryStorage(),
): SearchHistoryItem[] {
  const compactInput = compactWhitespace(input)
  if (!storage || !compactInput) return readSearchHistory(storage)

  const existingHistory = readSearchHistory(storage)
  const id = createHistoryId(compactInput, parsed.tab)
  const previous = existingHistory.find((item) => item.id === id)
  const previousCount = previous && isFreshHistoryItem(previous) ? previous.count : 0
  const nextItem: SearchHistoryItem = {
    id,
    input: compactInput,
    tab: parsed.tab,
    keyword: parsed.keyword,
    filters: parsed.filters,
    chips: parsed.chips,
    tags: extractSearchTags(compactInput, parsed),
    count: previousCount + 1,
    lastUsedAt: Date.now(),
  }
  const nextHistory = sortSearchHistory([
    nextItem,
    ...existingHistory.filter((item) => item.id !== id),
  ]).slice(0, MAX_SEARCH_HISTORY_ITEMS)

  try {
    storage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory))
  } catch {
    return existingHistory
  }

  return nextHistory
}

export function clearSearchHistory(storage = getHistoryStorage()): void {
  if (!storage) return

  try {
    storage.removeItem(SEARCH_HISTORY_STORAGE_KEY)
  } catch {
    // Ignore storage failures. Search suggestions are non-critical UI state.
  }
}

export function getPersonalizedSearchSuggestions(
  input: string,
  tab: SearchTab,
  history: SearchHistoryItem[],
  limit = 4,
): SearchHistoryItem[] {
  const normalizedInput = normalize(input)
  const inputTokens = normalizedInput.split(' ').filter(Boolean)

  return history
    .filter((item) => {
      if (item.count < SEARCH_TAG_PROMOTION_COUNT) return false
      if (tab !== 'all' && item.tab !== tab && item.tab !== 'all') return false
      if (inputTokens.length === 0) return true

      const searchableText = normalize(
        `${item.input} ${item.keyword} ${item.chips.map((chip) => chip.label).join(' ')}`,
      )

      return inputTokens.every((token) => searchableText.includes(token))
    })
    .map((item) => {
      const normalizedItemInput = normalize(item.input)
      const startsWithInput = normalizedInput && normalizedItemInput.startsWith(normalizedInput)
      const recencyScore = Math.max(0, 7 - (Date.now() - item.lastUsedAt) / 86_400_000)

      return {
        item,
        score: item.count * 8 + recencyScore + (startsWithInput ? 10 : 0),
      }
    })
    .sort((left, right) => right.score - left.score)
    .map(({ item }) => item)
    .slice(0, limit)
}

export function getSearchTagSuggestions(
  input: string,
  tab: SearchTab,
  history: SearchHistoryItem[],
  projectSuggestions: SearchProjectSuggestionInput[] = [],
  limit = 8,
): SearchTagSuggestion[] {
  // Suggest tags based on history, catalog, and project name matches.
  const fragments = getSuggestionFragments(input)
  if (!fragments.some((fragment) => fragment.length >= 2)) return []

  const suggestions = new Map<string, SearchTagSuggestion>()
  const historyTagStats = getHistoryTagStats(history, tab)

  fragments.forEach((normalizedFragment, fragmentIndex) => {
    const inputTokens = normalizedFragment.split(' ').filter(Boolean)
    if (normalizedFragment.length < 2) return

    const dynamicDistrictSuggestion = createDistrictTagSuggestion(
      normalizedFragment,
      inputTokens,
      tab,
      normalizedFragment,
    )

    if (dynamicDistrictSuggestion) {
      suggestions.set(dynamicDistrictSuggestion.normalized, {
        ...dynamicDistrictSuggestion,
        score: clampSuggestionScore(
          dynamicDistrictSuggestion.score + fragments.length - fragmentIndex,
        ),
      })
    }

    historyTagStats.forEach((stats, normalizedLabel) => {
      if (stats.count < SEARCH_TAG_PROMOTION_COUNT) return

      const catalogTag = TAG_BY_NORMALIZED_LABEL.get(normalizedLabel)
      const aliases = catalogTag?.aliases ?? [stats.label]
      const searchText = catalogTag
        ? getTagSearchText(catalogTag)
        : normalize(`${stats.label} ${aliases.join(' ')}`)
      const exactInputBoost = tagStartsWithInput(
        { label: stats.label, aliases },
        normalizedFragment,
      )
        ? 40
        : 0
      const districtHistoryMatch = isDistrictTagMatch(normalizedLabel, normalizedFragment)

      if (!matchesInputTokens(searchText, inputTokens)) return
      if (
        !districtHistoryMatch &&
        !tagCloselyMatchesInput({ label: stats.label, aliases }, normalizedFragment, inputTokens)
      )
        return

      const existing = suggestions.get(normalizedLabel)
      const score =
        stats.count * 60 +
        (districtHistoryMatch ? 35 : 0) +
        exactInputBoost +
        fragments.length -
        fragmentIndex +
        Math.max(0, 7 - (Date.now() - stats.lastUsedAt) / 86_400_000)

      if (existing && existing.score >= score) return

      suggestions.set(normalizedLabel, {
        id: `history:${normalizedLabel}`,
        label: stats.label,
        normalized: normalizedLabel,
        tab: catalogTag?.tab ?? stats.tab,
        source: 'history',
        score: clampSuggestionScore(score),
        aliases,
        matchedInput: normalizedFragment,
      })
    })

    SEARCH_TAG_CATALOG.forEach((tag) => {
      if (!tabMatches(tag.tab, tab)) return

      const normalizedLabel = normalize(tag.label)
      const searchText = getTagSearchText(tag)
      const exactInputBoost = tagStartsWithInput(tag, normalizedFragment) ? 60 : 0

      if (!matchesInputTokens(searchText, inputTokens)) return
      if (!tagCloselyMatchesInput(tag, normalizedFragment, inputTokens)) return

      const existing = suggestions.get(normalizedLabel)
      const score = 20 + exactInputBoost + tag.popularity / 10 + fragments.length - fragmentIndex

      if (existing && existing.score >= score) return

      suggestions.set(normalizedLabel, {
        id: `popular:${normalizedLabel}`,
        label: tag.label,
        normalized: normalizedLabel,
        tab: tag.tab,
        source: 'popular',
        score: clampSuggestionScore(score),
        aliases: tag.aliases,
        matchedInput: normalizedFragment,
      })
    })

    if (tab === 'all' || tab === 'project') {
      projectSuggestions.forEach((project) => {
        if (!project.name) return

        const aliases = [project.name, `khu ${project.name}`]
        const normalizedLabel = normalize(project.name)
        const searchText = normalize(aliases.join(' '))

        if (!matchesInputTokens(searchText, inputTokens)) return
        if (
          !tagCloselyMatchesInput({ label: project.name, aliases }, normalizedFragment, inputTokens)
        )
          return

        const existing = suggestions.get(normalizedLabel)
        const score = 105 + fragments.length - fragmentIndex

        if (existing && existing.score >= score) return

        suggestions.set(normalizedLabel, {
          id: `project:${project.id}`,
          label: project.name,
          normalized: normalizedLabel,
          tab: 'project',
          source: 'popular',
          score: clampSuggestionScore(score),
          aliases,
          matchedInput: normalizedFragment,
        })
      })
    }
  })

  return [...suggestions.values()].sort((left, right) => right.score - left.score).slice(0, limit)
}

export function applySearchTagSuggestion(input: string, suggestion: SearchTagSuggestion): string {
  // Replace the matched input suffix (or any alias) with the canonical tag label.
  const compactInput = compactWhitespace(input)
  const matchedTokens = suggestion.matchedInput.split(' ').filter(Boolean)

  if (matchedTokens.length > 0) {
    const inputParts = compactInput.split(/\s+/).filter(Boolean)
    const suffix = inputParts.slice(inputParts.length - matchedTokens.length).join(' ')

    if (normalize(suffix) === suggestion.matchedInput) {
      return compactWhitespace(
        [...inputParts.slice(0, inputParts.length - matchedTokens.length), suggestion.label].join(
          ' ',
        ),
      )
    }
  }

  const aliases = [suggestion.label, ...suggestion.aliases]
    .map((alias) => alias.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)

  for (const alias of aliases) {
    const pattern = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
    const aliasRegExp = new RegExp(`(^|\\s)${pattern}(?=\\s|$)`, 'iu')

    if (aliasRegExp.test(compactInput)) {
      return compactWhitespace(compactInput.replace(aliasRegExp, `$1${suggestion.label}`))
    }
  }

  if (compactInput && normalize(suggestion.label).startsWith(normalize(compactInput))) {
    return suggestion.label
  }

  if (!compactInput || normalize(compactInput) === normalize(suggestion.label)) {
    return suggestion.label
  }

  return compactWhitespace(`${compactInput} ${suggestion.label}`)
}

export function getSearchSuggestionFragment(input: string): string {
  return getSuggestionFragments(input)[0] ?? ''
}

export function getSearchSuggestionFragmentRaw(input: string): string {
  const rawInput = compactWhitespace(input)
  if (!rawInput) return ''

  const tokens = rawInput.split(' ').filter(Boolean)
  const startIndex = Math.max(0, tokens.length - MAX_SUGGESTION_FRAGMENT_TOKENS)

  return tokens.slice(startIndex).join(' ')
}
