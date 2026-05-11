import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

type FilterBarProps = {
  propertyTypes: string[]
  priceRanges: string[]
  areaRanges: string[]
  regions: string[]
}

export function PropertiesFilterBar({
  propertyTypes,
  priceRanges,
  areaRanges,
  regions,
}: FilterBarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [openPanel, setOpenPanel] = useState<null | 'type' | 'price' | 'area' | 'region'>(null)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedPrices, setSelectedPrices] = useState<string[]>([])
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])

  const togglePanel = (panel: 'type' | 'price' | 'area' | 'region') => {
    setOpenPanel((current) => (current === panel ? null : panel))
  }

  const toggleValue = (
    value: string,
    selected: string[],
    setSelected: Dispatch<SetStateAction<string[]>>,
  ) => {
    setSelected((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
  }

  const renderPanel = (
    isOpen: boolean,
    items: string[],
    selected: string[],
    onToggle: (value: string) => void,
  ) => {
    if (!isOpen) return null

    return (
      <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-outline-variant/30 bg-white p-3 shadow-lg">
        <div className="max-h-56 overflow-auto pr-1">
          {items.length === 0 && <p className="text-xs text-secondary">Chưa có dữ liệu.</p>}
          {items.map((item) => (
            <label
              key={item}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-on-surface hover:bg-surface-container"
            >
              <span className="min-w-0 flex-1 truncate">{item}</span>
              <input
                className="h-4 w-4"
                type="checkbox"
                checked={selected.includes(item)}
                onChange={() => onToggle(item)}
              />
            </label>
          ))}
        </div>
        <button
          className="mt-3 w-full rounded-lg border border-outline-variant/40 py-2 text-xs font-semibold text-secondary hover:text-on-surface"
          onClick={() => setOpenPanel(null)}
          type="button"
        >
          Xong
        </button>
      </div>
    )
  }

  const typeCount = selectedTypes.length
  const priceCount = selectedPrices.length
  const areaCount = selectedAreas.length
  const regionCount = selectedRegions.length

  useEffect(() => {
    if (!openPanel) return

    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (containerRef.current.contains(event.target as Node)) return
      setOpenPanel(null)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [openPanel])

  return (
    <section className="bg-white shadow-[0px_12px_32px_rgba(27,28,28,0.06)] rounded-xl p-2 mb-10 sticky top-20 z-40 border border-outline-variant/10">
      <div className="flex flex-col gap-4 p-2">
        <div className="flex gap-3">
          <div className="flex-1 relative flex items-center bg-white border border-outline-variant/50 rounded-lg overflow-hidden h-14">
            <span className="material-symbols-outlined absolute left-4 text-secondary">search</span>
            <input
              className="w-full h-full pl-12 pr-32 border-none focus:ring-0 text-on-surface"
              placeholder="Tìm kiếm nhà đất..."
              type="text"
            />
            <button className="absolute right-2 bg-primary text-white px-6 py-2 rounded font-bold text-sm hover:opacity-90">
              Tìm kiếm
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3" ref={containerRef}>
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant/50 rounded-lg text-sm font-medium text-on-surface bg-white hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-lg">tune</span>
            Lọc
          </button>
          <div className="flex items-center gap-3 px-4 py-2 border border-outline-variant/50 rounded-lg bg-white">
            <span className="flex items-center gap-1 text-sm font-medium text-secondary">
              <span
                className="material-symbols-outlined text-green-600 text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              Tin xác thực
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input className="sr-only peer" type="checkbox" />
              <div className="w-9 h-5 bg-zinc-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                className="flex items-center gap-2 pl-4 pr-1 py-2 border border-outline-variant/50 rounded-lg text-sm text-on-surface bg-white hover:bg-surface-container-low transition-colors"
                onClick={() => togglePanel('type')}
                type="button"
              >
                Loại nhà đất
                {typeCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {typeCount}
                  </span>
                )}
                <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              </button>
              {renderPanel(openPanel === 'type', propertyTypes, selectedTypes, (value) =>
                toggleValue(value, selectedTypes, setSelectedTypes),
              )}
            </div>
            <div className="relative">
              <button
                className="flex items-center gap-2 pl-4 pr-1 py-2 border border-outline-variant/50 rounded-lg text-sm text-on-surface bg-white hover:bg-surface-container-low transition-colors"
                onClick={() => togglePanel('price')}
                type="button"
              >
                Khoảng giá
                {priceCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {priceCount}
                  </span>
                )}
                <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              </button>
              {renderPanel(openPanel === 'price', priceRanges, selectedPrices, (value) =>
                toggleValue(value, selectedPrices, setSelectedPrices),
              )}
            </div>
            <div className="relative">
              <button
                className="flex items-center gap-2 pl-4 pr-1 py-2 border border-outline-variant/50 rounded-lg text-sm text-on-surface bg-white hover:bg-surface-container-low transition-colors"
                onClick={() => togglePanel('area')}
                type="button"
              >
                Diện tích
                {areaCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {areaCount}
                  </span>
                )}
                <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              </button>
              {renderPanel(openPanel === 'area', areaRanges, selectedAreas, (value) =>
                toggleValue(value, selectedAreas, setSelectedAreas),
              )}
            </div>
            <div className="relative">
              <button
                className="flex items-center gap-2 pl-4 pr-1 py-2 border border-outline-variant/50 rounded-lg text-sm text-on-surface bg-white hover:bg-surface-container-low transition-colors"
                onClick={() => togglePanel('region')}
                type="button"
              >
                Khu vực
                {regionCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {regionCount}
                  </span>
                )}
                <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              </button>
              {renderPanel(openPanel === 'region', regions, selectedRegions, (value) =>
                toggleValue(value, selectedRegions, setSelectedRegions),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
