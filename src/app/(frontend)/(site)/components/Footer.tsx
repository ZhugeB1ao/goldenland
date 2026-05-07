export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-100 bg-stone-50 pb-8 pt-16">
      <div className="mx-auto mb-16 grid max-w-screen-2xl grid-cols-1 gap-8 px-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-6">
          <span className="font-lexend text-lg font-bold uppercase tracking-wider text-zinc-900">
            TUYỂN CHỌN KIẾN TRÚC
          </span>
          <p className="text-sm leading-relaxed text-zinc-500">
            Nền tảng báo chí và thông tin bất động sản hàng đầu dành cho các nhà đầu tư và người yêu
            kiến trúc bền vững.
          </p>
          <div className="flex gap-4">
            <a
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container transition-all hover:bg-primary hover:text-white"
              href="#"
            >
              <span className="material-symbols-outlined text-xl">share</span>
            </a>
          </div>
        </div>
        <div>
          <h5 className="mb-6 font-lexend text-sm font-bold uppercase tracking-widest text-zinc-900">
            Danh mục
          </h5>
          <ul className="space-y-4">
            <li>
              <a
                className="font-lexend text-sm text-zinc-500 transition-colors hover:text-red-700"
                href="#"
              >
                Mua bán nhà đất
              </a>
            </li>
            <li>
              <a
                className="font-lexend text-sm text-zinc-500 transition-colors hover:text-red-700"
                href="#"
              >
                Cho thuê căn hộ
              </a>
            </li>
            <li>
              <a
                className="font-lexend text-sm text-zinc-500 transition-colors hover:text-red-700"
                href="#"
              >
                Dự án mới công bố
              </a>
            </li>
            <li>
              <a
                className="font-lexend text-sm text-zinc-500 transition-colors hover:text-red-700"
                href="#"
              >
                Phân tích thị trường
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h5 className="mb-6 font-lexend text-sm font-bold uppercase tracking-widest text-zinc-900">
            Hỗ trợ khách hàng
          </h5>
          <ul className="space-y-4">
            <li>
              <a
                className="font-lexend text-sm text-zinc-500 transition-colors hover:text-red-700"
                href="#"
              >
                Về chúng tôi
              </a>
            </li>
            <li>
              <a
                className="font-lexend text-sm text-zinc-500 transition-colors hover:text-red-700"
                href="#"
              >
                Liên hệ
              </a>
            </li>
            <li>
              <a
                className="font-lexend text-sm text-zinc-500 transition-colors hover:text-red-700"
                href="#"
              >
                Điều khoản
              </a>
            </li>
            <li>
              <a
                className="font-lexend text-sm text-zinc-500 transition-colors hover:text-red-700"
                href="#"
              >
                Bảo mật
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h5 className="mb-6 font-lexend text-sm font-bold uppercase tracking-widest text-zinc-900">
            Liên hệ
          </h5>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-sm text-zinc-500">
              <span className="material-symbols-outlined text-lg text-primary">location_on</span>
              72 Lê Thánh Tôn, Quận 1, TP. Hồ Chí Minh
            </li>
            <li className="flex items-center gap-3 text-sm text-zinc-500">
              <span className="material-symbols-outlined text-lg text-primary">call</span>
              1900 1907
            </li>
            <li className="flex items-center gap-3 text-sm text-zinc-500">
              <span className="material-symbols-outlined text-lg text-primary">mail</span>
              contact@editorial-re.vn
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-4 border-t border-zinc-100 px-8 pt-8 md:flex-row">
        <p className="font-lexend text-sm text-zinc-500">
          © 2026 Goldenland. Nền tảng thông tin bất động sản và tuyển chọn kiến trúc.
        </p>
        <div className="flex gap-6">
          <a
            className="font-lexend text-sm text-zinc-500 transition-colors hover:text-zinc-800"
            href="#"
          >
            Facebook
          </a>
          <a
            className="font-lexend text-sm text-zinc-500 transition-colors hover:text-zinc-800"
            href="#"
          >
            LinkedIn
          </a>
          <a
            className="font-lexend text-sm text-zinc-500 transition-colors hover:text-zinc-800"
            href="#"
          >
            Instagram
          </a>
        </div>
      </div>
    </footer>
  )
}
