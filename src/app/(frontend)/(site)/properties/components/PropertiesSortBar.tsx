export function PropertiesSortBar() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex gap-6 border-b border-outline-variant/30 text-sm font-medium">
        <button className="pb-3 border-b-2 border-primary text-primary">Thông thường</button>
        <button className="pb-3 text-secondary hover:text-on-surface transition-colors">
          Mới nhất
        </button>
        <button className="pb-3 text-secondary hover:text-on-surface transition-colors">
          Giá thấp đến cao
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded bg-surface-container-high text-on-surface">
          <span className="material-symbols-outlined">view_list</span>
        </button>
        <button className="p-2 rounded hover:bg-surface-container text-secondary transition-colors">
          <span className="material-symbols-outlined">grid_view</span>
        </button>
      </div>
    </div>
  )
}
