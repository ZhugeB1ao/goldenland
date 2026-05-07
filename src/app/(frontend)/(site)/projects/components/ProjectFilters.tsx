'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { PROPERTY_TYPES, STATUS_OPTIONS, PROVINCES, PRICE_RANGES } from '../utils'

function useOutsideClick(ref: React.RefObject<HTMLDivElement | null>, cb: () => void) {
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) cb()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [ref, cb])
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                active
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
            }`}
        >
            {label}
        </button>
    )
}

// Dropdown mở/đóng đơn giản — pills apply ngay, không có local state
function Dropdown({
    label, displayValue, open, onToggle,
    onReset, children,
}: {
    label: string
    displayValue: string
    open: boolean
    onToggle: () => void
    onReset: () => void
    children: ReactNode
}) {
    const ref = useRef<HTMLDivElement>(null)
    useOutsideClick(ref, () => { if (open) onToggle() })

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={onToggle}
                className={`flex flex-col items-start px-5 py-3 w-full hover:bg-gray-50 transition min-w-[120px] ${open ? 'bg-gray-50' : ''}`}
            >
                <span className="text-xs text-gray-500 font-medium mb-0.5">{label}</span>
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{displayValue}</span>
                    <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 min-w-[220px] p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chọn {label.toLowerCase()}</p>
                    {children}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => { onReset(); onToggle() }}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Đặt lại
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

type FiltersProps = {
    keyword: string
    province: string
    propertyType: string
    minPrice: string
    maxPrice: string
    status: string
    hasFilter: boolean
    onKeywordChange: (v: string) => void
    onKeywordSubmit: () => void
    onApplyProvince: (v: string) => void
    onApplyPropertyType: (v: string) => void
    onApplyPrice: (min: string, max: string) => void
    onApplyStatus: (v: string) => void
    onResetAll: () => void
}

export default function ProjectFilters({
    keyword, province, propertyType, minPrice, maxPrice, status, hasFilter,
    onKeywordChange, onKeywordSubmit,
    onApplyProvince, onApplyPropertyType, onApplyPrice, onApplyStatus,
    onResetAll,
}: FiltersProps) {
    const [open, setOpen] = useState<'province' | 'type' | 'price' | 'status' | null>(null)
    const [provinceSearch, setProvinceSearch] = useState('')
    const toggle = (key: typeof open) => setOpen((v) => (v === key ? null : key))

    const provinceLabel = PROVINCES.find((p) => p.value === province)?.label || 'Toàn quốc'
    const typeLabel = propertyType ? (PROPERTY_TYPES.find((p) => p.value === propertyType)?.label || 'Tất cả') : 'Tất cả'
    const statusLabel = status ? (STATUS_OPTIONS.find((p) => p.value === status)?.label || 'Tất cả') : 'Tất cả'
    const priceRange = PRICE_RANGES.find((r) => r.min === minPrice && r.max === maxPrice)
    const priceLabel = priceRange?.label || 'Tất cả'

    return (
        <div className="bg-white rounded-2xl shadow-lg mb-8">
            <div className="flex items-stretch flex-wrap divide-x divide-gray-200">
                {/* Keyword */}
                <div className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[200px]">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        className="text-sm text-gray-900 outline-none w-full placeholder:text-gray-400"
                        placeholder="Tìm kiếm dự án..."
                        value={keyword}
                        onChange={(e) => onKeywordChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onKeywordSubmit()}
                    />
                </div>

                {/* Khu vực */}
                <Dropdown label="Khu vực" displayValue={provinceLabel} open={open === 'province'}
                    onToggle={() => toggle('province')}
                    onReset={() => { onApplyProvince(''); setProvinceSearch('') }}
                >
                    <div className="w-[200px]">
                        <input
                            className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-emerald-400 bg-gray-50 placeholder:text-gray-400"
                            placeholder="Tìm Tỉnh/ Thành phố"
                            value={provinceSearch}
                            onChange={(e) => setProvinceSearch(e.target.value)}
                        />
                        <div className="max-h-52 overflow-y-auto">
                            {PROVINCES
                                .filter((p) => p.label.toLowerCase().includes(provinceSearch.toLowerCase()))
                                .map((p) => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        onClick={() => { onApplyProvince(p.value); setOpen(null); setProvinceSearch('') }}
                                        className={`flex items-center justify-between w-full px-2 py-2.5 rounded-lg text-sm text-left transition hover:bg-gray-50 ${
                                            province === p.value ? 'text-emerald-600 font-semibold' : 'text-gray-700'
                                        }`}
                                    >
                                        <span>{p.label}</span>
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                </Dropdown>

                {/* Loại hình */}
                <Dropdown label="Loại hình" displayValue={typeLabel} open={open === 'type'}
                    onToggle={() => toggle('type')}
                    onReset={() => onApplyPropertyType('')}
                >
                    <div className="flex flex-wrap gap-2">
                        <Pill label="Tất cả" active={!propertyType}
                            onClick={() => { onApplyPropertyType(''); setOpen(null) }}
                        />
                        {PROPERTY_TYPES.filter((p) => p.value !== '').map((p) => (
                            <Pill key={p.value} label={p.label} active={propertyType === p.value}
                                onClick={() => { onApplyPropertyType(p.value); setOpen(null) }}
                            />
                        ))}
                    </div>
                </Dropdown>

                {/* Khoảng giá */}
                <Dropdown label="Khoảng giá" displayValue={priceLabel} open={open === 'price'}
                    onToggle={() => toggle('price')}
                    onReset={() => onApplyPrice('', '')}
                >
                    <div className="flex flex-col gap-2">
                        {PRICE_RANGES.map((r) => (
                            <Pill key={r.label} label={r.label}
                                active={minPrice === r.min && maxPrice === r.max}
                                onClick={() => { onApplyPrice(r.min, r.max); setOpen(null) }}
                            />
                        ))}
                    </div>
                </Dropdown>

                {/* Trạng thái */}
                <Dropdown label="Trạng thái" displayValue={statusLabel} open={open === 'status'}
                    onToggle={() => toggle('status')}
                    onReset={() => onApplyStatus('')}
                >
                    <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((s) => (
                            <Pill key={s.value} label={s.label} active={status === s.value}
                                onClick={() => { onApplyStatus(s.value); setOpen(null) }}
                            />
                        ))}
                    </div>
                </Dropdown>

                {/* Reset all */}
                {hasFilter && (
                    <button
                        type="button"
                        onClick={onResetAll}
                        title="Đặt lại tất cả"
                        className="flex items-center justify-center px-4 text-gray-400 hover:text-gray-700 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    )
}
