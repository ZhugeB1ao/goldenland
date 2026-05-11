type PropertiesHeaderProps = {
  totalDocs: number
}

export function PropertiesHeader({ totalDocs }: PropertiesHeaderProps) {
  return (
    <section className="mb-8">
      <nav className="flex text-xs text-secondary gap-2 mb-4 font-body">
        <a href="/" className="hover:text-primary transition-colors">
          Trang chủ
        </a>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="text-on-surface">Bán nhà đất trên toàn quốc</span>
      </nav>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-lexend tracking-tight text-on-surface">
            Bán nhà đất trên toàn quốc
          </h1>
          <p className="text-sm text-secondary mt-1">
            Hiện có <span className="font-bold text-on-surface">{totalDocs}</span> tin đăng nhà đất
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white border border-outline-variant/30 px-4 py-2 rounded-lg text-sm hover:bg-surface-container transition-colors shadow-sm">
            <span className="material-symbols-outlined text-lg">history_edu</span>
            Biến động giá
          </button>
          <button className="flex items-center gap-2 bg-white border border-outline-variant/30 px-4 py-2 rounded-lg text-sm hover:bg-surface-container transition-colors shadow-sm">
            <span className="material-symbols-outlined text-lg">map</span>
            Xem bản đồ
          </button>
        </div>
      </div>
    </section>
  )
}
