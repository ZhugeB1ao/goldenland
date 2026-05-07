import Link from 'next/link'
import { formatPrice, PROPERTY_TYPES } from '../utils'

type Project = {
    id: number
    name: string
    address?: string
    priceFrom?: number
    priceTo?: number
    totalArea?: number
    totalUnits?: number
    saleStatus?: string
    propertyTypes?: string[]
    thumbnail?: { url?: string } | null
    investor?: { name?: string } | null
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    active: { label: 'Đang mở bán', cls: 'bg-emerald-500 text-white' },
    upcoming: { label: 'Sắp mở bán', cls: 'bg-amber-500 text-white' },
    completed: { label: 'Đã bàn giao', cls: 'bg-gray-500 text-white' },
}

export default function ProjectCard({ project: p }: { project: Project }) {
    const imgUrl = p.thumbnail?.url || null
    const badge = p.saleStatus ? STATUS_MAP[p.saleStatus] : null

    return (
        <Link
            href={`/projects/${p.id}`}
            className="flex flex-col rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-200 no-underline text-black bg-white"
        >
            {/* IMAGE */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                {imgUrl ? (
                    <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        Chưa có ảnh
                    </div>
                )}
                {badge && (
                    <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                        {badge.label}
                    </span>
                )}
            </div>

            {/* CONTENT */}
            <div className="flex flex-col flex-1 p-4">
                {/* Property type tags */}
                {p.propertyTypes && p.propertyTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {p.propertyTypes.slice(0, 2).map((t) => (
                            <span key={t} className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 text-xs font-medium">
                                {PROPERTY_TYPES.find((x) => x.value === t)?.label || t}
                            </span>
                        ))}
                    </div>
                )}

                <div className="text-base font-bold leading-snug text-gray-900 mb-1.5 line-clamp-2">
                    {p.name}
                </div>
                {p.address && (
                    <div className="text-sm text-gray-500 mb-1 truncate">📍 {p.address}</div>
                )}
                {p.investor?.name && (
                    <div className="text-xs text-gray-400 mb-3">CĐT: {p.investor.name}</div>
                )}

                {/* PRICE + STATS */}
                <div className="mt-auto pt-3 border-t border-gray-100">
                    {(p.priceFrom || p.priceTo) && (
                        <div className="text-base font-bold text-emerald-600 mb-1.5">
                            {p.priceFrom && p.priceTo
                                ? `${formatPrice(p.priceFrom)} - ${formatPrice(p.priceTo)}`
                                : formatPrice(p.priceFrom || p.priceTo)}
                        </div>
                    )}
                    <div className="flex gap-3 text-xs text-gray-400">
                        {p.totalArea && <span>📐 {p.totalArea} ha</span>}
                        {p.totalUnits && <span>🏢 {p.totalUnits} căn</span>}
                    </div>
                </div>
            </div>
        </Link>
    )
}
