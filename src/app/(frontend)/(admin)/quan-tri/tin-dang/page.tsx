import { getPayload } from 'payload'
import config from '@/payload.config'

import PropertyApprovalTable from './components/PropertyApprovalTable'
import PropertyFilterBar from './components/PropertyFilterBar'

export const dynamic = 'force-dynamic'

const STATUS_OPTIONS = ['pending', 'active', 'rejected', 'draft', 'expired', 'sold'] as const
type Status = (typeof STATUS_OPTIONS)[number]

const PROPERTY_TYPE_OPTIONS = [
  'house',
  'apartment',
  'land',
  'villa',
  'townhouse',
  'shophouse',
  'penthouse',
  'condotel',
  'warehouse',
  'commercial',
] as const

type SearchParams = Record<string, string | string[] | undefined>

function pickStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

export default async function PropertiesApprovalPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams

  const status = (pickStr(sp.status) as Status) || 'pending'
  const propertyType = pickStr(sp.propertyType)
  const q = pickStr(sp.q)?.trim()
  const page = Math.max(1, parseInt(pickStr(sp.page) || '1', 10))
  const limit = 20

  const payload = await getPayload({ config: await config })

  const whereAnd: any[] = []
  if (STATUS_OPTIONS.includes(status as Status)) {
    whereAnd.push({ status: { equals: status } })
  }
  if (propertyType && PROPERTY_TYPE_OPTIONS.includes(propertyType as any)) {
    whereAnd.push({ propertyType: { equals: propertyType } })
  }
  if (q) {
    whereAnd.push({
      or: [
        { title: { like: q } },
        { address: { like: q } },
      ],
    })
  }

  const result = await payload.find({
    collection: 'properties',
    where: whereAnd.length ? { and: whereAnd } : {},
    sort: '-createdAt',
    page,
    limit,
    depth: 1,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Duyệt tin đăng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng {result.totalDocs.toLocaleString('vi-VN')} tin theo bộ lọc hiện tại
          </p>
        </div>
      </div>

      <PropertyFilterBar
        status={status}
        propertyType={propertyType}
        q={q}
      />

      <PropertyApprovalTable
        items={result.docs as any[]}
        page={result.page || 1}
        totalPages={result.totalPages}
        totalDocs={result.totalDocs}
      />
    </div>
  )
}
