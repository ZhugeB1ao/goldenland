// @ts-nocheck
import type { Endpoint } from 'payload'

export const myDashboard: Endpoint = {
    path: '/my/dashboard',
    method: 'get',
    handler: async (req) => {
        const { payload, user } = req

        if (!user) {
            return Response.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        try {
            // Đếm tin đăng của tôi theo status
            const [active, pending, expired, sold, drafts] = await Promise.all([
                payload.find({
                    collection: 'properties',
                    where: {
                        and: [{ user: { equals: user.id } }, { status: { equals: 'active' } }],
                    },
                    limit: 0,
                    overrideAccess: false,
                    req,
                }),
                payload.find({
                    collection: 'properties',
                    where: {
                        and: [{ user: { equals: user.id } }, { status: { equals: 'pending' } }],
                    },
                    limit: 0,
                    overrideAccess: false,
                    req,
                }),
                payload.find({
                    collection: 'properties',
                    where: {
                        and: [{ user: { equals: user.id } }, { status: { equals: 'expired' } }],
                    },
                    limit: 0,
                    overrideAccess: false,
                    req,
                }),
                payload.find({
                    collection: 'properties',
                    where: {
                        and: [{ user: { equals: user.id } }, { status: { equals: 'sold' } }],
                    },
                    limit: 0,
                    overrideAccess: false,
                    req,
                }),
                payload.find({
                    collection: 'properties',
                    where: {
                        and: [{ user: { equals: user.id } }, { status: { equals: 'draft' } }],
                    },
                    limit: 0,
                    overrideAccess: false,
                    req,
                }),
            ])

            // Đếm voucher còn hiệu lực
            const vouchers = await payload.find({
                collection: 'vouchers',
                where: {
                    and: [{ user: { equals: user.id } }, { status: { equals: 'active' } }],
                },
                limit: 0,
                overrideAccess: false,
                req,
            })

            // Đếm tin yêu thích
            const favorites = await payload.find({
                collection: 'favorites',
                where: { user: { equals: user.id } },
                limit: 0,
                overrideAccess: false,
                req,
            })

            // Đếm thông báo chưa đọc
            const unreadNotifs = await payload.find({
                collection: 'notifications',
                where: {
                    and: [{ user: { equals: user.id } }, { isRead: { equals: false } }],
                },
                limit: 0,
                overrideAccess: false,
                req,
            })

            // 5 order gần nhất
            const recentOrders = await payload.find({
                collection: 'orders',
                where: { user: { equals: user.id } },
                sort: '-createdAt',
                limit: 5,
                overrideAccess: false,
                req,
            })

            return Response.json({
                balance: user.balance || 0,
                properties: {
                    active: active.totalDocs,
                    pending: pending.totalDocs,
                    expired: expired.totalDocs,
                    sold: sold.totalDocs,
                    drafts: drafts.totalDocs,
                    total: active.totalDocs + pending.totalDocs + expired.totalDocs + sold.totalDocs + drafts.totalDocs,
                },
                vouchersActive: vouchers.totalDocs,
                favoriteProperties: favorites.totalDocs,
                unreadNotifications: unreadNotifs.totalDocs,
                recentOrders: recentOrders.docs,
            })
        } catch (error: any) {
            return Response.json({ error: error.message }, { status: 500 })
        }
    },
}