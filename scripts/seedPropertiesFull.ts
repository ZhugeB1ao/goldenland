import dotenv from 'dotenv'
dotenv.config()

import { getPayload } from 'payload'
import { createClient } from '@supabase/supabase-js'

const TITLES = [
  'Bán nhà mặt phố trung tâm',
  'Bán đất nền ven biển',
  'Bán biệt thự nghỉ dưỡng sang trọng',
  'Nhà liền kề khu đô thị mới',
  'Bán shophouse sinh lời cao',
  'Căn hộ mini giá rẻ cho sinh viên',
  'Bán nhà cấp 4 tiện xây mới',
  'Chính chủ cần bán gấp căn góc',
  'Bán đất thổ cư sổ đỏ chính chủ',
  'Căn hộ Penthouse view toàn thành phố',
  'Bán nhà trong ngõ ô tô đỗ cửa'
]

const DESCRIPTIONS = [
  'Vị trí đắc địa, giao thông thuận tiện. Gần trường học, bệnh viện, chợ. Khu dân cư văn minh, an ninh tốt. Không gian thoáng đãng, mang đến cuộc sống lý tưởng cho gia đình bạn.',
  'Thiết kế hiện đại, tối ưu công năng sử dụng. Đầy đủ nội thất cao cấp chỉ việc xách vali về ở. Tòa nhà trang bị thang máy tốc độ cao, hệ thống phòng cháy chữa cháy an toàn.',
  'Cơ hội đầu tư sinh lời cao. Tiềm năng tăng giá trong tương lai khi có dự án hạ tầng lớn đi qua. Xung quanh đầy đủ các tiện ích ngoại khu vượt trội.',
  'Không gian sống trong lành, nhiều tiện ích xung quanh. Phù hợp cho gia đình có người già và trẻ nhỏ. An ninh 24/7, bãi đỗ xe thông minh rộng rãi.',
  'Giấy tờ pháp lý rõ ràng, sổ đỏ sẵn sàng giao dịch. Sang tên nhanh chóng trong ngày. Hỗ trợ vay vốn ngân hàng lên đến 70% giá trị với lãi suất ưu đãi.'
]

const PROPERTY_TYPES_NO_APARTMENT = ['house', 'land', 'villa', 'townhouse', 'shophouse', 'warehouse', 'commercial']
const DIRECTIONS = ['east', 'west', 'south', 'north', 'northeast', 'southeast', 'northwest', 'southwest']
const LEGAL_STATUSES = ['red_book', 'sale_contract', 'pending', 'other']
const FURNITURE_STATUSES = ['luxury', 'full', 'basic', 'none']

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BUCKET_NAME = 'Properties'
const SEED_SLUG_PREFIX = 'seed-prop-full'

const DUMMY_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
]

// Location Mocks (aligned with vietnam-divisions dataset)
const LOCATIONS = [
  { provinceCode: '79', wardCode: '25747', street: 'Nguyễn Huệ', district: 'Quận 1', city: 'TP. Hồ Chí Minh', baseLat: 10.7732, baseLng: 106.7034 },
  { provinceCode: '79', wardCode: '25750', street: 'Lê Duẩn', district: 'Quận 1', city: 'TP. Hồ Chí Minh', baseLat: 10.7828, baseLng: 106.6993 },
  { provinceCode: '79', wardCode: '25813', street: 'Nguyễn Thị Minh Khai', district: 'Quận 3', city: 'TP. Hồ Chí Minh', baseLat: 10.7769, baseLng: 106.6951 },

  { provinceCode: '01', wardCode: '00070', street: 'Tràng Tiền', district: 'Quận Hoàn Kiếm', city: 'Hà Nội', baseLat: 21.0253, baseLng: 105.8524 },
  { provinceCode: '01', wardCode: '00025', street: 'Kim Mã', district: 'Quận Ba Đình', city: 'Hà Nội', baseLat: 21.0315, baseLng: 105.8202 },

  { provinceCode: '48', wardCode: '20242', street: 'Bạch Đằng', district: 'Quận Hải Châu', city: 'Đà Nẵng', baseLat: 16.0664, baseLng: 108.2231 },
  { provinceCode: '48', wardCode: '20263', street: 'Võ Nguyên Giáp', district: 'Quận Sơn Trà', city: 'Đà Nẵng', baseLat: 16.0601, baseLng: 108.2435 },

  { provinceCode: '75', wardCode: '26248', street: 'Đồng Khởi', district: 'TP. Biên Hòa', city: 'Đồng Nai', baseLat: 10.9575, baseLng: 106.8427 },
  { provinceCode: '75', wardCode: '26341', street: 'Phạm Văn Thuận', district: 'TP. Biên Hòa', city: 'Đồng Nai', baseLat: 10.9416, baseLng: 106.8306 },
  { provinceCode: '75', wardCode: '26485', street: 'Đại lộ Bình Dương', district: 'TP. Thủ Dầu Một', city: 'Bình Dương', baseLat: 10.9806, baseLng: 106.6745 },
]

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const getRandomBoolean = () => Math.random() >= 0.5
const randomOffset = () => (Math.random() - 0.5) * 0.01 // Add slight variation to coords

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

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config: await config })

  const { docs: users } = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1000,
    pagination: false,
  })

  if (!users.length) {
    console.error('No users found. Please seed users before seeding properties.')
    process.exit(1)
  }

  const userIds = users.map((user) => user.id)
  const ownerUser = users.find((user) => String(user.id) === '1')

  if (!ownerUser) {
    console.error('User id=1 not found. Please seed users or adjust the target user id.')
    process.exit(1)
  }

  const { docs: projects } = await payload.find({
    collection: 'projects',
    depth: 0,
    limit: 1000,
    pagination: false,
  })
  const projectIds = projects.map((project) => project.id)

  console.log(`Loaded ${userIds.length} users and ${projectIds.length} projects for random assignment.`)
  console.log(`All seeded properties will be assigned to user id=${ownerUser.id}.`)

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

  console.log('--- Cleaning up previous seed properties ---')
  await payload.delete({
    collection: 'properties',
    where: {
      slug: {
        contains: `${SEED_SLUG_PREFIX}-`,
      },
    }
  })

  console.log('--- Seeding 100 realistic properties with FULL metadata ---')

  let createdCount = 0
  let imageLinkedCount = 0
  let failedCount = 0

  for (let i = 1; i <= 100; i++) {
    const hasProject = projectIds.length > 0 && Math.random() >= 0.4
    const projectId = hasProject ? getRandomItem(projectIds) : null

    let propertyType = 'apartment'
    if (!hasProject) {
      propertyType = getRandomItem(PROPERTY_TYPES_NO_APARTMENT)
    } else {
      const projectTypes = ['apartment', 'apartment', 'villa', 'townhouse', 'shophouse', 'condotel', 'land']
      propertyType = getRandomItem(projectTypes)
    }

    const loc = getRandomItem(LOCATIONS)
    const houseNumber = getRandomInt(1, 200)
    const titleBase = getRandomItem(TITLES)
    const title = `${titleBase} tại ${loc.street}, ${loc.city}`
    const slug = `${SEED_SLUG_PREFIX}-${title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-')}-${getRandomInt(10000, 99999)}`
    const description = `${getRandomItem(DESCRIPTIONS)} ${getRandomItem(DESCRIPTIONS)}`
    
    const price = getRandomInt(1, 20) * 1000000000 // 1 to 20 tỷ
    const priceUnit = 'total' as const

    const area = getRandomInt(30, 300)
    const bedrooms = propertyType === 'land' || propertyType === 'warehouse' ? 0 : getRandomInt(1, 5)
    const bathrooms = propertyType === 'land' || propertyType === 'warehouse' ? 0 : getRandomInt(1, 4)
    const userId = ownerUser.id


    const isVerified = getRandomBoolean()

    try {
      const property = await payload.create({
        collection: 'properties',
        data: {
          title,
          slug,
          description,
          postType: getRandomBoolean() ? 'normal' : 'vip',
          price,
          priceUnit,
          propertyType: propertyType as any,
          area,
          bedrooms,
          bathrooms,
          roadWidth: getRandomBoolean() ? getRandomInt(3, 20) : undefined,
          facadeWidth: getRandomBoolean() ? getRandomInt(4, 15) : undefined,
          direction: getRandomItem(DIRECTIONS) as any,
          legalStatus: getRandomItem(LEGAL_STATUSES) as any,
          furnitureStatus: getRandomItem(FURNITURE_STATUSES) as any,
          
          // FULL LOCATION
          provinceCode: loc.provinceCode,
          wardCode: loc.wardCode,
          street: loc.street,
          address: `Số ${houseNumber} ${loc.street}, ${loc.district}, ${loc.city}`,
          latitude: loc.baseLat + randomOffset(),
          longitude: loc.baseLng + randomOffset(),

          // MEDIA
          videoUrl: getRandomBoolean() ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : undefined,

          // STATUS & VERIFICATION
          status: 'active',
          label: getRandomItem(['normal', 'vip', 'hot', 'premium']) as any,
          isVerified,
          verifiedBy: isVerified ? getRandomItem(userIds) : undefined,
          verifiedAt: isVerified ? new Date(Date.now() - getRandomInt(1, 10) * 86400000).toISOString() : undefined,

          // SEO
          seoTitle: `${title} | BĐS`.substring(0, 70),
          seoDescription: description.substring(0, 150),
          seoKeywords: `bán nhà, ${propertyType}, ${loc.street}, bđs`,

          user: userId,
          project: projectId,
        },
      })
      createdCount += 1

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

      imageLinkedCount += 1
      console.log(`Created full property ${i}/100 (ID: ${propertyId}) with ${uploadedImages.length} images: ${title}`)
    } catch (error) {
      failedCount += 1
      console.error(`Failed to create property ${i}:`, error instanceof Error ? error.message : error)
    }
  }

  console.log(`Summary: created=${createdCount}, linkedImages=${imageLinkedCount}, failed=${failedCount}`)
  console.log('--- Full Property seed complete ---')
  process.exit(0)
}

seed()
