'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { signInThunk, selectAuthLoading, selectAuthError } from '../store/slices/authSlice'
import { fetchFavoritesThunk } from '../store/slices/favoritesSlice'
import type { RootState, AppDispatch } from '../store'

type SignInFormProps = {
  onClose: () => void
  onSwitchToRegister: () => void
}

export function SignInForm({ onClose, onSwitchToRegister }: SignInFormProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const loading = useSelector((state: RootState) => selectAuthLoading(state as any))
  const error = useSelector((state: RootState) => selectAuthError(state as any))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = await dispatch(signInThunk({ email, password }))
    if (result.type.endsWith('/fulfilled')) {
      await dispatch(fetchFavoritesThunk())
      onClose()
      router.refresh()
    }
  }

  return (
    <div className="h-full flex font-sans">
      {/* Left Panel — Architectural Image */}
      <div className="relative hidden md:flex md:w-1/2 lg:w-[55%] flex-col justify-end overflow-hidden">
        {/* Background image via gradient placeholder — swap src for real image */}
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
          alt="Architecture"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Bottom text */}
        <div className="relative z-10 p-10 pb-12">
          <h1 className="text-white text-3xl font-bold leading-tight mb-3">
            The Art of Living Curated.
          </h1>
          <p className="text-white/75 text-sm leading-relaxed max-w-sm">
            Access premium architectural insights and exclusive real estate listings designed for
            the discerning eye.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex flex-1 items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Đăng nhập để tiếp tục</h2>
          <p className="text-sm text-gray-500 mb-8">
            Chào mừng bạn quay trở lại không gian kiến trúc của chúng tôi.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email / Phone */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại hoặc Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                placeholder="your@email.com"
                className="w-full border border-gray-200 rounded-md px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  className="w-full border border-gray-200 rounded-md px-4 py-2.5 pr-10 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? (
                    /* Eye-off icon */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7a9.77 9.77 0 012.17-3.17M6.53 6.53A9.77 9.77 0 0112 5c5 0 9 4 9 7a9.77 9.77 0 01-1.31 2.7M15 12a3 3 0 01-4.24 4.24M9.88 9.88A3 3 0 0115 12M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    /* Eye icon */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  disabled={loading}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-600">Nhớ tài khoản</span>
              </label>
              <a href="#" className="text-sm text-red-600 hover:underline font-medium">
                Quên mật khẩu?
              </a>
            </div>

            {error ? <p className="mb-4 text-sm font-medium text-red-600">{error}</p> : null}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 rounded-md transition text-sm tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-widest whitespace-nowrap">
              Hoặc đăng nhập với
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-md py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition font-medium">
              {/* Google icon */}
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
            <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-md py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition font-medium">
              {/* Apple icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.77M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Apple
            </button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Chưa là thành viên?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-red-600 font-semibold hover:underline"
            >
              Đăng ký tại đây
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignInForm
