import dotenv from 'dotenv'
dotenv.config()

import { getPayload } from 'payload'

const REASONS = ['scam', 'wrong_info', 'duplicate', 'wrong_image', 'sold_not_removed', 'other'] as const
const STATUSES = ['pending', 'pending', 'pending', 'reviewing', 'resolved', 'dismissed'] as const

const DETAILS: Partial<Record<string, string>> = {
  other: 'Tin này có nội dung không phù hợp, cần xem xét lại.',
}

const ADMIN_NOTES: Record<string, string> = {
  resolved: 'Đã liên hệ người đăng và yêu cầu chỉnh sửa thông tin.',
  dismissed: 'Báo cáo không có cơ sở, tin đăng hợp lệ.',
  reviewing: 'Đang xác minh thông tin với người đăng.',
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function seed() {
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config: await config })

  // Lấy properties có sẵn
  const propsResult = await payload.find({
    collection: 'properties',
    limit: 30,
    depth: 0,
    overrideAccess: true,
  })

  if (propsResult.docs.length === 0) {
    console.error('Không có properties trong database. Hãy seed properties trước.')
    process.exit(1)
  }

  // Lấy users có sẵn
  const usersResult = await payload.find({
    collection: 'users',
    limit: 20,
    depth: 0,
    overrideAccess: true,
  })

  if (usersResult.docs.length === 0) {
    console.error('Không có users trong database. Hãy seed users trước.')
    process.exit(1)
  }

  const properties = propsResult.docs
  const users = usersResult.docs

  console.log(`Tìm thấy ${properties.length} properties, ${users.length} users`)
  console.log('Bắt đầu seed 20 reports...\n')

  let created = 0

  for (let i = 0; i < 20; i++) {
    const property = pick(properties)
    const reporter = pick(users)
    const reason = pick(REASONS)
    const status = pick(STATUSES)

    try {
      await payload.create({
        collection: 'reports',
        data: {
          property: property.id,
          reporter: reporter.id,
          reason,
          ...(reason === 'other' ? { detail: DETAILS.other } : {}),
          status,
          ...(ADMIN_NOTES[status] ? { adminNote: ADMIN_NOTES[status] } : {}),
        },
        overrideAccess: true,
      })
      created++
      console.log(`✓ [${created}/20] ${reason} → ${status} | "${(property as any).title?.slice(0, 40) ?? property.id}"`)
    } catch (e: any) {
      console.error(`✗ Lỗi tạo report ${i + 1}:`, e.message)
    }
  }

  console.log(`\n✓ Đã tạo ${created}/20 reports`)
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})