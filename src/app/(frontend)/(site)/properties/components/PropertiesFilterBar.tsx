'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { PropertiesAdvancedFilterPopup, type FilterState } from './PropertiesAdvancedFilterPopup'

type RangeOption = {
  id: string
  label: string
}

type SelectOption = {
  value: string
  label: string
}

type FilterBarProps = {
  propertyTypeOptions: SelectOption[]
  priceRangeOptions: RangeOption[]
  areaRangeOptions: RangeOption[]
  regionOptions: SelectOption[]
  wardOptions: Array<SelectOption & { provinceCode: string }>
  streetOptions: Array<SelectOption & { provinceCode: string; wardCode: string }>
  projectOptions: Array<SelectOption & { provinceCode: string; wardCode: string }>
  dynamicAttributeOptions: Array<{ key: string; label: string; options: SelectOption[] }>
  filters: FilterState
  keywordInput: string
  onFiltersChange: (filters: FilterState) => void
  onKeywordInputChange: (value: string) => void
  onSearch: () => void
}

type PanelKey = null | 'advanced' | 'type' | 'price' | 'area' | 'region'

const getFilterCount = (filters: FilterState) =>
  [
    filters.verifiedOnly ? 1 : 0,
    filters.propertyTypes.length,
    filters.priceRangeIds.length,
    filters.areaRangeIds.length,
    filters.minPriceInput ? 1 : 0,
    filters.maxPriceInput ? 1 : 0,
    filters.minAreaInput ? 1 : 0,
    filters.maxAreaInput ? 1 : 0,
    filters.provinceCodes.length,
    filters.wardCodes.length,
    filters.projectIds.length,
    filters.directions.length,
    filters.legalStatuses.length,
    filters.bedroomsList.length,
    filters.bathroomsList.length,
  ].reduce((sum, value) => sum + value, 0)

export function PropertiesFilterBar({
  propertyTypeOptions,
  priceRangeOptions,
  areaRangeOptions,
  regionOptions,
  wardOptions,
  streetOptions,
  projectOptions,
  dynamicAttributeOptions,
  filters,
  keywordInput,
  onFiltersChange,
  onKeywordInputChange,
  onSearch,
}: FilterBarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isSticky, setIsSticky] = useState(false)
  const [openPanel, setOpenPanel] = useState<PanelKey>(null)
  const [draftFilters, setDraftFilters] = useState<FilterState | null>(null)

  const activeFilterCount = useMemo(() => getFilterCount(filters), [filters])
  const legalOptions = useMemo(
    () => dynamicAttributeOptions.find((group) => group.key === 'legalStatus')?.options ?? [],
    [dynamicAttributeOptions],
  )

  useEffect(() => {
    const stickyEnter = 220
    const stickyExit = 160
    const handleScroll = () => {
      if (!containerRef.current) return
      setIsSticky((current) => (current ? window.scrollY >= stickyExit : window.scrollY >= stickyEnter))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!openPanel) return
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (containerRef.current.contains(event.target as Node)) return
      setOpenPanel(null)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [openPanel])

  const togglePanel = (panel: Exclude<PanelKey, null>) => {
    setOpenPanel((current) => (current === panel ? null : panel))
  }

  const toggleStringValue = (key: keyof FilterState, value: string) => {
    const current = filters[key] as string[]
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    onFiltersChange({ ...filters, [key]: next })
  }

  const renderSimplePanel = (
    isOpen: boolean,
    options: Array<SelectOption | RangeOption>,
    selected: string[],
    onToggle: (value: string) => void,
  ) => {
    if (!isOpen) return null
    return (
      <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-outline-variant/30 bg-white p-3 shadow-lg">
        <div className="max-h-56 overflow-y-auto pr-1">
          {options.map((item) => {
            const value = 'value' in item ? item.value : item.id
            return (
              <label key={value} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm hover:bg-surface-container">
                <span className="truncate">{item.label}</span>
                <input checked={selected.includes(value)} onChange={() => onToggle(value)} type="checkbox" />
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <section
      ref={containerRef}
      className="sticky top-20 z-40 mb-10 rounded-xl border border-outline-variant/10 bg-white p-2 shadow-[0px_12px_32px_rgba(27,28,28,0.06)]"
    >
      <div className="flex flex-col gap-4 p-2">
        {!isSticky && (
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative h-14 flex-1 overflow-hidden rounded-lg border border-outline-variant/50 bg-white">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
              <input className="h-full w-full border-none pl-12 pr-4 text-on-surface focus:ring-0" id="properties-search" name="search" onChange={(event) => onKeywordInputChange(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && onSearch()} placeholder="Tìm kiếm nhà đất..." type="text" value={keywordInput} />
            </div>
            <div className="flex gap-2">
              <button className="h-14 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white" onClick={onSearch} type="button">Tìm kiếm</button>
              <button className="inline-flex h-14 items-center gap-1 rounded-lg border border-outline-variant/40 px-3 py-2 text-sm text-secondary" type="button">
                <span className="material-symbols-outlined text-base">map</span>
                Xem bản đồ
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {isSticky && (
            <div className="flex min-w-[220px] flex-1 items-center gap-2">
              <div className="relative h-10 flex-1 overflow-hidden rounded-lg border border-outline-variant/50 bg-white">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-secondary">search</span>
                <input className="h-full w-full border-none pl-10 pr-4 text-sm text-on-surface focus:ring-0" id="properties-search-sticky" name="search-sticky" onChange={(event) => onKeywordInputChange(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && onSearch()} placeholder="Tìm kiếm..." type="text" value={keywordInput} />
              </div>
              <button className="h-10 rounded bg-primary px-3 text-xs font-semibold text-white" onClick={onSearch} type="button"><span className="material-symbols-outlined text-sm">search</span></button>
              <button className="inline-flex h-10 items-center gap-1 rounded border border-outline-variant/40 px-3 py-2 text-xs text-secondary" type="button"><span className="material-symbols-outlined text-sm">map</span>Bản đồ</button>
            </div>
          )}

          <div className="relative">
            <button
              className="relative flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-4 py-2 text-sm font-medium text-on-surface"
              onClick={() => {
                if (openPanel !== 'advanced') setDraftFilters({ ...filters })
                togglePanel('advanced')
              }}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">tune</span>
              Lọc
              {activeFilterCount > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">{activeFilterCount}</span>}
            </button>
            <PropertiesAdvancedFilterPopup
              isOpen={openPanel === 'advanced'}
              filters={filters}
              draftFilters={draftFilters}
              onDraftChange={setDraftFilters}
              onApply={(next) => {
                onFiltersChange(next)
                setDraftFilters(null)
                setOpenPanel(null)
              }}
              onCancel={() => {
                setDraftFilters(null)
                setOpenPanel(null)
              }}
              onClear={() =>
                setDraftFilters({
                  ...(draftFilters ?? filters),
                  verifiedOnly: false,
                  propertyTypes: [],
                  priceRangeIds: [],
                  areaRangeIds: [],
                  minPriceInput: '',
                  maxPriceInput: '',
                  minAreaInput: '',
                  maxAreaInput: '',
                  provinceCodes: [],
                  wardCodes: [],
                  streets: [],
                  projectIds: [],
                  directions: [],
                  legalStatuses: [],
                  bedroomsList: [],
                  bathroomsList: [],
                })
              }
              propertyTypeOptions={propertyTypeOptions}
              regionOptions={regionOptions}
              wardOptions={wardOptions}
              projectOptions={projectOptions}
              legalOptions={legalOptions}
            />
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-outline-variant/50 bg-white px-4 py-2">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-secondary">
              <span className="material-symbols-outlined text-[16px] text-green-700">verified</span>
              Tin xác thực
            </span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                checked={filters.verifiedOnly}
                className="peer sr-only"
                onChange={(e) => onFiltersChange({ ...filters, verifiedOnly: e.target.checked })}
                type="checkbox"
              />
              <span className="h-6 w-11 rounded-full bg-zinc-300 transition-colors peer-checked:bg-green-700" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-all peer-checked:left-[22px]" />
            </label>
          </div>

          <div className="relative">
            <button className="flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-4 py-2 text-sm" onClick={() => togglePanel('type')} type="button">
              Loại nhà đất {filters.propertyTypes.length > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{filters.propertyTypes.length}</span>}
            </button>
            {renderSimplePanel(openPanel === 'type', propertyTypeOptions, filters.propertyTypes, (value) => toggleStringValue('propertyTypes', value))}
          </div>

          <div className="relative">
            <button className="flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-4 py-2 text-sm" onClick={() => togglePanel('price')} type="button">
              Khoảng giá {filters.priceRangeIds.length > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{filters.priceRangeIds.length}</span>}
            </button>
            {renderSimplePanel(openPanel === 'price', priceRangeOptions, filters.priceRangeIds, (value) => toggleStringValue('priceRangeIds', value))}
          </div>

          <div className="relative">
            <button className="flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-4 py-2 text-sm" onClick={() => togglePanel('area')} type="button">
              Diện tích {filters.areaRangeIds.length > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{filters.areaRangeIds.length}</span>}
            </button>
            {renderSimplePanel(openPanel === 'area', areaRangeOptions, filters.areaRangeIds, (value) => toggleStringValue('areaRangeIds', value))}
          </div>

          <div className="relative">
            <button className="flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-4 py-2 text-sm" onClick={() => togglePanel('region')} type="button">
              Khu vực {filters.provinceCodes.length > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{filters.provinceCodes.length}</span>}
            </button>
            {renderSimplePanel(openPanel === 'region', regionOptions, filters.provinceCodes, (value) => toggleStringValue('provinceCodes', value))}
          </div>
        </div>
      </div>
    </section>
  )
}
