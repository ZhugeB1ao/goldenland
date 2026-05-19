// Normalize text for accent-insensitive search matching.
export const normalize = (input: string): string => {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Convert a localized decimal string into a number.
export const toNumber = (raw: string): number => Number(raw.replace(',', '.'))

// Convert a number and Vietnamese unit into VND.
export const toVnd = (value: number, unitRaw?: string): number => {
  const unit = (unitRaw || '').toLowerCase()

  if (unit.includes('ty') || unit === 't' || unit.includes('billion')) {
    return Math.round(value * 1_000_000_000)
  }

  if (unit.includes('trieu') || unit === 'tr' || unit === 'm' || unit.includes('million')) {
    return Math.round(value * 1_000_000)
  }

  return Math.round(value)
}

// Collapse repeated whitespace into a single trimmed string.
export const compactWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim()

// Remove full alias token matches without touching partial words.
export const removeAliasTokens = (input: string, aliases: string[]): string => {
  const inputTokens = compactWhitespace(input).split(/\s+/).filter(Boolean)
  const normalizedTokens = inputTokens.map((token) => normalize(token))

  const aliasTokenSets = aliases
    .map((alias) => compactWhitespace(alias))
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)
    .map((alias) => alias.split(/\s+/).map((token) => normalize(token)))

  if (aliasTokenSets.length === 0) return compactWhitespace(input)

  const tokens = [...inputTokens]
  const normalized = [...normalizedTokens]

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
