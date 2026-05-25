import PropertyLocationMap from './PropertyLocationMap'

export type FeatureItem = {
  label: string
  value: string
  icon: string
}

export type MetaItem = {
  label: string
  value: string
}

export function DescriptionSection({ description }: { description?: string | null }) {
  return (
    <section>
      <h2 className="text-2xl font-headline font-semibold tracking-tight text-on-background mb-6">
        Thông tin mô tả
      </h2>
      <div className="prose prose-lg text-on-surface max-w-none font-body leading-relaxed space-y-4">
        <p>{description || 'Đang cập nhật mô tả chi tiết.'}</p>
      </div>
    </section>
  )
}

export function FeaturesSection({ items }: { items: FeatureItem[] }) {
  return (
    <section>
      <h2 className="text-2xl font-headline font-semibold tracking-tight text-on-background mb-6">
        Đặc điểm bất động sản
      </h2>
      {items.length === 0 ? (
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 text-on-surface-variant">
          Chưa có thông tin chi tiết.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 shadow-[0px_4px_24px_rgba(27,28,28,0.02)]">
          {items.map((item) => (
            <div
              key={`${item.label}-${item.value}`}
              className="flex justify-between py-3 border-b border-outline-variant/20"
            >
              <span className="text-on-secondary-container font-body flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">{item.icon}</span> {item.label}
              </span>
              <span className="font-medium text-on-surface font-body text-right">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function MapSection({
  locationText,
  lat,
  lng,
  label,
}: {
  locationText: string
  lat: number
  lng: number
  label: string
}) {
  return (
    <section>
      <h2 className="text-2xl font-headline font-semibold tracking-tight text-on-background mb-6">
        Bản đồ
      </h2>
      <PropertyLocationMap lat={lat} lng={lng} label={label} />
      <p className="mt-3 text-sm text-on-secondary-container" data-location={locationText}>
        Vị trí hiển thị mang tính tham khảo theo đường/dự án.
      </p>
      <p className="text-sm text-on-secondary-container">{locationText}</p>
    </section>
  )
}

export function MapSectionFallback({ locationText }: { locationText: string }) {
  return (
    <section>
      <h2 className="text-2xl font-headline font-semibold tracking-tight text-on-background mb-6">
        Bản đồ
      </h2>
      <div className="h-80 bg-surface-container-low rounded-xl overflow-hidden shadow-[0px_4px_24px_rgba(27,28,28,0.02)] border border-outline-variant/15 relative flex items-center justify-center text-on-surface-variant">
        Chưa có tọa độ để hiển thị bản đồ
      </div>
      <p className="mt-3 text-sm text-on-secondary-container">{locationText}</p>
    </section>
  )
}

export function MetaInfo({ items }: { items: MetaItem[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-5">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <p className="text-xs text-on-secondary-container font-label uppercase tracking-wide">
            {item.label}
          </p>
          <p className="text-sm font-medium text-on-surface">{item.value || 'Đang cập nhật'}</p>
        </div>
      ))}
    </div>
  )
}

export function ProjectSection({ title, items }: { title: string; items: FeatureItem[] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <section>
      <h2 className="text-2xl font-headline font-semibold tracking-tight text-on-background mb-6">
        Thông tin dự án
      </h2>
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-6">
        <h3 className="text-lg font-headline font-semibold text-on-surface mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {items.map((item) => (
            <div
              key={`${item.label}-${item.value}`}
              className="flex justify-between py-3 border-b border-outline-variant/20"
            >
              <span className="text-on-secondary-container font-body flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">{item.icon}</span> {item.label}
              </span>
              <span className="font-medium text-on-surface font-body text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
