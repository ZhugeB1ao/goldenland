import { describe, expect, it } from 'vitest'
import { parseSearch, removeSearchTokenByChip } from '@/app/(frontend)/(site)/home/lib/search'

describe('hybridSearch parsing', () => {
  it('parses district with "quận" prefix', () => {
    const result = parseSearch('căn hộ quận 7', 'property')
    expect(result.filters.district).toBe(7)
  })

  it('treats single area as max area', () => {
    const result = parseSearch('100 m²', 'property')
    expect(result.filters.maxArea).toBe(100)
  })

  it('treats single price as max price', () => {
    const result = parseSearch('2 tỷ', 'property')
    expect(result.filters.maxPrice).toBe(2_000_000_000)
  })

  it('removes listing type token from input', () => {
    const cleared = removeSearchTokenByChip('Bán nhà phố', {
      key: 'listingType',
      label: 'Bán',
      value: 'sale',
      editText: 'bán',
    })
    expect(cleared).toBe('nhà phố')
  })

  it('strips numeric filters from news keyword', () => {
    const result = parseSearch('2 tỷ lãi suất vay mua nhà', 'news')
    expect(result.keyword).toBe('lãi suất vay mua nhà')
  })
})
