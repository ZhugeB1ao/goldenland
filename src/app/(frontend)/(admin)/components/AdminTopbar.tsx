'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/services/auth'

type Props = {
  user: {
    id: number | string
    email: string
    fullName: string
    avatarUrl: string | null
  }
}

export default function AdminTopbar({ user }: Props) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
    } finally {
      router.push('/')
      router.refresh()
    }
  }

  const initial = (user.fullName || user.email || 'A').trim().charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="material-symbols-outlined text-[18px]">shield_person</span>
          <span>Khu vực quản trị nội bộ</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            Về trang chính
          </Link>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-semibold">
              {initial}
            </div>
            <div className="text-sm leading-tight">
              <div className="font-medium text-slate-800">{user.fullName || user.email}</div>
              <div className="text-xs text-slate-500">Quản trị viên</div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="ml-2 px-3 py-1.5 text-sm rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  )
}