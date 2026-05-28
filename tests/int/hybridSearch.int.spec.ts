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
    const areaChip = result.chips.find((chip) => chip.key === 'area')
    expect(areaChip?.label).toBe('Dưới 100 m²')
  })

  it('treats single price as max price', () => {
    const result = parseSearch('2 tỷ', 'property')
    expect(result.filters.maxPrice).toBe(2_000_000_000)
  })

  it('removes property type token from input', () => {
    const result = parseSearch('Nhà phố quận 7', 'property')
    const chip = result.chips.find((item) => item.key === 'propertyType')
    expect(chip).toBeDefined()
    const cleared = removeSearchTokenByChip('Nhà phố quận 7', chip!)
    expect(cleared).toContain('quận 7')
    expect(cleared.toLowerCase()).not.toContain('nhà phố')
  })

  it('strips numeric filters from news keyword', () => {
    const result = parseSearch('2 tỷ lãi suất vay mua nhà', 'news')
    expect(result.keyword).toBe('lãi suất vay mua nhà')
  })
})
