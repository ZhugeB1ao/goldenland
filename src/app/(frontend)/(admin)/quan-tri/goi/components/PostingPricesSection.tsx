'use client'

import { useTransition } from 'react'
import { formatVND } from '../../../lib/format'
import { togglePostingPriceActive } from '../actions'

type PostingPrice = {
  id: string | number
  name: string
  postType: 'normal' | 'vip'
  durationDays: number
  price: number
  sort: number
  isActive: boolean
}

function PostingPriceRow({ item }: { item: PostingPrice }) {
  const [pending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(() => togglePostingPriceActive(item.id, !item.isActive))
  }

  return (
    <tr
      className={`group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${
        !item.isActive ? 'opacity-50' : ''
      }`}
    >
      <td className="px-5 py-3.5 font-medium text-slate-800">{item.name}</td>
      <td className="px-5 py-3.5">
        <span
          className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            item.postType === 'vip'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-sky-100 text-sky-700'
          }`}
        >
          {item.postType === 'vip' ? 'Tin VIP' : 'Tin thường'}
        </span>
      </td>
      <td className="px-5 py-3.5 text-slate-600">
        <span className="font-medium">{item.durationDays}</span>
        <span className="text-slate-400 ml-1">ngày</span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <span className="font-bold text-amber-600">{formatVND(item.price)}</span>
        {item.durationDays > 0 && (
          <div className="text-[10px] text-slate-400">
            ≈ {formatVND(Math.round(item.price / item.durationDays))}/ngày
          </div>
        )}
      </td>
      <td className="px-5 py-3.5 text-center text-slate-400 text-sm">{item.sort}</td>
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
        <a
          href={`/admin/collections/posting-prices/${item.id}`}
          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          Sửa
        </a>
      </td>
    </tr>
  )
}

export default function PostingPricesSection({
  postingPrices,
}: {
  postingPrices: PostingPrice[]
}) {
  const normalPrices = postingPrices.filter((p) => p.postType === 'normal')
  const vipPrices = postingPrices.filter((p) => p.postType === 'vip')

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-500">receipt_long</span>
          Bảng giá đăng tin lẻ
          <span className="ml-1 text-sm font-normal text-slate-400">
            ({postingPrices.length} mức giá)
          </span>
        </h2>
        <a
          href="/admin/collections/posting-prices/create"
          className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          Thêm mức giá
        </a>
      </div>

      {postingPrices.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <span className="material-symbols-outlined text-slate-300 text-[48px]">receipt_long</span>
          <p className="mt-2 text-sm text-slate-400">
            Chưa có mức giá nào.{' '}
            <a href="/admin/collections/posting-prices/create" className="text-amber-500 hover:underline">
              Thêm mức giá đầu tiên
            </a>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Normal posts table */}
          {normalPrices.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-sky-50 flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-500 text-[18px]">article</span>
                <span className="text-sm font-semibold text-sky-700">Tin thường</span>
                <span className="text-xs text-sky-500">({normalPrices.length} mức)</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Tên
                    </th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Loại
                    </th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Thời hạn
                    </th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Giá
                    </th>
                    <th className="text-center px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Thứ tự
                    </th>
                    <th className="text-center px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Trạng thái
                    </th>
                    <th className="px-5 py-2.5 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {normalPrices.map((item) => (
                    <PostingPriceRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIP posts table */}
          {vipPrices.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-purple-50 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-500 text-[18px]">star</span>
                <span className="text-sm font-semibold text-purple-700">Tin VIP</span>
                <span className="text-xs text-purple-500">({vipPrices.length} mức)</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Tên
                    </th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Loại
                    </th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Thời hạn
                    </th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Giá
                    </th>
                    <th className="text-center px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Thứ tự
                    </th>
                    <th className="text-center px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Trạng thái
                    </th>
                    <th className="px-5 py-2.5 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {vipPrices.map((item) => (
                    <PostingPriceRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
