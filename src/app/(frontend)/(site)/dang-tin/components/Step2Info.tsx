'use client'

import type { FormData } from '../page'

type Props = {
  data: FormData
  onChange: (field: keyof FormData, value: string | number) => void
}

const PRICE_UNITS = [
  { value: 'total', label: 'Tổng giá' },
  { value: 'per_m2', label: 'Giá/m²' },
  { value: 'per_month', label: 'Giá/tháng' },
  { value: 'negotiable', label: 'Thỏa thuận' },
]

const DIRECTIONS = [
  { value: 'east', label: 'Đông' },
  { value: 'west', label: 'Tây' },
  { value: 'south', label: 'Nam' },
  { value: 'north', label: 'Bắc' },
  { value: 'northeast', label: 'Đông Bắc' },
  { value: 'southeast', label: 'Đông Nam' },
  { value: 'northwest', label: 'Tây Bắc' },
  { value: 'southwest', label: 'Tây Nam' },
]

const LEGAL_STATUSES = [
  { value: 'red_book', label: 'Sổ đỏ / Sổ hồng' },
  { value: 'sale_contract', label: 'Hợp đồng mua bán' },
  { value: 'pending', label: 'Đang chờ sổ' },
  { value: 'other', label: 'Giấy tờ khác' },
]

const FURNITURE_STATUSES = [
  { value: 'luxury', label: 'Nội thất cao cấp' },
  { value: 'full', label: 'Đầy đủ nội thất' },
  { value: 'basic', label: 'Nội thất cơ bản' },
  { value: 'none', label: 'Không nội thất' },
]

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
    />
  )
}

export default function Step2Info({ data, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <Label required>Tiêu đề tin đăng</Label>
        <textarea
          rows={2}
          maxLength={255}
          placeholder="VD: Bán nhà 3 tầng mặt tiền đường Lê Văn Lương, Hà Nội"
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{data.title.length}/255 ký tự</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label required>Giá</Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={data.price || ''}
            onChange={(e) => onChange('price', Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Đơn vị giá</Label>
          <Select value={data.priceUnit} onChange={(e) => onChange('priceUnit', e.target.value)}>
            {PRICE_UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Diện tích (m²)</Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={data.area || ''}
            onChange={(e) => onChange('area', Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Số phòng ngủ</Label>
          <Input
            type="number"
            min={0}
            max={99}
            placeholder="0"
            value={data.bedrooms || ''}
            onChange={(e) => onChange('bedrooms', Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Số phòng tắm</Label>
          <Input
            type="number"
            min={0}
            max={99}
            placeholder="0"
            value={data.bathrooms || ''}
            onChange={(e) => onChange('bathrooms', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Hướng nhà</Label>
          <Select value={data.direction} onChange={(e) => onChange('direction', e.target.value)}>
            <option value="">-- Chọn hướng --</option>
            {DIRECTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Tình trạng pháp lý</Label>
          <Select value={data.legalStatus} onChange={(e) => onChange('legalStatus', e.target.value)}>
            <option value="">-- Chọn pháp lý --</option>
            {LEGAL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label>Nội thất</Label>
        <Select value={data.furnitureStatus} onChange={(e) => onChange('furnitureStatus', e.target.value)}>
          <option value="">-- Chọn tình trạng nội thất --</option>
          {FURNITURE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label required>Mô tả chi tiết</Label>
        <textarea
          rows={5}
          maxLength={5000}
          placeholder="Mô tả chi tiết về bất động sản: vị trí, tiện ích, đặc điểm nổi bật..."
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none"
        />
      </div>
    </div>
  )
}
