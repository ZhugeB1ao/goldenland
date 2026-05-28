'use client'

type Props = {
  propertyType: string
  onChange: (field: 'propertyType', value: string) => void
}

const PROPERTY_TYPES = [
  { value: 'house', label: 'Nhà riêng' },
  { value: 'apartment', label: 'Căn hộ' },
  { value: 'land', label: 'Đất' },
  { value: 'villa', label: 'Biệt thự' },
  { value: 'townhouse', label: 'Nhà phố' },
  { value: 'shophouse', label: 'Shophouse' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'condotel', label: 'Condotel' },
  { value: 'warehouse', label: 'Kho xưởng' },
  { value: 'commercial', label: 'Thương mại' },
]

export default function Step1Type({ propertyType, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-2">Loại bất động sản</h2>
        <select
          value={propertyType}
          onChange={(e) => onChange('propertyType', e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
        >
          <option value="">-- Chọn loại bất động sản --</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
