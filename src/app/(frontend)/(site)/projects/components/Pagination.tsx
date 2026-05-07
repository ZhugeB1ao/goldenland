'use client'

type PaginationProps = {
    page: number
    totalPages: number
    onPageChange: (n: number) => void
}

function getPages(current: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
    return pages
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null
    const pages = getPages(page, totalPages)

    return (
        <div className="flex justify-center items-center gap-2 mt-10 mb-8">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Trước
            </button>

            <div className="flex items-center gap-1">
                {pages.map((p, i) =>
                    p === '...' ? (
                        <span key={`dot-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p as number)}
                            className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                                p === page
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-400 hover:text-emerald-600'
                            }`}
                        >
                            {p}
                        </button>
                    )
                )}
            </div>

            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
                Sau
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    )
}
