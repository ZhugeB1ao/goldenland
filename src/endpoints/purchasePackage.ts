// @ts-nocheck
import type { Endpoint } from 'payload'

import { calculatePromotion } from '@/app/lib/calculatePromotion'

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
            const { packageId, selectedMonths, voucherCode, promotionId: selectedPromotionId, promotionCode } = body || {}

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

            let originalAmount = pkg.price as number
            let durationDays = pkg.durationDays as number

            if (pkg.durationOptions && pkg.durationOptions.length > 0) {
                if (!selectedMonths) {
                    return Response.json({ error: 'Gói này yêu cầu chọn thời hạn (selectedMonths)' }, { status: 400 })
                }
                const option = pkg.durationOptions.find((opt: any) => opt.months === selectedMonths)
                if (!option) {
                    return Response.json({ error: `Tùy chọn ${selectedMonths} tháng không hợp lệ` }, { status: 400 })
                }
                originalAmount = option.price
                durationDays = option.months * 30
            }

            const promotionResult =
            await calculatePromotion({
                payload,
                packageId,
                originalAmount,
                promotionId: selectedPromotionId,
                promotionCode,
                req,
            })

            if ((selectedPromotionId || promotionCode) && !promotionResult.promotion) {
                return Response.json({ error: 'Khuyen mai khong hop le hoac khong ap dung cho goi nay' }, { status: 400 })
            }

            const promotionDiscount =
            promotionResult.discountAmount || 0

            const appliedPromotionId =
            promotionResult.promotion?.id || null

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
                        discountAmount = (originalAmount * (voucher.discountValue || 0)) / 100
                        if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
                            discountAmount = voucher.maxDiscount
                        }
                    } else if (voucher.discountType === 'free_post') {
                        discountAmount = originalAmount
                    }
                }
            }

            if (voucherId && appliedPromotionId && promotionResult.promotion?.allowVoucherStacking === false) {
                return Response.json({ error: 'Ma khuyen mai nay khong the dung chung voi voucher' }, { status: 400 })
            }

            const totalAmount = Math.max(
                0,
                originalAmount -
                    discountAmount -
                    promotionDiscount,
                )

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
                    durationMonths: selectedMonths || null,
                    originalAmount: originalAmount,
                    discountAmount,
                    promotionDiscount,
                    totalAmount,
                    voucher: voucherId,
                    promotion: appliedPromotionId,
                    paymentMethod: 'balance',
                    status: 'paid',
                    paidAt: new Date().toISOString(),
                },
                overrideAccess: false,
                req,
            })

            // 5. Trừ số dư và cập nhật quyền lợi Membership
            const newExpiresAt = new Date()
            newExpiresAt.setDate(newExpiresAt.getDate() + (durationDays as number))

            // Tính toán vouchers mới để cộng dồn
            let currentVouchers = Array.isArray(user.availableVouchers) ? [...user.availableVouchers] : []

            if (pkg.bonusVouchers && pkg.bonusVouchers.length > 0) {
                for (const bonus of pkg.bonusVouchers) {
                    const existingIndex = currentVouchers.findIndex(
                        (v: any) => v.discountValue === bonus.discountValue && v.appliedFor === bonus.appliedFor
                    )

                    if (existingIndex > -1) {
                        currentVouchers[existingIndex].quantity += (bonus.quantity || 1)
                    } else {
                        currentVouchers.push({
                            quantity: bonus.quantity || 1,
                            discountValue: bonus.discountValue || 0,
                            appliedFor: bonus.appliedFor,
                        })
                    }
                }
            }

            await payload.update({
                collection: 'users',
                id: user.id,
                data: {
                    balance: currentBalance - totalAmount,
                    activePackage: packageId,
                    packageExpiresAt: newExpiresAt.toISOString(),
                    availableVouchers: currentVouchers,
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

            // 7. Voucher đã được cập nhật trực tiếp vào user.availableVouchers

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
