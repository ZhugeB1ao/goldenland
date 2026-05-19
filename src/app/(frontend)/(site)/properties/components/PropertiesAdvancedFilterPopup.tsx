'use client'

import { useState } from 'react'

type SelectOption = {
  value: string
  label: string
}

export type FilterState = {
  verifiedOnly: boolean
  propertyTypes: string[]
  priceRangeIds: string[]
  areaRangeIds: string[]
  minPriceInput: string
  maxPriceInput: string
  minAreaInput: string
  maxAreaInput: string
  provinceCodes: string[]
  wardCodes: string[]
  streets: string[]
  projectIds: string[]
  directions: string[]
  legalStatuses: string[]
  bedroomsList: number[]
  bathroomsList: number[]
}

type Props = {
  isOpen: boolean
  filters: FilterState
  draftFilters: FilterState | null
  onDraftChange: (next: FilterState | null) => void
  onApply: (next: FilterState) => void
  onCancel: () => void
  onClear: () => void
  propertyTypeOptions: SelectOption[]
  regionOptions: SelectOption[]
  wardOptions: Array<SelectOption & { provinceCode: string }>
  projectOptions: Array<SelectOption & { provinceCode: string; wardCode: string }>
  legalOptions: SelectOption[]
}

const BED_BATH_OPTIONS = [1, 2, 3, 4, 5]
const DIRECTIONS = [
  ['northwest', 'north', 'northeast'],
  ['west', '', 'east'],
  ['southwest', 'south', 'southeast'],
] as const
const DIRECTION_LABEL: Record<string, string> = {
  north: 'Bắc',
  south: 'Nam',
  east: 'Đông',
  west: 'Tây',
  northeast: 'ĐB',
  northwest: 'TB',
  southeast: 'ĐN',
  southwest: 'TN',
}
const LEGAL_LABEL: Record<string, string> = {
  red_book: 'Sổ đỏ/Sổ hồng',
  sale_contract: 'HĐ mua bán',
  pending: 'Đang chờ sổ',
  other: 'Khác',
}

export function PropertiesAdvancedFilterPopup({
  isOpen,
  filters,
  draftFilters,
  onDraftChange,
  onApply,
  onCancel,
  onClear,
  propertyTypeOptions,
  regionOptions,
  wardOptions,
  projectOptions,
  legalOptions,
}: Props) {
  const [openCustomDropdown, setOpenCustomDropdown] = useState<
    null | 'type' | 'province' | 'ward' | 'project'
  >(null)
  const [typeCandidate, setTypeCandidate] = useState('')

  const workingFilters = draftFilters ?? filters
  const selectedProvince = workingFilters.provinceCodes[0] ?? ''
  const selectedWard = workingFilters.wardCodes[0] ?? ''
  const selectedProject = workingFilters.projectIds[0] ?? ''
  const filteredWardOptions = wardOptions.filter(
    (item) => !selectedProvince || item.provinceCode === selectedProvince,
  )
  const filteredProjectOptions = projectOptions.filter(
    (item) =>
      (!selectedProvince || item.provinceCode === selectedProvince) &&
      (!selectedWard || item.wardCode === selectedWard),
  )

  const selectedTypeLabel =
    propertyTypeOptions.find((item) => item.value === typeCandidate)?.label || 'Chọn loại bất động sản'
  const selectedProvinceLabel =
    regionOptions.find((item) => item.value === selectedProvince)?.label || 'Tỉnh / Thành'
  const selectedWardLabel =
    filteredWardOptions.find((item) => item.value === selectedWard)?.label || 'Phường / Xã'
  const selectedProjectLabel =
    filteredProjectOptions.find((item) => item.value === selectedProject)?.label || 'Dự án'

  const setWorkingFilters = (next: FilterState) => onDraftChange(next)

  if (!isOpen) return null

  const renderCustomDropdown = (
    id: 'type' | 'province' | 'ward' | 'project',
    label: string,
    options: SelectOption[],
    onSelect: (value: string) => void,
    disabled = false,
  ) => (
    <div className="relative">
      <button
        className="flex h-10 w-full items-center justify-between rounded-lg border border-outline-variant/40 px-3 text-sm disabled:opacity-50"
        disabled={disabled}
        onClick={() => !disabled && setOpenCustomDropdown((current) => (current === id ? null : id))}
        type="button"
      >
        <span className="truncate">{label}</span>
        <span className="material-symbols-outlined text-base text-secondary">expand_more</span>
      </button>
      {openCustomDropdown === id && !disabled && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-outline-variant/30 bg-white p-1 shadow-lg">
          <div className="max-h-44 overflow-y-auto">
            {options.length === 0 && <div className="px-2 py-1.5 text-xs text-secondary">Không có dữ liệu</div>}
            {options.map((option) => (
              <button
                key={`${id}-${option.value}`}
                className="flex w-full items-center rounded px-2 py-1.5 text-left text-sm hover:bg-surface-container"
                onClick={() => {
                  onSelect(option.value)
                  setOpenCustomDropdown(null)
                }}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="absolute left-0 top-full z-50 mt-2 w-[min(92vw,760px)] rounded-xl border border-outline-variant/30 bg-white p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Bộ lọc nâng cao</h3>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs text-secondary hover:text-on-surface" onClick={onClear} type="button">
            Xóa tất cả
          </button>
          <button className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs" onClick={onCancel} type="button">
            Huỷ
          </button>
          <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white" onClick={() => onApply(workingFilters)} type="button">
            Lọc
          </button>
        </div>
      </div>

      <div className="max-h-[62vh] space-y-5 overflow-y-auto pr-1">
        <section className="rounded-xl border border-outline-variant/30 p-3">
          <p className="mb-2 text-sm font-semibold">Loại bất động sản</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {workingFilters.propertyTypes.map((value) => {
              const label = propertyTypeOptions.find((item) => item.value === value)?.label || value
              return (
                <button
                  key={`type-chip-${value}`}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                  onClick={() =>
                    setWorkingFilters({
                      ...workingFilters,
                      propertyTypes: workingFilters.propertyTypes.filter((item) => item !== value),
                    })
                  }
                  type="button"
                >
                  {label} ×
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              {renderCustomDropdown('type', selectedTypeLabel, propertyTypeOptions, (value) => setTypeCandidate(value))}
            </div>
            <button
              className="rounded-lg border border-outline-variant/40 px-3 text-sm"
              onClick={() => {
                if (!typeCandidate || workingFilters.propertyTypes.includes(typeCandidate)) return
                setWorkingFilters({
                  ...workingFilters,
                  propertyTypes: [...workingFilters.propertyTypes, typeCandidate],
                })
                setTypeCandidate('')
              }}
              type="button"
            >
              Thêm
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant/30 p-3">
          <p className="mb-2 text-sm font-semibold">Khu vực & dự án</p>
          <div className="grid gap-2 md:grid-cols-2">
            {renderCustomDropdown('province', selectedProvinceLabel, regionOptions, (nextProvince) =>
              setWorkingFilters({
                ...workingFilters,
                provinceCodes: nextProvince ? [nextProvince] : [],
                wardCodes: [],
                streets: [],
                projectIds: [],
              }),
            )}
            {renderCustomDropdown(
              'ward',
              selectedWardLabel,
              filteredWardOptions.map((item) => ({ value: item.value, label: item.label })),
              (nextWard) =>
                setWorkingFilters({
                  ...workingFilters,
                  wardCodes: nextWard ? [nextWard] : [],
                  streets: [],
                  projectIds: [],
                }),
              !selectedProvince,
            )}
            {renderCustomDropdown(
              'project',
              selectedProjectLabel,
              filteredProjectOptions.map((item) => ({ value: item.value, label: item.label })),
              (nextProject) =>
                setWorkingFilters({
                  ...workingFilters,
                  projectIds: nextProject ? [nextProject] : [],
                }),
              !selectedWard,
            )}
          </div>
        </section>

        <section className="grid gap-3 rounded-xl border border-outline-variant/30 p-3 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold">Khoảng giá</p>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <input className="h-9 rounded-lg border border-outline-variant/40 px-2 text-sm" placeholder="Từ (VNĐ)" value={workingFilters.minPriceInput} onChange={(e) => setWorkingFilters({ ...workingFilters, minPriceInput: e.target.value })} />
              <input className="h-9 rounded-lg border border-outline-variant/40 px-2 text-sm" placeholder="Đến (VNĐ)" value={workingFilters.maxPriceInput} onChange={(e) => setWorkingFilters({ ...workingFilters, maxPriceInput: e.target.value })} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Diện tích</p>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <input className="h-9 rounded-lg border border-outline-variant/40 px-2 text-sm" placeholder="Từ (m²)" value={workingFilters.minAreaInput} onChange={(e) => setWorkingFilters({ ...workingFilters, minAreaInput: e.target.value })} />
              <input className="h-9 rounded-lg border border-outline-variant/40 px-2 text-sm" placeholder="Đến (m²)" value={workingFilters.maxAreaInput} onChange={(e) => setWorkingFilters({ ...workingFilters, maxAreaInput: e.target.value })} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant/30 p-3">
          <label className="flex items-center justify-between text-sm font-semibold">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-green-700">verified</span>
              Tin xác thực
            </span>
            <span className="relative inline-flex cursor-pointer items-center">
              <input
                checked={workingFilters.verifiedOnly}
                className="peer sr-only"
                onChange={(e) => setWorkingFilters({ ...workingFilters, verifiedOnly: e.target.checked })}
                type="checkbox"
              />
              <span className="h-6 w-11 rounded-full bg-zinc-300 transition-colors peer-checked:bg-green-700" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-all peer-checked:left-[22px]" />
            </span>
          </label>
          <ul className="mt-1 list-disc pl-5 text-xs text-secondary">
            <li>Có sổ đỏ/hợp đồng mua bán</li>
            <li>Đúng địa chỉ, hình ảnh & đặc điểm</li>
            <li>Trong khoảng giá thị trường</li>
          </ul>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-outline-variant/30 p-3">
            <p className="mb-2 text-sm font-semibold">Phòng ngủ</p>
            <div className="flex flex-wrap gap-2">
              {BED_BATH_OPTIONS.map((value) => (
                <button key={`bed-${value}`} className={`rounded-full px-3 py-1 text-xs ${workingFilters.bedroomsList.includes(value) ? 'bg-primary text-white' : 'bg-surface-container text-secondary'}`} onClick={() => setWorkingFilters({ ...workingFilters, bedroomsList: workingFilters.bedroomsList.includes(value) ? workingFilters.bedroomsList.filter((item) => item !== value) : [...workingFilters.bedroomsList, value] })} type="button">
                  {value === 5 ? '5+' : value}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-outline-variant/30 p-3">
            <p className="mb-2 text-sm font-semibold">Phòng tắm</p>
            <div className="flex flex-wrap gap-2">
              {BED_BATH_OPTIONS.map((value) => (
                <button key={`bath-${value}`} className={`rounded-full px-3 py-1 text-xs ${workingFilters.bathroomsList.includes(value) ? 'bg-primary text-white' : 'bg-surface-container text-secondary'}`} onClick={() => setWorkingFilters({ ...workingFilters, bathroomsList: workingFilters.bathroomsList.includes(value) ? workingFilters.bathroomsList.filter((item) => item !== value) : [...workingFilters.bathroomsList, value] })} type="button">
                  {value === 5 ? '5+' : value}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-outline-variant/30 p-3">
            <p className="mb-2 text-sm font-semibold">Hướng nhà</p>
            <div className="grid grid-cols-3 gap-2">
              {DIRECTIONS.flat().map((direction, idx) =>
                direction ? (
                  <button key={`dir-${direction}`} className={`aspect-square rounded-full text-xs ${workingFilters.directions.includes(direction) ? 'bg-primary text-white' : 'bg-surface-container text-secondary'}`} onClick={() => setWorkingFilters({ ...workingFilters, directions: workingFilters.directions.includes(direction) ? workingFilters.directions.filter((item) => item !== direction) : [...workingFilters.directions, direction] })} type="button">
                    {DIRECTION_LABEL[direction]}
                  </button>
                ) : (
                  <div key={`dir-empty-${idx}`} />
                ),
              )}
            </div>
          </div>
          <div className="rounded-xl border border-outline-variant/30 p-3">
            <p className="mb-2 text-sm font-semibold">Pháp lý</p>
            <div className="flex flex-wrap gap-2">
              {legalOptions.map((option) => (
                <button key={`legal-${option.value}`} className={`rounded-full px-3 py-1 text-xs ${workingFilters.legalStatuses.includes(option.value) ? 'bg-primary text-white' : 'bg-surface-container text-secondary'}`} onClick={() => setWorkingFilters({ ...workingFilters, legalStatuses: workingFilters.legalStatuses.includes(option.value) ? workingFilters.legalStatuses.filter((item) => item !== option.value) : [...workingFilters.legalStatuses, option.value] })} type="button">
                  {LEGAL_LABEL[option.value] || option.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
