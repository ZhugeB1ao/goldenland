type NewsItem = {
  title: string
  href: string
}

type SidebarRangeItem = {
  id: string
  label: string
}

type SidebarRegionItem = {
  value: string
  label: string
}

type PropertiesSidebarProps = {
  priceRanges: SidebarRangeItem[]
  areaRanges: SidebarRangeItem[]
  regions: SidebarRegionItem[]
  news: NewsItem[]
  selectedPriceRangeIds: string[]
  selectedAreaRangeIds: string[]
  selectedRegionCodes: string[]
  onPriceRangeSelect: (id: string) => void
  onAreaRangeSelect: (id: string) => void
  onRegionSelect: (code: string) => void
}

export function PropertiesSidebar({
  priceRanges,
  areaRanges,
  regions,
  news,
  selectedPriceRangeIds,
  selectedAreaRangeIds,
  selectedRegionCodes,
  onPriceRangeSelect,
  onAreaRangeSelect,
  onRegionSelect,
}: PropertiesSidebarProps) {
  return (
    <aside className="lg:col-span-4 self-start space-y-8 lg:pt-20">
      <div className="bg-white rounded-xl border border-outline-variant/30 p-6 shadow-sm">
        <h3 className="font-lexend font-bold text-lg mb-4">Gợi ý khoảng giá</h3>
        <div className="space-y-3">
          {priceRanges.map((range) => (
            <button
              key={range.id}
              className={`flex justify-between items-center text-sm transition-colors w-full ${
                selectedPriceRangeIds.includes(range.id)
                  ? 'text-primary font-semibold'
                  : 'text-secondary hover:text-primary'
              }`}
              onClick={() => onPriceRangeSelect(range.id)}
              type="button"
            >
              <span>{range.label}</span>
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
              key={range.id}
              className={`flex justify-between items-center text-sm transition-colors w-full ${
                selectedAreaRangeIds.includes(range.id)
                  ? 'text-primary font-semibold'
                  : 'text-secondary hover:text-primary'
              }`}
              onClick={() => onAreaRangeSelect(range.id)}
              type="button"
            >
              <span>{range.label}</span>
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
              key={region.value}
              className={`flex justify-between items-center text-sm transition-colors w-full ${
                selectedRegionCodes.includes(region.value)
                  ? 'text-primary font-semibold'
                  : 'text-secondary hover:text-primary'
              }`}
              onClick={() => onRegionSelect(region.value)}
              type="button"
            >
              <span>{region.label}</span>
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
