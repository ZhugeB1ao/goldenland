# Home Search Module (`home/lib/search`)

Tài liệu này mô tả đúng flow tìm kiếm hiện tại của `HeroSection` ở trang Home.

## Flow hiện tại trong Hero Section

1. User nhập text vào ô tìm kiếm.
2. `HeroSection` gọi `parseSearch(inputValue, activeTab)` bằng `useMemo`.
3. Khi bấm Enter hoặc icon search:
   - dispatch `setSearchTab(activeTab)`
   - dispatch `hydrateFromParsed({ tab, rawInput, parsed })`
4. Routing theo tab:
   - `news`: gọi `searchNewsByParsed(parsed, { limit: 5 })`, lấy bài đầu tiên rồi `router.push('/articles/[slug]')`.
   - `property`: build query từ `parsed.keyword` + `parsed.filters` rồi `router.push('/properties?...')`.

Lưu ý:
- Tab đang hiển thị trên UI Home: `property`, `news`.
- `SearchTab` hiện chỉ còn: `property | project | news` (đã bỏ `all`).

## Vai trò từng file

## `parser.ts`
- `parseSearch(input, tab)`: parse free-text thành:
  - `filters` (district/province/ward/price/area/bedrooms/...)
  - `keyword` sau khi loại token filter
  - `chips` (structured output, hiện chưa render trên Hero)
- `getSearchPlaceholder(tab)`: placeholder theo tab.

## `parserUtils.ts`
- Bộ hàm parse nhỏ cho district, bedrooms, bathrooms, price, area, listingType, propertyType...
- `buildKeyword(...)` để giữ lại phần keyword “sạch”.

## `tagCatalog.ts`
- Catalog tag + alias để map text sang filter.
- `getMatchedFilterTags` và `removeMatchedFilterTagText` hỗ trợ `parseSearch`.

## `provinceCatalog.ts`
- Parse tỉnh/phường từ normalized text.
- Hỗ trợ ánh xạ label tỉnh theo `provinceCode`.

## `text.ts`
- `normalize`, `compactWhitespace`, `toVnd`, `toNumber`, `removeAliasTokens`.

## `types.ts`
- Kiểu dữ liệu chung: `SearchTab`, `ParsedSearchResult`, `ParsedSearchFilters`, `SearchChip`, ...

## Legacy modules (đang giữ để tương thích)

## `chips.ts`
- `removeSearchTokenByChip`, `applySearchTagSuggestion`.
- Hiện không được gọi từ Hero UI hiện tại.
- Vẫn giữ để tương thích test/util cũ.

## `history.ts`
- Chỉ giữ `clearSearchHistory()` để dọn localStorage khi logout.

## `index.ts`
- Re-export API tối thiểu từ `chips`, `parser`, `types`.

## Liên kết service search

- `home/services/hybridSearch.ts` vẫn có:
  - `searchPropertiesByParsed`
  - `searchProjectsByParsed` (legacy)
  - `searchNewsByParsed`
  - `runHybridSearch` (legacy path)

Trong flow Hero hiện tại:
- Chỉ dùng trực tiếp `searchNewsByParsed` cho tab `news`.
- Tab `property` chuyển hướng sang `/properties` với query string đã parse.
- Không gọi `runHybridSearch`.
