'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectUser } from '@/app/store/slices/authSlice'
import type { RootState } from '@/app/store'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import {
  deleteManagedProperty,
  fetchManagementDashboard,
  fetchManagementProperties,
  type ManagedProperty,
  type ManagedPropertyStats,
} from '../services/accountManagement'
import { formatLocationByCodes } from '../../(site)/properties/lib/utils'

const STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'active', label: 'Đang hiển thị' },
  { value: 'pending', label: 'Đang đợi' },
  { value: 'draft', label: 'Nháp' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'sold', label: 'Đã bán' },
]

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-yellow-100 text-yellow-700',
  draft: 'bg-gray-100 text-gray-600',
  expired: 'bg-red-100 text-red-600',
  sold: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-600',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Đang hiển thị',
  pending: 'Đang đợi',
  draft: 'Nháp',
  expired: 'Hết hạn',
  sold: 'Đã bán',
  rejected: 'Bị từ chối',
}

const POST_TYPE_BADGE: Record<string, string> = {
  normal: 'bg-zinc-100 text-zinc-700',
  silver: 'bg-teal-100 text-teal-700',
  gold: 'bg-amber-100 text-amber-700',
  diamond: 'bg-red-100 text-red-700',
}

const POST_TYPE_LABEL: Record<string, string> = {
  normal: 'Tin thường',
  silver: 'VIP Bạc',
  gold: 'VIP Vàng',
  diamond: 'VIP Kim Cương',
}

const PRICE_UNIT: Record<string, string> = {
  total: '',
  per_m2: '/m²',
  per_month: '/tháng',
  negotiable: '',
}

function formatPrice(price: number, unit: string): string {
  if (unit === 'negotiable') return 'Thỏa thuận'
  if (price >= 1_000_000_000)
    return `${(price / 1_000_000_000).toFixed(2)} tỷ${PRICE_UNIT[unit] || ''}`
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)} triệu${PRICE_UNIT[unit] || ''}`
  return `${price.toLocaleString('vi-VN')} đ`
}

function formatNumber(value: number): string {
  return value.toLocaleString('vi-VN')
}

function formatManagementLocation(property: ManagedProperty): string {
  return formatLocationByCodes({
    provinceCode: property.provinceCode,
    wardCode: property.wardCode,
    street: property.street,
  })
}

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string
  value: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-left transition ${
        active
          ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
          : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300'
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-bold">{formatNumber(value)}</p>
    </button>
  )
}

function ManagementInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useSelector((state: RootState) => selectUser(state))
  const userId = user?.id

  const [properties, setProperties] = useState<ManagedProperty[]>([])
  const [stats, setStats] = useState<ManagedPropertyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [activeStatus, setActiveStatus] = useState('')
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [balance, setBalance] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)
  const justPosted = searchParams.get('posted') === '1'
  const totalPosts = stats?.total || 0
  const shouldShowPromotionSidebar = !loading && totalPosts === 0

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const refreshDashboard = useCallback(async () => {
    try {
      const data = await fetchManagementDashboard()
      setStats(data.stats)
      setBalance(data.balance)
    } catch {}
  }, [])

  const refreshAll = useCallback(() => {
    void refreshDashboard()
    setRefreshToken((prev) => prev + 1)
  }, [refreshDashboard])

  useEffect(() => {
    refreshAll()
  }, [refreshAll, userId])

  useEffect(() => {
    if (!justPosted) return
    refreshAll()
  }, [justPosted, refreshAll])

  useEffect(() => {
    const handleFocus = () => refreshAll()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshAll()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refreshAll])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!userId) {
        if (cancelled) return
        setProperties([])
        setTotalPages(1)
        setLoading(false)
        return
      }

      if (!cancelled) setLoading(true)
      try {
        const data = await fetchManagementProperties({
          userId,
          status: activeStatus,
          page,
        })

        if (cancelled) return
        setProperties(data.properties)
        setTotalPages(data.totalPages)
      } catch {
        if (!cancelled) {
          setProperties([])
          setTotalPages(1)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [activeStatus, page, userId, refreshToken])

  const handleStatusTab = (status: string) => {
    setActiveStatus(status)
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa tin này không?')) return
    setDeletingId(id)
    try {
      await deleteManagedProperty(id)
      setProperties((prev) => prev.filter((p) => p.id !== id))
      await refreshDashboard()
    } catch {}
    setDeletingId(null)
  }

  const accountName = isMounted ? user?.fullName || user?.email || 'Khách hàng' : 'Khách hàng'
  const avatarInitial = String(accountName).trim().charAt(0).toUpperCase() || 'G'

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-3 py-6 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-zinc-200 bg-zinc-50/70 p-4 sm:p-6">
        <section className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Golden Land
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
              Quản lý tin đăng
            </h1>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Ví tiền
              </p>
              <p className="text-lg font-bold text-zinc-900">{formatNumber(balance)} đ</p>
            </div>
            <Link
              href="/account/top-up"
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Nạp tiền
            </Link>
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
                {avatarInitial}
              </div>
              <div className="pr-1">
                <p className="text-xs text-zinc-500">Tài khoản</p>
                <p className="max-w-[140px] truncate text-sm font-semibold text-zinc-900">
                  {accountName}
                </p>
              </div>
            </div>
          </div>
        </section>

        {justPosted && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span>Tin đăng của bạn đã được gửi, đang chờ kiểm duyệt.</span>
            <button
              type="button"
              onClick={() => router.replace('/account/management')}
              className="ml-4 text-xl leading-none text-emerald-500 hover:text-emerald-700"
            >
              ×
            </button>
          </div>
        )}

        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Tất cả"
            value={stats?.total || 0}
            active={activeStatus === ''}
            onClick={() => handleStatusTab('')}
          />
          <StatCard
            label="Đang hiển thị"
            value={stats?.active || 0}
            active={activeStatus === 'active'}
            onClick={() => handleStatusTab('active')}
          />
          <StatCard
            label="Đang đợi"
            value={stats?.pending || 0}
            active={activeStatus === 'pending'}
            onClick={() => handleStatusTab('pending')}
          />
          <StatCard
            label="Nháp"
            value={stats?.drafts || 0}
            active={activeStatus === 'draft'}
            onClick={() => handleStatusTab('draft')}
          />
          <StatCard
            label="Hết hạn"
            value={stats?.expired || 0}
            active={activeStatus === 'expired'}
            onClick={() => handleStatusTab('expired')}
          />
          <StatCard
            label="Đã bán"
            value={stats?.sold || 0}
            active={activeStatus === 'sold'}
            onClick={() => handleStatusTab('sold')}
          />
        </section>

        <section
          className={`grid grid-cols-1 gap-6 ${shouldShowPromotionSidebar ? 'xl:grid-cols-12' : ''}`}
        >
          <div className={shouldShowPromotionSidebar ? 'xl:col-span-8' : ''}>
            {/* <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2 overflow-x-auto">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => handleStatusTab(tab.value)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeStatus === tab.value
                        ? 'bg-zinc-900 text-white'
                        : 'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <Link
                href="/dang-tin"
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Đăng tin mới
              </Link>
            </div> */}

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex gap-4">
                      <div className="h-24 w-28 flex-shrink-0 rounded-xl bg-zinc-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-zinc-200" />
                        <div className="h-3 w-1/2 rounded bg-zinc-200" />
                        <div className="h-3 w-1/4 rounded bg-zinc-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-zinc-500">
                <p className="text-lg font-semibold text-zinc-700">Chưa có tin đăng nào</p>
                <Link
                  href="/dang-tin"
                  className="mt-3 inline-block text-sm font-medium text-red-600 hover:underline"
                >
                  Đăng tin ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="relative h-24 w-full overflow-hidden rounded-xl bg-zinc-100 sm:w-32">
                        {p.images?.[0]?.image ? (
                          <Image
                            src={p.images[0].image}
                            alt={p.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 128px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                          <h3 className="line-clamp-2 text-base font-semibold text-zinc-900">
                            {p.title}
                          </h3>
                          <div className="flex flex-wrap gap-1.5 sm:justify-end">
                            {p.postType ? (
                              <span
                                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${POST_TYPE_BADGE[p.postType] || 'bg-zinc-100 text-zinc-600'}`}
                              >
                                {POST_TYPE_LABEL[p.postType] || p.postType}
                              </span>
                            ) : null}
                            <span
                              className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[p.status] || 'bg-zinc-100 text-zinc-600'}`}
                            >
                              {STATUS_LABEL[p.status] || p.status}
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 text-sm font-bold text-red-600">
                          {formatPrice(p.price, p.priceUnit)}
                        </p>
                        <p className="mt-1 truncate text-sm text-zinc-500">
                          {formatManagementLocation(p)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === p.id ? '...' : 'Xóa'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPage(i + 1)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                      page === i + 1
                        ? 'bg-zinc-900 text-white'
                        : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {shouldShowPromotionSidebar ? (
            <aside className="space-y-4 xl:col-span-4">
              <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-red-50 p-6">
                <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-red-100 blur-2xl" />
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500">
                    Golden Land
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-zinc-900">Quà tặng khách hàng mới</h2>
                  <p className="mt-3 rounded-xl border border-red-100 bg-white p-3 text-sm text-zinc-700">
                    Miễn phí 1 tin thường 15 ngày cho khách hàng mới.
                  </p>
                  <p className="mt-3 text-sm text-zinc-600">
                    Tin đăng của bạn sẽ tiếp cận hàng triệu người mua/thuê bất động sản mỗi tháng.
                  </p>
                  <div className="mt-5 space-y-2">
                    <Link
                      href="/dang-tin"
                      className="block rounded-full bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      Đăng tin ngay
                    </Link>
                    <button
                      type="button"
                      className="w-full text-center text-sm font-medium text-red-600 hover:underline"
                    >
                      Xem tất cả khuyến mãi
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          ) : null}
        </section>
      </div>
    </div>
  )
}

export default function ManagementPage() {
  return (
    <Suspense>
      <ManagementInner />
    </Suspense>
  )
}
