// @ts-nocheck
import type { Endpoint } from 'payload'

export const trackView: Endpoint = {
    path: '/properties/:id/view',
    method: 'post',
    handler: async (req) => {
        const { payload, user } = req
        const { id } = req.routeParams as { id: string }

        try {
            // Lưu vào view history nếu có user
            if (user) {
                // Kiểm tra đã xem trong 1 giờ qua chưa (tránh spam)
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
                const recent = await payload.find({
                    collection: 'view-history',
                    where: {
                        and: [
                            { user: { equals: user.id } },
                            { property: { equals: id } },
                            { createdAt: { greater_than: oneHourAgo } },
                        ],
                    },
                    limit: 1,
                    overrideAccess: false,
                    req,
                })

                if (recent.docs.length === 0) {
                    await payload.create({
                        collection: 'view-history',
                        data: {
                            user: user.id,
                            property: id,
                        },
                        overrideAccess: false,
                        req,
                    })
                }
            }

            return Response.json({ success: true })
        } catch (error: any) {
            return Response.json({ error: error.message }, { status: 500 })
        }
    },
}