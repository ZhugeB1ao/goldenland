import type { Endpoint } from 'payload'

import {
  calculatePromotion,
  getPromotionDateBounds,
  promotionAppliesToPackage,
} from '@/app/lib/calculatePromotion'

const formatPromotionOption = (promotion: any, originalAmount: number) => {
  let discountAmount = 0

  if (promotion.discountType === 'fixed') {
    discountAmount = Number(promotion.discountValue || 0)
  }

  if (promotion.discountType === 'percent') {
    discountAmount = (originalAmount * Number(promotion.discountValue || 0)) / 100

    if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
      discountAmount = promotion.maxDiscount
    }
  }

  discountAmount = Math.min(discountAmount, originalAmount)

  return {
    id: promotion.id,
    name: promotion.name,
    code: promotion.code,
    description: promotion.description,
    discountType: promotion.discountType,
    discountValue: promotion.discountValue,
    discountAmount,
  }
}

export const calculatePackagePrice: Endpoint = {
  path: '/calculate-package-price',
  method: 'post',
  handler: async (req) => {
    const { payload } = req

    try {
      const body = await req.json?.()
      const { packageId, selectedMonths, promotionId, promotionCode } = body || {}

      if (!packageId) {
        return Response.json({ error: 'Thieu packageId' }, { status: 400 })
      }

      const pkg = await payload.findByID({
        collection: 'packages',
        id: packageId,
        overrideAccess: false,
        req,
      })

      if (!pkg || !pkg.isActive) {
        return Response.json({ error: 'Goi khong ton tai hoac da ngung' }, { status: 404 })
      }

      let originalAmount = Number(pkg.price || 0)
      let durationDays = Number(pkg.durationDays || 0)

      if (pkg.durationOptions && pkg.durationOptions.length > 0) {
        if (!selectedMonths) {
          return Response.json({ error: 'Goi nay yeu cau chon thoi han' }, { status: 400 })
        }

        const option = pkg.durationOptions.find((opt: any) => Number(opt.months) === Number(selectedMonths))

        if (!option) {
          return Response.json({ error: `Tuy chon ${selectedMonths} thang khong hop le` }, { status: 400 })
        }

        originalAmount = Number(option.price || 0)
        durationDays = Number(option.months || 0) * 30
      }

      const { todayStart, todayEnd } = getPromotionDateBounds()
      const availablePromotionsResult = await payload.find({
        collection: 'promotions',
        where: {
          and: [
            { isActive: { equals: true } },
            { startDate: { less_than_equal: todayEnd } },
            { endDate: { greater_than_equal: todayStart } },
          ],
        },
        sort: '-priority',
        limit: 50,
        overrideAccess: false,
        req,
      })

      const promotionResult = await calculatePromotion({
        payload,
        packageId,
        originalAmount,
        promotionId,
        promotionCode,
        req,
      })

      if ((promotionId || promotionCode) && !promotionResult.promotion) {
        return Response.json(
          { error: 'Khuyen mai khong hop le hoac khong ap dung cho goi nay' },
          { status: 400 },
        )
      }

      const promotionDiscount = Number(promotionResult.discountAmount || 0)

      return Response.json({
        originalAmount,
        durationDays,
        availablePromotions: availablePromotionsResult.docs
          .filter((promotion: any) => promotionAppliesToPackage(promotion, packageId))
          .map((promotion: any) => formatPromotionOption(promotion, originalAmount)),
        promotionDiscount,
        totalAmount: Math.max(0, originalAmount - promotionDiscount),
        appliedPromotion: promotionResult.promotion
          ? {
              id: promotionResult.promotion.id,
              name: promotionResult.promotion.name,
              code: promotionResult.promotion.code,
              discountType: promotionResult.promotion.discountType,
              discountValue: promotionResult.promotion.discountValue,
            }
          : null,
      })
    } catch (error: any) {
      return Response.json({ error: error.message || 'Khong tinh duoc gia goi' }, { status: 500 })
    }
  },
}
