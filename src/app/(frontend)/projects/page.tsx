'use client'

import { useEffect, useCallback, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import qs from 'qs'
import ProjectCard from './components/ProjectCard'
import ProjectFilters from './components/ProjectFilters'
import Pagination from './components/Pagination'
import { SORT_OPTIONS } from './utils'

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
    thumbnail?: { url?: string; filename?: string } | null
    investor?: { name?: string } | null
}

type Filters = {
    keyword: string
    province: string
    propertyType: string
    status: string
    minPrice: string
    maxPrice: string
    sort: string
    page: number
}

const DEFAULT: Filters = {
    keyword: '', province: '', propertyType: '', status: '',
    minPrice: '', maxPrice: '', sort: '-createdAt', page: 1,
}

function filtersFromParams(params: URLSearchParams): Filters {
    return {
        keyword: params.get('keyword') || '',
        province: params.get('province') || '',
        propertyType: params.get('propertyType') || '',
        status: params.get('status') || '',
        minPrice: params.get('minPrice') || '',
        maxPrice: params.get('maxPrice') || '',
        sort: params.get('sort') || '-createdAt',
        page: Number(params.get('page') || 1),
    }
}

function filtersToParams(f: Filters): string {
    const p = new URLSearchParams()
    if (f.keyword) p.set('keyword', f.keyword)
    if (f.province) p.set('province', f.province)
    if (f.propertyType) p.set('propertyType', f.propertyType)
    if (f.status) p.set('status', f.status)
    if (f.minPrice) p.set('minPrice', f.minPrice)
    if (f.maxPrice) p.set('maxPrice', f.maxPrice)
    if (f.sort !== '-createdAt') p.set('sort', f.sort)
    if (f.page > 1) p.set('page', String(f.page))
    return p.toString()
}

function SkeletonCard() {
    return (
        <div className="rounded-xl overflow-hidden shadow-md bg-white animate-pulse">
            <div className="aspect-[4/3] bg-gray-200" />
            <div className="p-4 space-y-3">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-4/5" />
                <div className="h-3 bg-gray-200 rounded w-3/5" />
                <div className="h-3 bg-gray-200 rounded w-2/5 mt-4" />
            </div>
        </div>
    )
}

function ProjectsPageInner() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [totalPages, setTotalPages] = useState(1)
    const [totalDocs, setTotalDocs] = useState(0)
    const [filters, setFilters] = useState<Filters>(() => filtersFromParams(searchParams))
    const [keywordInput, setKeywordInput] = useState(() => searchParams.get('keyword') || '')

    const loadProjects = useCallback(async (f: Filters) => {
        setLoading(true)
        try {
            const conditions: any[] = []
            if (f.keyword) conditions.push({ name: { like: f.keyword } })
            if (f.province) conditions.push({ provinceCode: { equals: f.province } })
            if (f.propertyType) conditions.push({ propertyTypes: { equals: f.propertyType } })
            if (f.status) conditions.push({ saleStatus: { equals: f.status } })
            if (f.minPrice) conditions.push({ priceTo: { greater_than_equal: Number(f.minPrice) } })
            if (f.maxPrice) conditions.push({ priceFrom: { less_than_equal: Number(f.maxPrice) } })

            const query = qs.stringify(
                {
                    limit: 9,
                    page: f.page,
                    depth: 2,
                    sort: f.sort,
                    ...(conditions.length > 0 && { where: { and: conditions } }),
                },
                { encodeValuesOnly: true },
            )
            const res = await fetch(`/api/projects?${query}`)
            const data = await res.json()
            setProjects(data.docs || [])
            setTotalPages(data.totalPages || 1)
            setTotalDocs(data.totalDocs || 0)
        } catch {
            // keep existing data
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        loadProjects(filters)
        const qs = filtersToParams(filters)
        router.replace(qs ? `/projects?${qs}` : '/projects', { scroll: false })
    }, [filters, loadProjects, router])

    const apply = (changes: Partial<Omit<Filters, 'sort' | 'page'>>) =>
        setFilters((prev) => ({ ...prev, ...changes, page: 1 }))

    const resetAll = () => {
        setKeywordInput('')
        setFilters(DEFAULT)
    }

    const hasFilter = !!(filters.keyword || filters.province || filters.propertyType ||
        filters.status || filters.minPrice || filters.maxPrice)

    return (
        <div className="bg-gray-50 min-h-screen text-gray-900">
            {/* HERO */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 pt-[100px] pb-12">
                <div className="max-w-[1100px] mx-auto px-5">
                    <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-2">Goldenland</p>
                    <h1 className="text-4xl font-bold text-white mb-2">Dự án Bất động sản</h1>
                    <p className="text-gray-400 text-base">
                        Khám phá {totalDocs > 0 ? totalDocs : ''} dự án bất động sản uy tín trên toàn quốc
                    </p>
                </div>
            </div>

            <div className="max-w-[1100px] mx-auto px-5 pb-10">
                <div className="-mt-6">
                    <ProjectFilters
                        keyword={keywordInput}
                        province={filters.province}
                        propertyType={filters.propertyType}
                        minPrice={filters.minPrice}
                        maxPrice={filters.maxPrice}
                        status={filters.status}
                        hasFilter={hasFilter}
                        onKeywordChange={setKeywordInput}
                        onKeywordSubmit={() => apply({ keyword: keywordInput })}
                        onApplyProvince={(v) => apply({ province: v })}
                        onApplyPropertyType={(v) => apply({ propertyType: v })}
                        onApplyPrice={(min, max) => apply({ minPrice: min, maxPrice: max })}
                        onApplyStatus={(v) => apply({ status: v })}
                        onResetAll={resetAll}
                    />
                </div>

                {/* RESULT BAR */}
                {!loading && (
                    <div className="flex items-center justify-between mb-5">
                        <p className="text-sm text-gray-500">
                            {totalDocs > 0 ? (
                                <><span className="font-semibold text-gray-900">{totalDocs}</span> dự án được tìm thấy</>
                            ) : 'Không có dự án nào'}
                        </p>
                        <select
                            value={filters.sort}
                            onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value, page: 1 }))}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:border-emerald-500 cursor-pointer"
                        >
                            {SORT_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* GRID */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm text-gray-400">
                        <div className="text-5xl mb-4">🏗️</div>
                        <div className="font-semibold text-lg">Không tìm thấy dự án nào</div>
                        <div className="text-sm mt-1">Thử thay đổi bộ lọc để xem thêm kết quả</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
                    </div>
                )}

                <Pagination
                    page={filters.page}
                    totalPages={totalPages}
                    onPageChange={(p) => {
                        setFilters((prev) => ({ ...prev, page: p }))
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                />
            </div>
        </div>
    )
}

export default function ProjectsPage() {
    return (
        <Suspense>
            <ProjectsPageInner />
        </Suspense>
    )
}
