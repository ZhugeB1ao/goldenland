'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { formatDateTime, relativeTime, reportReasonLabel } from '../../../lib/format'
import ReportDetailDrawer from './ReportDetailDrawer'
import type { ReportStatus } from '../actions'

type ReportItem = {
  id: string | number
  reason?: string
  detail?: string
  status?: string
  adminNote?: string
  createdAt?: string
  property?: { id?: string | number; title?: string; address?: string; images?: any[] } | null
  reporter?: { id?: string | number; fullName?: string; email?: string } | null
}

type Props = {
  items: ReportItem[]
  page: number
  totalPages: number
  totalDocs: number
  currentStatus: string
  currentReason?: string
}

const reasonOptions = [
  { value: '', label: 'Tất cả lý do' },
  { value: 'scam', label: 'Tin giả / Lừa đảo' },
  { value: 'wrong_info', label: 'Sai thông tin' },
  { value: 'duplicate', label: 'Trùng lặp' },
  { value: 'wrong_image', label: 'Ảnh không đúng' },
  { value: 'sold_not_removed', label: 'Đã bán chưa gỡ' },
  { value: 'other', label: 'Khác' },
]

function statusBadge(status?: string) {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-700'
    case 'reviewing':
      return 'bg-blue-100 text-blue-700'
    case 'resolved':
      return 'bg-emerald-100 text-emerald-700'
    case 'dismissed':
      return 'bg-slate-100 text-slate-500'
    default:
      return 'bg-slate-100 text-slate-500'
  }
}

const statusLabels: Record<string, string> = {
  pending: 'Chờ xử lý',
  reviewing: 'Đang xem xét',
  resolved: 'Đã xử lý',
  dismissed: 'Bỏ qua',
}

const actionFeedback: Record<ReportStatus, { msg: string; tab: ReportStatus; icon: string; color: string }> = {
  reviewing: { msg: 'Đã chuyển sang Đang xem xét', tab: 'reviewing', icon: 'schedule', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  resolved:  { msg: 'Đã xử lý xong', tab: 'resolved',  icon: 'check_circle', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  dismissed: { msg: 'Đã bỏ qua báo cáo', tab: 'dismissed', icon: 'do_not_disturb', color: 'bg-slate-50 border-slate-200 text-slate-700' },
  pending:   { msg: '', tab: 'pending', icon: '', color: '' },
}

const reasonBadge: Record<string, string> = {
  scam: 'bg-rose-100 text-rose-700',
  wrong_info: 'bg-orange-100 text-orange-700',
  duplicate: 'bg-purple-100 text-purple-700',
  wrong_image: 'bg-yellow-100 text-yellow-700',
  sold_not_removed: 'bg-slate-100 text-slate-600',
  other: 'bg-slate-100 text-slate-500',
}

export default function ReportsTable({
  items, page, totalPages, totalDocs, currentStatus, currentReason,
}: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [detailId, setDetailId] = useState<string | number | null>(null)
  const [lastAction, setLastAction] = useState<ReportStatus | null>(null)

  const detailItem = detailId !== null ? items.find((i) => String(i.id) === String(detailId)) ?? null : null

  useEffect(() => {
    if (!lastAction) return
    const t = setTimeout(() => setLastAction(null), 5000)
    return () => clearTimeout(t)
  }, [lastAction])

  const goToPage = (p: number) => {
    const next = new URLSearchParams(sp?.toString() || '')
    next.set('page', String(p))
    router.push(`/quan-tri/bao-cao?${next.toString()}`)
  }

  const handleReasonChange = (reason: string) => {
    const next = new URLSearchParams()
    next.set('status', currentStatus)
    if (reason) next.set('reason', reason)
    router.push(`/quan-tri/bao-cao?${next.toString()}`)
  }

  const feedback = lastAction && lastAction !== 'pending' ? actionFeedback[lastAction] : null

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        {feedback && (
          <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm ${feedback.color}`}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">{feedback.icon}</span>
              <span>{feedback.msg} — Xem tại tab</span>
              <a href={`/quan-tri/bao-cao?status=${feedback.tab}`} className="font-semibold underline underline-offset-2">
                {statusLabels[feedback.tab]}
              </a>
            </div>
            <button onClick={() => setLastAction(null)} className="opacity-60 hover:opacity-100">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <select
            value={currentReason || ''}
            onChange={(e) => handleReasonChange(e.target.value)}
            className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {reasonOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-6 py-16 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300">flag</span>
          <p className="mt-2 text-slate-500">Không có báo cáo nào</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {feedback && (
          <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm ${feedback.color}`}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">{feedback.icon}</span>
              <span>{feedback.msg} — Xem tại tab</span>
              <a href={`/quan-tri/bao-cao?status=${feedback.tab}`} className="font-semibold underline underline-offset-2">
                {statusLabels[feedback.tab]}
              </a>
            </div>
            <button onClick={() => setLastAction(null)} className="opacity-60 hover:opacity-100">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <select
            value={currentReason || ''}
            onChange={(e) => handleReasonChange(e.target.value)}
            className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {reasonOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Lý do</th>
                  <th className="px-4 py-3 text-left">Tin bị báo cáo</th>
                  <th className="px-4 py-3 text-left">Người báo cáo</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Thời gian</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((r) => {
                  const property = typeof r.property === 'object' ? r.property : null
                  const reporter = typeof r.reporter === 'object' ? r.reporter : null
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setDetailId(r.id)}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            reasonBadge[r.reason ?? ''] ?? 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {reportReasonLabel(r.reason)}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[280px]">
                        {property ? (
                          <div>
                            <p className="font-medium text-slate-800 line-clamp-1">{property.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{property.address || '-'}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Tin đã bị xóa</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700 line-clamp-1">{reporter?.fullName || '-'}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{reporter?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(r.status)}`}
                        >
                          {statusLabels[r.status ?? ''] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        <div>{relativeTime(r.createdAt)}</div>
                        <div className="text-slate-400">{formatDateTime(r.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setDetailId(r.id)}
                          className="px-2 py-1 rounded text-slate-600 hover:bg-slate-100"
                          title="Xem chi tiết"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
            <span className="text-slate-500">
              Trang {page} / {totalPages} • {totalDocs.toLocaleString('vi-VN')} báo cáo
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {detailItem && (
        <ReportDetailDrawer
          report={detailItem}
          onClose={() => setDetailId(null)}
          onUpdated={(newStatus) => {
            setDetailId(null)
            setLastAction(newStatus)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
