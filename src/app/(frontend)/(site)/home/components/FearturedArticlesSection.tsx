'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  fetchFeaturedArticlesBasedOnCategoryId,
  fetchTopViewedRealEstateNews,
} from '../services/articles'
import { ArticleHeroItem, ArticleListItem, type Article } from './ArticleItems'

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
          nextCategories.push(
            buildCategory('top-viewed', categoryLabels['top-viewed'], topViewedResult.value),
          )
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
        <Link
          className="group mb-2 flex items-center gap-1 font-semibold text-primary"
          href="/articles"
        >
          Xem tất cả
          <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
            arrow_forward
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <ArticleHeroItem article={heroArticle} isFading={isHeroFading} />

        <div className="space-y-8 lg:col-span-4">
          {currentCategory.articles.map((article, index) => (
            <ArticleListItem
              key={article.id}
              article={article}
              isActive={index === activeArticleIndex}
              isLast={index === currentCategory.articles.length - 1}
              onActivate={() => setActiveArticleIndex(index)}
            />
          ))}
          {/* Empty state for a tab without items. */}
          {currentCategory.articles.length === 0 && (
            <p className="text-sm text-secondary">Chua co bai viet cho danh muc nay.</p>
          )}
        </div>
      </div>
    </section>
  )
}
