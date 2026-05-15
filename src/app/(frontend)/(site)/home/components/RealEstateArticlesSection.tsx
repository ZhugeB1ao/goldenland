'use client'

import { useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { fetchFeaturedArticlesBasedOnCategoryId } from '../services/articles'

type NewsItem = {
  id: string | number
  title: string
  image: string
  imageAlt: string
  date: string
}

const fallbackImage =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function RealEstateArticlesSection() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    slidesToScroll: 1,
  })

  useEffect(() => {
    let isMounted = true

    const fetchNews = async () => {
      try {
        const featuredArticles = await fetchFeaturedArticlesBasedOnCategoryId(6)
        if (!isMounted) return

        setNewsItems(
          featuredArticles.map((article) => ({
            id: article.id,
            title: article.title,
            image: article.imageUrl ?? fallbackImage,
            imageAlt: article.title,
            date: dateFormatter.format(new Date(article.updatedAt)),
          })),
        )

        console.log('Fetched news items:', featuredArticles)
      } catch {
        if (isMounted) {
          setNewsItems([])
        }
      }
    }

    void fetchNews()

    return () => {
      isMounted = false
    }
  }, [])

  const handlePrev = () => emblaApi?.scrollPrev()

  const handleNext = () => emblaApi?.scrollNext()

  return (
    <section className="mx-auto max-w-screen-2xl px-8 pb-20">
      <div className="border-t border-zinc-100 pt-20">
        <div className="mb-12 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-bold uppercase tracking-tighter text-on-surface">
            Tin tức bất động sản
          </h2>
        </div>

        <div className="relative">
          <button
            aria-label="Xem tin trước"
            className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-outline bg-white shadow-sm transition-all hover:border-primary hover:bg-primary hover:text-white"
            onClick={handlePrev}
            type="button"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <button
            aria-label="Xem tin kế tiếp"
            className="absolute right-0 top-1/2 z-10 flex h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-outline bg-white shadow-sm transition-all hover:border-primary hover:bg-primary hover:text-white"
            onClick={handleNext}
            type="button"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="-mx-3 flex">
              {newsItems.map((news, index) => {
                const order = String(index + 1).padStart(2, '0')

                return (
                  <article
                    key={String(news.id)}
                    className="group min-w-0 shrink-0 basis-full cursor-pointer px-3 md:basis-1/2 lg:basis-1/3"
                  >
                    <div className="mb-6 overflow-hidden rounded-xl">
                      <img
                        alt={news.imageAlt}
                        className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={news.image}
                      />
                    </div>

                    <div className="flex gap-4">
                      <span className="text-4xl font-extrabold text-zinc-200 transition-colors group-hover:text-primary">
                        {order}
                      </span>

                      <div>
                        <h4 className="text-base font-bold leading-tight transition-colors group-hover:text-primary">
                          {news.title}
                        </h4>
                        <p className="mt-2 text-xs text-secondary">{news.date}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
