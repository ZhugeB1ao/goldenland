import type { Endpoint } from 'payload'

const startOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

const addDays = (d: Date, days: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

export const adminDashboardStats: Endpoint = {
  path: '/admin/dashboard-stats',
  method: 'get',
  handler: async (req) => {
    const { payload, user } = req

    if (!user || (user as { role?: string }).role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const today = startOfDay(now)
    const tomorrow = addDays(today, 1)
    const last7 = addDays(today, -6)
    const last30 = addDays(today, -29)

    const countOnly = { limit: 0, depth: 0, req } as const

    const [
      pendingProperties,
      activeProperties,
      pendingReports,
      newUsersToday,
      totalUsers,
      ordersToday,
      ordersLast7,
      ordersLast30,
      latestPending,
      latestReports,
    ] = await Promise.all([
      payload.find({
        collection: 'properties',
        where: { status: { equals: 'pending' } },
        ...countOnly,
      }),
      payload.find({
        collection: 'properties',
        where: { status: { equals: 'active' } },
        ...countOnly,
      }),
      payload.find({
        collection: 'reports',
        where: { status: { equals: 'pending' } },
        ...countOnly,
      }),
      payload.find({
        collection: 'users',
        where: { createdAt: { greater_than_equal: today.toISOString() } },
        ...countOnly,
      }),
      payload.find({ collection: 'users', ...countOnly }),
      payload.find({
        collection: 'orders',
        where: {
          and: [
            { status: { equals: 'paid' } },
            { paidAt: { greater_than_equal: today.toISOString() } },
            { paidAt: { less_than: tomorrow.toISOString() } },
          ],
        },
        limit: 200,
        depth: 0,
        req,
      }),
      payload.find({
        collection: 'orders',
        where: {
          and: [
            { status: { equals: 'paid' } },
            { paidAt: { greater_than_equal: last7.toISOString() } },
          ],
        },
        limit: 1000,
        depth: 0,
        req,
      }),
      payload.find({
        collection: 'orders',
        where: {
          and: [
            { status: { equals: 'paid' } },
            { paidAt: { greater_than_equal: last30.toISOString() } },
          ],
        },
        limit: 5000,
        depth: 0,
        req,
      }),
      payload.find({
        collection: 'properties',
        where: { status: { equals: 'pending' } },
        sort: '-createdAt',
        limit: 5,
        depth: 1,
        req,
      }),
      payload.find({
        collection: 'reports',
        where: { status: { equals: 'pending' } },
        sort: '-createdAt',
        limit: 5,
        depth: 1,
        req,
      }),
    ])

    const sum = (docs: Array<{ totalAmount?: number | null }>) =>
      docs.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0)

    return Response.json({
      counts: {
        pendingProperties: pendingProperties.totalDocs,
        activeProperties: activeProperties.totalDocs,
        pendingReports: pendingReports.totalDocs,
        newUsersToday: newUsersToday.totalDocs,
        totalUsers: totalUsers.totalDocs,
        ordersToday: ordersToday.totalDocs,
      },
      revenue: {
        today: sum(ordersToday.docs as any),
        last7Days: sum(ordersLast7.docs as any),
        last30Days: sum(ordersLast30.docs as any),
      },
      latestPendingProperties: latestPending.docs,
      latestPendingReports: latestReports.docs,
    })
  },
}