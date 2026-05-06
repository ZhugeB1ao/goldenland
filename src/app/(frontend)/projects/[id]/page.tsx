'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatPrice, formatDate, lexicalToHtml, PROPERTY_TYPES } from '../utils'
import SectionTitle from '../components/SectionTitle'
import ProjectCard from '../components/ProjectCard'

const MapSection = dynamic(() => import('./components/MapSection'), { ssr: false })

const HOTLINE = '0901 234 567'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    active: { label: 'Đang mở bán', cls: 'bg-emerald-500 text-white' },
    upcoming: { label: 'Sắp mở bán', cls: 'bg-amber-500 text-white' },
    completed: { label: 'Đã bàn giao', cls: 'bg-gray-500 text-white' },
}

function getYoutubeId(url?: string): string | null {
    if (!url) return null
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
    return m ? m[1] : null
}

export default function ProjectDetailPage() {
    const { id } = useParams() as { id: string }
    const [project, setProject] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [currentImage, setCurrentImage] = useState(0)
    const [related, setRelated] = useState<any[]>([])

    useEffect(() => {
        if (!id) return
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/projects/${id}?depth=2`)
                const data = await res.json()
                setProject(data)
                fetch(`/api/projects/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ views: (data.views || 0) + 1 }),
                }).catch(() => {})

                // Fetch related projects (same province, exclude current)
                if (data.provinceCode) {
                    const params = new URLSearchParams({
                        limit: '3',
                        depth: '1',
                        'where[and][0][provinceCode][equals]': data.provinceCode,
                        'where[and][1][id][not_equals]': String(data.id),
                    })
                    fetch(`/api/projects?${params}`)
                        .then((r) => r.json())
                        .then((d) => setRelated(d.docs || []))
                        .catch(() => {})
                }
            } catch {
                alert('Lỗi tải dữ liệu')
            }
            setLoading(false)
        }
        fetchData()
    }, [id])

    if (loading) return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-[1100px] mx-auto px-5 pt-[120px]">
                <div className="animate-pulse space-y-4">
                    <div className="h-[480px] bg-gray-200 rounded-xl" />
                    <div className="h-8 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
            </div>
        </div>
    )

    if (!project) return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
            <div className="text-center text-gray-400">
                <div className="text-5xl mb-4">🏗️</div>
                <div className="font-semibold text-lg">Không tìm thấy dự án</div>
            </div>
        </div>
    )

    const images = project.images || []
    const mainImage =
        currentImage === 0 && project.thumbnail?.url
            ? project.thumbnail.url
            : images[currentImage - 1]?.image?.url || project.thumbnail?.url

    const badge = project.saleStatus ? STATUS_MAP[project.saleStatus] : null
    const youtubeId = getYoutubeId(project.videoUrl)

    return (
        <div className="bg-gray-50 min-h-screen text-gray-900 pb-24">
            <div className="max-w-[1100px] mx-auto px-5 pt-[100px] pb-12">
                {/* BACK LINK */}
                <Link
                    href="/projects"
                    className="inline-flex items-center gap-1.5 mb-6 text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors no-underline"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Quay lại danh sách
                </Link>

                {/* HERO IMAGE */}
                <div className="relative rounded-xl overflow-hidden shadow-lg mb-4">
                    {mainImage ? (
                        <img src={mainImage} alt={project.name} className="w-full h-[480px] object-cover block bg-gray-200" />
                    ) : (
                        <div className="w-full h-[480px] bg-gray-200 flex items-center justify-center text-gray-400">
                            Chưa có ảnh
                        </div>
                    )}
                    {badge && (
                        <span className={`absolute top-4 left-4 px-4 py-1.5 rounded-full text-sm font-semibold ${badge.cls}`}>
                            {badge.label}
                        </span>
                    )}
                </div>

                {/* THUMBNAILS */}
                {(project.thumbnail || images.length > 0) && (
                    <div className="flex gap-2 mb-6 overflow-x-auto">
                        {project.thumbnail?.url && (
                            <img
                                src={project.thumbnail.url}
                                alt="thumb"
                                className={`w-20 h-[60px] object-cover rounded-lg cursor-pointer transition-all flex-shrink-0 ${currentImage === 0 ? 'ring-2 ring-emerald-500 opacity-100' : 'opacity-60 hover:opacity-90'}`}
                                onClick={() => setCurrentImage(0)}
                            />
                        )}
                        {images.map((img: any, i: number) => (
                            <img
                                key={i}
                                src={img.image?.url}
                                alt={`thumb-${i}`}
                                className={`w-20 h-[60px] object-cover rounded-lg cursor-pointer transition-all flex-shrink-0 ${currentImage === i + 1 ? 'ring-2 ring-emerald-500 opacity-100' : 'opacity-60 hover:opacity-90'}`}
                                onClick={() => setCurrentImage(i + 1)}
                            />
                        ))}
                    </div>
                )}

                <h1 className="text-[30px] font-bold mb-2 text-gray-900">{project.name}</h1>

                {/* PROPERTY TYPE TAGS */}
                {project.propertyTypes?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {project.propertyTypes.map((t: string) => (
                            <span key={t} className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-0.5 text-xs font-medium">
                                {PROPERTY_TYPES.find((x) => x.value === t)?.label || t}
                            </span>
                        ))}
                    </div>
                )}

                {project.address && (
                    <div className="text-gray-500 text-[15px] mb-5 flex items-center gap-1">
                        📍 {project.address}
                    </div>
                )}

                {/* PRICE BOX */}
                <div className="bg-white rounded-xl shadow-sm p-5 mb-8 grid grid-cols-3 gap-5">
                    {[
                        { label: 'Giá từ', value: formatPrice(project.priceFrom), accent: true },
                        { label: 'Giá đến', value: formatPrice(project.priceTo), accent: true },
                        { label: 'Tổng số căn', value: project.totalUnits || '-', accent: false },
                    ].map(({ label, value, accent }) => (
                        <div key={label}>
                            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">{label}</div>
                            <div className={`text-lg font-bold ${accent && value ? 'text-emerald-600' : 'text-gray-900'}`}>
                                {value || '-'}
                            </div>
                        </div>
                    ))}
                </div>

                {/* THÔNG TIN CHUNG */}
                <div className="mb-8">
                    <SectionTitle>Thông tin chung</SectionTitle>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {[
                            { label: 'Chủ đầu tư', value: project.investor?.name || '-' },
                            { label: 'Tổng diện tích', value: project.totalArea ? `${project.totalArea} ha` : '-' },
                            { label: 'Ngày khởi công', value: formatDate(project.startDate) },
                            { label: 'Ngày bàn giao', value: formatDate(project.completionDate) },
                        ].map(({ label, value }, i, arr) => (
                            <div
                                key={label}
                                className={`flex justify-between items-center px-5 py-3.5 text-sm ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
                            >
                                <span className="text-gray-500">{label}</span>
                                <span className="font-semibold text-gray-900">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BẢN ĐỒ */}
                {project.latitude && project.longitude && (
                    <div className="mb-8">
                        <SectionTitle>Vị trí dự án {project.name}</SectionTitle>
                        <MapSection lat={project.latitude} lng={project.longitude} name={project.name} />
                    </div>
                )}

                {/* MÔ TẢ */}
                {project.description && (
                    <div className="mb-8">
                        <SectionTitle>Mô tả dự án</SectionTitle>
                        <div
                            className="bg-white rounded-xl shadow-sm p-5 leading-relaxed text-[15px] text-gray-700"
                            dangerouslySetInnerHTML={{
                                __html: typeof project.description === 'string'
                                    ? project.description
                                    : lexicalToHtml(project.description),
                            }}
                        />
                    </div>
                )}

                {/* PHÂN KHU */}
                {project.zones?.length > 0 && (
                    <div className="mb-8">
                        <SectionTitle>Phân khu ({project.zones.length})</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {project.zones.map((z: any, i: number) => (
                                <div key={i} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                                    <div className="font-bold text-base mb-1 text-gray-900">{z.name}</div>
                                    {z.description && (
                                        <div className="text-gray-500 text-sm mb-3">{z.description}</div>
                                    )}
                                    <div className="flex gap-3 text-xs text-gray-400 pt-3 border-t border-gray-100">
                                        {z.totalUnits && <span>🏢 {z.totalUnits} căn</span>}
                                        {z.status && <span>• {z.status}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* MẶT BẰNG TỔNG THỂ */}
                {project.masterPlan?.url && (
                    <div className="mb-8">
                        <SectionTitle>Mặt bằng tổng thể</SectionTitle>
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <img
                                src={project.masterPlan.url}
                                alt="Mặt bằng tổng thể"
                                className="w-full object-contain max-h-[600px]"
                            />
                        </div>
                    </div>
                )}

                {/* VIDEO */}
                {youtubeId && (
                    <div className="mb-8">
                        <SectionTitle>Video dự án</SectionTitle>
                        <div className="rounded-xl overflow-hidden shadow-sm aspect-video">
                            <iframe
                                src={`https://www.youtube.com/embed/${youtubeId}`}
                                title="Video dự án"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                            />
                        </div>
                    </div>
                )}

                {/* DỰ ÁN LIÊN QUAN */}
                {related.length > 0 && (
                    <div className="mb-8">
                        <SectionTitle>Dự án cùng khu vực</SectionTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {related.map((p) => <ProjectCard key={p.id} project={p} />)}
                        </div>
                    </div>
                )}
            </div>

            {/* STICKY CTA */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3">
                <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-3">
                    <div className="hidden sm:block">
                        <div className="text-xs text-gray-400">Hotline tư vấn</div>
                        <div className="text-base font-bold text-gray-900">{HOTLINE}</div>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <a
                            href={`tel:${HOTLINE.replace(/\s/g, '')}`}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border-2 border-emerald-600 text-emerald-600 font-semibold rounded-xl text-sm hover:bg-emerald-50 transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Gọi ngay
                        </a>
                        <a
                            href={`https://zalo.me/${HOTLINE.replace(/\s/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition"
                        >
                            Nhận bảng giá
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
