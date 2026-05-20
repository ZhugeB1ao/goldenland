'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  href: string
  label: string
  icon: string
}

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Tổng quan',
    items: [{ href: '/quan-tri', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    title: 'Nội dung',
    items: [
      { href: '/quan-tri/tin-dang', label: 'Duyệt tin đăng', icon: 'fact_check' },
      { href: '/quan-tri/bao-cao', label: 'Báo cáo tin', icon: 'flag' },
      { href: '/quan-tri/du-an', label: 'Dự án', icon: 'apartment' },
      { href: '/quan-tri/bai-viet', label: 'Bài viết', icon: 'article' },
    ],
  },
  {
    title: 'Người dùng & Tài chính',
    items: [
      { href: '/quan-tri/nguoi-dung', label: 'Người dùng', icon: 'group' },
      { href: '/quan-tri/don-hang', label: 'Đơn hàng', icon: 'receipt_long' },
      { href: '/quan-tri/goi', label: 'Gói & Bảng giá', icon: 'workspace_premium' },
    ],
  },
  {
    title: 'Cấu hình',
    items: [
      { href: '/quan-tri/banner', label: 'Banner', icon: 'view_carousel' },
      { href: '/admin', label: 'Payload Admin', icon: 'tune' },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/quan-tri') return pathname === '/quan-tri'
    return pathname?.startsWith(href)
  }

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-100 min-h-screen sticky top-0 self-start">
      <div className="px-6 py-5 border-b border-slate-800">
        <Link href="/quan-tri" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400">apartment</span>
          <span className="font-bold text-lg tracking-wide">Golden Land</span>
        </Link>
        <p className="text-xs text-slate-400 mt-1">Trang quản trị</p>
      </div>

      <nav className="px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        active
                          ? 'bg-amber-500/10 text-amber-300 font-medium'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}