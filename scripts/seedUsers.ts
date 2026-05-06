import dotenv from 'dotenv'
dotenv.config()

import { getPayload } from 'payload'

async function seed() {
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config: await config })

  console.log('--- Seeding 11 new users with updated avatar URLs ---')

  const userNames = [
    'Nguyễn Văn An',
    'Trần Thị Bình',
    'Lê Hoàng Cường',
    'Phạm Minh Đức',
    'Hoàng Thu Thảo',
    'Vũ Anh Tuấn',
    'Đặng Tuyết Mai',
    'Bùi Xuân Bắc',
    'Đỗ Kim Chi',
    'Ngô Quang Khải',
    'Lý Bảo Ngọc'
  ]

  for (let i = 1; i <= 11; i++) {
    const email = `user${i}@example.com`
    const fullName = userNames[i - 1]
    const avatarUrl = `https://ccwmekftdqxobmxscvzy.supabase.co/storage/v1/object/public/Avatar/user-${i}/avatar.jpg`

    console.log(`Creating user: ${fullName} (${email})`)

    try {
      await payload.create({
        collection: 'users',
        data: {
          email,
          password: 'password123',
          fullName,
          phone: `09876540${i.toString().padStart(2, '0')}`,
          avatar_id: avatarUrl,
          role: 'user',
          balance: 1000000,
          isVerified: true,
          isActive: true,
        },
      })
    } catch (error) {
      console.error(`Failed to create user ${email}:`, error instanceof Error ? error.message : error)
    }
  }

  console.log('--- Seed complete ---')
  process.exit(0)
}

seed()
