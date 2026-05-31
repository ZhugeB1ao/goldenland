
'use client'

import Link from 'next/link'

const navLinks = [
  { href: '/account/profile', label: 'Thông tin cá nhân' },
  { href: '/account/management', label: 'Quản lý' },
  { href: '/account/setting', label: 'Cài đặt tài khoản' },
  { href: '/account/membership', label: 'Gói Hội Viên' },
]

export default function SideBar({ onCreatePostClick }: { onCreatePostClick?: () => void }) {
  return (
    <aside className="w-64 border-r border-zinc-200 bg-gray-100 p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Tài khoản của tôi</h2>
        <button
          type="button"
          onClick={onCreatePostClick}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white transition hover:bg-red-700"
          aria-label="Tạo tin mới"
          title="Tạo tin mới"
        >
          +
        </button>
      </div>
      <ul>
        {navLinks.map((link) => (
          <li key={link.href} className="mb-2">
            <Link href={link.href} className="text-red-500 hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
