import { getPayload } from 'payload'
import config from '@/payload.config'

import PackagesSection from './components/PackagesSection'
import PostingPricesSection from './components/PostingPricesSection'

export const dynamic = 'force-dynamic'

export default async function GoiPage() {
  const payload = await getPayload({ config: await config })

  const [packagesResult, postingPricesResult] = await Promise.all([
    payload.find({
      collection: 'packages',
      sort: 'sort',
      limit: 100,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'posting-prices',
      sort: 'sort',
      limit: 100,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  const activePackages = packagesResult.docs.filter((p) => p.isActive).length
  const activePrices = postingPricesResult.docs.filter((p) => p.isActive).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gói & Bảng giá</h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý gói đăng tin và bảng giá đăng tin lẻ
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-amber-500 text-[20px]">workspace_premium</span>
            <span className="text-xs text-slate-500">Tổng gói</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{packagesResult.docs.length}</div>
          <div className="text-xs text-emerald-600 mt-0.5">{activePackages} đang hiển thị</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-purple-500 text-[20px]">diamond</span>
            <span className="text-xs text-slate-500">Gói premium</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {packagesResult.docs.filter((p) => p.postType !== 'normal').length}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {packagesResult.docs.filter((p) => p.postType === 'normal').length} gói tin thường
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-slate-500 text-[20px]">receipt_long</span>
            <span className="text-xs text-slate-500">Giá lẻ</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{postingPricesResult.docs.length}</div>
          <div className="text-xs text-emerald-600 mt-0.5">{activePrices} đang hiển thị</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-rose-400 text-[20px]">redeem</span>
            <span className="text-xs text-slate-500">Gói bán chạy</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {packagesResult.docs.filter((p) => p.isBestSeller).length}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">được đánh dấu</div>
        </div>
      </div>

      {/* Packages */}
      <PackagesSection packages={packagesResult.docs as any[]} />

      {/* Posting Prices */}
      <PostingPricesSection postingPrices={postingPricesResult.docs as any[]} />
    </div>
  )
}
