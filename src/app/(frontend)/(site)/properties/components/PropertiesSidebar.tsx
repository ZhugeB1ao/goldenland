type NewsItem = {
  title: string
  href: string
}

type PropertiesSidebarProps = {
  priceRanges: string[]
  areaRanges: string[]
  regions: string[]
  news: NewsItem[]
}

export function PropertiesSidebar({
  priceRanges,
  areaRanges,
  regions,
  news,
}: PropertiesSidebarProps) {
  return (
    <aside className="lg:col-span-4 space-y-8">
      <div className="bg-white rounded-xl border border-outline-variant/30 p-6 shadow-sm">
        <h3 className="font-lexend font-bold text-lg mb-4">Gợi ý khoảng giá</h3>
        <div className="space-y-3">
          {priceRanges.map((range) => (
            <button
              key={range}
              className="flex justify-between items-center text-sm text-secondary hover:text-primary transition-colors w-full"
              type="button"
            >
              <span>{range}</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant/30 p-6 shadow-sm">
        <h3 className="font-lexend font-bold text-lg mb-4">Gợi ý diện tích</h3>
        <div className="space-y-3">
          {areaRanges.map((range) => (
            <button
              key={range}
              className="flex justify-between items-center text-sm text-secondary hover:text-primary transition-colors w-full"
              type="button"
            >
              <span>{range}</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant/30 p-6 shadow-sm">
        <h3 className="font-lexend font-bold text-lg mb-4">Khu vực</h3>
        <div className="space-y-3">
          {regions.map((region) => (
            <button
              key={region}
              className="flex justify-between items-center text-sm text-secondary hover:text-primary transition-colors w-full"
              type="button"
            >
              <span>{region}</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant/30 p-6 shadow-sm">
        <h3 className="font-lexend font-bold text-lg mb-4">Tin tức bất động sản</h3>
        <div className="space-y-3">
          {news.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">article</span>
              <span>{item.title}</span>
            </a>
          ))}
        </div>
      </div>
    </aside>
  )
}
