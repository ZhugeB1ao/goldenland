import type { ParsedSearchResult, SearchHistoryItem, SearchHistoryTag, SearchTab } from './types'
import {
  MAX_SEARCH_HISTORY_ITEMS,
  SEARCH_HISTORY_STORAGE_KEY,
  SEARCH_HISTORY_TTL_MS,
  SEARCH_TAG_PROMOTION_COUNT,
  SEARCH_TABS,
} from './constants'
import { compactWhitespace, normalize } from './text'
import { SEARCH_TAG_CATALOG, tabMatches } from './tagCatalog'
import { count } from 'console'

// Safely access localStorage only in the browser.
const getHistoryStorage = (): Storage | undefined => {
  if (typeof window === 'undefined') return undefined

  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

// Build a stable history key from tab and normalized input.
const createHistoryId = (input: string, tab: SearchTab): string => `${tab}:${normalize(input)}`

// Check whether stored JSON has the expected history shape.
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

// Sort history by frequency first, then recency.
const sortSearchHistory = (history: SearchHistoryItem[]): SearchHistoryItem[] => {
  return [...history].sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count

    return right.lastUsedAt - left.lastUsedAt
  })
}

// Check whether a history item is still within the TTL.
const isFreshHistoryItem = (item: SearchHistoryItem): boolean => {
  return Date.now() - item.lastUsedAt <= SEARCH_HISTORY_TTL_MS
}

// Deduplicate tags by normalized label.
const uniqueSearchTags = (tags: SearchHistoryTag[]): SearchHistoryTag[] => {
  return [...new Map(tags.map((tag) => [tag.normalized, tag])).values()]
}

// Extract searchable tags from a completed search.
export const extractSearchTags = (
  input: string,
  parsed: ParsedSearchResult,
): SearchHistoryTag[] => {
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

// Aggregate tag usage stats for personalized suggestions.
export const getHistoryTagStats = (history: SearchHistoryItem[], activeTab: SearchTab) => {
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
  // Map {
  //   "quan 7" => {
  //     label: "Quận 7",
  //     count: 6,
  //     lastUsedAt: 1760000000000,
  //     tab: "property"
  //   },
  //   "can ho" => {
  //     label: "căn hộ",
  //     count: 4,
  //     lastUsedAt: 1759999000000,
  //     tab: "property"
  //   },
  //   "vinhomes" => {
  //     label: "Vinhomes",
  //     count: 3,
  //     lastUsedAt: 1759998000000,
  //     tab: "project"
  //   }
  // }
}

// Legacy utility: history-based search suggestion is disabled in active Home flow.
// Read fresh search history from localStorage.
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

// Legacy utility: history-based search suggestion is disabled in active Home flow.
// Save a search and update its frequency count.
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

// Remove all stored search history.
export function clearSearchHistory(storage = getHistoryStorage()): void {
  if (!storage) return

  try {
    storage.removeItem(SEARCH_HISTORY_STORAGE_KEY)
  } catch {
    // Ignore storage failures. Search suggestions are non-critical UI state.
  }
}

// Return history items that match the current input and tab.
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
