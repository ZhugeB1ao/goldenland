'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  savePostingPrice,
  deletePostingPrice,
  type PostType,
  type PostingPriceFormData,
  type PostingPriceDurationOption,
} from '../actions'
import type { PostingPriceItem } from './PostingPricesSection'

// ─── Form state ───────────────────────────────────────────────────────────────

type DurationOptionForm = {
  durationDays: string
  discountPercent: string
  label: string
}

type FormState = {
  name: string
  description: string
  postType: PostType
  displayMultiplier: string
  dailyPrice: string
  recommendedDurationDays: string
  durationOptions: DurationOptionForm[]
  sort: string
  isActive: boolean
}

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'normal', label: 'Tin thường' },
  { value: 'silver', label: 'VIP Bạc' },
  { value: 'gold', label: 'VIP Vàng' },
  { value: 'diamond', label: 'VIP Kim cương' },
]

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  postType: 'normal',
  displayMultiplier: '1',
  dailyPrice: '',
  recommendedDurationDays: '15',
  durationOptions: [{ durationDays: '7', discountPercent: '', label: '' }],
  sort: '0',
  isActive: true,
})

function toForm(item: PostingPriceItem): FormState {
  return {
    name: item.name ?? '',
    description: item.description ?? '',
    postType: item.postType ?? 'normal',
    displayMultiplier: item.displayMultiplier?.toString() ?? '1',
    dailyPrice: item.dailyPrice?.toString() ?? '',
    recommendedDurationDays: item.recommendedDurationDays?.toString() ?? '15',
    durationOptions:
      item.durationOptions?.map((o) => ({
        durationDays: o.durationDays?.toString() ?? '',
        discountPercent: o.discountPercent?.toString() ?? '',
        label: o.label ?? '',
      })) ?? [],
    sort: item.sort?.toString() ?? '0',
    isActive: item.isActive ?? true,
  }
}

function toSubmit(form: FormState): PostingPriceFormData {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    postType: form.postType,
    displayMultiplier: Number(form.displayMultiplier) || 1,
    dailyPrice: Number(form.dailyPrice),
    recommendedDurationDays: Number(form.recommendedDurationDays) || 15,
    durationOptions: form.durationOptions
      .filter((o) => o.durationDays)
      .map<PostingPriceDurationOption>((o) => ({
        durationDays: Number(o.durationDays),
        discountPercent: o.discountPercent ? Number(o.discountPercent) : undefined,
        label: o.label.trim() || undefined,
      })),
    sort: Number(form.sort) || 0,
    isActive: form.isActive,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputCls =
  'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'

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

// ─── Main component ───────────────────────────────────────────────────────────

type Props = { item: PostingPriceItem | null; onClose: () => void }

export default function PostingPriceFormDrawer({ item, onClose }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => (item ? toForm(item) : emptyForm()))
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const isEdit = !!item?.id

  useEffect(() => {
    setForm(item ? toForm(item) : emptyForm())
    setError(null)
  }, [item])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const addDuration = () =>
    set('durationOptions', [
      ...form.durationOptions,
      { durationDays: '', discountPercent: '', label: '' },
    ])
  const removeDuration = (i: number) =>
    set('durationOptions', form.durationOptions.filter((_, idx) => idx !== i))
  const updateDuration = (i: number, k: keyof DurationOptionForm, v: string) => {
    const next = [...form.durationOptions]
    next[i] = { ...next[i], [k]: v }
    set('durationOptions', next)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return setError('Tên không được để trống')
    if (!form.dailyPrice) return setError('Giá/ngày không được để trống')
    if (form.durationOptions.filter((o) => o.durationDays).length === 0)
      return setError('Phải có ít nhất 1 tuỳ chọn ngày')
    setError(null)

    startTransition(async () => {
      try {
        await savePostingPrice(item?.id ?? null, toSubmit(form))
        router.refresh()
        onClose()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Lỗi khi lưu')
      }
    })
  }

  const handleDelete = () => {
    if (!item?.id) return
    if (!confirm(`Xoá loại tin "${item.name}"?`)) return
    setDeleting(true)
    deletePostingPrice(item.id)
      .then(() => { router.refresh(); onClose() })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Lỗi khi xoá')
        setDeleting(false)
      })
  }

  // Computed preview
  const dailyPriceNum = Number(form.dailyPrice) || 0
  const multiplierNum = Number(form.displayMultiplier) || 1

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-slate-900/40" />
      <aside
        className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h2 className="font-semibold text-slate-800">
              {isEdit ? `Chỉnh sửa — ${item.name}` : 'Thêm loại tin mới'}
            </h2>
          </div>
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              {deleting ? 'Đang xoá...' : 'Xoá'}
            </button>
          )}
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <Field label="Tên loại tin" required>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="VD: Tin thường, VIP Bạc, VIP Vàng..."
            />
          </Field>

          <Field label="Mô tả ngắn">
            <textarea
              rows={2}
              className={`${inputCls} resize-none`}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="VD: Hiển thị ưu tiên gấp 8 lần tin thường"
            />
          </Field>

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
            <Field label="Hệ số ưu tiên">
              <input
                type="number"
                min={1}
                className={inputCls}
                value={form.displayMultiplier}
                onChange={(e) => set('displayMultiplier', e.target.value)}
                placeholder="1"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Giá / ngày (₫)" required>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={form.dailyPrice}
                onChange={(e) => set('dailyPrice', e.target.value)}
                placeholder="5000"
              />
            </Field>
            <Field label="Số ngày đề xuất">
              <input
                type="number"
                min={1}
                className={inputCls}
                value={form.recommendedDurationDays}
                onChange={(e) => set('recommendedDurationDays', e.target.value)}
                placeholder="15"
              />
            </Field>
          </div>

          {/* Duration options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Các mốc ngày được chọn
              </h3>
              <button
                onClick={addDuration}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>Thêm mốc
              </button>
            </div>

            {form.durationOptions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có mốc nào</p>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Số ngày</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Giảm (%)</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Nhãn</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Tổng tiền</th>
                      <th className="px-3 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form.durationOptions.map((opt, i) => {
                      const days = Number(opt.durationDays) || 0
                      const disc = Number(opt.discountPercent) || 0
                      const total = days * dailyPriceNum * (1 - disc / 100)
                      return (
                        <tr key={i}>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={1}
                              value={opt.durationDays}
                              onChange={(e) => updateDuration(i, 'durationDays', e.target.value)}
                              placeholder="7"
                              className="w-16 border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={opt.discountPercent}
                              onChange={(e) => updateDuration(i, 'discountPercent', e.target.value)}
                              placeholder="0"
                              className="w-16 border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={opt.label}
                              onChange={(e) => updateDuration(i, 'label', e.target.value)}
                              placeholder="VD: Đề xuất"
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-xs font-semibold text-amber-600">
                            {total > 0 ? total.toLocaleString('vi-VN') + '₫' : '-'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => removeDuration(i)}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Thứ tự hiển thị">
              <input
                type="number"
                className={inputCls}
                value={form.sort}
                onChange={(e) => set('sort', e.target.value)}
                placeholder="0"
              />
            </Field>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set('isActive', e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-sm text-slate-700">Hiển thị loại tin này</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          {dailyPriceNum > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-semibold">Xem trước</div>
              <div className="font-bold text-slate-800">{form.name || '(Chưa đặt tên)'}</div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-amber-600">
                  {dailyPriceNum.toLocaleString('vi-VN')}₫
                </span>
                <span className="text-xs text-slate-500">/ ngày</span>
                {multiplierNum > 1 && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                    Ưu tiên {multiplierNum}x
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.durationOptions
                  .filter((o) => o.durationDays)
                  .map((opt, i) => {
                    const days = Number(opt.durationDays)
                    const disc = Number(opt.discountPercent) || 0
                    const total = days * dailyPriceNum * (1 - disc / 100)
                    return (
                      <div
                        key={i}
                        className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-center"
                      >
                        <div className="font-semibold text-slate-700">{days} ngày</div>
                        <div className="text-amber-600 font-bold">{total.toLocaleString('vi-VN')}₫</div>
                        {disc > 0 && <div className="text-rose-500 text-[10px]">-{disc}%</div>}
                        {opt.label && <div className="text-slate-400 text-[10px]">{opt.label}</div>}
                      </div>
                    )
                  })}
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
            {isEdit ? 'Lưu thay đổi' : 'Tạo loại tin'}
          </button>
        </footer>
      </aside>
    </div>
  )
}
