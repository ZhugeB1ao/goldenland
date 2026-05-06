// @ts-nocheck
import type { Endpoint } from 'payload'

export const purchasePackage: Endpoint = {
    path: '/purchase-package',
    method: 'post',
    handler: async (req) => {
        const { payload, user } = req

        if (!user) {
            return Response.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        try {
            const body = await req.json?.()
            const { packageId, voucherCode } = body || {}

            if (!packageId) {
                return Response.json({ error: 'Thiếu packageId' }, { status: 400 })
            }

            // 1. Lấy thông tin gói
            const pkg = await payload.findByID({
                collection: 'packages',
                id: packageId,
                overrideAccess: false,
                req,
            })

            if (!pkg || !pkg.isActive) {
                return Response.json({ error: 'Gói không tồn tại hoặc đã ngưng' }, { status: 404 })
            }

            let discountAmount = 0
            let voucherId = null

            // 2. Kiểm tra voucher (nếu có)
            if (voucherCode) {
                const vouchers = await payload.find({
                    collection: 'vouchers',
                    where: {
                        code: { equals: voucherCode },
                        user: { equals: user.id },
                        status: { equals: 'active' },
                    },
                    overrideAccess: false,
                    req,
                })

                if (vouchers.docs.length > 0) {
                    const voucher = vouchers.docs[0]
                    voucherId = voucher.id

                    if (voucher.discountType === 'fixed') {
                        discountAmount = voucher.discountValue || 0
                    } else if (voucher.discountType === 'percent') {
                        discountAmount = ((pkg.price as number) * (voucher.discountValue || 0)) / 100
                        if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
                            discountAmount = voucher.maxDiscount
                        }
                    } else if (voucher.discountType === 'free_post') {
                        discountAmount = pkg.price as number
                    }
                }
            }

            const totalAmount = Math.max(0, (pkg.price as number) - discountAmount)

            // 3. Kiểm tra số dư
            const currentBalance = (user.balance as number) || 0
            if (currentBalance < totalAmount) {
                return Response.json(
                    { error: 'Số dư không đủ', required: totalAmount, balance: currentBalance },
                    { status: 400 },
                )
            }

            // 4. Tạo order
            const order = await payload.create({
                collection: 'orders',
                data: {
                    user: user.id,
                    orderType: 'package',
                    package: packageId,
                    originalAmount: pkg.price as number,
                    discountAmount,
                    totalAmount,
                    voucher: voucherId,
                    paymentMethod: 'balance',
                    status: 'paid',
                    paidAt: new Date().toISOString(),
                },
                overrideAccess: false,
                req,
            })

            // 5. Trừ số dư
            await payload.update({
                collection: 'users',
                id: user.id,
                data: {
                    balance: currentBalance - totalAmount,
                },
                overrideAccess: false,
                req,
            })

            // 6. Đánh dấu voucher đã dùng
            if (voucherId) {
                await payload.update({
                    collection: 'vouchers',
                    id: voucherId,
                    data: {
                        status: 'used',
                        usedAt: new Date().toISOString(),
                    },
                    overrideAccess: false,
                    req,
                })
            }

            // 7. Tạo voucher tặng kèm (nếu gói có)
            if (pkg.bonusVouchers && (pkg.bonusVouchers as number) > 0) {
                for (let i = 0; i < (pkg.bonusVouchers as number); i++) {
                    const code = `BONUS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
                    const expiresAt = new Date()
                    expiresAt.setDate(expiresAt.getDate() + (pkg.durationDays as number))

                    await payload.create({
                        collection: 'vouchers',
                        data: {
                            code,
                            user: user.id,
                            discountType: 'free_post',
                            status: 'active',
                            expiresAt: expiresAt.toISOString(),
                            source: 'package',
                        },
                        overrideAccess: false,
                        req,
                    })
                }
            }

            return Response.json({
                success: true,
                order: order.id,
                orderCode: order.orderCode,
                message: `Mua gói "${pkg.name}" thành công`,
            })
        } catch (error: any) {
            return Response.json({ error: error.message }, { status: 500 })
        }
    },
}