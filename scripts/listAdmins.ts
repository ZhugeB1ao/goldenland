import dotenv from 'dotenv'
dotenv.config()

import { getPayload } from 'payload'

async function main() {
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config: await config })

  const result = await payload.find({
    collection: 'users',
    where: { role: { equals: 'admin' } },
    limit: 50,
    depth: 0,
  })

  console.log(`\n=== Tìm thấy ${result.totalDocs} tài khoản admin ===\n`)

  if (result.docs.length === 0) {
    console.log('Chưa có user nào với role=admin trong DB.')
  } else {
    result.docs.forEach((u: any, i: number) => {
      console.log(`${i + 1}. ${u.fullName || '(không có tên)'}`)
      console.log(`   email   : ${u.email}`)
      console.log(`   phone   : ${u.phone || '-'}`)
      console.log(`   active  : ${u.isActive}`)
      console.log(`   verified: ${u.isVerified}`)
      console.log(`   created : ${u.createdAt}`)
      console.log('')
    })
  }

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})