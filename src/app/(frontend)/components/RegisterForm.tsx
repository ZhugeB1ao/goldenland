'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { registerThunk, selectAuthLoading, selectAuthError } from '../store/slices/authSlice'
import { fetchFavoritesThunk } from '../store/slices/favoritesSlice'
import type { RootState, AppDispatch } from '../store'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// Validation Schema
const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'Bạn phải đồng ý với điều khoản dịch vụ',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

type RegisterFormProps = {
  onClose: () => void
  onSwitchToSignIn: () => void
}

export function RegisterForm({ onClose, onSwitchToSignIn }: RegisterFormProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const loading = useSelector((state: RootState) => selectAuthLoading(state as any))
  const reduxError = useSelector((state: RootState) => selectAuthError(state as any))

  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
    mode: 'onBlur',
  })

  const agreeTerms = watch('agreeTerms')

  const onSubmit = async (data: RegisterFormData) => {
    const result = await dispatch(
      registerThunk({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      }),
    )
    if (result.type.endsWith('/fulfilled')) {
      await dispatch(fetchFavoritesThunk())
      onClose()
      router.refresh()
    }
  }

  const nextStep = async () => {
    const isStep1Valid = await trigger(['fullName', 'email'])
    if (isStep1Valid) {
      setStep(2)
    }
  }

  const prevStep = () => {
    setStep(1)
  }

  return (
    <div className="h-full flex font-sans overflow-hidden">
      {/* ── Left Panel — Architectural Image ── */}
      <div className="relative hidden md:flex md:w-1/2 lg:w-[55%] flex-col justify-end overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
          alt="Architecture"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="relative z-10 p-10 pb-12">
          <h1 className="text-white text-3xl font-bold leading-tight mb-3">
            Tìm nhà đất
            <br />
            Batdongsan.com.vn dẫn lối
          </h1>
          <p className="text-white/75 text-sm leading-relaxed max-w-sm">
            Khám phá hàng ngàn bất động sản cao cấp và thông tin kiến trúc độc quyền dành riêng cho
            bạn.
          </p>
        </div>
      </div>

      {/* ── Right Panel — Register Form ── */}
      <div className="flex flex-1 items-center justify-center bg-white px-8 py-12 relative overflow-y-auto custom-scrollbar">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 z-20">
          <div
            className="h-full bg-red-600 transition-all duration-300 ease-in-out"
            style={{ width: `${step === 1 ? '50%' : '100%'}` }}
          />
        </div>

        <div className="w-full max-w-sm">
          {step === 2 && (
            <button
              onClick={prevStep}
              className="absolute top-6 left-8 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-xs font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Quay lại
            </button>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Đăng ký tài khoản mới</h2>
          <p className="text-sm text-gray-500 mb-8">
            {step === 1
              ? 'Hãy cho chúng tôi biết thông tin cơ bản của bạn.'
              : 'Cài đặt mật khẩu để bảo vệ tài khoản.'}
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 ? (
              <div className="space-y-5">
                {/* Full Name input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên</label>
                  <input
                    {...register('fullName')}
                    disabled={loading}
                    placeholder="Nhập họ và tên của bạn"
                    className={`w-full border ${errors.fullName ? 'border-red-500' : 'border-gray-200'} rounded-md px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    {...register('email')}
                    disabled={loading}
                    placeholder="your@email.com"
                    className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-md px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Spacer to match Step 2 height */}
                <div className="h-[66px] hidden sm:block" aria-hidden="true"></div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-md transition text-sm tracking-wide flex items-center justify-center gap-2"
                >
                  Tiếp tục
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Password input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      disabled={loading}
                      placeholder="Nhập mật khẩu"
                      className={`w-full border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-md px-4 py-2.5 pr-10 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      disabled={loading}
                      placeholder="Nhập lại mật khẩu"
                      className={`w-full border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} rounded-md px-4 py-2.5 pr-10 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Terms checkbox */}
                <div className="min-h-[66px]">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register('agreeTerms')}
                      disabled={loading}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-600 leading-snug">
                      Tôi đồng ý với{' '}
                      <a href="#" className="text-red-600 font-medium hover:underline">
                        Điều khoản
                      </a>{' '}
                      và{' '}
                      <a href="#" className="text-red-600 font-medium hover:underline">
                        Chính sách
                      </a>{' '}
                      của Batdongsan.com.vn
                    </span>
                  </label>
                  {errors.agreeTerms && (
                    <p className="mt-1 text-xs text-red-500">{errors.agreeTerms.message}</p>
                  )}
                </div>

                {/* <div className="min-h-[20px]">
                  {reduxError ? (
                    <p className="text-xs font-medium text-red-600">{reduxError}</p>
                  ) : null}
                </div> */}

                <button
                  type="submit"
                  disabled={loading || !agreeTerms}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 active:bg-red-800 text-white font-semibold py-3 rounded-md transition text-sm tracking-wide disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>
              </div>
            )}
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-widest whitespace-nowrap">
              Hoặc đăng ký với
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={loading}
              className="flex items-center justify-center gap-2 border border-gray-200 rounded-md py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition font-medium disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              disabled={loading}
              className="flex items-center justify-center gap-2 border border-gray-200 rounded-md py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition font-medium disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.77M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Apple
            </button>
          </div>

          {/* Sign in link */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Bạn đã có tài khoản?{' '}
            <button
              type="button"
              onClick={onSwitchToSignIn}
              className="text-red-600 font-semibold hover:underline"
            >
              Đăng nhập tại đây
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterForm
