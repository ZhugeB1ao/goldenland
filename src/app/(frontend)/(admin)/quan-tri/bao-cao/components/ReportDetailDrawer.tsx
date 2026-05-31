'use client'

import { useEffect, useRef, useTransition, useState } from 'react'
import { reportReasonLabel } from '../../../lib/format'
import { updateReportStatus, type ReportStatus } from '../actions'

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
  report: ReportItem
  onClose: () => void
  onUpdated: () => void
}

const statusLabels: Record<string, string> = {
  pending: 'Chờ xử lý',
  reviewing: 'Đang xem xét',
  resolved: 'Đã xử lý',
  dismissed: 'Bỏ qua',
}

function statusBadge(status?: string) {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-700'
    case 'reviewing': return 'bg-blue-100 text-blue-700'
    case 'resolved': return 'bg-emerald-100 text-emerald-700'
    case 'dismissed': return 'bg-slate-100 text-slate-500'
    default: return 'bg-slate-100 text-slate-500'
  }
}

export default function ReportDetailDrawer({ report, onClose, onUpdated }: Props) {
  const [isPending, startTransition] = useTransition()
  const [adminNote, setAdminNote] = useState(report.adminNote || '')
  const [error, setError] = useState<string | null>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const property = typeof report.property === 'object' ? report.property : null
  const reporter = typeof report.reporter === 'object' ? report.reporter : null

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleStatus = (status: ReportStatus) => {
    setError(null)
    startTransition(async () => {
      try {
        await updateReportStatus(report.id, status, adminNote || undefined)
        onUpdated()
      } catch (e: any) {
        setError(e?.message || 'Lỗi khi cập nhật')
      }
    })
  }

  const canReview = report.status === 'pending'
  const canResolve = report.status !== 'resolved'
  const canDismiss = report.status !== 'dismissed'

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500">flag</span>
            <h2 className="font-semibold text-slate-900">Chi tiết báo cáo</h2>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(report.status)}`}>
              {statusLabels[report.status ?? ''] ?? report.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-500"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-2 rounded-md">
              {error}
            </div>
          )}

          {/* Reason */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Lý do báo cáo</p>
            <p className="text-slate-900 font-medium">{reportReasonLabel(report.reason)}</p>
            {report.detail && (
              <p className="mt-1 text-sm text-slate-600 bg-slate-50 rounded-md px-3 py-2">{report.detail}</p>
            )}
          </div>

          {/* Property */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Tin bị báo cáo</p>
            {property ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {property.images?.[0]?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={property.images[0].image}
                    alt=""
                    className="w-full h-36 object-cover"
                  />
                )}
                <div className="p-3">
                  <p className="font-medium text-slate-800">{property.title}</p>
                  {property.address && (
                    <p className="text-xs text-slate-500 mt-0.5">{property.address}</p>
                  )}
                  <a
                    href={`/ban-bat-dong-san/${property.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-600 hover:underline mt-2"
                  >
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    Xem tin đăng
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Tin đăng đã bị xóa</p>
            )}
          </div>

          {/* Reporter */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Người báo cáo</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                <span className="material-symbols-outlined text-[16px]">person</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{reporter?.fullName || 'Ẩn danh'}</p>
                <p className="text-xs text-slate-500">{reporter?.email || '-'}</p>
              </div>
            </div>
          </div>

          {/* Admin note */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Ghi chú xử lý
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder="Nhập ghi chú xử lý (tuỳ chọn)..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-200 px-5 py-4 flex flex-wrap gap-2">
          {canReview && (
            <button
              onClick={() => handleStatus('reviewing')}
              disabled={isPending}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Đang xử lý...' : 'Đánh dấu đang xem xét'}
            </button>
          )}
          {canResolve && (
            <button
              onClick={() => handleStatus('resolved')}
              disabled={isPending}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Đang xử lý...' : 'Đã xử lý'}
            </button>
          )}
          {canDismiss && (
            <button
              onClick={() => handleStatus('dismissed')}
              disabled={isPending}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {isPending ? '...' : 'Bỏ qua'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
