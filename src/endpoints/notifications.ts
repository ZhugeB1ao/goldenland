// @ts-nocheck
import type { Endpoint } from 'payload'

// Đánh dấu 1 thông báo đã đọc
export const markNotificationRead: Endpoint = {
    path: '/notifications/:id/read',
    method: 'post',
    handler: async (req) => {
        const { payload, user } = req
        const { id } = req.routeParams as { id: string }

        if (!user) {
            return Response.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        try {
            const result = await payload.find({
                collection: 'notifications',
                where: {
                    and: [{ id: { equals: id } }, { user: { equals: user.id } }],
                },
                limit: 1,
                overrideAccess: false,
                req,
            })

            const notification = result.docs[0]

            if (!notification) {
                return Response.json({ error: 'Không tìm thấy thông báo' }, { status: 404 })
            }

            await payload.update({
                collection: 'notifications',
                id: notification.id,
                data: { isRead: true },
                overrideAccess: false,
                req,
            })
            return Response.json({ success: true })
        } catch (error: any) {
            return Response.json({ error: error.message }, { status: 500 })
        }
    },
}

// Đánh dấu tất cả đã đọc
export const markAllNotificationsRead: Endpoint = {
    path: '/notifications/read-all',
    method: 'post',
    handler: async (req) => {
        const { payload, user } = req

        if (!user) {
            return Response.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        try {
            const unread = await payload.find({
                collection: 'notifications',
                where: {
                    and: [{ user: { equals: user.id } }, { isRead: { equals: false } }],
                },
                limit: 1000,
                overrideAccess: false,
                req,
            })

            for (const notif of unread.docs) {
                await payload.update({
                    collection: 'notifications',
                    id: notif.id,
                    data: { isRead: true },
                    overrideAccess: false,
                    req,
                })
            }

            return Response.json({ success: true, count: unread.docs.length })
        } catch (error: any) {
            return Response.json({ error: error.message }, { status: 500 })
        }
    },
}

// Đếm số thông báo chưa đọc
export const countUnreadNotifications: Endpoint = {
    path: '/notifications/unread-count',
    method: 'get',
    handler: async (req) => {
        const { payload, user } = req

        if (!user) {
            return Response.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        try {
            const result = await payload.find({
                collection: 'notifications',
                where: {
                    and: [{ user: { equals: user.id } }, { isRead: { equals: false } }],
                },
                limit: 0,
                overrideAccess: false,
                req,
            })

            return Response.json({ count: result.totalDocs })
        } catch (error: any) {
            return Response.json({ error: error.message }, { status: 500 })
        }
    },
}