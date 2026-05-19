import type { ReactNode } from 'react'
import Link from 'next/link'

export function Breadcrumb({ title }: { title: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex text-sm text-on-secondary-container mb-6 font-label"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link className="hover:text-primary transition-colors" href="/properties">
            Nhà đất bán
          </Link>
        </li>
        <li>
          <div className="flex items-center">
            <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
            <span className="text-on-surface font-medium">{title}</span>
          </div>
        </li>
      </ol>
    </nav>
  )
}

export function HeaderActions({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start gap-4">
        <h1 className="text-[2rem] leading-tight font-headline font-bold text-on-background tracking-tighter max-w-3xl">
          {title}
        </h1>
        <div className="flex gap-2 shrink-0 mt-2">{actions}</div>
      </div>
    </div>
  )
}

export function LocationLine({ locationText }: { locationText: string }) {
  return (
    <p className="text-on-secondary-container flex items-center gap-2 font-body text-base mt-2">
      <span className="material-symbols-outlined text-lg">location_on</span>
      {locationText}
    </p>
  )
}

export function PropertyStats({
  priceText,
  areaText,
  bedrooms,
  bathrooms,
}: {
  priceText: string
  areaText: string
  bedrooms: number
  bathrooms: number
}) {
  return (
    <div className="flex flex-wrap gap-8 p-6 mb-8 border-y border-outline-variant/20 bg-surface-container-lowest">
      <div>
        <p className="text-sm text-on-secondary-container font-label mb-1">Mức giá</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-headline font-bold text-primary">{priceText}</p>
        </div>
      </div>
      <div className="w-px bg-outline-variant/30 hidden sm:block"></div>
      <div>
        <p className="text-sm text-on-secondary-container font-label mb-1">Diện tích</p>
        <p className="text-xl font-headline font-semibold text-on-surface">{areaText}</p>
      </div>
      <div className="w-px bg-outline-variant/30 hidden sm:block"></div>
      <div className="flex gap-6">
        <div>
          <p className="text-sm text-on-secondary-container font-label mb-1">Phòng ngủ</p>
          <p className="text-xl font-headline font-semibold text-on-surface flex items-center gap-1">
            {bedrooms}{' '}
            <span className="material-symbols-outlined text-lg text-on-surface-variant">bed</span>
          </p>
        </div>
        <div>
          <p className="text-sm text-on-secondary-container font-label mb-1">Phòng tắm</p>
          <p className="text-xl font-headline font-semibold text-on-surface flex items-center gap-1">
            {bathrooms}{' '}
            <span className="material-symbols-outlined text-lg text-on-surface-variant">
              bathtub
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
