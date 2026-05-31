'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectUser } from '@/app/store/slices/authSlice'
import type { RootState } from '@/app/store'
import Step1Type from './components/Step1Type'
import Step2Info from './components/Step2Info'
import Step3Location from './components/Step3Location'
import Step4Images from './components/Step4Images'
import Step5Preview from './components/Step5Preview'

export type FormData = {
  propertyType: string
  title: string
  price: number
  priceUnit: string
  area: number
  bedrooms: number
  bathrooms: number
  direction: string
  legalStatus: string
  furnitureStatus: string
  description: string
  provinceCode: string
  wardCode: string
  street: string
  address: string
  project: string
  latitude: number | null
  longitude: number | null
  images: { image: string; sort: number }[]
  videoUrl: string
}

const INITIAL: FormData = {
  propertyType: '',
  title: '',
  price: 0,
  priceUnit: 'total',
  area: 0,
  bedrooms: 0,
  bathrooms: 0,
  direction: '',
  legalStatus: '',
  furnitureStatus: '',
  description: '',
  provinceCode: '',
  wardCode: '',
  street: '',
  address: '',
  project: '',
  latitude: null,
  longitude: null,
  images: [],
  videoUrl: '',
}

const STEPS = [
  { label: 'Loại tin', short: '1' },
  { label: 'Thông tin', short: '2' },
  { label: 'Vị trí', short: '3' },
  { label: 'Hình ảnh', short: '4' },
  { label: 'Xem trước', short: '5' },
]

function validateStep(step: number, data: FormData): string {
  if (step === 0) {
    if (!data.propertyType) return 'Vui lòng chọn loại bất động sản'
  }
  if (step === 1) {
    if (!data.title.trim()) return 'Vui lòng nhập tiêu đề tin đăng'
    if (!data.price) return 'Vui lòng nhập giá'
    if (!data.description.trim()) return 'Vui lòng nhập mô tả'
  }
  if (step === 2) {
    if (!data.provinceCode) return 'Vui lòng chọn tỉnh/thành phố'
  }
  return ''
}

export default function DangTinPage() {
  const router = useRouter()
  const user = useSelector((state: RootState) => selectUser(state as any))
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(INITIAL)
  const [validationError, setValidationError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const update = (field: keyof FormData, value: string | number | null) => {
    setData((prev) => ({ ...prev, [field]: value }))
    setValidationError('')
  }

  const goNext = () => {
    const err = validateStep(step, data)
    if (err) { setValidationError(err); return }
    setValidationError('')
    setStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setValidationError('')
    setStep((s) => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')

    const body = {
      title: data.title,
      description: data.description,
      propertyType: data.propertyType,
      price: data.price,
      priceUnit: data.priceUnit,
      area: data.area || undefined,
      bedrooms: data.bedrooms || undefined,
      bathrooms: data.bathrooms || undefined,
      direction: data.direction || undefined,
      legalStatus: data.legalStatus || undefined,
      furnitureStatus: data.furnitureStatus || undefined,
      provinceCode: data.provinceCode || undefined,
      wardCode: data.wardCode || undefined,
      street: data.street || undefined,
      address: data.address || undefined,
      project: data.project || undefined,
      latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
      longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
      images: data.images.length > 0 ? data.images : undefined,
      videoUrl: data.videoUrl || undefined,
      status: 'pending',
      user: user?.id,
    }

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        setSubmitError(err?.message || 'Có lỗi xảy ra, vui lòng thử lại.')
        return
      }

      router.push('/account/management?posted=1')
    } catch {
      setSubmitError('Không thể kết nối đến máy chủ, vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[80px] pb-16">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 pt-6">
          <h1 className="text-2xl font-bold text-gray-900">Đăng tin bất động sản</h1>
          <p className="text-sm text-gray-500 mt-1">Điền đầy đủ thông tin để tin đăng được duyệt nhanh hơn</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                    i < step
                      ? 'bg-emerald-500 text-white'
                      : i === step
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i < step ? '✓' : s.short}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${i === step ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step === 0 && (
            <Step1Type
              propertyType={data.propertyType}
              onChange={(field, value) => update(field, value)}
            />
          )}
          {step === 1 && <Step2Info data={data} onChange={update} />}
          {step === 2 && <Step3Location data={data} onChange={(f, v) => update(f, v)} />}
          {step === 3 && (
            <Step4Images
              images={data.images}
              videoUrl={data.videoUrl}
              onImagesChange={(imgs) => setData((prev) => ({ ...prev, images: imgs }))}
              onVideoChange={(url) => update('videoUrl', url)}
            />
          )}
          {step === 4 && (
            <Step5Preview
              data={data}
              submitting={submitting}
              error={submitError}
              onSubmit={handleSubmit}
            />
          )}

          {validationError && (
            <p className="mt-4 text-sm text-red-500">{validationError}</p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-5">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              ← Quay lại
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={goNext}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
            >
              Tiếp theo →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
