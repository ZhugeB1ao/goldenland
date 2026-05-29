import dotenv from 'dotenv'

dotenv.config()

import { getPayload } from 'payload'
import type { PostingPrice } from '../src/payload-types'

type PostingPriceSeed = Omit<PostingPrice, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: never
  createdAt?: never
  updatedAt?: never
}

const DEFAULT_POSTING_PRICES: PostingPriceSeed[] = [
  {
    name: 'VIP Kim Cương',
    description: 'Hiển thị nổi bật nhất, ưu tiên cao nhất trong danh sách tin.',
    postType: 'diamond',
    displayMultiplier: 30,
    dailyPrice: 321_100,
    recommendedDurationDays: 7,
    durationOptions: [
      { durationDays: 7, discountPercent: 0, label: 'Đề xuất' },
      { durationDays: 15, discountPercent: 5, label: 'Tiết kiệm 5%' },
      { durationDays: 30, discountPercent: 10, label: 'Tiết kiệm 10%' },
    ],
    sort: 10,
    isActive: true,
  },
  {
    name: 'VIP Vàng',
    description: 'Ưu tiên hiển thị cao, phù hợp tin cần tăng tốc tiếp cận.',
    postType: 'gold',
    displayMultiplier: 15,
    dailyPrice: 120_900,
    recommendedDurationDays: 7,
    durationOptions: [
      { durationDays: 7, discountPercent: 0, label: 'Đề xuất' },
      { durationDays: 15, discountPercent: 5, label: 'Tiết kiệm 5%' },
      { durationDays: 30, discountPercent: 10, label: 'Tiết kiệm 10%' },
    ],
    sort: 20,
    isActive: true,
  },
  {
    name: 'VIP Bạc',
    description: 'Ưu tiên hiển thị tốt hơn tin thường, chi phí vừa phải.',
    postType: 'silver',
    displayMultiplier: 8,
    dailyPrice: 66_000,
    recommendedDurationDays: 7,
    durationOptions: [
      { durationDays: 7, discountPercent: 0, label: 'Đề xuất' },
      { durationDays: 15, discountPercent: 5, label: 'Tiết kiệm 5%' },
      { durationDays: 30, discountPercent: 10, label: 'Tiết kiệm 10%' },
    ],
    sort: 30,
    isActive: true,
  },
  {
    name: 'Tin Thường',
    description: 'Hiển thị tiêu chuẩn theo thời gian đăng tin đã chọn.',
    postType: 'normal',
    displayMultiplier: 1,
    dailyPrice: 3_000,
    recommendedDurationDays: 15,
    durationOptions: [
      { durationDays: 15, discountPercent: 0, label: 'Đề xuất' },
      { durationDays: 30, discountPercent: 5, label: 'Tiết kiệm 5%' },
      { durationDays: 60, discountPercent: 10, label: 'Tiết kiệm 10%' },
    ],
    sort: 40,
    isActive: true,
  },
]

async function run() {
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config: await config })

  for (const price of DEFAULT_POSTING_PRICES) {
    const existing = await payload.find({
      collection: 'posting-prices',
      where: { postType: { equals: price.postType } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'posting-prices',
        id: existing.docs[0].id,
        data: price,
        overrideAccess: true,
      })
      console.log(`Updated ${price.name}`)
      continue
    }

    await payload.create({
      collection: 'posting-prices',
      data: price,
      overrideAccess: true,
    })
    console.log(`Created ${price.name}`)
  }
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
