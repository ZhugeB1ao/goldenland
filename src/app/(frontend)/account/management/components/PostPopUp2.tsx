'use client'

type PostPopUp2Props = {
  onBack: () => void
  onClose: () => void
  onNext: () => void
}

export default function PostPopUp2({ onBack, onClose, onNext }: PostPopUp2Props) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Golden Land</p>
        <h2 className="mt-2 text-2xl font-bold text-zinc-900">Bước 2: Hình ảnh & video</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Tải ảnh rõ ràng, đủ sáng và thêm video để tăng tỉ lệ khách liên hệ.
        </p>
      </div>

      <ul className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        <li>- Tối thiểu 3 ảnh, tối đa 25 ảnh.</li>
        <li>- Ảnh đầu tiên sẽ là ảnh đại diện.</li>
        <li>- Có thể thêm liên kết video để khách xem chi tiết hơn.</li>
      </ul>

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
          onClick={onNext}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  )
}
