'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { PropertySortValue } from '../services/properties'

type PropertiesHeaderProps = {
  totalDocs: number
  headline: string
  sortValue: PropertySortValue
  onSortChange: (value: PropertySortValue) => void
}

const SORT_OPTIONS: Array<{ value: PropertySortValue; label: string }> = [
  { value: 'default', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'area_asc', label: 'Diện tích nhỏ đến lớn' },
  { value: 'area_desc', label: 'Diện tích lớn đến nhỏ' },
]

export function PropertiesHeader({
  totalDocs,
  headline,
  sortValue,
  onSortChange,
}: PropertiesHeaderProps) {
  const [openSort, setOpenSort] = useState(false)
  const sortRef = useRef<HTMLDivElement | null>(null)
  const sortLabel = useMemo(
    () => SORT_OPTIONS.find((option) => option.value === sortValue)?.label ?? SORT_OPTIONS[0].label,
    [sortValue],
  )

  useEffect(() => {
    if (!openSort) return
    const handleOutsideClick = (event: MouseEvent) => {
      if (!sortRef.current) return
      if (sortRef.current.contains(event.target as Node)) return
      setOpenSort(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [openSort])

  return (
    <section className="mb-8 mt-20">
      <nav className="flex text-xs text-secondary gap-2 mb-4 font-body">
        <Link href="/" className="hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="text-on-surface">{headline}</span>
      </nav>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-lexend tracking-tight text-on-surface">
            {headline}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Hiện có <span className="font-bold text-on-surface">{totalDocs}</span> tin đăng
          </p>
        </div>
        <div className="flex justify-start md:justify-end">
          <div className="relative" ref={sortRef}>
            <button
              className="inline-flex h-10 min-w-[260px] items-center justify-between gap-3 rounded-lg border border-outline-variant/40 bg-white px-3 text-sm text-on-surface shadow-sm"
              onClick={() => setOpenSort((current) => !current)}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-secondary">swap_vert</span>
                <span className="truncate">{sortLabel}</span>
              </span>
              <span className="material-symbols-outlined text-base text-secondary">expand_more</span>
            </button>
            {openSort && (
              <div className="absolute right-0 top-full z-30 mt-2 w-[320px] rounded-xl border border-outline-variant/30 bg-white p-2 shadow-lg">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                      sortValue === option.value
                        ? 'bg-primary/10 text-primary'
                        : 'text-on-surface hover:bg-surface-container'
                    }`}
                    onClick={() => {
                      onSortChange(option.value)
                      setOpenSort(false)
                    }}
                    type="button"
                  >
                    <span>{option.label}</span>
                    {sortValue === option.value && (
                      <span className="material-symbols-outlined text-base">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
