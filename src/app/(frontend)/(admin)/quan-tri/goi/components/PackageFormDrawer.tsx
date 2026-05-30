'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatVND } from '../../../lib/format'
import {
  savePackage,
  deletePackage,
  type PostType,
  type PackageFormData,
  type PackageDurationOption,
  type PackageBonusVoucher,
} from '../actions'
import type { PackageItem } from './PackagesSection'

// ─── Form state types ─────────────────────────────────────────────────────────

type DurationOptionForm = {
  months: string
  price: string
  originalPrice: string
  totalProperties: string
  discount: string
  savePerMonth: string
}

type BonusVoucherForm = {
  quantity: string
  discountValue: string
  appliedFor: PostType
}

type FormState = {
  name: string
  subtitle: string
  description: string
  price: string
  originalPrice: string
  totalProperties: string
  durationDays: string
  propertyDurationDays: string
  postType: PostType
  isBestSeller: boolean
  isActive: boolean
  sort: string
  durationOptions: DurationOptionForm[]
  features: string[]
  bonusVouchers: BonusVoucherForm[]
}

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'normal', label: 'Tin thường' },
  { value: 'silver', label: 'VIP Bạc' },
  { value: 'gold', label: 'VIP Vàng' },
  { value: 'diamond', label: 'VIP Kim cương' },
]

const emptyForm = (): FormState => ({
  name: '',
  subtitle: '',
  description: '',
  price: '',
  originalPrice: '',
  totalProperties: '',
  durationDays: '',
  propertyDurationDays: '30',
  postType: 'normal',
  isBestSeller: false,
  isActive: true,
  sort: '0',
  durationOptions: [],
  features: [],
  bonusVouchers: [],
})

function toForm(pkg: PackageItem): FormState {
  return {
    name: pkg.name ?? '',
    subtitle: pkg.subtitle ?? '',
    description: pkg.description ?? '',
    price: pkg.price?.toString() ?? '',
    originalPrice: pkg.originalPrice?.toString() ?? '',
    totalProperties: pkg.totalProperties?.toString() ?? '',
    durationDays: pkg.durationDays?.toString() ?? '',
    propertyDurationDays: pkg.propertyDurationDays?.toString() ?? '30',
    postType: pkg.postType ?? 'normal',
    isBestSeller: pkg.isBestSeller ?? false,
    isActive: pkg.isActive ?? true,
    sort: pkg.sort?.toString() ?? '0',
    durationOptions:
      pkg.durationOptions?.map((o) => ({
        months: o.months?.toString() ?? '',
        price: o.price?.toString() ?? '',
        originalPrice: o.originalPrice?.toString() ?? '',
        totalProperties: o.totalProperties?.toString() ?? '',
        discount: o.discount?.toString() ?? '',
        savePerMonth: o.savePerMonth?.toString() ?? '',
      })) ?? [],
    features: pkg.features?.map((f) => f.feature ?? '').filter(Boolean) ?? [],
    bonusVouchers:
      pkg.bonusVouchers?.map((v) => ({
        quantity: v.quantity?.toString() ?? '1',
        discountValue: v.discountValue?.toString() ?? '0',
        appliedFor: (v.appliedFor as PostType) ?? 'normal',
      })) ?? [],
  }
}

function toSubmit(form: FormState): PackageFormData {
  return {
    name: form.name.trim(),
    subtitle: form.subtitle.trim() || undefined,
    description: form.description.trim() || undefined,
    price: Number(form.price),
    originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
    totalProperties: Number(form.totalProperties),
    durationDays: Number(form.durationDays),
    propertyDurationDays: Number(form.propertyDurationDays) || 30,
    postType: form.postType,
    isBestSeller: form.isBestSeller,
    isActive: form.isActive,
    sort: Number(form.sort) || 0,
    durationOptions: form.durationOptions
      .filter((o) => o.months && o.price)
      .map<PackageDurationOption>((o) => ({
        months: Number(o.months),
        price: Number(o.price),
        originalPrice: o.originalPrice ? Number(o.originalPrice) : undefined,
        totalProperties: o.totalProperties ? Number(o.totalProperties) : undefined,
        discount: o.discount ? Number(o.discount) : undefined,
        savePerMonth: o.savePerMonth ? Number(o.savePerMonth) : undefined,
      })),
    features: form.features
      .map((f) => f.trim())
      .filter(Boolean)
      .map((f) => ({ feature: f })),
    bonusVouchers: form.bonusVouchers
      .filter((v) => v.discountValue)
      .map<PackageBonusVoucher>((v) => ({
        quantity: Number(v.quantity) || 1,
        discountValue: Number(v.discountValue),
        appliedFor: v.appliedFor,
      })),
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
      {action}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'

// ─── Main component ───────────────────────────────────────────────────────────

type Props = { pkg: PackageItem | null; onClose: () => void }

export default function PackageFormDrawer({ pkg, onClose }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => (pkg ? toForm(pkg) : emptyForm()))
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const isEdit = !!pkg?.id

  useEffect(() => {
    setForm(pkg ? toForm(pkg) : emptyForm())
    setError(null)
  }, [pkg])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  // Features helpers
  const addFeature = () => set('features', [...form.features, ''])
  const removeFeature = (i: number) => set('features', form.features.filter((_, idx) => idx !== i))
  const updateFeature = (i: number, v: string) => {
    const next = [...form.features]
    next[i] = v
    set('features', next)
  }

  // Duration options helpers
  const addDuration = () =>
    set('durationOptions', [
      ...form.durationOptions,
      { months: '', price: '', originalPrice: '', totalProperties: '', discount: '', savePerMonth: '' },
    ])
  const removeDuration = (i: number) =>
    set('durationOptions', form.durationOptions.filter((_, idx) => idx !== i))
  const updateDuration = (i: number, k: keyof DurationOptionForm, v: string) => {
    const next = [...form.durationOptions]
    next[i] = { ...next[i], [k]: v }
    set('durationOptions', next)
  }

  // Bonus voucher helpers
  const addVoucher = () =>
    set('bonusVouchers', [
      ...form.bonusVouchers,
      { quantity: '1', discountValue: '0', appliedFor: 'normal' as PostType },
    ])
  const removeVoucher = (i: number) =>
    set('bonusVouchers', form.bonusVouchers.filter((_, idx) => idx !== i))
  const updateVoucher = (i: number, k: keyof BonusVoucherForm, v: string) => {
    const next = [...form.bonusVouchers]
    next[i] = { ...next[i], [k]: v as PostType }
    set('bonusVouchers', next)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return setError('Tên gói không được để trống')
    if (!form.price) return setError('Giá không được để trống')
    if (!form.totalProperties) return setError('Số lượt đăng không được để trống')
    if (!form.durationDays) return setError('Thời hạn gói không được để trống')
    setError(null)

    startTransition(async () => {
      try {
        await savePackage(pkg?.id ?? null, toSubmit(form))
        router.refresh()
        onClose()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Lỗi khi lưu')
      }
    })
  }

  const handleDelete = () => {
    if (!pkg?.id) return
    if (!confirm(`Xoá gói "${pkg.name}"? Hành động này không thể hoàn tác.`)) return
    setDeleting(true)
    deletePackage(pkg.id)
      .then(() => { router.refresh(); onClose() })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Lỗi khi xoá')
        setDeleting(false)
      })
  }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-slate-900/40" />
      <aside
        className="w-full max-w-xl bg-white h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h2 className="font-semibold text-slate-800">
              {isEdit ? `Chỉnh sửa — ${pkg.name}` : 'Thêm gói mới'}
            </h2>
          </div>
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              {deleting ? 'Đang xoá...' : 'Xoá gói'}
            </button>
          )}
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Thông tin cơ bản */}
          <div className="space-y-3">
            <Section title="Thông tin cơ bản" />
            <Field label="Tên gói" required>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="VD: Gói Cơ bản, Gói VIP Vàng..."
              />
            </Field>
            <Field label="Phụ đề">
              <input
                className={inputCls}
                value={form.subtitle}
                onChange={(e) => set('subtitle', e.target.value)}
                placeholder="VD: Dành cho người mới bắt đầu"
              />
            </Field>
            <Field label="Mô tả">
              <textarea
                rows={2}
                className={`${inputCls} resize-none`}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </Field>
          </div>

          {/* Giá */}
          <div className="space-y-3">
            <Section title="Giá cơ bản" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Giá bán (₫)" required>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Giá gốc (₫)">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.originalPrice}
                  onChange={(e) => set('originalPrice', e.target.value)}
                  placeholder="Để trống nếu không giảm giá"
                />
              </Field>
            </div>
          </div>

          {/* Thông số gói */}
          <div className="space-y-3">
            <Section title="Thông số gói" />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Số lượt đăng" required>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={form.totalProperties}
                  onChange={(e) => set('totalProperties', e.target.value)}
                  placeholder="5"
                />
              </Field>
              <Field label="Thời hạn (ngày)" required>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={form.durationDays}
                  onChange={(e) => set('durationDays', e.target.value)}
                  placeholder="30"
                />
              </Field>
              <Field label="Tin hiển thị (ngày)">
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={form.propertyDurationDays}
                  onChange={(e) => set('propertyDurationDays', e.target.value)}
                  placeholder="30"
                />
              </Field>
            </div>
          </div>

          {/* Tuỳ chọn thời hạn */}
          <div className="space-y-3">
            <Section
              title="Tuỳ chọn thời hạn (tháng)"
              action={
                <button
                  onClick={addDuration}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>Thêm
                </button>
              }
            />
            {form.durationOptions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có tùy chọn nào</p>
            ) : (
              <div className="space-y-2">
                {form.durationOptions.map((opt, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600">Tùy chọn #{i + 1}</span>
                      <button onClick={() => removeDuration(i)} className="text-slate-400 hover:text-rose-500">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          ['months', 'Số tháng', '1'],
                          ['price', 'Giá (₫)', '0'],
                          ['originalPrice', 'Giá gốc (₫)', ''],
                          ['totalProperties', 'Số lượt đăng', ''],
                          ['discount', 'Giảm (%)', ''],
                          ['savePerMonth', 'Tiết kiệm/tháng (₫)', ''],
                        ] as [keyof DurationOptionForm, string, string][]
                      ).map(([key, label, placeholder]) => (
                        <div key={key}>
                          <label className="text-[10px] text-slate-500 font-medium mb-1 block">
                            {label}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={opt[key]}
                            onChange={(e) => updateDuration(i, key, e.target.value)}
                            placeholder={placeholder}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cấu hình */}
          <div className="space-y-3">
            <Section title="Cấu hình" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Loại tin">
                <select
                  className={inputCls}
                  value={form.postType}
                  onChange={(e) => set('postType', e.target.value as PostType)}
                >
                  {POST_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Thứ tự hiển thị">
                <input
                  type="number"
                  className={inputCls}
                  value={form.sort}
                  onChange={(e) => set('sort', e.target.value)}
                  placeholder="0"
                />
              </Field>
            </div>
            <div className="flex items-center gap-6">
              {(
                [
                  ['isActive', 'Hiển thị gói'],
                  ['isBestSeller', 'Đánh dấu Bán chạy'],
                ] as [keyof FormState, string][]
              ).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[k] as boolean}
                    onChange={(e) => set(k, e.target.checked as FormState[typeof k])}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tính năng */}
          <div className="space-y-3">
            <Section
              title="Tính năng gói"
              action={
                <button
                  onClick={addFeature}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>Thêm
                </button>
              }
            />
            {form.features.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có tính năng nào</p>
            ) : (
              <div className="space-y-2">
                {form.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px] shrink-0">
                      check_circle
                    </span>
                    <input
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      value={f}
                      onChange={(e) => updateFeature(i, e.target.value)}
                      placeholder="VD: Đăng tối đa 5 tin..."
                    />
                    <button onClick={() => removeFeature(i)} className="text-slate-400 hover:text-rose-500">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voucher tặng kèm */}
          <div className="space-y-3">
            <Section
              title="Voucher tặng kèm"
              action={
                <button
                  onClick={addVoucher}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>Thêm
                </button>
              }
            />
            {form.bonusVouchers.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có voucher tặng kèm</p>
            ) : (
              <div className="space-y-2">
                {form.bonusVouchers.map((v, i) => (
                  <div
                    key={i}
                    className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-amber-700">Voucher #{i + 1}</span>
                      <button onClick={() => removeVoucher(i)} className="text-slate-400 hover:text-rose-500">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-amber-700 font-medium mb-1 block">Số lượng</label>
                        <input
                          type="number"
                          min={1}
                          value={v.quantity}
                          onChange={(e) => updateVoucher(i, 'quantity', e.target.value)}
                          className="w-full border border-amber-200 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-amber-700 font-medium mb-1 block">Giảm (₫)</label>
                        <input
                          type="number"
                          min={0}
                          value={v.discountValue}
                          onChange={(e) => updateVoucher(i, 'discountValue', e.target.value)}
                          className="w-full border border-amber-200 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-amber-700 font-medium mb-1 block">Áp dụng cho</label>
                        <select
                          value={v.appliedFor}
                          onChange={(e) => updateVoucher(i, 'appliedFor', e.target.value)}
                          className="w-full border border-amber-200 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                        >
                          {POST_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {form.price && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-400 uppercase font-semibold mb-2">Xem trước</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-amber-600">
                  {Number(form.price).toLocaleString('vi-VN')}₫
                </span>
                {form.originalPrice && Number(form.originalPrice) > Number(form.price) && (
                  <span className="text-sm text-slate-400 line-through">
                    {Number(form.originalPrice).toLocaleString('vi-VN')}₫
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                {form.name || '(Chưa đặt tên)'} ·{' '}
                {form.totalProperties || '?'} lượt đăng ·{' '}
                {form.durationDays || '?'} ngày gói
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2"
          >
            {pending && (
              <span className="material-symbols-outlined text-[16px] animate-spin">
                progress_activity
              </span>
            )}
            {isEdit ? 'Lưu thay đổi' : 'Tạo gói'}
          </button>
        </footer>
      </aside>
    </div>
  )
}
