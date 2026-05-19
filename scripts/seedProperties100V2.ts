import dotenv from 'dotenv'
dotenv.config()

import { getPayload } from 'payload'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import type { Property } from '../src/payload-types'

type DivisionWard = {
  Code: string
  FullName: string
}

type Division = DivisionWard & {
  Wards?: DivisionWard[]
}

type PropertyType = NonNullable<Property['propertyType']>
type PropertyDirection = NonNullable<Property['direction']>
type PropertyLegalStatus = NonNullable<Property['legalStatus']>
type PropertyFurnitureStatus = NonNullable<Property['furnitureStatus']>

const DESCRIPTION_INTROS = [
  'Khu dân cư hiện hữu, an ninh tốt, đường thông thoáng.',
  'Vị trí đẹp, di chuyển thuận tiện, tiện ích xung quanh đầy đủ.',
  'Không gian thoáng, phù hợp gia đình ở lâu dài hoặc đầu tư.',
  'Pháp lý rõ ràng, sẵn sàng công chứng nhanh.',
  'Hạ tầng hoàn chỉnh, khu vực phát triển ổn định.'
]

const DESCRIPTION_FEATURES = [
  'Thiết kế hiện đại, bố trí công năng hợp lý.',
  'Nội thất cơ bản, có thể vào ở ngay.',
  'Mặt tiền rộng, thuận tiện kinh doanh.',
  'Khu vực yên tĩnh, dân cư văn minh.',
  'Gần chợ, trường học, siêu thị trong bán kính 1-2km.'
]

const TITLE_PREFIXES = [
  'Chính chủ bán',
  'Cần bán nhanh',
  'Bán gấp',
  'Bán',
  'Giao dịch ngay',
  'Bán giá tốt'
]

const TITLE_SUFFIXES = [
  'sổ riêng',
  'full nội thất',
  'pháp lý rõ ràng',
  'view thoáng',
  'hẻm ô tô',
  'khu dân cư an ninh',
  'gần trung tâm',
  'tiện kinh doanh'
]

const AMENITIES = [
  'gần chợ',
  'gần trường học',
  'gần bệnh viện',
  'gần siêu thị',
  'cách trung tâm 10-15 phút',
  'khu dân cư đông đúc',
  'đường trước nhà rộng',
  'khu vực ít ngập',
  'an ninh 24/7'
]

const NEARBY_PLACES = [
  'bến xe',
  'công viên',
  'chợ truyền thống',
  'TTTM',
  'trường học',
  'bệnh viện',
  'khu công nghiệp',
  'sông/kênh',
  'ga/metro'
]

const STREET_NAMES = [
  'Nguyễn Trãi',
  'Lê Lợi',
  'Trần Hưng Đạo',
  'Võ Văn Kiệt',
  'Cách Mạng Tháng 8',
  'Điện Biên Phủ',
  'Lý Thường Kiệt',
  'Phan Đình Phùng',
  'Hoàng Diệu',
  'Nguyễn Huệ',
  'Lê Duẩn',
  'Nguyễn Thị Minh Khai',
  'Hai Bà Trưng',
  'Phạm Văn Đồng',
  'Quang Trung'
]

const PROPERTY_TYPES_NO_APARTMENT = ['house', 'land', 'villa', 'townhouse', 'shophouse', 'warehouse', 'commercial'] as const satisfies readonly PropertyType[]
const DIRECTIONS = ['east', 'west', 'south', 'north', 'northeast', 'southeast', 'northwest', 'southwest'] as const satisfies readonly PropertyDirection[]
const LEGAL_STATUSES = ['red_book', 'sale_contract', 'pending', 'other'] as const satisfies readonly PropertyLegalStatus[]
const FURNITURE_STATUSES = ['luxury', 'full', 'basic', 'none'] as const satisfies readonly PropertyFurnitureStatus[]

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BUCKET_NAME = 'Properties'

const DUMMY_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
]

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const getRandomItem = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
const getRandomBoolean = () => Math.random() >= 0.5

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: 'nhà phố',
  apartment: 'căn hộ',
  land: 'đất nền',
  villa: 'biệt thự',
  townhouse: 'nhà liền kề',
  shophouse: 'shophouse',
  penthouse: 'penthouse',
  condotel: 'condotel',
  warehouse: 'kho/xưởng',
  commercial: 'mặt bằng',
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

function buildTitle(args: {
  propertyType: string
  wardName?: string
  provinceName?: string
  bedrooms: number
  isCorner: boolean
}): string {
  const typeLabel = PROPERTY_TYPE_LABELS[args.propertyType] || 'bất động sản'
  const location = [args.wardName, args.provinceName].filter(Boolean).join(', ')
  const bedLabel = args.bedrooms > 0 ? `${args.bedrooms}PN` : ''
  const cornerLabel = args.isCorner ? 'căn góc' : ''
  const prefix = getRandomItem(TITLE_PREFIXES)
  const suffix = getRandomBoolean() ? getRandomItem(TITLE_SUFFIXES) : ''
  const parts = [prefix, typeLabel, bedLabel, cornerLabel, suffix, location].filter(Boolean)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function buildDescription(args: {
  area: number
  bedrooms: number
  bathrooms: number
  direction: string
  legalStatus: string
  furnitureStatus: string
  roadWidth?: number
  facadeWidth?: number
  address: string
}): string {
  const directionLabel = DIRECTION_LABELS[args.direction] || 'Đang cập nhật'
  const legalLabel = LEGAL_STATUS_LABELS[args.legalStatus] || 'Đang cập nhật'
  const furnitureLabel = FURNITURE_STATUS_LABELS[args.furnitureStatus] || 'Đang cập nhật'
  const extra: string[] = []
  const amenitySample = [
    getRandomItem(AMENITIES),
    getRandomItem(AMENITIES),
    getRandomItem(AMENITIES),
  ]
  const nearby = getRandomItem(NEARBY_PLACES)

  if (args.roadWidth) extra.push(`Đường rộng ~${args.roadWidth}m`)
  if (args.facadeWidth) extra.push(`Mặt tiền ~${args.facadeWidth}m`)

  return [
    `${getRandomItem(DESCRIPTION_INTROS)}`,
    `${getRandomItem(DESCRIPTION_FEATURES)}`,
    `Diện tích ${args.area}m2, ${args.bedrooms}PN, ${args.bathrooms}WC.`,
    `Hướng ${directionLabel}. Pháp lý: ${legalLabel}. Nội thất: ${furnitureLabel}.`,
    `Tiện ích xung quanh: ${amenitySample.join(', ')}, gần ${nearby}.`,
    extra.length ? `${extra.join(', ')}.` : '',
    `Địa chỉ: ${args.address}.`,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function downloadImage(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image ${url}: ${response.status}`)
  }
  return response.arrayBuffer()
}

async function seed() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase URL or Service Role Key in .env')
    process.exit(1)
  }

  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config: await config })

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  const { data: existingBucket, error: getBucketError } = await supabase.storage.getBucket(BUCKET_NAME)
  if (!existingBucket || getBucketError) {
    const { error: createBucketError } = await supabase.storage.createBucket(BUCKET_NAME, { public: true })
    if (createBucketError) {
      console.error(`Failed to create bucket ${BUCKET_NAME}:`, createBucketError.message)
      process.exit(1)
    }
  }

  // Read vietnam-divisions.json
  const divisionsPath = path.resolve(process.cwd(), 'src/app/data/vietnam-divisions.json')
  const divisions = JSON.parse(fs.readFileSync(divisionsPath, 'utf8')) as Division[]

  console.log('Downloading dummy images into memory...')
  const imageBuffers: ArrayBuffer[] = []
  for (const url of DUMMY_IMAGE_URLS) {
    try {
      const buf = await downloadImage(url)
      imageBuffers.push(buf)
    } catch (error) {
      console.error(`Failed to download dummy image: ${url}`, error)
    }
  }

  if (imageBuffers.length === 0) {
    console.error('No dummy images downloaded, exiting.')
    process.exit(1)
  }

  console.log('--- Seeding 100 properties (User 1-2, Projects 1-33) ---')

  for (let i = 1; i <= 100; i++) {
    const province = getRandomItem(divisions)
    const ward = getRandomItem(province.Wards || [])

    // Project IDs from 1 to 33
    const hasProject = Math.random() >= 0.3
    const projectId = hasProject ? getRandomInt(1, 33) : null

    let propertyType: PropertyType = 'apartment'
    if (!hasProject) {
      propertyType = getRandomItem(PROPERTY_TYPES_NO_APARTMENT)
    } else {
      const projectTypes = ['apartment', 'apartment', 'villa', 'townhouse', 'shophouse', 'condotel', 'land'] as const satisfies readonly PropertyType[]
      propertyType = getRandomItem(projectTypes)
    }

    const listingType = 'sale'
    
    const price = getRandomInt(1, 20) * 1000000000
    const priceUnit = 'total' as const

    const userId = getRandomInt(1, 2)
    const area = getRandomInt(30, 300)
    const bedrooms = propertyType === 'land' || propertyType === 'warehouse' || propertyType === 'commercial' ? 0 : getRandomInt(1, 5)
    const bathrooms = propertyType === 'land' || propertyType === 'warehouse' || propertyType === 'commercial' ? 0 : getRandomInt(1, 3)
    const isVerified = Math.random() >= 0.6
    const streetNumber = getRandomInt(1, 220)
    const streetName = getRandomItem(STREET_NAMES)
    const street = `${streetNumber} ${streetName}`
    const fullAddress = [street, ward?.FullName, province.FullName].filter(Boolean).join(', ')

    const direction = getRandomItem(DIRECTIONS)
    const legalStatus = getRandomItem(LEGAL_STATUSES)
    const furnitureStatus = getRandomItem(FURNITURE_STATUSES)
    const roadWidth = getRandomBoolean() ? getRandomInt(3, 20) : undefined
    const facadeWidth = getRandomBoolean() ? getRandomInt(4, 15) : undefined
    const isCorner = getRandomBoolean()

    const realisticTitle = buildTitle({
      propertyType,
      wardName: ward?.FullName,
      provinceName: province.FullName,
      bedrooms,
      isCorner,
    })

    const description = buildDescription({
      area,
      bedrooms,
      bathrooms,
      direction,
      legalStatus,
      furnitureStatus,
      roadWidth,
      facadeWidth,
      address: fullAddress,
    })

    try {
      const property = await payload.create({
        collection: 'properties',
        data: {
          title: realisticTitle,
          description,
          listingType,
          propertyType,
          price,
          priceUnit,
          area,
          bedrooms,
          bathrooms,
          roadWidth,
          facadeWidth,
          direction,
          legalStatus,
          furnitureStatus,
          provinceCode: province.Code,
          wardCode: ward?.Code || province.Code,
          street,
          address: fullAddress,
          user: userId,
          project: projectId,
          status: 'active',
          postType: i % 10 === 0 ? 'vip' : 'normal',
          label: getRandomItem(['normal', 'vip', 'hot', 'premium']),
          isVerified,
          verifiedBy: isVerified ? getRandomInt(1, 2) : undefined,
          verifiedAt: isVerified ? new Date().toISOString() : undefined,
          seoTitle: realisticTitle.slice(0, 70),
          seoDescription: description.slice(0, 150),
          seoKeywords: 'bat dong san, nha dat, mua ban, cho thue',
        },
      })

      const propertyId = property.id
      const numImages = getRandomInt(1, 5)
      const uploadedImages: Array<{ image: string; sort: number }> = []

      for (let imageIndex = 1; imageIndex <= numImages; imageIndex++) {
        const filePath = `property-${propertyId}/${imageIndex}.jpg`
        const buffer = imageBuffers[(imageIndex - 1) % imageBuffers.length]

        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, buffer, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (error) {
          console.error(`Failed image upload for property ${propertyId}, file ${imageIndex}.jpg: ${error.message}`)
          continue
        }

        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
        uploadedImages.push({
          image: publicUrlData.publicUrl,
          sort: imageIndex,
        })
      }

      if (!uploadedImages.length) {
        throw new Error(`No images uploaded successfully for property ${propertyId}`)
      }

      await payload.update({
        collection: 'properties',
        id: propertyId,
        data: {
          images: uploadedImages,
        },
      })

      console.log(`Created property ${i}/100`)
    } catch (e) {
      console.error(`Failed to create property ${i}:`, e)
    }
  }

  console.log('--- Done ---')
  process.exit(0)
}

seed()
