'use client'

import { useState } from 'react'

type Props = {
  count: number
  busy: boolean
  onSubmit: (reason: string) => void | Promise<void>
  onClose: () => void
}

const PRESETS = [
  'Tin trùng lặp với tin đã có',
  'Thông tin không chính xác / thiếu',
  'Ảnh kém chất lượng hoặc không liên quan',
  'Giá bất thường, có dấu hiệu lừa đảo',
  'Vi phạm chính sách đăng tin',
]

export default function RejectModal({ count, busy, onSubmit, onClose }: Props) {
  const [reason, setReason] = useState('')

  const handleSubmit = () => {
    const v = reason.trim()
    if (!v) return
    onSubmit(v)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-slate-900">
          Từ chối {count > 1 ? `${count} tin` : 'tin đăng'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Vui lòng nhập lý do để gửi tới người đăng tin.
        </p>

        <div className="mt-4 space-y-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setReason(p)}
              className="w-full text-left text-sm px-3 py-2 rounded border border-slate-200 hover:bg-slate-50"
            >
              {p}
            </button>
          ))}
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Hoặc nhập lý do tuỳ chỉnh..."
          className="mt-3 w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-amber-400"
        />

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy || !reason.trim()}
            className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {busy ? 'Đang gửi...' : 'Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  )
}