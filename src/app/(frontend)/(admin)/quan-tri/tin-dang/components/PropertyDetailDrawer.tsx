'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

import {
  formatVND,
  formatDateTime,
  propertyStatusBadgeClass,
  propertyStatusLabel,
  propertyTypeLabel,
} from '../../../lib/format'

type Props = {
  propertyId: string | number
  onClose: () => void
  onApprove: () => void | Promise<void>
  onReject: () => void
}

type Property = {
  id: string | number
  title: string
  description?: string
  status?: string
  propertyType?: string
  postType?: string
  price?: number
  priceUnit?: string
  area?: number
  bedrooms?: number
  bathrooms?: number
  roadWidth?: number
  facadeWidth?: number
  direction?: string
  legalStatus?: string
  furnitureStatus?: string
  address?: string
  street?: string
  latitude?: number
  longitude?: number
  images?: { image?: string }[]
  videoUrl?: string
  user?: { id?: string | number; fullName?: string; email?: string; phone?: string } | string | number
  project?: { id?: string | number; name?: string } | string | number
  isVerified?: boolean
  rejectionReason?: string
  createdAt?: string
  updatedAt?: string
}

export default function PropertyDetailDrawer({
  propertyId,
  onClose,
  onApprove,
  onReject,
}: Props) {
  const [data, setData] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    axios
      .get(`/api/properties/${propertyId}?depth=2`, { withCredentials: true })
      .then((res) => {
        if (cancelled) return
        setData(res.data)
        setError(null)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e?.message || 'Không tải được tin đăng')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [propertyId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleApprove = async () => {
    setBusy(true)
    try {
      await onApprove()
    } finally {
      setBusy(false)
    }
  }

  const user = typeof data?.user === 'object' ? data?.user : null
  const project = typeof data?.project === 'object' ? data?.project : null

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-slate-900/40" />
      <aside
        className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-100"
              title="Đóng"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h2 className="font-semibold text-slate-800">Chi tiết tin đăng</h2>
          </div>
          {data && (
            <a
              href={`/properties/${data.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-slate-500 hover:text-amber-600 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              Xem trang public
            </a>
          )}
        </header>

        <div className="p-5">
          {loading && <p className="text-slate-500 text-sm">Đang tải...</p>}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}
          {data && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${propertyStatusBadgeClass(
                      data.status,
                    )}`}
                  >
                    {propertyStatusLabel(data.status)}
                  </span>
                  {data.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      Đã xác thực
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-slate-900">{data.title}</h1>
                <p className="text-sm text-slate-500 mt-1">{data.address || '-'}</p>
              </div>

              {data.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 rounded-md px-3 py-2 text-sm text-rose-700">
                  <div className="font-medium">Lý do từ chối:</div>
                  <div>{data.rejectionReason}</div>
                </div>
              )}

              {Array.isArray(data.images) && data.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {data.images.slice(0, 9).map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={img.image}
                      alt=""
                      className="w-full h-24 object-cover rounded-md bg-slate-100"
                    />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Loại tin" value="Bán" />
                <Info label="Loại BĐS" value={propertyTypeLabel(data.propertyType)} />
                <Info label="Giá" value={<b>{formatVND(data.price)}</b>} />
                <Info label="Diện tích" value={data.area ? `${data.area} m²` : '-'} />
                <Info label="Phòng ngủ" value={data.bedrooms ?? '-'} />
                <Info label="Phòng tắm" value={data.bathrooms ?? '-'} />
                <Info
                  label="Mặt tiền / Đường"
                  value={`${data.facadeWidth || '-'}m / ${data.roadWidth || '-'}m`}
                />
                <Info label="Hướng" value={data.direction || '-'} />
                <Info label="Pháp lý" value={data.legalStatus || '-'} />
                <Info label="Nội thất" value={data.furnitureStatus || '-'} />
              </div>

              {data.description && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">Mô tả</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{data.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 rounded-md p-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Người đăng</p>
                  <p className="font-medium">{user?.fullName || '-'}</p>
                  <p className="text-xs text-slate-500">{user?.email || ''}</p>
                  {user?.phone && <p className="text-xs text-slate-500">{user.phone}</p>}
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Dự án</p>
                  <p className="font-medium">{project?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Ngày tạo</p>
                  <p className="text-slate-700">{formatDateTime(data.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Cập nhật</p>
                  <p className="text-slate-700">{formatDateTime(data.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {data && (
          <footer className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Đóng
            </button>
            {data.status !== 'rejected' && (
              <button
                onClick={onReject}
                className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700"
              >
                Từ chối
              </button>
            )}
            {data.status !== 'active' && (
              <button
                onClick={handleApprove}
                disabled={busy}
                className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? 'Đang duyệt...' : 'Duyệt tin'}
              </button>
            )}
          </footer>
        )}
      </aside>
    </div>
  )
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-800">{value}</p>
    </div>
  )
}
