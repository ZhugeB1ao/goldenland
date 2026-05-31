'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

type Props = {
  status?: string
  propertyType?: string
  q?: string
}

const STATUS_TABS = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'active', label: 'Đang hiển thị' },
  { value: 'rejected', label: 'Bị từ chối' },
  { value: 'draft', label: 'Nháp' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'sold', label: 'Đã bán' },
]

const PROPERTY_TYPES = [
  { value: '', label: 'Tất cả loại' },
  { value: 'house', label: 'Nhà riêng' },
  { value: 'apartment', label: 'Chung cư' },
  { value: 'land', label: 'Đất nền' },
  { value: 'villa', label: 'Biệt thự' },
  { value: 'townhouse', label: 'Nhà phố' },
  { value: 'shophouse', label: 'Shophouse' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'condotel', label: 'Condotel' },
  { value: 'warehouse', label: 'Kho/Xưởng' },
  { value: 'commercial', label: 'Mặt bằng' },
]

export default function PropertyFilterBar({ status, propertyType, q }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchVal, setSearchVal] = useState(q || '')

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(sp?.toString() || '')
    if (!value) next.delete(key)
    else next.set(key, value)
    next.delete('page')
    startTransition(() => {
      router.push(`/quan-tri/tin-dang?${next.toString()}`)
    })
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParam('q', searchVal.trim() || undefined)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const active = (status || 'pending') === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => updateParam('status', tab.value)}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                active
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={propertyType || ''}
          onChange={(e) => updateParam('propertyType', e.target.value || undefined)}
          className="px-3 py-2 rounded-md border border-slate-200 text-sm bg-white"
        >
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <form onSubmit={submitSearch} className="flex-1 min-w-[240px] flex">
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Tìm theo tiêu đề / địa chỉ..."
            className="flex-1 px-3 py-2 rounded-l-md border border-slate-200 text-sm focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-r-md bg-slate-800 text-white text-sm hover:bg-slate-700"
          >
            Tìm
          </button>
        </form>
      </div>
    </div>
  )
}
