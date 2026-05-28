'use client'

type PostPopUp3Props = {
  onBack: () => void
  onClose: () => void
}

export default function PostPopUp3({ onBack, onClose }: PostPopUp3Props) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Golden Land</p>
        <h2 className="mt-2 text-2xl font-bold text-zinc-900">Bước 3: Cấu hình & thanh toán</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Chọn loại tin, thời gian đăng và kiểm tra chi phí trước khi xuất bản.
        </p>
      </div>

      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-zinc-700">
        Mẹo: chọn gói phù hợp và thời gian đăng dài hơn để tối ưu chi phí hiển thị.
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Đóng
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Hoàn tất
        </button>
      </div>
    </div>
  )
}
