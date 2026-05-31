import Link from 'next/link'

const footerLinks = [
  { href: '#', label: 'Về chúng tôi' },
  { href: '#', label: 'Liên hệ' },
  { href: '#', label: 'Điều khoản' },
  { href: '#', label: 'Bảo mật' },
]

const categoryLinks = [
  { href: '#', label: 'Căn hộ cao cấp' },
  { href: '#', label: 'Biệt thự phố' },
  { href: '#', label: 'Penthouse' },
  { href: '#', label: 'Văn phòng sáng tạo' },
]

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-50 pt-12 text-sm">
      <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 gap-8 px-4 pb-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <h3 className="text-lg font-bold uppercase tracking-[0.18em] text-zinc-900">Golden Land</h3>
          <p className="leading-relaxed text-zinc-600">
            Cổng thông tin bất động sản dành cho môi giới, nhà đầu tư và khách hàng tìm kiếm không gian sống chất lượng.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-zinc-900">Liên kết</h4>
          <nav className="flex flex-col gap-2">
            {footerLinks.map((item) => (
              <Link key={item.label} href={item.href} className="text-zinc-600 transition hover:text-zinc-900">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-zinc-900">Danh mục</h4>
          <nav className="flex flex-col gap-2">
            {categoryLinks.map((item) => (
              <Link key={item.label} href={item.href} className="text-zinc-600 transition hover:text-zinc-900">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-zinc-900">Bản tin</h4>
          <p className="text-zinc-600">Đăng ký để nhận thông tin dự án mới nhất mỗi tuần.</p>
          <div className="flex gap-2">
            <input
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs outline-none ring-red-500 transition focus:ring-2"
              placeholder="Email của bạn"
              type="email"
            />
            <button className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700">
              Gửi
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-zinc-500 md:flex-row">
          <p>© 2026 Golden Land. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="transition hover:text-red-600">
              Facebook
            </Link>
            <Link href="#" className="transition hover:text-red-600">
              Instagram
            </Link>
            <Link href="#" className="transition hover:text-red-600">
              LinkedIn
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
