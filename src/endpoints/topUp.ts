import type { Endpoint } from 'payload'

export const topUp: Endpoint = {
    path: '/top-up',
    method: 'post',
    handler: async (req) => {
        const { payload, user } = req

        if (!user) {
            return Response.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        try {
            const body = await req.json?.()
            const { amount } = body || {}

            if (!amount || typeof amount !== 'number' || amount <= 0) {
                return Response.json({ error: 'Số tiền nạp không hợp lệ' }, { status: 400 })
            }

            // Tạo order nạp tiền (pending)
            const order = await payload.create({
                collection: 'orders',
                data: {
                    user: user.id,
                    orderType: 'top_up',
                    originalAmount: amount,
                    totalAmount: amount,
                    paymentMethod: 'bank_transfer',
                    status: 'pending',
                } as any,
                overrideAccess: false,
                req,
            })

            return Response.json({
                success: true,
                order: order.id,
                orderCode: order.orderCode,
                message: 'Đã tạo yêu cầu nạp tiền. Vui lòng chuyển khoản theo hướng dẫn.',
            })
        } catch (error: any) {
            return Response.json({ error: error.message }, { status: 500 })
        }
    },
}
