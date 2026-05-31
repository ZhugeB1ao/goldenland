'use client'

import { useState, useTransition } from 'react'
import { formatVND } from '../../../lib/format'
import { togglePackageActive, type PostType } from '../actions'
import PackageFormDrawer from './PackageFormDrawer'

export type PackageItem = {
  id: string | number
  name: string
  subtitle?: string | null
  description?: string | null
  price: number
  originalPrice?: number | null
  durationOptions?: {
    id?: string | null
    months: number
    price: number
    originalPrice?: number | null
    discount?: number | null
    savePerMonth?: number | null
    totalProperties?: number | null
  }[]
  totalProperties: number
  durationDays: number
  propertyDurationDays: number
  postType?: PostType | null
  isBestSeller?: boolean | null
  isActive?: boolean | null
  sort?: number | null
  features?: { id?: string | null; feature?: string | null }[]
  bonusVouchers?: {
    id?: string | null
    quantity?: number | null
    discountValue?: number | null
    appliedFor?: string | null
  }[]
}

const POST_TYPE_CONFIG: Record<PostType, { label: string; bg: string; text: string }> = {
  normal: { label: 'Tin thường', bg: 'bg-sky-100', text: 'text-sky-700' },
  silver: { label: 'VIP Bạc', bg: 'bg-slate-200', text: 'text-slate-700' },
  gold: { label: 'VIP Vàng', bg: 'bg-amber-100', text: 'text-amber-700' },
  diamond: { label: 'VIP Kim cương', bg: 'bg-cyan-100', text: 'text-cyan-700' },
}

const appliedForLabel = (v?: string | null) =>
  POST_TYPE_CONFIG[(v as PostType) ?? 'normal']?.label ?? v ?? '-'

function PackageCard({
  pkg,
  onEdit,
}: {
  pkg: PackageItem
  onEdit: (pkg: PackageItem) => void
}) {
  const [pending, startTransition] = useTransition()
  const postTypeCfg = POST_TYPE_CONFIG[pkg.postType ?? 'normal']

  const handleToggle = () => {
    startTransition(() => togglePackageActive(pkg.id, !pkg.isActive))
  }

  const discount =
    pkg.originalPrice && pkg.originalPrice > pkg.price
      ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)
      : null

  return (
    <div
      className={`bg-white rounded-xl border-2 relative overflow-hidden flex flex-col transition-all ${
        !pkg.isActive
          ? 'opacity-55 border-slate-100'
          : pkg.isBestSeller
            ? 'border-amber-300'
            : 'border-slate-200'
      }`}
    >
      {pkg.isBestSeller && (
        <div className="absolute top-3 -right-8 bg-amber-400 text-white text-[10px] font-bold px-10 py-0.5 rotate-45">
          BÁN CHẠY
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2 pr-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base leading-tight">{pkg.name}</h3>
            {pkg.subtitle && <p className="text-xs text-slate-500 mt-0.5">{pkg.subtitle}</p>}
          </div>
          <span
            className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${postTypeCfg.bg} ${postTypeCfg.text}`}
          >
            {postTypeCfg.label}
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-amber-600">{formatVND(pkg.price)}</span>
          {pkg.originalPrice && pkg.originalPrice > pkg.price && (
            <>
              <span className="text-sm text-slate-400 line-through">{formatVND(pkg.originalPrice)}</span>
              <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">
                -{discount}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-3 grid grid-cols-3 gap-2 border-b border-slate-100">
        <div className="text-center bg-slate-50 rounded-lg py-2">
          <div className="text-lg font-bold text-slate-800">{pkg.totalProperties}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">lượt đăng</div>
        </div>
        <div className="text-center bg-slate-50 rounded-lg py-2">
          <div className="text-lg font-bold text-slate-800">{pkg.durationDays}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">ngày gói</div>
        </div>
        <div className="text-center bg-slate-50 rounded-lg py-2">
          <div className="text-lg font-bold text-slate-800">{pkg.propertyDurationDays}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">ngày/tin</div>
        </div>
      </div>

      {/* Duration options */}
      {pkg.durationOptions && pkg.durationOptions.length > 0 && (
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Tuỳ chọn thời hạn
          </p>
          <div className="flex flex-wrap gap-1.5">
            {pkg.durationOptions.map((opt, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center">
                <div className="font-semibold text-slate-700">{opt.months} tháng</div>
                <div className="text-amber-600 font-bold">{formatVND(opt.price)}</div>
                {opt.discount ? (
                  <div className="text-rose-500 text-[10px]">-{opt.discount}%</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      {pkg.features && pkg.features.length > 0 && (
        <div className="px-5 py-3 border-b border-slate-100 flex-1">
          <ul className="space-y-1.5">
            {pkg.features.slice(0, 4).map((f, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                <span className="material-symbols-outlined text-emerald-500 text-[14px] mt-px shrink-0">
                  check_circle
                </span>
                <span>{f.feature}</span>
              </li>
            ))}
            {pkg.features.length > 4 && (
              <li className="text-xs text-slate-400 pl-5">+{pkg.features.length - 4} tính năng khác</li>
            )}
          </ul>
        </div>
      )}

      {/* Bonus vouchers */}
      {pkg.bonusVouchers && pkg.bonusVouchers.length > 0 && (
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="bg-amber-50 rounded-lg p-2.5">
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">redeem</span>
              Voucher tặng kèm
            </div>
            <ul className="space-y-1">
              {pkg.bonusVouchers.map((v, i) => (
                <li key={i} className="text-xs text-amber-700">
                  {v.quantity}x giảm{' '}
                  <span className="font-semibold">{formatVND(v.discountValue ?? 0)}</span>{' '}
                  <span className="text-amber-500">({appliedForLabel(v.appliedFor)})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-3 flex items-center justify-between gap-2 mt-auto">
        <button
          onClick={handleToggle}
          disabled={pending}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-60 ${
            pkg.isActive
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">
            {pending ? 'hourglass_empty' : pkg.isActive ? 'toggle_on' : 'toggle_off'}
          </span>
          {pkg.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">#{pkg.sort ?? 0}</span>
          <button
            onClick={() => onEdit(pkg)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PackagesSection({ packages }: { packages: PackageItem[] }) {
  const [drawerPkg, setDrawerPkg] = useState<PackageItem | null | 'new'>(null)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500">workspace_premium</span>
          Gói đăng tin
          <span className="ml-1 text-sm font-normal text-slate-400">({packages.length} gói)</span>
        </h2>
        <button
          onClick={() => setDrawerPkg('new')}
          className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          Thêm gói mới
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <span className="material-symbols-outlined text-slate-300 text-[48px]">workspace_premium</span>
          <p className="mt-2 text-sm text-slate-400">
            Chưa có gói nào.{' '}
            <button
              onClick={() => setDrawerPkg('new')}
              className="text-amber-500 hover:underline"
            >
              Thêm gói đầu tiên
            </button>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} onEdit={setDrawerPkg} />
          ))}
        </div>
      )}

      {drawerPkg !== null && (
        <PackageFormDrawer
          pkg={drawerPkg === 'new' ? null : drawerPkg}
          onClose={() => setDrawerPkg(null)}
        />
      )}
    </section>
  )
}
