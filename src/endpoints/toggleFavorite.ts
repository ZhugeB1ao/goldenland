// @ts-nocheck
import type { Endpoint } from 'payload'

export const toggleFavorite: Endpoint = {
    path: '/favorites/toggle',
    method: 'post',
    handler: async (req) => {
        const { payload, user } = req

        if (!user) {
            return Response.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        try {
            const body = await req.json?.()
            const { propertyId } = body || {}

            if (!propertyId) {
                return Response.json({ error: 'Thiếu propertyId' }, { status: 400 })
            }

            // Kiểm tra đã yêu thích chưa
            const existing = await payload.find({
                collection: 'favorites',
                where: {
                    and: [{ user: { equals: user.id } }, { property: { equals: propertyId } }],
                },
                limit: 1,
                overrideAccess: false,
                req,
            })

            if (existing.docs.length > 0) {
                // Đã yêu thích -> bỏ yêu thích
                await payload.delete({
                    collection: 'favorites',
                    id: existing.docs[0].id,
                    overrideAccess: false,
                    req,
                })
                return Response.json({ success: true, favorited: false, message: 'Đã bỏ yêu thích' })
            } else {
                // Chưa yêu thích -> thêm yêu thích
                await payload.create({
                    collection: 'favorites',
                    data: {
                        user: user.id,
                        property: propertyId,
                    },
                    overrideAccess: false,
                    req,
                })
                return Response.json({ success: true, favorited: true, message: 'Đã thêm vào yêu thích' })
            }
        } catch (error: any) {
            return Response.json({ error: error.message }, { status: 500 })
        }
    },
}
