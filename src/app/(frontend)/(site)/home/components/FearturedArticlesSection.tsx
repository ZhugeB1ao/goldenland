'use client'

import { useEffect, useState } from 'react'
import {
  fetchFeaturedArticlesBasedOnCategoryId,
  fetchTopViewedRealEstateNews,
} from '../services/articles'

type Article = {
  id: string | number
  title: string
  summary: string
  date: string
  readTime: string
  image: string
  label: string
}

type ArticlesCategory = {
  id: number | 'top-viewed'
  title: string
  articles: Article[]
}

const categoryIds = ['top-viewed', 1, 2] as const

// Temporary image when an article has no thumbnail.
const PLACEHOLDER_IMAGE = 'https://placehold.co/1200x675?text=No+Image'

// Fixed tab labels for the homepage section.
const categoryLabels: Record<(typeof categoryIds)[number], string> = {
  'top-viewed': 'Tin nổi bật',
  2: 'BĐS TPHCM',
  1: 'BĐS Hà Nội',
}

const estimateReadTime = (text: string): string => {
  // Approximate reading time using 180 words/minute.
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(wordCount / 180))

  return `${minutes} phút đọc`
}

const initialCategories: ArticlesCategory[] = categoryIds.map((id) => ({
  id,
  title: categoryLabels[id],
  articles: [],
}))

// Fallback hero item before API data arrives.
const emptyArticle: Article = {
  id: 'placeholder',
  title: 'Chua co bai viet',
  summary: 'Du lieu bai viet dang duoc cap nhat.',
  date: '',
  readTime: '',
  image: PLACEHOLDER_IMAGE,
  label: 'Dang cap nhat',
}

export function FeaturedArticlesSection() {
  const [remoteCategories, setRemoteCategories] = useState<ArticlesCategory[]>(initialCategories)

  // Active tab
  const [activeCategoryTitle, setActiveCategoryTitle] = useState(initialCategories[0].title)

  // Active article index inside the tab
  const [activeArticleIndex, setActiveArticleIndex] = useState(0)

  // Main hero article
  const [heroArticle, setHeroArticle] = useState<Article>(emptyArticle)

  // Hero fade animation state
  const [isHeroFading, setIsHeroFading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadFeaturedArticles = async () => {
      try {
        const [topViewedResult, haNoiResult, tpHcmResult] = await Promise.allSettled([
          fetchTopViewedRealEstateNews(),
          fetchFeaturedArticlesBasedOnCategoryId(1),
          fetchFeaturedArticlesBasedOnCategoryId(2),
        ])

        const buildCategory = (
          id: ArticlesCategory['id'],
          title: string,
          articles: Awaited<ReturnType<typeof fetchFeaturedArticlesBasedOnCategoryId>>,
        ): ArticlesCategory => ({
          id,
          title,
          articles: articles.map((article) => ({
            id: article.id,
            title: article.title,
            summary: article.excerpt ?? '',
            date: new Date(article.updatedAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }),
            readTime: estimateReadTime(article.excerpt ?? ''),
            image: article.imageUrl ?? PLACEHOLDER_IMAGE,
            label: title,
          })),
        })

        const nextCategories: ArticlesCategory[] = []

        if (topViewedResult.status === 'fulfilled') {
          nextCategories.push(buildCategory('top-viewed', categoryLabels['top-viewed'], topViewedResult.value))
        }

        if (haNoiResult.status === 'fulfilled') {
          nextCategories.push(buildCategory(1, categoryLabels[1], haNoiResult.value))
        } else {
          nextCategories.push({ id: 1, title: categoryLabels[1], articles: [] })
        }

        if (tpHcmResult.status === 'fulfilled') {
          nextCategories.push(buildCategory(2, categoryLabels[2], tpHcmResult.value))
        } else {
          nextCategories.push({ id: 2, title: categoryLabels[2], articles: [] })
        }

        if (isMounted) {
          // Default to the first available tab after a successful fetch.
          setRemoteCategories(nextCategories)
          setActiveCategoryTitle(nextCategories[0]?.title ?? initialCategories[0].title)
        }

        console.log('fetchFeaturedArticlesBasedOnCategoryId results:', {
          topViewed: topViewedResult,
          haNoi: haNoiResult,
          tpHcm: tpHcmResult,
        })
        
      } catch {
        if (isMounted) {
          // Keep empty tab shells if the request fails.
          setRemoteCategories(initialCategories)
        }
      }
    }

    // Initial fetch for the section.
    loadFeaturedArticles()

    return () => {
      // Prevent state updates after unmount.
      isMounted = false
    }
  }, [])

  // Find selected category, fallback to first one
  const currentCategory =
    remoteCategories.find((category) => category.title === activeCategoryTitle) ??
    remoteCategories[0] ??
    initialCategories[0]

  // Pick active article for hero
  const activeArticle =
    currentCategory.articles[activeArticleIndex] ?? currentCategory.articles[0] ?? heroArticle

  // Reset article index when tab changes
  useEffect(() => {
    setActiveArticleIndex(0)
  }, [activeCategoryTitle])

  // Animate hero content switch
  useEffect(() => {
    if (heroArticle.title === activeArticle.title) return

    setIsHeroFading(true)
    const timeoutId = setTimeout(() => {
      setHeroArticle(activeArticle)
      setIsHeroFading(false)
    }, 140)

    return () => clearTimeout(timeoutId)
  }, [activeArticle, heroArticle.title])

  return (
    <section className="mx-auto max-w-screen-2xl bg-surface px-8 py-20">
      <div className="mb-12 flex flex-col justify-between border-b border-outline-variant/20 pb-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold uppercase tracking-tighter text-on-surface">
            Dòng chảy thị trường
          </h2>
          <div className="scrollbar-hide flex gap-8 overflow-x-auto pb-2">
            {remoteCategories.map((category) => {
              const isActive = category.title === activeCategoryTitle

              return (
                <button
                  key={category.title}
                  className={
                    isActive
                      ? 'whitespace-nowrap border-b-2 border-primary pb-2 font-bold text-primary'
                      : 'whitespace-nowrap pb-2 text-secondary transition-colors hover:text-on-surface'
                  }
                  onClick={() => setActiveCategoryTitle(category.title)}
                  type="button"
                >
                  {category.title}
                </button>
              )
            })}
          </div>
        </div>
        <a
          className="group mb-2 flex items-center gap-1 font-semibold text-primary"
          href="/articles"
        >
          Xem tất cả
          <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
            arrow_forward
          </span>
        </a>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div
          className={`group cursor-pointer transition-all duration-300 ease-out lg:col-span-8 ${
            isHeroFading ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="relative mb-6 overflow-hidden rounded-full">
            <img
              alt={heroArticle.title}
              className="aspect-[16/9] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              src={heroArticle.image}
            />
            <div className="absolute left-6 top-6">
              <span className="bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                {heroArticle.label}
              </span>
            </div>
          </div>
          <h3 className="mb-4 text-2xl font-bold leading-snug transition-colors group-hover:text-primary">
            {heroArticle.title}
          </h3>
          <p className="mb-4 leading-relaxed text-secondary">{heroArticle.summary}</p>
          <div className="flex items-center gap-4 text-xs text-secondary">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              {heroArticle.date}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {heroArticle.readTime}
            </span>
          </div>
        </div>

        <div className="space-y-8 lg:col-span-4">
          {currentCategory.articles.map((article, index) => {
            const isActive = index === activeArticleIndex

            return (
              <div
                key={article.id}
                className={`group -mx-2 flex cursor-pointer gap-4 rounded-lg px-2 py-2 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-surface-container-low ${
                  isActive ? 'bg-surface-container-low' : ''
                } ${
                  index < currentCategory.articles.length - 1
                    ? 'border-b border-outline-variant/10 pb-6'
                    : ''
                }`}
                onFocus={() => setActiveArticleIndex(index)}
                onMouseEnter={() => setActiveArticleIndex(index)}
                role="button"
                tabIndex={0}
              >
                {/* Small thumbnail can be enabled again when needed. */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold leading-tight transition-colors group-hover:text-primary">
                    {article.title}
                  </h4>
                  {/* <span className="text-[10px] font-bold uppercase text-secondary">
                    {article.summary}
                  </span> */}
                </div>
              </div>
            )
          })}
          {/* Empty state for a tab without items. */}
          {currentCategory.articles.length === 0 && (
            <p className="text-sm text-secondary">Chua co bai viet cho danh muc nay.</p>
          )}
        </div>
      </div>
    </section>
  )
}
