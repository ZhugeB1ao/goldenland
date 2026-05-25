import type { ParsedSearchFilters, SearchHistoryTag, SearchTab } from './types'
import { normalize } from './text'

export type SearchTagDefinition = {
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

// Normalize raw tag options into catalog entries.
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

export const PROPERTY_ATTRIBUTE_TAGS = createAttributeTags(
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

export const PROJECT_ATTRIBUTE_TAGS = createAttributeTags(
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

export const NEWS_ATTRIBUTE_TAGS = createAttributeTags(
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

export const SEARCH_TAG_CATALOG: SearchTagDefinition[] = [
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

export const TAG_BY_NORMALIZED_LABEL = new Map(
  SEARCH_TAG_CATALOG.map((tag) => [normalize(tag.label), tag] as const),
)

// Build searchable text from a tag label, aliases, and related terms.
export const getTagSearchText = (tag: SearchTagDefinition): string => {
  return normalize(`${tag.label} ${tag.aliases.join(' ')} ${tag.related.join(' ')}`)
}

// Check whether a tag belongs to the active search tab.
export const tabMatches = (candidate: SearchTab, activeTab: SearchTab): boolean => {
  return candidate === activeTab
}

// Find catalog tags that should become structured filters.
export const getMatchedFilterTags = (input: string, tab: SearchTab): SearchTagDefinition[] => {
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

// Remove matched filter tag text before building keyword search.
export const removeMatchedFilterTagText = (input: string, matchedTags: SearchTagDefinition[]): string => {
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
