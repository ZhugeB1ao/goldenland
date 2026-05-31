import type { PayloadRequest } from 'payload'

export const SCHEDULE_CONTEXT_KEY = 'skipScheduledPropertyRefresh'

export const refreshScheduledProperties = async (req: PayloadRequest) => {
  if (req.context?.[SCHEDULE_CONTEXT_KEY]) return

  const now = new Date().toISOString()
  const context = { ...req.context, [SCHEDULE_CONTEXT_KEY]: true }

  const [duePending, dueExpired] = await Promise.all([
    req.payload.find({
      collection: 'properties',
      where: {
        and: [
          { status: { equals: 'pending' } },
          { scheduledPublishAt: { less_than_equal: now } },
        ],
      },
      limit: 100,
      depth: 0,
      overrideAccess: true,
      req,
      context,
    }),
    req.payload.find({
      collection: 'properties',
      where: {
        and: [{ status: { equals: 'active' } }, { expiresAt: { less_than_equal: now } }],
      },
      limit: 100,
      depth: 0,
      overrideAccess: true,
      req,
      context,
    }),
  ])

  await Promise.all([
    ...duePending.docs.map((doc) =>
      req.payload.update({
        collection: 'properties',
        id: doc.id,
        data: { status: 'active' },
        overrideAccess: true,
        req,
        context,
      }),
    ),
    ...dueExpired.docs.map((doc) =>
      req.payload.update({
        collection: 'properties',
        id: doc.id,
        data: { status: 'expired' },
        overrideAccess: true,
        req,
        context,
      }),
    ),
  ])
}
