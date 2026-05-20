export function formatVND(n: number | null | undefined): string {
  const v = Number(n) || 0
  return new Intl.NumberFormat('vi-VN').format(v) + '₫'
}

export function formatCompactVND(n: number | null | undefined): string {
  const v = Number(n) || 0
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' tỷ'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' tr'
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k'
  return String(v)
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '-'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return '-'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relativeTime(d: string | Date | null | undefined): string {
  if (!d) return '-'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '-'

  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  return formatDate(date)
}

const propertyTypeLabels: Record<string, string> = {
  house: 'Nhà riêng',
  apartment: 'Chung cư',
  land: 'Đất nền',
  villa: 'Biệt thự',
  townhouse: 'Nhà phố',
  shophouse: 'Shophouse',
  penthouse: 'Penthouse',
  condotel: 'Condotel',
  warehouse: 'Kho/Xưởng',
  commercial: 'Mặt bằng',
}

export const propertyTypeLabel = (k?: string | null) =>
  (k && propertyTypeLabels[k]) || k || '-'

const statusLabels: Record<string, string> = {
  draft: 'Nháp',
  pending: 'Chờ duyệt',
  active: 'Đang hiển thị',
  expired: 'Hết hạn',
  sold: 'Đã bán',
  rejected: 'Bị từ chối',
}

export const propertyStatusLabel = (k?: string | null) => (k && statusLabels[k]) || k || '-'

export function propertyStatusBadgeClass(status?: string | null): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-700'
    case 'active':
      return 'bg-emerald-100 text-emerald-700'
    case 'rejected':
      return 'bg-rose-100 text-rose-700'
    case 'sold':
      return 'bg-slate-200 text-slate-700'
    case 'expired':
      return 'bg-slate-100 text-slate-500'
    case 'draft':
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const reportReasonLabels: Record<string, string> = {
  scam: 'Tin giả / Lừa đảo',
  wrong_info: 'Sai thông tin',
  duplicate: 'Trùng lặp',
  wrong_image: 'Ảnh không đúng',
  sold_not_removed: 'Đã bán chưa gỡ',
  other: 'Khác',
}

export const reportReasonLabel = (k?: string | null) =>
  (k && reportReasonLabels[k]) || k || '-'

export const listingTypeLabel = (k?: string | null) =>
  k === 'sale' ? 'Bán' : k === 'rent' ? 'Cho thuê' : k || '-'