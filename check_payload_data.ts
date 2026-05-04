import { getPayload } from 'payload'
import configPromise from './src/payload.config'
import dotenv from 'dotenv'

dotenv.config()

async function checkData() {
  try {
    const payload = await getPayload({ config: configPromise })
    const response = await payload.find({
      collection: 'projects',
      sort: '-views',
      limit: 4,
      page: 1,
      where: {
        status: {
          equals: 'active',
        },
      },
    })

    console.log('--- PAYLOAD DATA ---')
    console.log(JSON.stringify(response.docs.map(d => ({ id: d.id, name: d.name, views: d.views, status: d.status })), null, 2))
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

checkData()
