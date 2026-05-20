# Search Module - Chức năng chính

Thư mục `home/lib/search` cung cấp bộ xử lý tìm kiếm tự nhiên (free-text) cho trang Home, gồm parse filter, lịch sử tìm kiếm, autocomplete tag và thao tác chip.

> Cập nhật mới: luồng Home hiện tại đã bỏ UI chips/suggestion và tab `all`/`project`.
> Các module `chips`, `suggestions`, `history` đang được giữ ở trạng thái legacy để tương thích.

## `index.ts`
- Re-export toàn bộ API từ các module chính: `chips`, `history`, `parser`, `suggestions`, `types`.

## `parser.ts`
- `parseSearch(input, tab)`: parse câu tìm kiếm thành:
  - `keyword` (từ khóa còn lại sau khi bỏ token filter),
  - `filters` (district, bedrooms, bathrooms, price, area, listingType, ...),
  - `chips` để hiển thị UI.
- `getSearchPlaceholder(tab)`: trả placeholder theo tab (`property`, `project`, `news`, `all`).
- `suggestMissingFilters(parsed, tab)`: gợi ý các filter còn thiếu (ví dụ `quận 7`, `2 phòng ngủ`, `2 tỷ`).

## `parserUtils.ts`
- `formatPrice(value)`: format VND ra chuỗi ngắn (`2 tỷ`, `850 triệu`).
- `parseDistrict(normalizedInput)`: tách quận từ text.
- `parseBedrooms(normalizedInput)`: tách số phòng ngủ.
- `parseBathrooms(normalizedInput)`: tách số phòng tắm/WC.
- `parseArea(normalizedInput)`: tách diện tích (khoảng hoặc giá trị đơn lẻ).
- `parsePrice(normalizedInput)`: tách giá (khoảng hoặc trần giá).
- `buildKeyword(input, tab)`: loại bỏ token filter để còn từ khóa sạch cho search keyword.

## `tagCatalog.ts`
- Khai báo catalog tag:
  - `PROPERTY_ATTRIBUTE_TAGS`, `PROJECT_ATTRIBUTE_TAGS`, `NEWS_ATTRIBUTE_TAGS`.
  - `SEARCH_TAG_CATALOG`: catalog tổng hợp cho toàn bộ tab.
  - `TAG_BY_NORMALIZED_LABEL`: map tra cứu nhanh theo label normalize.
- Hàm hỗ trợ:
  - `getTagSearchText(tag)`: tạo searchable text từ label/aliases/related.
  - `tabMatches(candidate, activeTab)`: check tag có hợp tab hiện tại không.
  - `getMatchedFilterTags(input, tab)`: tìm các tag có `filter` để map vào structured filters.
  - `removeMatchedFilterTagText(input, matchedTags)`: xóa text tag đã match khỏi input trước khi build keyword.

## `suggestions.ts`
- `getSearchTagSuggestions(input, tab, history, projectSuggestions, limit)`: trả danh sách suggestion có xếp hạng điểm, tổng hợp từ:
  - history tag stats,
  - catalog tag phổ biến,
  - dynamic district (`Quận x`),
  - project suggestions truyền vào.
- `getSearchSuggestionFragment(input)`: lấy fragment normalize ở cuối input để match suggestion.
- `getSearchSuggestionFragmentRaw(input)`: lấy fragment raw (không normalize) để gọi API gợi ý dự án.

## `history.ts`
- `readSearchHistory(storage?)`: đọc lịch sử từ localStorage, lọc dữ liệu hợp lệ + TTL, sort theo tần suất và độ mới.
- `recordSearchHistory(input, parsed, storage?)`: lưu search vừa thực hiện, tăng `count`, cập nhật `lastUsedAt`, cắt theo giới hạn tối đa.
- `clearSearchHistory(storage?)`: xóa toàn bộ lịch sử.
- `getPersonalizedSearchSuggestions(input, tab, history, limit?)`: lấy lịch sử phù hợp với input/tab để gợi ý cá nhân hóa.
- `extractSearchTags(input, parsed)`: trích xuất tag từ input + chips để phục vụ thống kê.
- `getHistoryTagStats(history, activeTab)`: tổng hợp tần suất dùng tag theo tab.

## `chips.ts`
- `removeSearchTokenByChip(input, chip)`: xóa token tương ứng với chip khỏi câu search.
- `applySearchTagSuggestion(input, suggestion)`: áp dụng suggestion vào input:
  - thay fragment cuối nếu đang gõ dở,
  - thay alias đã có,
  - hoặc append vào cuối.

## `text.ts`
- `normalize(input)`: normalize text không dấu, lowercase, bỏ ký tự đặc biệt, gọn khoảng trắng.
- `toNumber(raw)`: parse số từ chuỗi có dấu phẩy thập phân.
- `toVnd(value, unitRaw?)`: đổi số + đơn vị (`ty`, `trieu`) sang VND.
- `compactWhitespace(value)`: gom khoảng trắng dư.
- `removeAliasTokens(input, aliases)`: xóa token theo alias, tránh xóa trúng partial word.

## `constants.ts`
- Khai báo:
  - key localStorage,
  - giới hạn history/suggestion,
  - TTL,
  - danh sách tab,
  - toàn bộ regex parse/remove cho district, bedrooms, bathrooms, area, price.

## `types.ts`
- Định nghĩa các kiểu dữ liệu chính:
  - `SearchTab`, `SearchChipKey`, `SearchChip`,
  - `ParsedSearchFilters`, `ParsedSearchResult`,
  - `SearchHistoryItem`, `SearchHistoryTag`,
  - `SearchTagSuggestion`, `SearchProjectSuggestionInput`.

## Runtime Flow (Từ nhập chữ đến bấm tìm)

### 1) User gõ vào ô search
- `HeroSection` -> `onChange` của `<input>` gọi `setInputValue(event.target.value)`.
- State đổi sẽ kích hoạt các `useMemo`.

### 2) Parse input thành filter/chip/keyword
- `useMemo(parseSearch(inputValue, activeTab))` trong `HeroSection`.
- `parseSearch` gọi theo thứ tự chính:
  - `compactWhitespace` + `normalize` (chuẩn hóa input).
  - `parseDistrict`, `parseProvinceFromNormalizedText`.
  - (tab `property/all`) gọi thêm `parseListingType`, `parsePropertyType`, `parseDirection`, `parseLegalStatus`, `parseFurnitureStatus`, `parsePostType`, `parseBedrooms`, `parseBathrooms`, `parseArea`, `parsePrice`.
  - `getMatchedFilterTags(rawInput, tab)` để map alias/tag -> filter.
  - `removeMatchedFilterTagText` + `removeAliasTokens` (xóa token đã nhận diện).
  - `buildKeyword(...)` để lấy keyword sạch.
- Kết quả trả về: `ParsedSearchResult` gồm:
  - `tab`
  - `filters` (district, provinceCode, propertyType, price range, ...)
  - `keyword`
  - `chips` (để render/xóa/sửa filter trên UI)

### 3) Sinh suggestion khi đang gõ
- `useMemo(getSearchSuggestionFragment(inputValue))` và `useMemo(getSearchSuggestionFragmentRaw(inputValue))`.
- `useMemo(getSearchTagSuggestions(inputValue, activeTab, searchHistory, projectSuggestions))`:
  - lấy gợi ý từ history,
  - tag catalog,
  - dynamic district (`Quận x`),
  - project suggestions truyền vào.
- Kết quả: mảng `SearchTagSuggestion[]` để render chip gợi ý.

### 4) Gọi gợi ý dự án nền (khi phù hợp)
- `useEffect` trong `HeroSection` theo `activeTab + fragment`.
- Nếu tab `all/project` và fragment đủ dài:
  - `parseSearch(rawSuggestionFragment, 'project')`
  - `searchProjectsByParsed(parsedProjectSearch, { limit: 5 })`
- Kết quả set vào `projectSuggestions` để feed lại bước 3.

### 5) User bấm nút Tìm kiếm (hoặc Enter)
- `handleSearch(parsedSearch = parsed, rawInput = inputValue)` được gọi.
- Trong `handleSearch`:
  - gọi `runHybridSearch(parsedSearch)`.

### 6) `runHybridSearch` dispatch theo tab
- Nếu tab cụ thể:
  - `property` -> `searchPropertiesByParsed(parsed)`
  - `project` -> `searchProjectsByParsed(parsed)`
  - `news` -> `searchNewsByParsed(parsed)`
- Nếu tab `all`:
  - chạy song song cả 3 bằng `Promise.allSettled`.
- Kết quả trả về: `HybridSearchResult` gồm 3 nhóm `property/project/news` với `items`, `total`, `error?`.

### 7) Build query và gọi API
- `searchPropertiesByParsed` / `searchProjectsByParsed` / `searchNewsByParsed`:
  - dùng `buildQuery(...)` để serialize params từ `parsed.filters + parsed.keyword`.
  - gọi `getJSON('/api/search/...')`.
- Endpoint nhận query và trả:
  - `{ success, data, pagination }`.
- Service map thành `HybridSearchGroup`:
  - `{ items: data, total: pagination.totalDocs }`.

### 8) Render kết quả + lưu lịch sử
- `setSearchResult(result)` để hiển thị danh sách kết quả.
- `recordSearchHistory(rawInput, parsedSearch)` để lưu lịch sử và tăng tần suất.
- UI hiện:
  - tổng số kết quả,
  - danh sách cuộn tối đa 5 item,
  - chips/filter đã parse.

### 9) Các tương tác phụ trên chip/suggestion
- Xóa chip: `removeSearchTokenByChip(input, chip)` -> cập nhật input.
- Chọn suggestion: `applySearchTagSuggestion(input, suggestion)` -> cập nhật input/tab.
- Sau khi input đổi, flow quay lại bước 2.
