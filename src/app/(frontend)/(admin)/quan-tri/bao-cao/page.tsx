import { getPayload } from 'payload'
import config from '@/payload.config'

import ReportsTable from './components/ReportsTable'

export const dynamic = 'force-dynamic'

const STATUS_OPTIONS = ['pending', 'reviewing', 'resolved', 'dismissed'] as const
const REASON_OPTIONS = ['scam', 'wrong_info', 'duplicate', 'wrong_image', 'sold_not_removed', 'other'] as const

type SearchParams = Record<string, string | string[] | undefined>

function pickStr(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v
}

const statusLabels: Record<string, string> = {
  pending: 'Chờ xử lý',
  reviewing: 'Đang xem xét',
  resolved: 'Đã xử lý',
  dismissed: 'Bỏ qua',
}

export default async function BaoCaoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const status = pickStr(sp.status) || 'pending'
  const reason = pickStr(sp.reason)
  const page = Math.max(1, parseInt(pickStr(sp.page) || '1', 10))
  const limit = 20

  const payload = await getPayload({ config: await config })

  const whereAnd: any[] = []
  if (STATUS_OPTIONS.includes(status as any)) {
    whereAnd.push({ status: { equals: status } })
  }
  if (reason && REASON_OPTIONS.includes(reason as any)) {
    whereAnd.push({ reason: { equals: reason } })
  }

  const result = await payload.find({
    collection: 'reports',
    where: whereAnd.length ? { and: whereAnd } : {},
    sort: '-createdAt',
    page,
    limit,
    depth: 2,
    overrideAccess: true,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Báo cáo vi phạm</h1>
        <p className="text-sm text-slate-500 mt-1">
          {result.totalDocs.toLocaleString('vi-VN')} báo cáo • {statusLabels[status] ?? status}
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['pending', 'reviewing', 'resolved', 'dismissed'] as const).map((s) => {
          const active = status === s
          const params = new URLSearchParams()
          params.set('status', s)
          if (reason) params.set('reason', reason)
          return (
            <a
              key={s}
              href={`/quan-tri/bao-cao?${params.toString()}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {statusLabels[s]}
            </a>
          )
        })}
      </div>

      <ReportsTable
        items={result.docs as any[]}
        page={result.page ?? 1}
        totalPages={result.totalPages}
        totalDocs={result.totalDocs}
        currentStatus={status}
        currentReason={reason}
      />
    </div>
  )
}