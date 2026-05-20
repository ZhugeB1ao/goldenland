import type {
  SearchHistoryItem,
  SearchProjectSuggestionInput,
  SearchTab,
  SearchTagSuggestion,
} from './types'
import {
  DISTRICT_TAG_RE,
  MAX_SUGGESTION_FRAGMENT_TOKENS,
  SEARCH_TAG_PROMOTION_COUNT,
} from './constants'
import { compactWhitespace, normalize } from './text'
import { getHistoryTagStats } from './history'
import {
  getTagSearchText,
  SEARCH_TAG_CATALOG,
  TAG_BY_NORMALIZED_LABEL,
  tabMatches,
  type SearchTagDefinition,
} from './tagCatalog'

// Build suffix fragments from the current input for autocomplete.
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

// Check that every input token exists in the searchable text.
const matchesInputTokens = (searchText: string, inputTokens: string[]): boolean => {
  if (inputTokens.length === 0) return true

  return inputTokens.every((token) => searchText.includes(token))
}

// Check whether a tag label or alias starts with the input.
const tagStartsWithInput = (
  tag: Pick<SearchTagDefinition, 'label' | 'aliases'>,
  normalizedInput: string,
): boolean => {
  if (!normalizedInput) return false

  return [tag.label, ...tag.aliases].some((value) => normalize(value).startsWith(normalizedInput))
}

// Check whether the user input is a close prefix match for a tag.
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

// Detect history matches like "q" that point to district tags.
const isDistrictTagMatch = (normalizedLabel: string, normalizedInput: string): boolean => {
  return /^(?:quan|q)$/.test(normalizedInput) && /^quan \d{1,2}$/.test(normalizedLabel)
}

// Create a dynamic district suggestion such as "Quận 7".
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

// Keep suggestion scores within a predictable display range.
const clampSuggestionScore = (score: number): number => Math.min(score, 220)

// Legacy utility: suggestion chips were removed from the active Home search flow.
// Kept for potential reuse in other search UIs.
// Return ranked suggestions from history, catalog tags, and projects.
export function getSearchTagSuggestions(
  input: string,
  tab: SearchTab,
  history: SearchHistoryItem[],
  projectSuggestions: SearchProjectSuggestionInput[] = [],
  limit = 8,
): SearchTagSuggestion[] {
  // Create fragments from the input and skip suggestions if all are too short to be meaningful.
  const fragments = getSuggestionFragments(input)
  if (!fragments.some((fragment) => fragment.length >= 2)) return []

  const suggestions = new Map<string, SearchTagSuggestion>()
  const historyTagStats = getHistoryTagStats(history, tab)

  // Extract tags from the current input for additional personalized suggestions.
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
  //   [
  //   { label: 'Quận 7', score: 220, ... },
  //   { label: 'căn hộ', score: 178, ... },
  //   { label: '2 phòng ngủ', score: 165, ... }
  // ]
}

// Legacy utility for tag suggestion UI, currently not used in active Home flow.
// Return the normalized suffix used for matching suggestions.
export function getSearchSuggestionFragment(input: string): string {
  return getSuggestionFragments(input)[0] ?? ''
}

// Legacy utility for project suggestion prefetch, currently not used in active Home flow.
// Return the raw suffix used to fetch project suggestions.
export function getSearchSuggestionFragmentRaw(input: string): string {
  const rawInput = compactWhitespace(input)
  if (!rawInput) return ''

  const tokens = rawInput.split(' ').filter(Boolean)
  const startIndex = Math.max(0, tokens.length - MAX_SUGGESTION_FRAGMENT_TOKENS)

  return tokens.slice(startIndex).join(' ')
}
