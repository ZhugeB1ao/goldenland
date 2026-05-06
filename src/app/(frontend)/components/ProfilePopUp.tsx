import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { signOutThunk, selectUser } from '../store/slices/authSlice'
import type { RootState, AppDispatch } from '../store'

const Crown = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path
      d="M3 18h18M5 18L3 8l4.5 4L12 4l4.5 8L21 8l-2 10H5z"
      fill="#FFD700"
      stroke="#FFA500"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

const menuItems = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <path d="M4 4h16v2H4zM4 10h16M4 16h10" />
        <path d="M17 14l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Chuyển sang đăng tin',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" strokeLinecap="round" />
      </svg>
    ),
    label: 'Tổng quan',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h10M7 13h6" strokeLinecap="round" />
      </svg>
    ),
    label: 'Quản lý tin đăng',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <circle cx="17" cy="8" r="3" />
        <path d="M21 20c0-3.3-1.8-6-4-6" strokeLinecap="round" />
      </svg>
    ),
    label: 'Quản lý khách hàng',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <path d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
    label: 'Môi giới chuyên nghiệp',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20v-2a6 6 0 0112 0v2" />
        <path d="M18 14l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Gói hội viên',
    badge: 'Tiết kiệm đến -39%',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <rect x="2" y="6" width="20" height="13" rx="2" />
        <path d="M2 10h20M7 15h.01M11 15h3" strokeLinecap="round" />
      </svg>
    ),
    label: 'Nạp tiền',
  },
]

const settingItems = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    label: 'Cài đặt tài khoản',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
      </svg>
    ),
    label: 'Đổi mật khẩu',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-5 h-5"
      >
        <path
          d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    label: 'Đăng xuất',
  },
]

export default function ProfilePopUp() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const user = useSelector((state: RootState) => selectUser(state as any))
  const [activeItem, setActiveItem] = useState<number | null>(null)

  const handleLogout = async () => {
    await dispatch(signOutThunk())
    router.refresh()
  }

  return (
    <div
      className="w-80 bg-white rounded-2xl shadow-xl overflow-hidden font-sans"
      style={{ fontFamily: "'Be Vietnam Pro', 'Segoe UI', sans-serif" }}
    >
      {/* VIP Banner */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #fff0f0 0%, #ffd6d6 100%)' }}
      >
        {/* Decorative diagonal stripes */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-red-400"
              style={{
                width: '2px',
                height: '200%',
                left: `${i * 14 + 50}%`,
                top: '-50%',
                transform: 'rotate(25deg)',
              }}
            />
          ))}
        </div>

        <div className="relative flex items-center gap-3 px-4 py-4">
          <div className="flex-shrink-0 p-2 bg-white rounded-xl shadow-sm">
            <Crown />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800 text-sm leading-tight">Gói voucher tin VIP</p>
            <p className="text-gray-500 text-xs mt-0.5 leading-snug">
              Tiết kiệm chi phí, nâng tầm tin đăng
            </p>
            <button
              className="mt-2 px-4 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(90deg, #e53935, #ef5350)' }}
            >
              Mua ngay
            </button>
          </div>
        </div>
      </div>

      {/* Username */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="font-semibold text-gray-800 text-[15px]">{user?.fullName || user?.email || 'User'}</p>
      </div>

      {/* Main Menu */}
      <div className="py-1">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => setActiveItem(idx)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 group
                ${activeItem === idx ? 'bg-red-50' : 'hover:bg-gray-50'}`}
          >
            <span
              className={`flex-shrink-0 transition-colors ${activeItem === idx ? 'text-red-500' : 'text-gray-500 group-hover:text-red-400'}`}
            >
              {item.icon}
            </span>
            <span
              className={`flex-1 text-sm font-medium transition-colors ${activeItem === idx ? 'text-red-600' : 'text-gray-700'}`}
            >
              {item.label}
            </span>
            {item.badge && (
              <span className="text-[11px] font-semibold text-teal-500 bg-teal-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mx-4 my-1" />

      {/* Settings & Logout */}
      <div className="py-1 pb-3">
        {settingItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (item.label === 'Đăng xuất') {
                handleLogout()
              } else {
                setActiveItem(menuItems.length + idx)
              }
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 group
                ${activeItem === menuItems.length + idx ? 'bg-red-50' : 'hover:bg-gray-50'}`}
          >
            <span
              className={`flex-shrink-0 transition-colors ${activeItem === menuItems.length + idx ? 'text-red-500' : 'text-gray-500 group-hover:text-red-400'}`}
            >
              {item.icon}
            </span>
            <span
              className={`text-sm font-medium transition-colors ${activeItem === menuItems.length + idx ? 'text-red-600' : 'text-gray-700'}`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
