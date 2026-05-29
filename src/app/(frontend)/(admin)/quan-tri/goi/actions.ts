'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'

export async function togglePackageActive(id: number | string, isActive: boolean) {
  const payload = await getPayload({ config: await config })
  await payload.update({
    collection: 'packages',
    id: id as number,
    data: { isActive },
    overrideAccess: true,
  })
  revalidatePath('/quan-tri/goi')
}

export async function togglePostingPriceActive(id: number | string, isActive: boolean) {
  const payload = await getPayload({ config: await config })
  await payload.update({
    collection: 'posting-prices',
    id: id as number,
    data: { isActive },
    overrideAccess: true,
  })
  revalidatePath('/quan-tri/goi')
}
