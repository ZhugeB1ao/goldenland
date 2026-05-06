import dotenv from 'dotenv'
dotenv.config()

import { getPayload } from 'payload'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase URL or Service Role Key in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const BUCKET_NAME = 'Properties'

// Dummy images to upload
const DUMMY_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
]

const TITLE_PREFIXES = {
  apartment: ['Bán căn hộ chung cư cao cấp', 'Bán nhanh căn hộ 2PN', 'Cần bán gấp căn góc chung cư', 'Bán chung cư tầng trung view đẹp', 'Bán căn Studio dự án', 'Chính chủ bán chung cư'],
  house: ['Bán nhà riêng phố', 'Bán nhà mặt ngõ ô tô đỗ cửa', 'Cần bán gấp nhà phân lô', 'Bán nhà cấp 4 tiện xây mới', 'Bán nhà 5 tầng mới kính koong'],
  land: ['Bán đất nền phân lô', 'Bán đất thổ cư mặt đường', 'Cần bán lô đất đẹp xây biệt thự', 'Bán đất vuông vắn ngõ nông'],
  villa: ['Bán biệt thự liền kề', 'Bán biệt thự đơn lập', 'Cần bán biệt thự nghỉ dưỡng', 'Bán biệt thự song lập sang trọng'],
  shophouse: ['Bán Shophouse khối đế', 'Bán Shophouse liền kề', 'Cần bán mặt bằng Shophouse kinh doanh tốt'],
  townhouse: ['Bán nhà phố thương mại', 'Bán liền kề kinh doanh sầm uất', 'Bán nhà liền kề mặt phố lớn'],
  warehouse: ['Bán xưởng sản xuất', 'Bán kho bãi diện tích rộng', 'Cần bán gấp mặt bằng kho bãi'],
  commercial: ['Bán mặt bằng kinh doanh', 'Bán sàn thương mại', 'Cần bán văn phòng mặt sàn'],
  condotel: ['Bán Condotel view biển', 'Bán Condotel cam kết lợi nhuận', 'Cần bán gấp Condotel cao cấp'],
  penthouse: ['Bán Penthouse đẳng cấp', 'Bán Penthouse đập thông 2 tầng', 'Cần bán Penthouse view toàn thành phố']
}

const LOCATIONS = [
  { province: '01', ward: '00139', street: 'Nguyễn Trãi', addressPrefix: 'Quận Thanh Xuân, Hà Nội', lat: 20.993776, lng: 105.808027 },
  { province: '01', ward: '00166', street: 'Trần Duy Hưng', addressPrefix: 'Quận Cầu Giấy, Hà Nội', lat: 21.009710, lng: 105.795856 },
  { province: '01', ward: '00622', street: 'Mễ Trì', addressPrefix: 'Quận Nam Từ Liêm, Hà Nội', lat: 21.016391, lng: 105.783637 },
  { province: '01', ward: '00025', street: 'Đội Cấn', addressPrefix: 'Quận Ba Đình, Hà Nội', lat: 21.034563, lng: 105.819727 },
  { province: '01', ward: '00073', street: 'Khâm Thiên', addressPrefix: 'Quận Đống Đa, Hà Nội', lat: 21.019567, lng: 105.833519 },
]

const PROPERTY_TYPES_NO_APARTMENT = ['house', 'land', 'villa', 'townhouse', 'shophouse', 'warehouse', 'commercial']
const DIRECTIONS = ['east', 'west', 'south', 'north', 'northeast', 'southeast', 'northwest', 'southwest']
const LEGAL_STATUSES = ['red_book', 'sale_contract', 'pending', 'other']
const FURNITURE_STATUSES = ['luxury', 'full', 'basic', 'none']

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const getRandomBoolean = () => Math.random() >= 0.5

async function downloadImage(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  return await response.arrayBuffer()
}

async function seed() {
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config: await config })

  console.log('Downloading dummy images into memory...')
  const imageBuffers: ArrayBuffer[] = []
  for (const url of DUMMY_IMAGE_URLS) {
    try {
      const buf = await downloadImage(url)
      imageBuffers.push(buf)
    } catch (e) {
      console.error('Failed to download dummy image', e)
    }
  }

  if (imageBuffers.length === 0) {
    console.error('No dummy images downloaded, exiting.')
    process.exit(1)
  }

  console.log('--- Appending 100 realistic SALE properties with all attributes ---')

  for (let i = 1; i <= 100; i++) {
    const isApartment = getRandomBoolean()
    let propertyType = 'apartment'
    let projectId: number | null = null

    if (isApartment) {
      propertyType = 'apartment'
      projectId = getRandomInt(72, 104)
    } else {
      propertyType = getRandomItem(PROPERTY_TYPES_NO_APARTMENT)
      projectId = getRandomBoolean() ? null : getRandomInt(72, 104)
    }

    const titlePrefix = getRandomItem(TITLE_PREFIXES[propertyType as keyof typeof TITLE_PREFIXES])
    const location = getRandomItem(LOCATIONS)
    const title = `${titlePrefix} tại ${location.street}, ${location.addressPrefix}`
    
    // Always sale
    const listingType = 'sale'
    
    let price = 0
    let priceUnit: 'total' | 'per_m2' = 'total'
    price = getRandomInt(1, 30) * 1000000000 // 1 to 30 tỷ
    priceUnit = getRandomBoolean() ? 'total' : 'per_m2'
    if (priceUnit === 'per_m2') {
       price = getRandomInt(30, 200) * 1000000 // 30 to 200 triệu / m2
    }

    const area = getRandomInt(30, 300)
    const bedrooms = propertyType === 'land' || propertyType === 'warehouse' ? 0 : getRandomInt(1, 5)
    const bathrooms = propertyType === 'land' || propertyType === 'warehouse' ? 0 : getRandomInt(1, 4)
    const userId = getRandomInt(1, 11)
    
    const isVerified = getRandomBoolean()
    
    // Add jitter to lat/lng to make them unique
    const lat = location.lat + (Math.random() - 0.5) * 0.01
    const lng = location.lng + (Math.random() - 0.5) * 0.01

    try {
      // Create a unique slug
      const slugBase = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const uniqueSlug = `${slugBase}-${Math.random().toString(36).substring(2, 8)}`

      // Step 1: Create the property in Payload with fully populated fields
      const property = await payload.create({
        collection: 'properties',
        data: {
          title,
          slug: uniqueSlug,
          description: `Chính chủ cần ${listingType === 'sale' ? 'bán' : 'cho thuê'} gấp ${propertyType === 'apartment' ? 'căn hộ' : 'bất động sản'} tại ${location.street}, ${location.addressPrefix}. Diện tích ${area}m2, thiết kế hợp lý, công năng tối ưu. Vị trí đắc địa, giao thông thuận tiện. Gần trường học, bệnh viện, khu vui chơi giải trí. Khu dân cư văn minh, an ninh đảm bảo 24/7. Pháp lý rõ ràng, sẵn sàng giao dịch. Liên hệ ngay để xem nhà và thương lượng giá tốt nhất.`,
          listingType,
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
          provinceCode: location.province,
          wardCode: location.ward,
          street: location.street,
          address: `Số ${getRandomInt(1, 100)}, Phố ${location.street}, ${location.addressPrefix}`,
          latitude: lat,
          longitude: lng,
          status: 'active',
          label: getRandomItem(['normal', 'vip', 'hot', 'premium']) as any,
          user: userId,
          project: projectId,
          videoUrl: getRandomBoolean() ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : undefined,
          isVerified: isVerified,
          verifiedBy: isVerified ? getRandomInt(1, 11) : undefined,
          verifiedAt: isVerified ? new Date().toISOString() : undefined,
          seoTitle: (`${title} - Giá tốt`).substring(0, 70),
          seoDescription: (`Cơ hội sở hữu ${title} với giá ưu đãi.`).substring(0, 160),
          seoKeywords: `bán ${propertyType}, ${location.street}, ${location.addressPrefix}`,
        },
      })

      const propertyId = property.id
      console.log(`Created Property ${i}/100 (ID: ${propertyId}): ${title}`)

      // Step 2: Upload 1-5 images to Supabase Storage
      const numImages = getRandomInt(1, 5)
      const newImagesArray = []

      for (let j = 0; j < numImages; j++) {
        const fileName = `${j + 1}.jpg`
        const filePath = `property-${propertyId}/${fileName}`
        
        // Cycle through cached image buffers
        const buffer = imageBuffers[j % imageBuffers.length]

        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, buffer, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (error) {
          console.error(`Error uploading ${filePath}:`, error.message)
        } else {
          // Public URL format requested by user:
          // https://ccwmekftdqxobmxscvzy.supabase.co/storage/v1/object/public/Properties/property-{properties_id}/{ảnh}
          const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath)
            
          newImagesArray.push({
            image: publicUrlData.publicUrl,
            sort: j + 1
          })
        }
      }

      // Step 3: Update the property with the image URLs
      if (newImagesArray.length > 0) {
        await payload.update({
          collection: 'properties',
          id: propertyId,
          data: {
            images: newImagesArray,
          },
        })
        console.log(` -> Uploaded and linked ${newImagesArray.length} images for Property ID: ${propertyId}`)
      }

    } catch (error) {
      console.error(`Failed to create property ${i}:`, error instanceof Error ? error.message : error)
    }
  }

  console.log('--- Property seed complete ---')
  process.exit(0)
}

seed()
