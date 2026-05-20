import type { Endpoint } from 'payload'

import { getPayOSCancelUrl, getPayOSClient, getPayOSReturnUrl } from '@/lib/payos'

const MIN_TOP_UP_AMOUNT = 10000

const createProviderOrderCode = () => Date.now() * 1000 + Math.floor(Math.random() * 1000)

export const topUp: Endpoint = {
  path: '/top-up',
  method: 'post',
  handler: async (req) => {
    const { payload, user } = req

    if (!user) {
      return Response.json({ error: 'Chua dang nhap' }, { status: 401 })
    }

    try {
      const body = await req.json?.()
      const amount = Number(body?.amount)
      const paymentMethod = body?.paymentMethod || 'bank_transfer'

      if (!Number.isFinite(amount) || amount < MIN_TOP_UP_AMOUNT) {
        return Response.json(
          { error: `So tien nap toi thieu la ${MIN_TOP_UP_AMOUNT.toLocaleString('vi-VN')} VND` },
          { status: 400 },
        )
      }

      if (paymentMethod !== 'bank_transfer') {
        return Response.json({ error: 'Phuong thuc thanh toan chua duoc ho tro' }, { status: 400 })
      }

      const providerOrderCode = createProviderOrderCode()
      const payOS = getPayOSClient()
      const paymentLink = await payOS.paymentRequests.create({
        orderCode: providerOrderCode,
        amount,
        description: `NAP${providerOrderCode}`,
        returnUrl: getPayOSReturnUrl(),
        cancelUrl: getPayOSCancelUrl(),
        items: [
          {
            name: 'Nap tien Golden Land',
            quantity: 1,
            price: amount,
          },
        ],
      })

      const order = await payload.create({
        collection: 'orders',
        data: {
          user: user.id,
          orderType: 'top_up',
          providerOrderCode,
          originalAmount: amount,
          totalAmount: amount,
          paymentMethod: 'bank_transfer',
          status: 'pending',
          paymentRef: paymentLink.paymentLinkId,
        } as any,
        overrideAccess: false,
        req,
      })

      return Response.json({
        success: true,
        provider: 'payos',
        order: order.id,
        orderCode: order.orderCode,
        providerOrderCode,
        amount,
        paymentLinkId: paymentLink.paymentLinkId,
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode,
        message: 'Da tao link thanh toan payOS',
      })
    } catch (error: any) {
      return Response.json({ error: error.message || 'Khong tao duoc yeu cau nap tien' }, { status: 500 })
    }
  },
}
