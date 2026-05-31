export const promotionAppliesToPackage = (promotion: any, packageId: number | string) => {
  const packageIds = Array.isArray(promotion?.appliesToPackages)
    ? promotion.appliesToPackages.map((pkg: any) => String(typeof pkg === 'object' ? pkg.id : pkg))
    : []

  return packageIds.includes(String(packageId))
}

export const getPromotionDateBounds = () => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  return {
    todayStart: todayStart.toISOString(),
    todayEnd: todayEnd.toISOString(),
  }
}

export async function calculatePromotion({
  payload,
  packageId,
  originalAmount,
  promotionId,
  promotionCode,
  req,
}: any) {
  const { todayStart, todayEnd } = getPromotionDateBounds()
  const selectedPromotionId =
    promotionId !== undefined && promotionId !== null && String(promotionId).trim()
      ? promotionId
      : null
  const normalizedCode =
    typeof promotionCode === 'string' && promotionCode.trim()
      ? promotionCode.trim().toUpperCase()
      : null

  if (!selectedPromotionId && !normalizedCode) {
    return {
      promotion: null,
      discountAmount: 0,
    }
  }

  const promotions = await payload.find({
    collection: 'promotions',

    where: {
      and: [
        {
          isActive: {
            equals: true,
          },
        },

        {
          startDate: {
            less_than_equal: todayEnd,
          },
        },

        {
          endDate: {
            greater_than_equal: todayStart,
          },
        },

        ...(selectedPromotionId
          ? [
              {
                id: {
                  equals: selectedPromotionId,
                },
              },
            ]
          : []),
        ...(normalizedCode
          ? [
              {
                code: {
                  equals: normalizedCode,
                },
              },
            ]
          : []),
      ],
    },

    sort: '-priority',

    limit: 1,

    overrideAccess: false,

    req,
  })

  if (promotions.docs.length === 0) {
    return {
      promotion: null,
      discountAmount: 0,
    }
  }

  const promotion = promotions.docs.find((doc: any) => promotionAppliesToPackage(doc, packageId))

  if (!promotion) {
    return {
      promotion: null,
      discountAmount: 0,
    }
  }

  let discountAmount = 0

  // Giảm tiền cố định
  if (promotion.discountType === 'fixed') {
    discountAmount = promotion.discountValue
  }

  // Giảm %
  if (promotion.discountType === 'percent') {
    discountAmount =
      (originalAmount * promotion.discountValue) / 100

    // max discount
    if (
      promotion.maxDiscount &&
      discountAmount > promotion.maxDiscount
    ) {
      discountAmount = promotion.maxDiscount
    }
  }

  discountAmount = Math.min(discountAmount, originalAmount)

  return {
    promotion,
    discountAmount,
  }
}
