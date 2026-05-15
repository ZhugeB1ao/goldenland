import type { Property } from '@/payload-types'
import { formatLocation, formatPrice, FALLBACK_IMAGE } from '../lib/utils'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

function getImageUrl(value: unknown): string {
  return typeof value === 'string' && value.length > 0 ? value : FALLBACK_IMAGE
}

function formatArea(property: Property): string {
  return property.area ? `${property.area} m²` : 'Đang cập nhật'
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params
  let property: Property | undefined
  let sidebarUser:
    | {
        fullName?: string | null
        phone?: string | null
        avatar_id?: string | null
        email?: string | null
      }
    | undefined

  try {
    const payload = await getPayload({ config })
    property = await payload.findByID({
      collection: 'properties',
      id,
      depth: 2,
      overrideAccess: false,
    })

    const userId =
      typeof property.user === 'object' && property.user
        ? property.user.id
        : property.user

    if (userId) {
      const user = await payload.findByID({
        collection: 'users',
        id: String(userId),
        depth: 0,
        // Intentional: property detail sidebar needs public contact info.
        overrideAccess: true,
        select: {
          fullName: true,
          phone: true,
          avatar_id: true,
          email: true,
        },
      })

      sidebarUser = {
        fullName: user.fullName,
        phone: user.phone,
        avatar_id: user.avatar_id,
        email: user.email,
      }
    }
  } catch {
    notFound()
  }

  if (!property) {
    notFound()
  }

  const locationText = formatLocation(property)
  const priceText = formatPrice(property)
  const areaText = formatArea(property)
  const bedrooms = property.bedrooms ?? 0
  const bathrooms = property.bathrooms ?? 0
  const images = Array.isArray(property.images) ? property.images : []
  const primaryImage = images[0]?.image
  const galleryImages = images.slice(1, 5)
  const extraCount = Math.max(images.length - 5, 0)

  return (
    <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <nav
        aria-label="Breadcrumb"
        className="flex text-sm text-on-secondary-container mb-6 font-label"
      >
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <a className="hover:text-primary transition-colors" href="/properties">
              Nhà đất bán
            </a>
          </li>
          <li>
            <div className="flex items-center">
              <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
              <span className="text-on-surface font-medium">{property.title}</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="mb-6">
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-[2rem] leading-tight font-headline font-bold text-on-background tracking-tighter max-w-3xl">
            {property.title}
          </h1>
          <div className="flex gap-2 shrink-0 mt-2">
            <button
              aria-label="Share"
              className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center w-10 h-10"
              type="button"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                share
              </span>
            </button>
            <button
              aria-label="Report"
              className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center w-10 h-10"
              type="button"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                flag
              </span>
            </button>
            <button
              aria-label="Favorite"
              className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center w-10 h-10"
              type="button"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                favorite
              </span>
            </button>
          </div>
        </div>
        <p className="text-on-secondary-container flex items-center gap-2 font-body text-base mt-2">
          <span className="material-symbols-outlined text-lg">location_on</span>
          {locationText}
        </p>
      </div>

      <div className="flex flex-wrap gap-8 py-6 mb-8 border-y border-outline-variant/20 bg-surface-container-lowest">
        <div>
          <p className="text-sm text-on-secondary-container font-label mb-1">Mức giá</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-headline font-bold text-primary">{priceText}</p>
          </div>
        </div>
        <div className="w-px bg-outline-variant/30 hidden sm:block"></div>
        <div>
          <p className="text-sm text-on-secondary-container font-label mb-1">Diện tích</p>
          <p className="text-xl font-headline font-semibold text-on-surface">{areaText}</p>
        </div>
        <div className="w-px bg-outline-variant/30 hidden sm:block"></div>
        <div className="flex gap-6">
          <div>
            <p className="text-sm text-on-secondary-container font-label mb-1">Phòng ngủ</p>
            <p className="text-xl font-headline font-semibold text-on-surface flex items-center gap-1">
              {bedrooms}{' '}
              <span className="material-symbols-outlined text-lg text-on-surface-variant">bed</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-on-secondary-container font-label mb-1">Phòng tắm</p>
            <p className="text-xl font-headline font-semibold text-on-surface flex items-center gap-1">
              {bathrooms}{' '}
              <span className="material-symbols-outlined text-lg text-on-surface-variant">
                bathtub
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <div className="rounded-xl overflow-hidden relative w-full h-[500px] mb-4 group">
          <img
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            src={getImageUrl(primaryImage)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <button
            className="absolute bottom-6 right-6 bg-surface/90 backdrop-blur-md text-on-surface px-4 py-2 rounded-lg font-lexend text-sm font-medium flex items-center gap-2 hover:bg-white transition-colors shadow-lg z-10"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">map</span>
            View Map
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4 h-32">
          {galleryImages.map((image, index) => {
            const imageUrl = getImageUrl(image?.image)
            const showExtra = index === 3 && extraCount > 0

            return (
              <div key={index} className="rounded-xl overflow-hidden relative group cursor-pointer">
                <img
                  alt={`${property.title} ${index + 2}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src={imageUrl}
                />
                {showExtra && (
                  <div className="absolute inset-0 bg-on-background/50 flex items-center justify-center transition-colors hover:bg-on-background/40">
                    <span className="text-white font-headline text-xl font-medium tracking-tight">
                      +{extraCount} ảnh
                    </span>
                  </div>
                )}
              </div>
            )
          })}
          {galleryImages.length < 4 &&
            Array.from({ length: 4 - galleryImages.length }).map((_, index) => (
              <div key={`placeholder-${index}`} className="rounded-xl bg-surface-container" />
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-2xl font-headline font-semibold tracking-tight text-on-background mb-6">
              Thông tin mô tả
            </h2>
            <div className="prose prose-lg text-on-surface max-w-none font-body leading-relaxed space-y-4">
              <p>{property.description || 'Đang cập nhật mô tả chi tiết.'}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-headline font-semibold tracking-tight text-on-background mb-6">
              Đặc điểm bất động sản
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 shadow-[0px_4px_24px_rgba(27,28,28,0.02)]">
              <div className="flex justify-between py-3 border-b border-outline-variant/20">
                <span className="text-on-secondary-container font-body flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">chair</span> Nội thất
                </span>
                <span className="font-medium text-on-surface font-body">
                  {property.furnitureStatus || 'Đang cập nhật'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-outline-variant/20">
                <span className="text-on-secondary-container font-body flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">description</span> Pháp lý
                </span>
                <span className="font-medium text-on-surface font-body">
                  {property.legalStatus || 'Đang cập nhật'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-outline-variant/20">
                <span className="text-on-secondary-container font-body flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">aspect_ratio</span> Diện tích
                </span>
                <span className="font-medium text-on-surface font-body">{areaText}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-outline-variant/20">
                <span className="text-on-secondary-container font-body flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">door_front</span> Hướng cửa
                  chính
                </span>
                <span className="font-medium text-on-surface font-body">
                  {property.direction || 'Đang cập nhật'}
                </span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-headline font-semibold tracking-tight text-on-background mb-6">
              Bản đồ
            </h2>
            <div className="h-80 bg-surface-container rounded-xl overflow-hidden shadow-[0px_4px_24px_rgba(27,28,28,0.02)] border border-outline-variant/15 relative">
              <div
                className="absolute inset-0 flex items-center justify-center bg-surface-container-low text-on-surface-variant font-medium"
                data-location={locationText}
              >
                Map Embed Placeholder: {locationText}
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-32 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_12px_32px_rgba(27,28,28,0.06)] border border-outline-variant/15 relative z-10 overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-surface bg-surface-container-highest">
                  {sidebarUser?.avatar_id ? (
                    <img
                      alt={sidebarUser.fullName || 'Người đăng'}
                      className="h-full w-full object-cover"
                      src={sidebarUser.avatar_id}
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center text-secondary font-bold">
                      {(sidebarUser?.fullName || sidebarUser?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-headline font-semibold text-lg text-on-surface tracking-tight">
                    {sidebarUser?.fullName || sidebarUser?.email || 'Người đăng'}
                  </h3>
                  <p className="text-sm text-on-secondary-container font-label">
                    Chuyên viên tư vấn
                  </p>
                </div>
              </div>
              <button
                className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-3 px-4 rounded-md font-lexend font-medium tracking-tight hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-4 shadow-[0px_4px_12px_rgba(181,27,23,0.2)]"
                type="button"
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  call
                </span>
                {sidebarUser?.phone ? `${sidebarUser.phone} - Hiện số` : 'Hiện số liên hệ'}
              </button>
              <button
                className="w-full bg-transparent border border-primary text-primary py-3 px-4 rounded-md font-lexend font-medium tracking-tight hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">chat</span>
                Chat Zalo
              </button>
            </div>

            <div className="bg-surface-container-low rounded-xl p-6 shadow-sm border border-outline-variant/15">
              <h4 className="font-headline font-semibold text-on-surface mb-4 tracking-tight">
                Yêu cầu tư vấn
              </h4>
              <form className="space-y-4">
                <div>
                  <input
                    className="w-full rounded-md border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-body text-on-surface placeholder:text-on-surface-variant/50"
                    placeholder="Họ và tên"
                    type="text"
                  />
                </div>
                <div>
                  <input
                    className="w-full rounded-md border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-body text-on-surface placeholder:text-on-surface-variant/50"
                    placeholder="Số điện thoại"
                    type="tel"
                  />
                </div>
                <div>
                  <input
                    className="w-full rounded-md border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-body text-on-surface placeholder:text-on-surface-variant/50"
                    placeholder="Email"
                    type="email"
                  />
                </div>
                <div>
                  <textarea
                    className="w-full rounded-md border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary font-body text-on-surface placeholder:text-on-surface-variant/50 resize-none"
                    placeholder="Lời nhắn..."
                    rows={3}
                  ></textarea>
                </div>
                <button
                  className="w-full bg-surface-variant text-on-surface py-2.5 px-4 rounded-md font-lexend font-medium text-sm tracking-tight hover:bg-surface-dim transition-colors"
                  type="button"
                >
                  Gửi yêu cầu
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
