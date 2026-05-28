'use client'

import type { FormData } from '../page'
import { formatLocationByCodes } from '../../properties/lib/utils'

type Props = {
  data: FormData
  submitting: boolean
  error: string
  onSubmit: () => void
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: 'Nhà riêng', apartment: 'Căn hộ', land: 'Đất', villa: 'Biệt thự',
  townhouse: 'Nhà phố', shophouse: 'Shophouse', penthouse: 'Penthouse',
  condotel: 'Condotel', warehouse: 'Kho xưởng', commercial: 'Thương mại',
}
const PRICE_UNIT_LABELS: Record<string, string> = {
  total: 'Tổng giá', per_m2: 'Giá/m²', per_month: 'Giá/tháng', negotiable: 'Thỏa thuận',
}
const DIRECTION_LABELS: Record<string, string> = {
  east: 'Đông', west: 'Tây', south: 'Nam', north: 'Bắc',
  northeast: 'Đông Bắc', southeast: 'Đông Nam', northwest: 'Tây Bắc', southwest: 'Tây Nam',
}
const LEGAL_LABELS: Record<string, string> = {
  red_book: 'Sổ đỏ / Sổ hồng', sale_contract: 'Hợp đồng mua bán',
  pending: 'Đang chờ sổ', other: 'Giấy tờ khác',
}
const FURNITURE_LABELS: Record<string, string> = {
  luxury: 'Nội thất cao cấp', full: 'Đầy đủ nội thất',
  basic: 'Nội thất cơ bản', none: 'Không nội thất',
}

function formatPrice(price: number, unit: string): string {
  if (unit === 'negotiable') return 'Thỏa thuận'
  if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(2)} tỷ`
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)} triệu`
  return `${price.toLocaleString('vi-VN')} đ`
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex py-2 border-b border-gray-100 last:border-0">
      <span className="w-36 flex-shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  )
}

export default function Step5Preview({ data, submitting, error, onSubmit }: Props) {
  const fallbackLocation = formatLocationByCodes({
    provinceCode: data.provinceCode,
    wardCode: data.wardCode,
    street: data.street,
  })
  const publicLocation = data.address.trim() || fallbackLocation

  return (
    <div className="space-y-6">
      {data.images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {data.images.slice(0, 8).map((img, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img src={img.image} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{data.title}</h3>
        <p className="text-emerald-600 font-bold text-lg">
          {data.price ? formatPrice(data.price, data.priceUnit) : 'Chưa nhập giá'}
          {data.priceUnit && data.priceUnit !== 'negotiable' && (
            <span className="text-sm font-normal text-gray-500 ml-1">
              ({PRICE_UNIT_LABELS[data.priceUnit]})
            </span>
          )}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">📍 {publicLocation}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Thông tin chi tiết</h4>
        <Row label="Loại giao dịch" value="Bán" />
        <Row label="Loại BĐS" value={PROPERTY_TYPE_LABELS[data.propertyType]} />
        <Row label="Diện tích" value={data.area ? `${data.area} m²` : null} />
        <Row label="Phòng ngủ" value={data.bedrooms ? `${data.bedrooms} phòng` : null} />
        <Row label="Phòng tắm" value={data.bathrooms ? `${data.bathrooms} phòng` : null} />
        <Row label="Hướng nhà" value={data.direction ? DIRECTION_LABELS[data.direction] : null} />
        <Row label="Pháp lý" value={data.legalStatus ? LEGAL_LABELS[data.legalStatus] : null} />
        <Row label="Nội thất" value={data.furnitureStatus ? FURNITURE_LABELS[data.furnitureStatus] : null} />
      </div>

      {data.description && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Mô tả</h4>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{data.description}</p>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        Sau khi đăng, tin sẽ được kiểm duyệt trước khi hiển thị công khai. Thường mất 1–24 giờ.
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition text-sm"
      >
        {submitting ? 'Đang đăng tin...' : 'Xác nhận đăng tin'}
      </button>
    </div>
  )
}
