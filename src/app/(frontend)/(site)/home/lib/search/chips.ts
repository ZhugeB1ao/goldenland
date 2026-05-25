import type { SearchChip, SearchTagSuggestion } from './types'
import {
  AREA_RANGE_REMOVE_RE,
  AREA_SINGLE_REMOVE_RE,
  BATHROOMS_REMOVE_RE,
  BEDROOMS_REMOVE_RE,
  DISTRICT_REMOVE_RE,
  PRICE_RANGE_REMOVE_RE,
  PRICE_SINGLE_REMOVE_RE,
} from './constants'
import { compactWhitespace, normalize, removeAliasTokens } from './text'

// Remove one displayed chip from the raw search input.
export function removeSearchTokenByChip(input: string, chip: SearchChip): string {
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
    chip.key === 'province' ||
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

// Apply a suggestion by replacing the matching input fragment.
export function applySearchTagSuggestion(input: string, suggestion: SearchTagSuggestion): string {
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
