'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import axios from 'axios'

import {
  formatVND,
  formatDateTime,
  listingTypeLabel,
  propertyStatusBadgeClass,
  propertyStatusLabel,
  propertyTypeLabel,
} from '../../../lib/format'

import PropertyDetailDrawer from './PropertyDetailDrawer'
import RejectModal from './RejectModal'

type PropertyItem = {
  id: string | number
  title: string
  status?: string
  listingType?: string
  propertyType?: string
  price?: number
  priceUnit?: string
  area?: number
  address?: string
  images?: { image?: string }[]
  user?: { id?: string | number; fullName?: string; email?: string } | string | number
  rejectionReason?: string
  isVerified?: boolean
  createdAt?: string
}

type Props = {
  items: PropertyItem[]
  page: number
  totalPages: number
  totalDocs: number
}

export default function PropertyApprovalTable({ items, page, totalPages, totalDocs }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [detailId, setDetailId] = useState<string | number | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{ ids: (string | number)[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const allIds = useMemo(() => items.map((i) => String(i.id)), [items])
  const allChecked = selected.size > 0 && allIds.every((id) => selected.has(id))

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const goToPage = (p: number) => {
    const next = new URLSearchParams(sp?.toString() || '')
    next.set('page', String(p))
    router.push(`/quan-tri/tin-dang?${next.toString()}`)
  }

  const approveOne = async (id: string | number) => {
    setBusyId(String(id))
    setError(null)
    try {
      await axios.patch(
        `/api/properties/${id}`,
        {
          status: 'active',
          isVerified: true,
          verifiedAt: new Date().toISOString(),
        },
        { withCredentials: true },
      )
      router.refresh()
    } catch (e: any) {
      setError(e?.response?.data?.errors?.[0]?.message || e.message || 'Lỗi khi duyệt tin')
    } finally {
      setBusyId(null)
    }
  }

  const bulkApprove = async () => {
    if (selected.size === 0) return
    setBulkBusy(true)
    setError(null)
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          axios.patch(
            `/api/properties/${id}`,
            {
              status: 'active',
              isVerified: true,
              verifiedAt: new Date().toISOString(),
            },
            { withCredentials: true },
          ),
        ),
      )
      setSelected(new Set())
      router.refresh()
    } catch (e: any) {
      setError(e?.response?.data?.errors?.[0]?.message || e.message || 'Lỗi khi duyệt hàng loạt')
    } finally {
      setBulkBusy(false)
    }
  }

  const openRejectSingle = (id: string | number) => {
    setRejectTarget({ ids: [id] })
  }

  const openRejectBulk = () => {
    if (selected.size === 0) return
    setRejectTarget({ ids: Array.from(selected) })
  }

  const submitReject = async (reason: string) => {
    if (!rejectTarget) return
    setBulkBusy(true)
    setError(null)
    try {
      await Promise.all(
        rejectTarget.ids.map((id) =>
          axios.patch(
            `/api/properties/${id}`,
            { status: 'rejected', rejectionReason: reason },
            { withCredentials: true },
          ),
        ),
      )
      setRejectTarget(null)
      setSelected(new Set())
      router.refresh()
    } catch (e: any) {
      setError(e?.response?.data?.errors?.[0]?.message || e.message || 'Lỗi khi từ chối tin')
    } finally {
      setBulkBusy(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-12 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
        <p className="mt-2 text-slate-500">Không có tin nào phù hợp bộ lọc</p>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {selected.size > 0 && (
        <div className="sticky top-14 z-10 bg-amber-50 border border-amber-200 rounded-md px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-amber-800">
            Đã chọn <b>{selected.size}</b> tin
          </span>
          <div className="flex gap-2">
            <button
              onClick={bulkApprove}
              disabled={bulkBusy}
              className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              Duyệt đã chọn
            </button>
            <button
              onClick={openRejectBulk}
              disabled={bulkBusy}
              className="px-3 py-1.5 rounded-md bg-rose-600 text-white text-sm hover:bg-rose-700 disabled:opacity-50"
            >
              Từ chối đã chọn
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 text-sm hover:bg-white"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-3 py-3 text-left">Tin đăng</th>
                <th className="px-3 py-3 text-left">Loại</th>
                <th className="px-3 py-3 text-left">Giá</th>
                <th className="px-3 py-3 text-left">Người đăng</th>
                <th className="px-3 py-3 text-left">Trạng thái</th>
                <th className="px-3 py-3 text-left">Thời gian</th>
                <th className="px-3 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((p) => {
                const id = String(p.id)
                const checked = selected.has(id)
                const isBusy = busyId === id
                const user = typeof p.user === 'object' ? p.user : null
                return (
                  <tr key={id} className={checked ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3 max-w-[420px]">
                        <div className="w-14 h-14 rounded-md bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                          {p.images?.[0]?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.images[0].image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined">image</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setDetailId(p.id)}
                            className="font-medium text-slate-800 hover:text-amber-600 text-left line-clamp-1"
                          >
                            {p.title}
                          </button>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {p.address || '-'}
                          </p>
                          {p.area ? (
                            <p className="text-xs text-slate-400 mt-0.5">{p.area} m²</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-slate-700">{propertyTypeLabel(p.propertyType)}</div>
                      <div className="text-xs text-slate-500">{listingTypeLabel(p.listingType)}</div>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-800">
                      {formatVND(p.price)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-slate-700 line-clamp-1">{user?.fullName || '-'}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{user?.email || ''}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${propertyStatusBadgeClass(
                          p.status,
                        )}`}
                      >
                        {propertyStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {formatDateTime(p.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => setDetailId(p.id)}
                          className="px-2 py-1 rounded text-slate-600 hover:bg-slate-100"
                          title="Xem chi tiết"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        {p.status !== 'active' && (
                          <button
                            onClick={() => approveOne(p.id)}
                            disabled={isBusy}
                            className="px-2 py-1 rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                            title="Duyệt"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              check_circle
                            </span>
                          </button>
                        )}
                        {p.status !== 'rejected' && (
                          <button
                            onClick={() => openRejectSingle(p.id)}
                            disabled={isBusy}
                            className="px-2 py-1 rounded text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                            title="Từ chối"
                          >
                            <span className="material-symbols-outlined text-[18px]">block</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
          <span className="text-slate-500">
            Trang {page} / {totalPages} • {totalDocs.toLocaleString('vi-VN')} tin
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

      {detailId !== null && (
        <PropertyDetailDrawer
          propertyId={detailId}
          onClose={() => setDetailId(null)}
          onApprove={async () => {
            await approveOne(detailId)
            setDetailId(null)
          }}
          onReject={() => {
            setRejectTarget({ ids: [detailId] })
            setDetailId(null)
          }}
        />
      )}

      {rejectTarget && (
        <RejectModal
          count={rejectTarget.ids.length}
          busy={bulkBusy}
          onSubmit={submitReject}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </>
  )
}