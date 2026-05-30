import type { Payload } from 'payload'
import { SCHEDULE_CONTEXT_KEY } from '@/hooks/refreshScheduledProperties'

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

// Truyền context này vào mọi query trên `properties` để bỏ qua hook
// refreshScheduledProperties — tránh cascade thêm 2 query mỗi lần
const skipScheduleCtx = { [SCHEDULE_CONTEXT_KEY]: true } as const

export type DashboardStats = {
  counts: {
    pendingProperties: number
    activeProperties: number
    pendingReports: number
    newUsersToday: number
    totalUsers: number
    ordersToday: number
  }
  revenue: {
    today: number
    last7Days: number
    last30Days: number
  }
  latestPendingProperties: any[]
  latestPendingReports: any[]
}

export async function loadDashboardStats(payload: Payload): Promise<DashboardStats> {
  const now = new Date()
  const today = startOfDay(now)
  const tomorrow = addDays(today, 1)
  const last7 = addDays(today, -6)
  const last30 = addDays(today, -29)

  // ─── Đợt 1: 4 count queries (SELECT count(*)) ─────────────────────────────
  const [pendingPropCount, activePropCount, pendingReportCount, totalUserCount] =
    await Promise.all([
      payload.count({
        collection: 'properties',
        where: { status: { equals: 'pending' } },
        overrideAccess: true,
        context: skipScheduleCtx,  // ← bỏ qua refreshScheduledProperties hook
      }),
      payload.count({
        collection: 'properties',
        where: { status: { equals: 'active' } },
        overrideAccess: true,
        context: skipScheduleCtx,
      }),
      payload.count({
        collection: 'reports',
        where: { status: { equals: 'pending' } },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'users',
        overrideAccess: true,
      }),
    ])

  // ─── Đợt 2: User hôm nay + orders 30 ngày + danh sách mới nhất ───────────
  // Gộp 3 orders queries (today/7d/30d) → 1 query, tính trong JS
  const [newUserCount, ordersLast30, latestPending, latestReports] =
    await Promise.all([
      payload.count({
        collection: 'users',
        where: { createdAt: { greater_than_equal: today.toISOString() } },
        overrideAccess: true,
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
        overrideAccess: true,
      }),
      payload.find({
        collection: 'properties',
        where: { status: { equals: 'pending' } },
        sort: '-createdAt',
        limit: 5,
        depth: 1,
        overrideAccess: true,
        context: skipScheduleCtx,  // ← bỏ qua hook
      }),
      payload.find({
        collection: 'reports',
        where: { status: { equals: 'pending' } },
        sort: '-createdAt',
        limit: 5,
        depth: 1,
        overrideAccess: true,
      }),
    ])

  // ─── Tính revenue từ 1 orders query ──────────────────────────────────────
  const todayMs = today.getTime()
  const tomorrowMs = tomorrow.getTime()
  const last7Ms = last7.getTime()

  let revenueToday = 0
  let ordersToday = 0
  let revenueLast7 = 0
  let revenueLast30 = 0

  for (const order of ordersLast30.docs as any[]) {
    const paidAt = order.paidAt ? new Date(order.paidAt).getTime() : 0
    const amount = Number(order.totalAmount) || 0
    revenueLast30 += amount
    if (paidAt >= last7Ms) revenueLast7 += amount
    if (paidAt >= todayMs && paidAt < tomorrowMs) {
      revenueToday += amount
      ordersToday++
    }
  }

  return {
    counts: {
      pendingProperties: pendingPropCount.totalDocs,
      activeProperties: activePropCount.totalDocs,
      pendingReports: pendingReportCount.totalDocs,
      newUsersToday: newUserCount.totalDocs,
      totalUsers: totalUserCount.totalDocs,
      ordersToday,
    },
    revenue: {
      today: revenueToday,
      last7Days: revenueLast7,
      last30Days: revenueLast30,
    },
    latestPendingProperties: latestPending.docs,
    latestPendingReports: latestReports.docs,
  }
}
