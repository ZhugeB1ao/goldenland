'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'

export async function updateReportStatus(
  id: number | string,
  status: ReportStatus,
  adminNote?: string,
) {
  const payload = await getPayload({ config: await config })
  await payload.update({
    collection: 'reports',
    id,
    data: {
      status,
      ...(adminNote !== undefined ? { adminNote } : {}),
    },
    overrideAccess: true,
  })
  revalidatePath('/quan-tri/bao-cao')
}

export async function hideProperty(propertyId: number | string) {
  const payload = await getPayload({ config: await config })
  await payload.update({
    collection: 'properties',
    id: propertyId,
    data: { status: 'rejected' },
    overrideAccess: true,
  })
  revalidatePath('/quan-tri/bao-cao')
  revalidatePath('/quan-tri/tin-dang')
}

export async function deleteProperty(propertyId: number | string) {
  const payload = await getPayload({ config: await config })
  await payload.delete({
    collection: 'properties',
    id: propertyId,
    overrideAccess: true,
  })
  revalidatePath('/quan-tri/bao-cao')
  revalidatePath('/quan-tri/tin-dang')
}