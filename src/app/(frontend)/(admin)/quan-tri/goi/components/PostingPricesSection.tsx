'use client'

import { useState, useTransition } from 'react'
import { formatVND } from '../../../lib/format'
import { togglePostingPriceActive, type PostType } from '../actions'
import PostingPriceFormDrawer from './PostingPriceFormDrawer'

export type PostingPriceItem = {
  id: string | number
  name: string
  description?: string | null
  postType: PostType
  displayMultiplier: number
  dailyPrice: number
  recommendedDurationDays: number
  durationOptions?: {
    id?: string | null
    durationDays: number
    discountPercent?: number | null
    label?: string | null
  }[]
  sort?: number | null
  isActive?: boolean | null
}

const POST_TYPE_CONFIG: Record<PostType, { label: string; headerBg: string; headerText: string; badgeBg: string; badgeText: string }> = {
  normal: {
    label: 'Tin thường',
    headerBg: 'bg-sky-50',
    headerText: 'text-sky-700',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-700',
  },
  silver: {
    label: 'VIP Bạc',
    headerBg: 'bg-slate-100',
    headerText: 'text-slate-700',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-700',
  },
  gold: {
    label: 'VIP Vàng',
    headerBg: 'bg-amber-50',
    headerText: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
  },
  diamond: {
    label: 'VIP Kim cương',
    headerBg: 'bg-cyan-50',
    headerText: 'text-cyan-700',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-700',
  },
}

const POST_TYPE_ICON: Record<PostType, string> = {
  normal: 'article',
  silver: 'verified',
  gold: 'star',
  diamond: 'diamond',
}

function PostingPriceRow({
  item,
  onEdit,
}: {
  item: PostingPriceItem
  onEdit: (item: PostingPriceItem) => void
}) {
  const [pending, startTransition] = useTransition()
  const cfg = POST_TYPE_CONFIG[item.postType]

  const handleToggle = () => {
    startTransition(() => togglePostingPriceActive(item.id, !item.isActive))
  }

  return (
    <tr
      className={`group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${
        !item.isActive ? 'opacity-50' : ''
      }`}
    >
      <td className="px-5 py-3.5">
        <div className="font-medium text-slate-800">{item.name}</div>
        {item.description && (
          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.description}</div>
        )}
      </td>
      <td className="px-5 py-3.5">
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}
        >
          <span className="material-symbols-outlined text-[12px]">{POST_TYPE_ICON[item.postType]}</span>
          {cfg.label}
        </span>
      </td>
      <td className="px-5 py-3.5 text-center">
        <span className="font-semibold text-slate-700">{item.displayMultiplier}x</span>
        <div className="text-[10px] text-slate-400">ưu tiên</div>
      </td>
      <td className="px-5 py-3.5 text-right">
        <span className="font-bold text-amber-600">{formatVND(item.dailyPrice)}</span>
        <div className="text-[10px] text-slate-400">/ ngày</div>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex flex-wrap gap-1">
          {item.durationOptions?.map((opt, i) => (
            <span
              key={i}
              className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium"
            >
              {opt.durationDays}d
              {opt.discountPercent ? (
                <span className="text-rose-500 ml-0.5">-{opt.discountPercent}%</span>
              ) : null}
            </span>
          ))}
        </div>
      </td>
      <td className="px-5 py-3.5 text-center">
        <button
          onClick={handleToggle}
          disabled={pending}
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-60 ${
            item.isActive
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[12px]">
            {pending ? 'hourglass_empty' : item.isActive ? 'visibility' : 'visibility_off'}
          </span>
          {item.isActive ? 'Hiển thị' : 'Đã ẩn'}
        </button>
      </td>
      <td className="px-5 py-3.5 text-right">
        <button
          onClick={() => onEdit(item)}
          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-all px-2 py-1 rounded hover:bg-slate-100"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          Sửa
        </button>
      </td>
    </tr>
  )
}

function PostTypeTable({
  postType,
  items,
  onEdit,
}: {
  postType: PostType
  items: PostingPriceItem[]
  onEdit: (item: PostingPriceItem) => void
}) {
  const cfg = POST_TYPE_CONFIG[postType]
  const icon = POST_TYPE_ICON[postType]

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className={`px-5 py-3 border-b border-slate-100 ${cfg.headerBg} flex items-center gap-2`}>
        <span className={`material-symbols-outlined text-[18px] ${cfg.headerText}`}>{icon}</span>
        <span className={`text-sm font-semibold ${cfg.headerText}`}>{cfg.label}</span>
        <span className={`text-xs ${cfg.headerText} opacity-70`}>({items.length} mức)</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {['Tên', 'Loại', 'Ưu tiên', 'Giá/ngày', 'Tuỳ chọn ngày', 'Trạng thái', ''].map((h) => (
              <th
                key={h}
                className="px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide text-left last:text-right"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <PostingPriceRow key={item.id} item={item} onEdit={onEdit} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PostingPricesSection({
  postingPrices,
}: {
  postingPrices: PostingPriceItem[]
}) {
  const [drawerItem, setDrawerItem] = useState<PostingPriceItem | null | 'new'>(null)

  const byType = (type: PostType) => postingPrices.filter((p) => p.postType === type)

  const postTypes: PostType[] = ['normal', 'silver', 'gold', 'diamond']

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-500">receipt_long</span>
          Bảng giá đăng tin
          <span className="ml-1 text-sm font-normal text-slate-400">
            ({postingPrices.length} loại)
          </span>
        </h2>
        <button
          onClick={() => setDrawerItem('new')}
          className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          Thêm loại tin
        </button>
      </div>

      {postingPrices.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <span className="material-symbols-outlined text-slate-300 text-[48px]">receipt_long</span>
          <p className="mt-2 text-sm text-slate-400">
            Chưa có loại tin nào.{' '}
            <button
              onClick={() => setDrawerItem('new')}
              className="text-amber-500 hover:underline"
            >
              Thêm loại đầu tiên
            </button>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {postTypes.map((type) => {
            const items = byType(type)
            if (items.length === 0) return null
            return (
              <PostTypeTable key={type} postType={type} items={items} onEdit={setDrawerItem} />
            )
          })}
        </div>
      )}

      {drawerItem !== null && (
        <PostingPriceFormDrawer
          item={drawerItem === 'new' ? null : drawerItem}
          onClose={() => setDrawerItem(null)}
        />
      )}
    </section>
  )
}
