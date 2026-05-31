import type { Property } from '@/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

export type PropertyDetailSidebarUser = {
  fullName?: string | null
  phone?: string | null
  avatar_id?: string | null
  email?: string | null
}

export type PropertyDetailData = {
  property: Property
  sidebarUser?: PropertyDetailSidebarUser
}

export async function fetchPropertyDetailData(id: string): Promise<PropertyDetailData> {
  const payload = await getPayload({ config })

  const property = await payload.findByID({
    collection: 'properties',
    id,
    depth: 2,
    overrideAccess: false,
  })

  const userId =
    typeof property.user === 'object' && property.user ? property.user.id : property.user

  if (!userId) {
    return { property }
  }

  const user = await payload.findByID({
    collection: 'users',
    id: String(userId),
    depth: 0,
    // Intentional: property detail sidebar needs public contact info.
    overrideAccess: true,
    select: {
      fullName: true,
      phone: true,
      avatar_id: true,
      email: true,
    },
  })

  return {
    property,
    sidebarUser: {
      fullName: user.fullName,
      phone: user.phone,
      avatar_id: user.avatar_id,
      email: user.email,
    },
  }
}
