'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, CheckCircle2, Clock3, Loader2 } from 'lucide-react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import { selectUser } from '@/app/store/slices/authSlice'
import type { PostDraft } from './postFlowTypes'

type PostPopUp3Props = {
  draft: PostDraft
  onBack: () => void
  onClose: () => void
}

const MIN_IMAGES = 3
type PostType = 'normal' | 'silver' | 'gold' | 'diamond'

type DurationOption = {
  durationDays: number
  discountPercent: number
  label?: string
}

type VoucherOption = {
  id: number
  code: string
  discountType: 'fixed' | 'percent' | 'free_post'
  discountValue?: number | null
  maxDiscount?: number | null
  expiresAt?: string | null
}

type PostTypeOption = {
  value: PostType
  title: string
  subtitle: string
  multiplier?: string
  recommendedDuration: number
  dailyPrice: number
  durationOptions: DurationOption[]
  price: string
  accent: string
  bars: number
}

type PostingPriceDoc = {
  id: number
  name?: string | null
  description?: string | null
  postType?: PostType | null
  displayMultiplier?: number | null
  dailyPrice?: number | null
  recommendedDurationDays?: number | null
  durationOptions?: Array<{
    durationDays?: number | null
    discountPercent?: number | null
    label?: string | null
  }> | null
}

const VIP_PACKAGE_IDS = new Set(['2', '3'])
const PRICE_FORMATTER = new Intl.NumberFormat('vi-VN')

const formatMoney = (value: number) => PRICE_FORMATTER.format(Math.max(0, Math.round(value)))

const POST_TYPE_STYLES: Record<PostType, Pick<PostTypeOption, 'accent' | 'bars'>> = {
  diamond: { accent: 'bg-red-600 text-red-600', bars: 3 },
  gold: { accent: 'bg-amber-500 text-amber-600', bars: 2 },
  silver: { accent: 'bg-teal-500 text-teal-600', bars: 1 },
  normal: { accent: 'bg-zinc-300 text-zinc-600', bars: 1 },
}

const POST_TYPE_ORDER: Record<PostType, number> = {
  diamond: 0,
  gold: 1,
  silver: 2,
  normal: 3,
}

const mapPostingPriceToPostType = (doc: PostingPriceDoc): PostTypeOption | null => {
  if (!doc.postType) return null

  const style = POST_TYPE_STYLES[doc.postType]
  const dailyPrice = Number(doc.dailyPrice)
  const recommendedDuration = Number(doc.recommendedDurationDays)

  if (!Number.isFinite(dailyPrice) || dailyPrice < 0) return null
  if (!Number.isFinite(recommendedDuration) || recommendedDuration <= 0) return null

  const durationOptions = Array.isArray(doc.durationOptions)
    ? doc.durationOptions
        .map((option): DurationOption | null => {
          const durationDays = Number(option.durationDays)
          if (!Number.isFinite(durationDays) || durationDays <= 0) return null

          return {
            durationDays,
            discountPercent: Math.min(100, Math.max(0, Number(option.discountPercent || 0))),
            label: option.label || undefined,
          }
        })
        .filter((option): option is DurationOption => Boolean(option))
    : []

  if (durationOptions.length === 0) return null

  return {
    value: doc.postType,
    title: doc.name || doc.postType,
    subtitle: doc.description || '',
    multiplier:
      doc.displayMultiplier && doc.displayMultiplier > 1
        ? `X${PRICE_FORMATTER.format(doc.displayMultiplier)}`
        : undefined,
    recommendedDuration,
    dailyPrice,
    durationOptions,
    price: `${formatMoney(dailyPrice)} đ/ngày`,
    accent: style.accent,
    bars: style.bars,
  }
}

const formatVoucherLabel = (voucher: VoucherOption) => {
  if (voucher.discountType === 'fixed') {
    return `Giảm ${formatMoney(voucher.discountValue || 0)} đ`
  }

  if (voucher.discountType === 'percent') {
    const maxDiscount = voucher.maxDiscount ? ` · Tối đa ${formatMoney(voucher.maxDiscount)} đ` : ''
    return `Giảm ${voucher.discountValue || 0}%${maxDiscount}`
  }

  return 'Miễn phí 1 lượt đăng'
}

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getRelationshipID = (value: unknown) => {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }

  return ''
}

const getScheduledDate = (startDate: string, startTime: string, canPickTime: boolean) => {
  const now = new Date()

  if (!startDate) return now

  if (startDate === toDateInputValue(now) && startTime === 'now') {
    return now
  }

  const time = canPickTime && startTime !== 'now' ? startTime : '00:00'
  const scheduled = new Date(`${startDate}T${time}:00`)

  if (Number.isNaN(scheduled.getTime())) return now
  if (scheduled < now) return now

  return scheduled
}

export default function PostPopUp3({ draft, onBack, onClose }: PostPopUp3Props) {
  const router = useRouter()
  const user = useSelector((state: RootState) => selectUser(state))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [postType, setPostType] = useState<PostType | ''>('')
  const [durationDays, setDurationDays] = useState(0)
  const [startDate, setStartDate] = useState(() => toDateInputValue(new Date()))
  const [startTime, setStartTime] = useState('now')
  const [postTypes, setPostTypes] = useState<PostTypeOption[]>([])
  const [pricingLoading, setPricingLoading] = useState(false)
  const [pricingError, setPricingError] = useState('')
  const [fetchedActivePackageID, setFetchedActivePackageID] = useState('')
  const [vouchers, setVouchers] = useState<VoucherOption[]>([])
  const [selectedVoucherId, setSelectedVoucherId] = useState('')
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherError, setVoucherError] = useState('')
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [balanceSnapshot, setBalanceSnapshot] = useState({ required: 0, balance: 0 })

  const userId = (user as { id?: number | string } | null)?.id
  const userPackageID =
    getRelationshipID((user as { package_id?: unknown; packageId?: unknown } | null)?.package_id) ||
    getRelationshipID((user as { package_id?: unknown; packageId?: unknown } | null)?.packageId)

  const activePackageID =
    fetchedActivePackageID ||
    getRelationshipID(
      (user as { activePackage?: unknown; active_package_id?: unknown } | null)?.activePackage,
    ) ||
    getRelationshipID((user as { active_package_id?: unknown } | null)?.active_package_id)
  const isVipPost = Boolean(postType && postType !== 'normal')
  const canScheduleHour =
    isVipPost || VIP_PACKAGE_IDS.has(activePackageID) || VIP_PACKAGE_IDS.has(userPackageID)
  const activePostType = postTypes.find((type) => type.value === postType)
  const recommendedDuration = activePostType?.recommendedDuration || 0
  const baseDailyPrice = activePostType?.dailyPrice ?? 0
  const durationOptions = activePostType?.durationOptions || []
  const durations = durationOptions.map((option) => option.durationDays)
  const selectedDurationOption =
    durationOptions.find((option) => option.durationDays === durationDays) || durationOptions[0]
  const minStartDate = useMemo(() => toDateInputValue(new Date()), [])
  const scheduledDate = getScheduledDate(startDate, startTime, canScheduleHour)
  const endsAt = useMemo(() => {
    const end = new Date(scheduledDate)
    end.setDate(end.getDate() + durationDays)
    return end
  }, [durationDays, scheduledDate])
  const isDurationValid = durations.includes(durationDays)
  const canSubmit =
    Boolean(activePostType) &&
    isDurationValid &&
    draft.images.length >= MIN_IMAGES &&
    !pricingLoading &&
    !submitting

  const discountPercent = selectedDurationOption?.discountPercent || 0
  const discountedDailyPrice = Math.round(baseDailyPrice * (1 - discountPercent / 100))
  const subtotalAmount = discountedDailyPrice * durationDays
  const selectedVoucher =
    vouchers.find((voucher) => String(voucher.id) === selectedVoucherId) || null
  const voucherDiscount = useMemo(() => {
    if (!selectedVoucher) return 0

    if (selectedVoucher.discountType === 'fixed') {
      return Math.min(subtotalAmount, Number(selectedVoucher.discountValue || 0))
    }

    if (selectedVoucher.discountType === 'percent') {
      const rawDiscount = (subtotalAmount * Number(selectedVoucher.discountValue || 0)) / 100
      const cappedDiscount = selectedVoucher.maxDiscount
        ? Math.min(rawDiscount, Number(selectedVoucher.maxDiscount))
        : rawDiscount
      return Math.min(subtotalAmount, Math.round(cappedDiscount))
    }

    if (selectedVoucher.discountType === 'free_post') return subtotalAmount

    return 0
  }, [selectedVoucher, subtotalAmount])
  const totalAmount = Math.max(0, subtotalAmount - voucherDiscount)

  useEffect(() => {
    if (!activePostType || isDurationValid) return

    const nextDuration = activePostType.durationOptions.some(
      (option) => option.durationDays === activePostType.recommendedDuration,
    )
      ? activePostType.recommendedDuration
      : activePostType.durationOptions[0]?.durationDays

    if (nextDuration) {
      setDurationDays(nextDuration)
    }
  }, [activePostType, isDurationValid])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setPricingLoading(true)
      setPricingError('')

      try {
        const params = new URLSearchParams()
        params.set('depth', '0')
        params.set('limit', '20')
        params.set('sort', 'sort')
        params.set('where[isActive][equals]', 'true')

        const res = await fetch(`/api/posting-prices?${params.toString()}`)
        if (!res.ok) throw new Error('Không thể tải bảng giá')

        const data = await res.json()
        const docs: PostingPriceDoc[] = Array.isArray(data?.docs) ? data.docs : []
        const mapped = docs
          .map(mapPostingPriceToPostType)
          .filter((type): type is PostTypeOption => Boolean(type))
          .sort((a, b) => POST_TYPE_ORDER[a.value] - POST_TYPE_ORDER[b.value])

        if (cancelled) return

        setPostTypes(mapped)

        const selected =
          mapped.find((type) => type.value === postType) ||
          mapped.find((type) => type.value === 'normal') ||
          mapped[0]

        if (selected) {
          setPostType(selected.value)
          setDurationDays(
            selected.durationOptions.some(
              (option) => option.durationDays === selected.recommendedDuration,
            )
              ? selected.recommendedDuration
              : selected.durationOptions[0].durationDays,
          )
        } else {
          setPostType('')
          setDurationDays(0)
          setPricingError('Chưa có cấu hình bảng giá đăng tin.')
        }
      } catch (err) {
        if (!cancelled) {
          setPostTypes([])
          setPostType('')
          setDurationDays(0)
          setPricingError(err instanceof Error ? err.message : 'Không thể tải bảng giá đăng tin.')
        }
      } finally {
        if (!cancelled) setPricingLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!canScheduleHour) setStartTime('now')
  }, [canScheduleHour])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const res = await fetch('/api/users/me?depth=0')
        if (!res.ok) return

        const data = await res.json()
        const me = data?.user ?? data
        const packageID =
          getRelationshipID(me?.activePackage) || getRelationshipID(me?.active_package_id)

        if (!cancelled) setFetchedActivePackageID(packageID)
      } catch {}
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    if (!userId) {
      setVouchers([])
      setSelectedVoucherId('')
      setVoucherLoading(false)
      setVoucherError('')
      return () => {
        cancelled = true
      }
    }

    const run = async () => {
      setVoucherLoading(true)
      setVoucherError('')

      try {
        const params = new URLSearchParams()
        params.set('where[user][equals]', String(userId))
        params.set('where[status][equals]', 'active')
        params.set('sort', '-createdAt')
        params.set('limit', '50')

        const res = await fetch(`/api/vouchers?${params.toString()}`)
        if (!res.ok) throw new Error('Không thể tải voucher')

        const data = await res.json()
        const docs = Array.isArray(data?.docs) ? data.docs : []
        const now = Date.now()
        const activeVouchers: VoucherOption[] = docs.filter((voucher: VoucherOption) => {
          if (!voucher?.expiresAt) return true
          const expiresAt = new Date(voucher.expiresAt).getTime()
          return Number.isNaN(expiresAt) ? true : expiresAt >= now
        })

        if (cancelled) return
        setVouchers(activeVouchers)
        setSelectedVoucherId((prev) =>
          activeVouchers.some((voucher) => String(voucher.id) === prev) ? prev : '',
        )
      } catch (err) {
        if (!cancelled) {
          setVouchers([])
          setSelectedVoucherId('')
          setVoucherError(err instanceof Error ? err.message : 'Không thể tải voucher')
        }
      } finally {
        if (!cancelled) setVoucherLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [userId])

  const handleSubmit = async () => {
    if (!canSubmit) return
    if (!activePostType) {
      setError('Chưa có cấu hình loại tin để đăng.')
      return
    }

    setSubmitting(true)
    setError('')

    const body = new FormData()
    const { images, ...draftPayload } = draft
    const submitPayload = {
      ...draftPayload,
      postType: activePostType.value,
      durationDays,
      scheduledPublishAt: scheduledDate.toISOString(),
    }

    body.append('draft', JSON.stringify(submitPayload))
    images.forEach((image) => {
      body.append('images', image.file, image.file.name)
    })

    try {
      const res = await fetch('/api/post-flow/submit', {
        method: 'POST',
        body,
      })
      const data = await res.json()

      if (!res.ok) {
        if (data?.error === 'Số dư không đủ') {
          setBalanceSnapshot({
            required: Number(data?.required || 0),
            balance: Number(data?.balance || 0),
          })
          setShowBalanceModal(true)
          setError('')
          return
        }

        setError(data?.error || 'Không thể gửi tin đăng, vui lòng thử lại.')
        return
      }

      onClose()
      router.push('/account/management?posted=1')
    } catch {
      setError('Không thể kết nối đến máy chủ, vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePostTypeChange = (type: PostTypeOption) => {
    setPostType(type.value)
    setDurationDays(
      type.durationOptions.some((option) => option.durationDays === type.recommendedDuration)
        ? type.recommendedDuration
        : type.durationOptions[0]?.durationDays || 0,
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      {showBalanceModal ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Golden Land
                </p>
                <h3 className="mt-2 text-xl font-bold text-zinc-900">Số dư không đủ</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBalanceModal(false)}
                className="text-xl leading-none text-zinc-400 transition hover:text-zinc-600"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm text-zinc-600">
              <div className="flex items-center justify-between">
                <span>Số dư hiện tại</span>
                <span className="font-semibold text-zinc-900">
                  {formatMoney(balanceSnapshot.balance)} đ
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Số tiền cần có</span>
                <span className="font-semibold text-zinc-900">
                  {formatMoney(balanceSnapshot.required)} đ
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowBalanceModal(false)}
                className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex-1 space-y-8 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Golden Land
          </p>
          <h2 className="mt-2 font-headline text-2xl font-bold tracking-tight text-zinc-900">
            Bước 3: Cấu hình & thanh toán
          </h2>
        </div>

        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-headline text-lg font-bold text-zinc-900">Chọn loại tin</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {pricingLoading
                  ? 'Đang tải bảng giá đăng tin...'
                  : 'Mặc định là Tin Thường. Tin VIP có thêm tuỳ chọn hẹn giờ theo gói.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {postTypes.map((type) => {
              const selected = postType === type.value

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handlePostTypeChange(type)}
                  className={`relative min-h-[150px] rounded-xl border p-5 text-left transition ${
                    selected
                      ? 'border-red-600 bg-white shadow-[0_12px_32px_rgba(27,28,28,0.08)]'
                      : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300'
                  }`}
                >
                  <div className="mb-5 flex gap-1">
                    {Array.from({ length: type.bars }).map((_, index) => (
                      <span
                        key={index}
                        className={`h-1 w-6 rounded-full ${type.accent.split(' ')[0]}`}
                      />
                    ))}
                  </div>
                  <p className="font-headline text-lg font-bold text-zinc-900">{type.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{type.subtitle}</p>
                  {type.multiplier ? (
                    <div className="mt-4 flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-1 text-xs font-bold ${type.accent} bg-opacity-10`}
                      >
                        {type.multiplier}
                      </span>
                      <span className="text-[11px] leading-tight text-zinc-400">
                        lượt liên hệ so với tin thường
                      </span>
                    </div>
                  ) : (
                    <div className="mt-4 h-6" />
                  )}
                  <p className="mt-4 text-sm font-bold text-zinc-900">{type.price}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Đề xuất {type.recommendedDuration} ngày
                  </p>
                  {selected ? (
                    <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-red-600" />
                  ) : null}
                </button>
              )
            })}
          </div>
          {!pricingLoading && pricingError ? (
            <p className="mt-3 text-sm text-red-600">{pricingError}</p>
          ) : null}
          {pricingLoading && postTypes.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">Đang tải dữ liệu loại tin...</p>
          ) : null}
        </section>

        <section className="rounded-xl bg-zinc-50 p-5">
          <p className="mb-4 text-sm font-semibold text-zinc-900">Thời hạn đăng tin</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {durations.map((duration) => {
              const selected = durationDays === duration
              const option = durationOptions.find((item) => item.durationDays === duration)
              const optionDiscountPercent = option?.discountPercent || 0
              const discountedDaily = Math.round(baseDailyPrice * (1 - optionDiscountPercent / 100))
              const hasDiscount = optionDiscountPercent > 0

              return (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setDurationDays(duration)}
                  className={`flex items-center justify-between rounded-lg border bg-white p-4 text-left transition ${
                    selected ? 'border-zinc-900' : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <span>
                    <span className="block font-headline text-lg font-bold text-zinc-900">
                      {duration} ngày
                    </span>
                    <span className="text-xs text-zinc-500">
                      {option?.label || (duration === recommendedDuration ? 'Đề xuất' : 'Tuỳ chọn')}
                    </span>
                    <span
                      className={`mt-1 block text-xs font-medium ${hasDiscount ? 'text-emerald-600' : 'text-zinc-500'}`}
                    >
                      {hasDiscount
                        ? `Giảm ${optionDiscountPercent}% còn ${PRICE_FORMATTER.format(discountedDaily)} đ/ngày`
                        : `Giá gốc ${PRICE_FORMATTER.format(discountedDaily)} đ/ngày`}
                    </span>
                  </span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      selected ? 'border-zinc-900' : 'border-zinc-200'
                    }`}
                  >
                    {selected ? <span className="h-2.5 w-2.5 rounded-full bg-zinc-900" /> : null}
                  </span>
                </button>
              )
            })}
          </div>
          {!pricingLoading && activePostType && durations.length === 0 ? (
            <p className="text-sm text-red-600">Loại tin này chưa có cấu hình thời hạn.</p>
          ) : null}
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              className="mb-3 block font-headline font-bold text-zinc-900"
              htmlFor="post-start-date"
            >
              Ngày bắt đầu
            </label>
            <div className="relative">
              <input
                id="post-start-date"
                type="date"
                min={minStartDate}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-11 text-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
              />
              <CalendarDays className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-zinc-400" />
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Kết thúc ngày {endsAt.toLocaleDateString('vi-VN')}
            </p>
          </div>

          <div>
            <label
              className="mb-3 block font-headline font-bold text-zinc-900"
              htmlFor="post-start-time"
            >
              Hẹn giờ đăng tin
            </label>
            <div className="relative">
              <select
                id="post-start-time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                disabled={!canScheduleHour}
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-11 text-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
              >
                <option value="now">Đăng ngay bây giờ</option>
                <option value="08:00">08:00</option>
                <option value="12:00">12:00</option>
                <option value="18:00">18:00</option>
                <option value="20:00">20:00</option>
              </select>
              <Clock3 className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-zinc-400" />
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Chỉ chọn được giờ khi đăng tin VIP hoặc tài khoản có gói VIP.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-headline text-lg font-bold text-zinc-900">Voucher giảm giá</h3>
              <p className="mt-1 text-xs text-zinc-500">Chọn voucher áp dụng cho lượt đăng này.</p>
            </div>
            <p className="text-xs text-zinc-500">
              {voucherLoading ? 'Đang tải voucher...' : `${vouchers.length} voucher khả dụng`}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <select
                value={selectedVoucherId}
                onChange={(event) => setSelectedVoucherId(event.target.value)}
                disabled={voucherLoading || vouchers.length === 0}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
              >
                <option value="">Không dùng voucher</option>
                {vouchers.map((voucher) => (
                  <option key={voucher.id} value={voucher.id}>
                    {voucher.code} · {formatVoucherLabel(voucher)}
                  </option>
                ))}
              </select>
              {voucherError ? <p className="mt-2 text-xs text-red-600">{voucherError}</p> : null}
            </div>

            <div className="min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Đang chọn
              </p>
              <p className="mt-2 break-words font-semibold text-zinc-900">
                {selectedVoucher ? selectedVoucher.code : 'Không dùng voucher'}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {selectedVoucher
                  ? formatVoucherLabel(selectedVoucher)
                  : 'Chọn voucher để giảm giá.'}
              </p>
              {selectedVoucher?.expiresAt ? (
                <p className="mt-2 text-xs text-zinc-400">
                  Hết hạn: {new Date(selectedVoucher.expiresAt).toLocaleDateString('vi-VN')}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-col gap-3 border-t border-zinc-100 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-bold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-60"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-bold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-60"
          >
            Đóng
          </button>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="text-left sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Tổng tiền
            </p>
            <p className="text-lg font-bold text-zinc-900">{formatMoney(totalAmount)} đ</p>
            <p className="text-xs text-zinc-500">
              Giảm voucher: {voucherDiscount > 0 ? `-${formatMoney(voucherDiscount)} đ` : '0 đ'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/15 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Đang gửi...' : 'Đăng tin'}
          </button>
        </div>
      </div>
    </div>
  )
}
