'use client'

import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import type { PostDraft } from './postFlowTypes'

type PostPopUp2Props = {
  draft: PostDraft
  onChange: Dispatch<SetStateAction<PostDraft>>
  onBack: () => void
  onClose: () => void
  onNext: () => void
}

const MIN_IMAGES = 3
const MAX_IMAGES = 10

export default function PostPopUp2({ draft, onChange, onBack, onClose, onNext }: PostPopUp2Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const canGoPhase3 = draft.images.length >= MIN_IMAGES && draft.images.length <= MAX_IMAGES && !uploading
  const remainingSlots = MAX_IMAGES - draft.images.length

  const handleFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList || [])
    if (files.length === 0) return

    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length !== files.length) {
      setError('Chỉ hỗ trợ file ảnh.')
      return
    }

    if (imageFiles.length > remainingSlots) {
      setError(`Bạn chỉ có thể thêm ${remainingSlots} ảnh nữa. Tối đa ${MAX_IMAGES} ảnh.`)
      return
    }

    setUploading(true)
    setError('')

    const selectedImages: PostDraft['images'] = imageFiles.map((file, index) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      sort: draft.images.length + index,
    }))

    onChange((prev) => ({
      ...prev,
      images: [...prev.images, ...selectedImages].map((image, index) => ({ ...image, sort: index })),
    }))

    setUploading(false)
  }

  const removeImage = (index: number) => {
    const image = draft.images[index]
    if (image) URL.revokeObjectURL(image.previewUrl)

    onChange((prev) => ({
      ...prev,
      images: prev.images.filter((_, imageIndex) => imageIndex !== index).map((image, sort) => ({ ...image, sort })),
    }))
    setError('')
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-5 pb-5">
        <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Golden Land</p>
        <h2 className="mt-2 text-2xl font-bold text-zinc-900">Bước 2: Hình ảnh</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Tải ảnh từ máy tính để khách xem rõ tình trạng bất động sản trước khi liên hệ.
        </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-900">Yêu cầu ảnh</p>
        <div className="mt-2 space-y-1">
          <p>- Tối thiểu {MIN_IMAGES} ảnh, tối đa {MAX_IMAGES} ảnh.</p>
          <p>- Ảnh đầu tiên sẽ là ảnh đại diện.</p>
          <p>- Hỗ trợ JPG, PNG, WEBP và các định dạng ảnh phổ biến.</p>
        </div>
        </div>

        <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-900">
            Ảnh đã tải lên <span className="font-normal text-zinc-500">({draft.images.length}/{MAX_IMAGES})</span>
          </h3>

          {remainingSlots > 0 ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {uploading ? 'Đang tải...' : 'Thêm ảnh'}
            </button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            const input = event.currentTarget
            void handleFiles(input.files).finally(() => {
              input.value = ''
            })
          }}
        />

        {draft.images.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-white p-10 text-center transition hover:border-red-300 hover:bg-red-50/40 disabled:opacity-60"
          >
            <ImagePlus className="h-10 w-10 text-zinc-400" />
            <span className="mt-3 text-sm font-semibold text-zinc-700">Chọn ảnh từ máy</span>
            <span className="mt-1 text-xs text-zinc-500">Cần ít nhất {MIN_IMAGES} ảnh để sang bước tiếp theo</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {draft.images.map((img, index) => (
              <div key={`${img.previewUrl}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                {index === 0 ? (
                  <span className="absolute left-1.5 top-1.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Ảnh bìa
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label="Xóa ảnh"
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition hover:bg-black group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {remainingSlots > 0 ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 text-zinc-400 transition hover:border-red-300 hover:text-red-500 disabled:opacity-60"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="mt-1 text-xs font-medium">Thêm</span>
              </button>
            ) : null}
          </div>
        )}

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {!canGoPhase3 ? (
          <p className="mt-2 text-xs text-zinc-500">
            Cần thêm {Math.max(MIN_IMAGES - draft.images.length, 0)} ảnh để mở bước tiếp theo.
          </p>
        ) : (
          <p className="mt-2 text-xs font-medium text-emerald-600">Đủ ảnh, bạn có thể tiếp tục.</p>
        )}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-6 flex items-center justify-between gap-3 border-t border-zinc-100 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            Đóng
          </button>
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoPhase3}
          className="rounded-full bg-red-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
        >
          Tiếp theo
        </button>
      </div>
    </div>
  )
}
