import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'

import KpiCard from '../components/KpiCard'
import { loadDashboardStats } from './lib/stats'
import {
  formatCompactVND,
  formatVND,
  propertyTypeLabel,
  reportReasonLabel,
  relativeTime,
} from '../lib/format'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const payload = await getPayload({ config: await config })
  const stats = await loadDashboardStats(payload)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tổng quan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tình hình hoạt động của Golden Land hôm nay
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon="fact_check"
          tone="warning"
          label="Tin chờ duyệt"
          value={stats.counts.pendingProperties}
          hint="Cần xử lý"
          href="/quan-tri/tin-dang?status=pending"
        />
        <KpiCard
          icon="check_circle"
          tone="success"
          label="Tin đang hiển thị"
          value={stats.counts.activeProperties}
          href="/quan-tri/tin-dang?status=active"
        />
        <KpiCard
          icon="flag"
          tone="danger"
          label="Báo cáo chờ xử lý"
          value={stats.counts.pendingReports}
          href="/quan-tri/bao-cao"
        />
        <KpiCard
          icon="person_add"
          tone="info"
          label="User mới hôm nay"
          value={stats.counts.newUsersToday}
          hint={`Tổng ${stats.counts.totalUsers.toLocaleString('vi-VN')} user`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon="payments"
          tone="success"
          label="Doanh thu hôm nay"
          value={formatCompactVND(stats.revenue.today)}
          hint={`${stats.counts.ordersToday} đơn paid`}
        />
        <KpiCard
          icon="trending_up"
          tone="info"
          label="Doanh thu 7 ngày"
          value={formatCompactVND(stats.revenue.last7Days)}
        />
        <KpiCard
          icon="calendar_month"
          tone="default"
          label="Doanh thu 30 ngày"
          value={formatCompactVND(stats.revenue.last30Days)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Tin chờ duyệt mới nhất</h2>
            <Link
              href="/quan-tri/tin-dang?status=pending"
              className="text-sm text-amber-600 hover:underline"
            >
              Xem tất cả
            </Link>
          </div>
          {stats.latestPendingProperties.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              Không có tin nào đang chờ duyệt
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.latestPendingProperties.map((p: any) => (
                <li key={p.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                    {p.images?.[0]?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[20px]">image</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/quan-tri/tin-dang/${p.id}`}
                      className="font-medium text-slate-800 hover:text-amber-600 line-clamp-1 block"
                    >
                      {p.title}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{propertyTypeLabel(p.propertyType)}</span>
                      <span>•</span>
                      <span>Bán</span>
                      <span>•</span>
                      <span className="font-medium text-slate-700">{formatVND(p.price)}</span>
                      <span>•</span>
                      <span>{relativeTime(p.createdAt)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Báo cáo mới nhất</h2>
            <Link href="/quan-tri/bao-cao" className="text-sm text-amber-600 hover:underline">
              Xem tất cả
            </Link>
          </div>
          {stats.latestPendingReports.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              Không có báo cáo nào đang chờ xử lý
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.latestPendingReports.map((r: any) => {
                const property = typeof r.property === 'object' ? r.property : null
                return (
                  <li key={r.id} className="px-5 py-3">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-rose-500 text-[20px]">
                        flag
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm">
                          {reportReasonLabel(r.reason)}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          Tin:{' '}
                          {property?.title || (
                            <span className="text-slate-400">đã xoá</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {relativeTime(r.createdAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
