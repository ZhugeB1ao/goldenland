import type { Property } from '@/payload-types'
import { PropertyCard } from './PropertyCard'

type PropertiesListProps = {
  properties: Property[]
  isLoading: boolean
  totalPages: number
  page: number
  pageNumbers: number[]
  onPageChange: (nextPage: number) => void
}

export function PropertiesList({
  properties,
  isLoading,
  totalPages,
  page,
  pageNumbers,
  onPageChange,
}: PropertiesListProps) {
  return (
    <div className="space-y-6">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-secondary text-sm">Đang tải...</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 pt-6">
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded border border-outline-variant/40 text-sm text-secondary disabled:opacity-40"
              disabled={page === 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
              type="button"
            >
              Trước
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                className={`px-3 py-2 rounded text-sm border transition-colors ${
                  pageNumber === page
                    ? 'bg-primary text-white border-primary'
                    : 'border-outline-variant/40 text-secondary hover:text-on-surface'
                }`}
                onClick={() => onPageChange(pageNumber)}
                type="button"
              >
                {pageNumber}
              </button>
            ))}
            <button
              className="px-3 py-2 rounded border border-outline-variant/40 text-sm text-secondary disabled:opacity-40"
              disabled={page === totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
              type="button"
            >
              Sau
            </button>
          </div>
          <p className="text-xs text-secondary">
            Trang {page} / {totalPages}
          </p>
        </div>
      )}
    </div>
  )
}
