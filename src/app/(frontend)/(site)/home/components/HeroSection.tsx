'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { applySearchTagSuggestion, removeSearchTokenByChip } from '../lib/search/chips'
import { getSearchPlaceholder, parseSearch } from '../lib/search/parser'
import { readSearchHistory, recordSearchHistory } from '../lib/search/history'
import {
  getSearchSuggestionFragment,
  getSearchSuggestionFragmentRaw,
  getSearchTagSuggestions,
} from '../lib/search/suggestions'
import {
  type SearchChip,
  type SearchHistoryItem,
  type SearchTagSuggestion,
  type SearchTab,
} from '../lib/search/types'
import {
  runHybridSearch,
  searchProjectsByParsed,
  type HybridSearchResult,
} from '../services/hybridSearch'

type TabOption = {
  key: SearchTab
  label: string
}

const tabOptions: TabOption[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'property', label: 'Bất động sản' },
  { key: 'project', label: 'Dự án' },
  { key: 'news', label: 'Tin tức' },
]

const truncate = (value?: string | null, max = 84): string => {
  if (!value) return 'Đang cập nhật'
  if (value.length <= max) return value
  return `${value.slice(0, max)}...`
}

const getGroupTotal = (result: HybridSearchResult | null, tab: SearchTab): number => {
  if (!result) return 0
  if (tab === 'property') return result.property.total
  if (tab === 'project') return result.project.total
  if (tab === 'news') return result.news.total

  return result.property.total + result.project.total + result.news.total
}

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<SearchTab>('all')
  const [inputValue, setInputValue] = useState('')
  const [searchResult, setSearchResult] = useState<HybridSearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [projectSuggestions, setProjectSuggestions] = useState<
    { id: string | number; name?: string | null }[]
  >([])

  const inputRef = useRef<HTMLInputElement>(null)

  const parsed = useMemo(() => parseSearch(inputValue, activeTab), [inputValue, activeTab])
  //   {
  //   tab: "property",
  //   keyword: "",
  //   filters: {
  //     district: 7,
  //     propertyType: "apartment",
  //     bedrooms: 2,
  //     maxPrice: 3000000000
  //   },
  //   chips: [
  //     { key: "district", label: "Quận 7", value: "7", editText: "quận 7" },
  //     { key: "propertyType", label: "chung cư", value: "apartment", editText: "chung cư" },
  //     { key: "bedrooms", label: "2 phòng ngủ", value: "2", editText: "2 phòng ngủ" },
  //     { key: "price", label: "Dưới 3 tỷ", value: "Dưới 3 tỷ", editText: "dưới 3 tỷ" }
  //   ]
  // }

  const suggestionFragment = useMemo(() => getSearchSuggestionFragment(inputValue), [inputValue])
  const rawSuggestionFragment = useMemo(
    () => getSearchSuggestionFragmentRaw(inputValue),
    [inputValue],
  )
  const tagSuggestions = useMemo(
    () => getSearchTagSuggestions(inputValue, activeTab, searchHistory, projectSuggestions),
    [activeTab, inputValue, projectSuggestions, searchHistory],
  )
  const placeholder = useMemo(() => getSearchPlaceholder(activeTab), [activeTab])

  useEffect(() => {
    setSearchHistory(readSearchHistory())
  }, [])

  useEffect(() => {
    if (activeTab !== 'all' && activeTab !== 'project') {
      setProjectSuggestions([])
      return
    }

    if (suggestionFragment.length < 2 || rawSuggestionFragment.length < 2) {
      setProjectSuggestions([])
      return
    }

    const timeoutId = window.setTimeout(() => {
      const parsedProjectSearch = parseSearch(rawSuggestionFragment, 'project')

      void searchProjectsByParsed(parsedProjectSearch, { limit: 5 })
        .then((result) => {
          setProjectSuggestions(
            result.items.map((project) => ({
              id: project.id,
              name: project.name,
            })),
          )
        })
        .catch(() => setProjectSuggestions([]))
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [activeTab, rawSuggestionFragment, suggestionFragment])

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab)
    setSearchResult(null)
    setErrorMessage(null)
  }

  const handleSearch = async (parsedSearch = parsed, rawInput = inputValue) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await runHybridSearch(parsedSearch)
      // {
      //   tab: "property",
      //   parsed: { ...parsedSearch },
      //   property: {
      //     total: 128,
      //     items: [
      //       { id: 101, title: "Căn hộ Sunrise City Q7", address: "Nguyễn Hữu Thọ, Quận 7", ... },
      //       { id: 205, title: "Chung cư 2PN Phú Mỹ Hưng", address: "Phú Mỹ Hưng, Quận 7", ... }
      //     ]
      //   },
      //   project: { total: 0, items: [] },
      //   news: { total: 0, items: [] }
      // }

      setSearchResult(result)
      setSearchHistory(recordSearchHistory(rawInput, parsedSearch))
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tìm kiếm lúc này')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveChip = (chip: SearchChip) => {
    setInputValue((previous) => removeSearchTokenByChip(previous, chip))
  }

  const handleEditChip = (chip: SearchChip) => {
    const cleared = removeSearchTokenByChip(inputValue, chip)
    setInputValue(compactInput(`${cleared} ${chip.editText}`))
    inputRef.current?.focus()
  }

  const handleSelectTagSuggestion = (suggestion: SearchTagSuggestion) => {
    setActiveTab((currentTab) => {
      if (currentTab === 'all' || suggestion.tab === currentTab) return currentTab

      return suggestion.tab
    })
    setInputValue((previous) => applySearchTagSuggestion(previous, suggestion))
    inputRef.current?.focus()
  }

  const totalMatched = getGroupTotal(searchResult, activeTab)

  return (
    <section className="editorial-gradient relative flex min-h-[600px] items-center overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-screen-2xl items-center justify-center gap-12 px-8">
        <div className="w-full rounded-xl bg-white/90 p-8 shadow-[0px_24px_48px_rgba(0,0,0,0.15)] backdrop-blur-2xl lg:w-2/3">
          <div className="mb-6 flex gap-4 border-b border-zinc-100 overflow-x-auto pb-1">
            {tabOptions.map((tab) => {
              const isActive = tab.key === activeTab
              return (
                <button
                  key={tab.key}
                  className={
                    isActive
                      ? 'whitespace-nowrap border-b-2 border-primary pb-3 text-sm font-bold text-primary'
                      : 'whitespace-nowrap pb-3 text-sm font-medium text-secondary transition-colors hover:text-on-surface'
                  }
                  onClick={() => handleTabChange(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="space-y-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-4 text-zinc-400">
                location_on
              </span>
              <input
                ref={inputRef}
                className="w-full rounded-lg border border-zinc-100 bg-surface-container-lowest py-4 pl-12 pr-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSearch()
                  }
                }}
                placeholder={placeholder}
                type="text"
                value={inputValue}
              />
            </div>

            {parsed.chips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {parsed.chips.map((chip) => (
                  <div
                    key={`${chip.key}-${chip.value}`}
                    className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs"
                  >
                    <button
                      className="text-primary transition-colors hover:text-primary/80"
                      onClick={() => handleEditChip(chip)}
                      title="Sửa bộ lọc"
                      type="button"
                    >
                      {chip.label}
                    </button>
                    <button
                      className="material-symbols-outlined text-sm text-secondary transition-colors hover:text-on-surface"
                      onClick={() => handleRemoveChip(chip)}
                      title="Xóa bộ lọc"
                      type="button"
                    >
                      close
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tagSuggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-secondary">Gợi ý:</span>
                {tagSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-secondary transition-colors hover:border-primary hover:text-primary"
                    onClick={() => handleSelectTagSuggestion(suggestion)}
                    type="button"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            )}

            <button
              className="editorial-gradient flex w-full items-center justify-center gap-2 rounded-lg py-4 font-bold text-white shadow-lg shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              onClick={() => {
                void handleSearch()
              }}
              type="button"
            >
              <span className="material-symbols-outlined">search</span>
              {isLoading ? 'Đang tìm kiếm...' : 'Tìm kiếm ngay'}
            </button>

            {(searchResult || errorMessage) && (
              <div className="rounded-lg border border-zinc-100 bg-white p-4">
                {errorMessage ? (
                  <p className="text-sm text-red-600">{errorMessage}</p>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-on-surface">
                        {totalMatched} kết quả phù hợp
                      </p>
                      {activeTab === 'all' && searchResult && (
                        <div className="flex flex-wrap gap-2 text-[11px] text-secondary">
                          <span className="rounded-full bg-surface-container px-2 py-1">
                            Bất động sản: {searchResult.property.total}
                          </span>
                          <span className="rounded-full bg-surface-container px-2 py-1">
                            Dự án: {searchResult.project.total}
                          </span>
                          <span className="rounded-full bg-surface-container px-2 py-1">
                            Tin tức: {searchResult.news.total}
                          </span>
                        </div>
                      )}
                    </div>

                    {searchResult && (
                      <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                        {(activeTab === 'property' || activeTab === 'all') &&
                          searchResult.property.items.slice(0, 5).map((property) => (
                            <div
                              key={`property-${property.id}`}
                              className="rounded-md bg-surface p-3"
                            >
                              <p className="text-sm font-semibold text-on-surface">
                                {property.title}
                              </p>
                              <p className="text-xs text-secondary">{truncate(property.address)}</p>
                            </div>
                          ))}

                        {(activeTab === 'project' || activeTab === 'all') &&
                          searchResult.project.items.slice(0, 5).map((project) => (
                            <div
                              key={`project-${project.id}`}
                              className="rounded-md bg-surface p-3"
                            >
                              <p className="text-sm font-semibold text-on-surface">
                                {project.name}
                              </p>
                              <p className="text-xs text-secondary">{truncate(project.address)}</p>
                            </div>
                          ))}

                        {(activeTab === 'news' || activeTab === 'all') &&
                          searchResult.news.items.slice(0, 5).map((article) => (
                            <div key={`news-${article.id}`} className="rounded-md bg-surface p-3">
                              <p className="text-sm font-semibold text-on-surface">
                                {article.title}
                              </p>
                              <p className="text-xs text-secondary">
                                {truncate(article.excerpt || '')}
                              </p>
                            </div>
                          ))}

                        {totalMatched === 0 && (
                          <p className="text-sm text-secondary">Không tìm thấy kết quả phù hợp.</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function compactInput(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}
