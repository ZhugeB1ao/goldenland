import dotenv from 'dotenv'
dotenv.config()

import { getPayload } from 'payload'

const TITLES = [
  'Bán nhà mặt phố trung tâm',
  'Cho thuê căn hộ cao cấp',
  'Bán đất nền ven biển',
  'Bán biệt thự nghỉ dưỡng sang trọng',
  'Cho thuê mặt bằng kinh doanh',
  'Nhà liền kề khu đô thị mới',
  'Bán shophouse sinh lời cao',
  'Cho thuê kho xưởng diện tích lớn',
  'Căn hộ mini giá rẻ cho sinh viên',
  'Bán nhà cấp 4 tiện xây mới',
  'Chính chủ cần bán gấp căn góc',
  'Cho thuê nhà nguyên căn nội thất đầy đủ',
  'Bán đất thổ cư sổ đỏ chính chủ',
  'Căn hộ Penthouse view toàn thành phố',
  'Bán nhà trong ngõ ô tô đỗ cửa'
]

const DESCRIPTIONS = [
  'Vị trí đắc địa, giao thông thuận tiện. Gần trường học, bệnh viện, chợ. Khu dân cư văn minh, an ninh tốt.',
  'Thiết kế hiện đại, tối ưu công năng sử dụng. Đầy đủ nội thất cao cấp chỉ việc xách vali về ở.',
  'Cơ hội đầu tư sinh lời cao. Tiềm năng tăng giá trong tương lai khi có dự án hạ tầng lớn đi qua.',
  'Không gian sống trong lành, nhiều tiện ích xung quanh. Phù hợp cho gia đình có người già và trẻ nhỏ.',
  'Giấy tờ pháp lý rõ ràng, sổ đỏ sẵn sàng giao dịch. Sang tên nhanh chóng trong ngày.'
]

const PROPERTY_TYPES_NO_APARTMENT = ['house', 'land', 'villa', 'townhouse', 'shophouse', 'warehouse', 'commercial']
const DIRECTIONS = ['east', 'west', 'south', 'north', 'northeast', 'southeast', 'northwest', 'southwest']
const LEGAL_STATUSES = ['red_book', 'sale_contract', 'pending', 'other']
const FURNITURE_STATUSES = ['luxury', 'full', 'basic', 'none']

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const getRandomBoolean = () => Math.random() >= 0.5

async function seed() {
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config: await config })

  console.log('--- Seeding 100 realistic properties ---')

  for (let i = 1; i <= 100; i++) {
    // Determine if it belongs to a project
    const hasProject = Math.random() >= 0.4 // 60% chance to belong to a project
    const projectId = hasProject ? getRandomInt(72, 104) : null

    // Determine property type
    let propertyType = 'apartment'
    if (!hasProject) {
      propertyType = getRandomItem(PROPERTY_TYPES_NO_APARTMENT)
    } else {
      // If it has a project, it could be anything, but mostly apartment, villa, townhouse, shophouse
      const projectTypes = ['apartment', 'apartment', 'villa', 'townhouse', 'shophouse', 'condotel', 'land']
      propertyType = getRandomItem(projectTypes)
    }

    const listingType = getRandomBoolean() ? 'sale' : 'rent'
    const titleBase = getRandomItem(TITLES)
    const title = `${titleBase} - Mã TS${getRandomInt(1000, 9999)}`
    
    let price = 0
    let priceUnit: 'total' | 'per_m2' | 'per_month' = 'total'
    if (listingType === 'sale') {
      price = getRandomInt(1, 20) * 1000000000 // 1 to 20 tỷ
      priceUnit = getRandomBoolean() ? 'total' : 'per_m2'
      if (priceUnit === 'per_m2') {
         price = getRandomInt(30, 200) * 1000000 // 30 to 200 triệu / m2
      }
    } else {
      price = getRandomInt(5, 50) * 1000000 // 5 to 50 triệu / tháng
      priceUnit = 'per_month'
    }

    const area = getRandomInt(30, 300)
    const bedrooms = propertyType === 'land' || propertyType === 'warehouse' ? 0 : getRandomInt(1, 5)
    const bathrooms = propertyType === 'land' || propertyType === 'warehouse' ? 0 : getRandomInt(1, 4)

    const images = [
      {
        image: `https://ccwmekftdqxobmxscvzy.supabase.co/storage/v1/object/public/Properties/demo-house-${getRandomInt(1, 5)}.jpg`,
        sort: 1
      },
      {
        image: `https://ccwmekftdqxobmxscvzy.supabase.co/storage/v1/object/public/Properties/demo-interior-${getRandomInt(1, 5)}.jpg`,
        sort: 2
      }
    ]

    const userId = getRandomInt(1, 11)

    try {
      await payload.create({
        collection: 'properties',
        data: {
          title,
          description: `${getRandomItem(DESCRIPTIONS)} ${getRandomItem(DESCRIPTIONS)}`,
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
          address: `Số ${getRandomInt(1, 100)}, Đường Mẫu, Quận Mẫu, TP Mẫu`,
          status: 'active',
          label: getRandomItem(['normal', 'vip', 'hot', 'premium']) as any,
          user: userId,
          project: projectId,
          images,
        },
      })
      console.log(`Created property ${i}/100: ${title}`)
    } catch (error) {
      console.error(`Failed to create property ${i}:`, error instanceof Error ? error.message : error)
    }
  }

  console.log('--- Property seed complete ---')
  process.exit(0)
}

seed()
