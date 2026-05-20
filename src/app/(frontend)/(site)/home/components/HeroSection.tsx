'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { buildQuery } from '@/app/lib/query'
import { getSearchPlaceholder, parseSearch } from '../lib/search/parser'
import type { SearchTab } from '../lib/search/types'
import { searchNewsByParsed } from '../services/hybridSearch'
import type { AppDispatch } from '@/app/store'
import {
  hydrateFromParsed,
  selectPropertySearch,
  setSearchTab,
} from '@/app/store/slices/propertySearchSlice'

type TabOption = {
  key: SearchTab
  label: string
}

const tabOptions: TabOption[] = [
  { key: 'property', label: 'Bất động sản' },
  // Project search tab is intentionally hidden in this phase.
  { key: 'news', label: 'Tin tức' },
]

export function HeroSection() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const sharedSearch = useSelector(selectPropertySearch)
  const [activeTab, setActiveTab] = useState<SearchTab>(
    sharedSearch.activeTab === 'news' ? 'news' : 'property',
  )
  const [inputValue, setInputValue] = useState(sharedSearch.homeInput || sharedSearch.keyword || '')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const parsed = useMemo(() => parseSearch(inputValue, activeTab), [inputValue, activeTab])
  const placeholder = useMemo(() => getSearchPlaceholder(activeTab), [activeTab])

  const handleSearch = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      dispatch(setSearchTab(activeTab))
      dispatch(
        hydrateFromParsed({
          tab: activeTab,
          rawInput: inputValue,
          parsed,
        }),
      )

      if (activeTab === 'news') {
        const newsResult = await searchNewsByParsed(parsed, { limit: 5 })
        const firstMatchedArticle = newsResult.items[0]

        if (!firstMatchedArticle?.slug) {
          setErrorMessage('Chưa tìm thấy bài viết phù hợp. Bạn thử từ khóa khác nhé.')
          return
        }

        router.push(`/articles/${firstMatchedArticle.slug}`)
        return
      }

      const query = buildQuery({
        keyword: parsed.keyword || undefined,
        district: parsed.filters.district || undefined,
        provinceCode: parsed.filters.provinceCode || undefined,
        wardCode: parsed.filters.wardCode || undefined,
        listingType: parsed.filters.listingType || undefined,
        propertyType: parsed.filters.propertyType || undefined,
        bedrooms: parsed.filters.bedrooms || undefined,
        bathrooms: parsed.filters.bathrooms || undefined,
        minPrice: parsed.filters.minPrice || undefined,
        maxPrice: parsed.filters.maxPrice || undefined,
        minArea: parsed.filters.minArea || undefined,
        maxArea: parsed.filters.maxArea || undefined,
        direction: parsed.filters.direction || undefined,
        legalStatus: parsed.filters.legalStatus || undefined,
        postType: parsed.filters.postType || undefined,
        furnitureStatus: parsed.filters.furnitureStatus || undefined,
      })

      router.push(`/properties${query}`)
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Không thể tìm kiếm lúc này. Vui lòng thử lại.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="editorial-gradient relative flex min-h-[600px] items-center overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-screen-2xl items-center justify-center gap-12 px-8">
        <div className="w-full rounded-xl bg-white/90 p-8 shadow-[0px_24px_48px_rgba(0,0,0,0.15)] backdrop-blur-2xl lg:w-2/3">
          <div className="mb-6 flex gap-4 overflow-x-auto border-b border-zinc-100 pb-1">
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
                  onClick={() => {
                    setActiveTab(tab.key)
                    setErrorMessage(null)
                  }}
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
                className="w-full rounded-lg border border-zinc-100 bg-surface-container-lowest py-4 pl-12 pr-16 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              <button
                aria-label="Tìm kiếm"
                className="material-symbols-outlined absolute right-2 top-2 rounded-md p-2 text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                onClick={() => {
                  void handleSearch()
                }}
                type="button"
              >
                search
              </button>
            </div>

            {errorMessage && <p className="text-sm text-amber-700">{errorMessage}</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
