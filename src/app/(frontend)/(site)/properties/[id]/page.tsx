import type { Project, Property } from '@/payload-types'
import { FALLBACK_IMAGE, formatLocation, formatLocationByCodes, formatPrice } from '../lib/utils'
import config from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import { Breadcrumb, HeaderActions, LocationLine, PropertyStats } from './components/DetailHeader'
import { PropertyGallery } from './components/PropertyGallery'
import {
    DescriptionSection,
    FeaturesSection,
    MapSection,
    MapSectionFallback,
    MetaInfo,
    ProjectSection,
  type FeatureItem,
  type MetaItem,
} from './components/DetailSections'
import { ForYouSection } from './components/ForYouSection'
import { FavoriteActionButton } from './components/FavoriteActionButton'
import type { PropertyItem } from '../../components/PropertyGridItem'
import { fetchForYouProperties } from '../services/properties'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

function formatArea(property: Property): string {
  return property.area ? `${property.area} m²` : 'Đang cập nhật'
}

function mapPropertyToItem(property: Property): PropertyItem {
  const firstImage = property.images?.[0]?.image

  return {
    id: property.id,
    title: property.title,
    price: formatPrice(property),
    area: formatArea(property),
    location: formatLocation(property),
    image: firstImage || FALLBACK_IMAGE,
    imageAlt: property.title,
    updatedAt: property.updatedAt,
  }
}

function formatDate(value?: string | null): string {
  if (!value) return 'Đang cập nhật'
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: 'Nhà riêng',
  apartment: 'Chung cư',
  land: 'Đất nền',
  villa: 'Biệt thự',
  townhouse: 'Nhà phố',
  shophouse: 'Shophouse',
  penthouse: 'Penthouse',
  condotel: 'Condotel',
  warehouse: 'Kho/Xưởng',
  commercial: 'Mặt bằng',
}

const DIRECTION_LABELS: Record<string, string> = {
  east: 'Đông',
  west: 'Tây',
  south: 'Nam',
  north: 'Bắc',
  northeast: 'Đông Bắc',
  southeast: 'Đông Nam',
  northwest: 'Tây Bắc',
  southwest: 'Tây Nam',
}

const LEGAL_STATUS_LABELS: Record<string, string> = {
  red_book: 'Sổ đỏ/Sổ hồng',
  sale_contract: 'Hợp đồng mua bán',
  pending: 'Đang chờ sổ',
  other: 'Giấy tờ khác',
}

const FURNITURE_STATUS_LABELS: Record<string, string> = {
  luxury: 'Nội thất cao cấp',
  full: 'Nội thất đầy đủ',
  basic: 'Nội thất cơ bản',
  none: 'Không nội thất',
}

const POST_TYPE_LABELS: Record<string, string> = {
  normal: 'Tin thường',
  vip: 'Tin VIP',
}

const PROJECT_SALE_STATUS_LABELS: Record<string, string> = {
  active: 'Đang mở bán',
  upcoming: 'Sắp mở bán',
  completed: 'Đã bàn giao',
}

function buildFeatureItems(property: Property): FeatureItem[] {
  const items: FeatureItem[] = []

  const pushItem = (label: string, value: string | number | null | undefined, icon: string) => {
    if (value === null || value === undefined) return
    const text = String(value).trim()
    if (!text) return
    items.push({ label, value: text, icon })
  }

  pushItem('Loại giao dịch', 'Bán', 'sell')
  pushItem('Loại bất động sản', PROPERTY_TYPE_LABELS[property.propertyType], 'home_work')
  pushItem('Diện tích', property.area ? `${property.area} m²` : null, 'aspect_ratio')
  pushItem('Phòng ngủ', property.bedrooms, 'bed')
  pushItem('Phòng tắm', property.bathrooms, 'bathtub')
  pushItem('Đường rộng', property.roadWidth ? `${property.roadWidth} m` : null, 'swap_horiz')
  pushItem('Mặt tiền', property.facadeWidth ? `${property.facadeWidth} m` : null, 'straighten')
  pushItem(
    'Hướng cửa chính',
    property.direction ? DIRECTION_LABELS[property.direction] : null,
    'explore',
  )
  pushItem(
    'Pháp lý',
    property.legalStatus ? LEGAL_STATUS_LABELS[property.legalStatus] : null,
    'description',
  )
  pushItem(
    'Nội thất',
    property.furnitureStatus ? FURNITURE_STATUS_LABELS[property.furnitureStatus] : null,
    'chair',
  )

  return items
}

function buildProjectInfo(project: Project): FeatureItem[] {
  const items: FeatureItem[] = []

  const pushItem = (label: string, value: string | number | null | undefined, icon: string) => {
    if (value === null || value === undefined) return
    const text = String(value).trim()
    if (!text) return
    items.push({ label, value: text, icon })
  }

  const priceFrom = project.priceFrom ? `${project.priceFrom} triệu` : ''
  const priceTo = project.priceTo ? `${project.priceTo} triệu` : ''
  const priceRange = priceFrom && priceTo ? `${priceFrom} - ${priceTo}` : priceFrom || priceTo

  pushItem(
    'Chủ đầu tư',
    project.investor && typeof project.investor === 'object' ? project.investor.name : null,
    'apartment',
  )
  pushItem(
    'Khu vực',
    formatLocationByCodes({ provinceCode: project.provinceCode, wardCode: project.wardCode }),
    'location_on',
  )
  pushItem('Tổng diện tích', project.totalArea ? `${project.totalArea} ha` : null, 'square_foot')
  pushItem('Tổng số căn/lô', project.totalUnits, 'home')
  pushItem('Giá', priceRange, 'payments')
  pushItem(
    'Trạng thái mở bán',
    project.saleStatus ? PROJECT_SALE_STATUS_LABELS[project.saleStatus] : null,
    'calendar_today',
  )

  return items
}

function getProjectTitle(project: Project): string {
  return project.name || 'Dự án liên quan'
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
    const foundProperty = await payload.findByID({
      collection: 'properties',
      id,
      depth: 2,
      overrideAccess: false,
    })

    property = foundProperty

    const userId =
      typeof foundProperty.user === 'object' && foundProperty.user
        ? foundProperty.user.id
        : foundProperty.user

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
  const images: NonNullable<Property['images']> = Array.isArray(property.images)
    ? property.images
    : []
  const featureItems = buildFeatureItems(property)

  const metaItems: MetaItem[] = [
    { label: 'Ngày đăng', value: formatDate(property.createdAt) },
    {
      label: 'Ngày hết hạn',
      value: property.status === 'expired' ? formatDate(property.updatedAt) : 'Đang cập nhật',
    },
    {
      label: 'Loại tin',
      value: property.postType ? POST_TYPE_LABELS[property.postType] : 'Đang cập nhật',
    },
    { label: 'Mã tin', value: `#${property.id}` },
  ]

  const project = typeof property.project === 'object' ? property.project : null
  const mapCoordinates = (() => {
    if (project) {
      if (typeof project.latitude === 'number' && typeof project.longitude === 'number') {
        return { lat: project.latitude, lng: project.longitude }
      }
      return null
    }

    if (typeof property.latitude === 'number' && typeof property.longitude === 'number') {
      return { lat: property.latitude, lng: property.longitude }
    }

    return null
  })()
  const projectItems = project ? buildProjectInfo(project) : []
  const projectTitle = project ? getProjectTitle(project) : ''
  const forYouProperties = await fetchForYouProperties(property)
    .then((properties) => properties.map(mapPropertyToItem))
    .catch(() => [])

  const headerActions = (
    <>
      <button
        aria-label="Share"
        className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center w-10 h-10"
        type="button"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
          share
        </span>
      </button>
      <button
        aria-label="Report"
        className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center w-10 h-10"
        type="button"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
          flag
        </span>
      </button>
      <FavoriteActionButton propertyId={property.id} title={property.title} />
    </>
  )

  return (
    <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <Breadcrumb title={property.title} />
      <HeaderActions title={property.title} actions={headerActions} />
      <LocationLine locationText={locationText} />
      <PropertyStats
        priceText={priceText}
        areaText={areaText}
        bedrooms={bedrooms}
        bathrooms={bathrooms}
      />
      <PropertyGallery title={property.title} images={images} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <DescriptionSection description={property.description} />
          <FeaturesSection items={featureItems} />
          {mapCoordinates ? (
            <MapSection
              locationText={locationText}
              lat={mapCoordinates.lat}
              lng={mapCoordinates.lng}
              label={property.title}
            />
          ) : (
            <MapSectionFallback locationText={locationText} />
          )}
          <MetaInfo items={metaItems} />
          <ForYouSection properties={forYouProperties} />
          {project && <ProjectSection title={projectTitle} items={projectItems} />}
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
