'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'

// ─── Shared ───────────────────────────────────────────────────────────────────

export type PostType = 'normal' | 'silver' | 'gold' | 'diamond'

// ─── Packages ─────────────────────────────────────────────────────────────────

export type PackageDurationOption = {
  months: number
  price: number
  originalPrice?: number
  totalProperties?: number
  discount?: number
  savePerMonth?: number
}

export type PackageBonusVoucher = {
  quantity: number
  discountValue: number
  appliedFor: PostType
}

export type PackageFormData = {
  name: string
  subtitle?: string
  description?: string
  price: number
  originalPrice?: number
  durationOptions?: PackageDurationOption[]
  totalProperties: number
  durationDays: number
  propertyDurationDays: number
  postType: PostType
  isBestSeller: boolean
  isActive: boolean
  sort: number
  features?: { feature: string }[]
  bonusVouchers?: PackageBonusVoucher[]
}

export async function savePackage(id: number | string | null, data: PackageFormData) {
  const payload = await getPayload({ config: await config })
  if (id) {
    await payload.update({ collection: 'packages', id: id as number, data, overrideAccess: true })
  } else {
    await payload.create({ collection: 'packages', data, overrideAccess: true })
  }
  revalidatePath('/quan-tri/goi')
}

export async function deletePackage(id: number | string) {
  const payload = await getPayload({ config: await config })
  await payload.delete({ collection: 'packages', id: id as number, overrideAccess: true })
  revalidatePath('/quan-tri/goi')
}

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

// ─── Posting Prices ───────────────────────────────────────────────────────────

export type PostingPriceDurationOption = {
  durationDays: number
  discountPercent?: number
  label?: string
}

export type PostingPriceFormData = {
  name: string
  description?: string
  postType: PostType
  displayMultiplier: number
  dailyPrice: number
  recommendedDurationDays: number
  durationOptions: PostingPriceDurationOption[]
  sort: number
  isActive: boolean
}

export async function savePostingPrice(
  id: number | string | null,
  data: PostingPriceFormData,
) {
  const payload = await getPayload({ config: await config })
  if (id) {
    await payload.update({
      collection: 'posting-prices',
      id: id as number,
      data,
      overrideAccess: true,
    })
  } else {
    await payload.create({ collection: 'posting-prices', data, overrideAccess: true })
  }
  revalidatePath('/quan-tri/goi')
}

export async function deletePostingPrice(id: number | string) {
  const payload = await getPayload({ config: await config })
  await payload.delete({ collection: 'posting-prices', id: id as number, overrideAccess: true })
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
