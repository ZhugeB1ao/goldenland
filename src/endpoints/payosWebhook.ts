import type { Endpoint } from 'payload'

import { getPayOSClient } from '@/lib/payos'

export const payosWebhook: Endpoint = {
  path: '/payos-webhook',
  method: 'post',
  handler: async (req) => {
    try {
      const body = await req.json?.()
      const payOS = getPayOSClient()
      const webhookData = await payOS.webhooks.verify(body)

      if (webhookData.code !== '00') {
        return Response.json({ success: true, message: 'Ignored non-success payment' })
      }

      const orders = await req.payload.find({
        collection: 'orders',
        where: {
          providerOrderCode: {
            equals: webhookData.orderCode,
          },
        },
        limit: 1,
        req,
      })

      const order = orders.docs[0]

      if (!order) {
        return Response.json({ success: true, message: 'Order not found, ignored' })
      }

      if (order.status === 'paid') {
        return Response.json({ success: true, message: 'Order already paid' })
      }

      if (order.orderType !== 'top_up') {
        return Response.json({ error: 'Invalid order type' }, { status: 400 })
      }

      if (order.totalAmount !== webhookData.amount) {
        return Response.json({ error: 'Invalid payment amount' }, { status: 400 })
      }

      await req.payload.update({
        collection: 'orders',
        id: order.id,
        data: {
          status: 'paid',
          paidAt: new Date().toISOString(),
          paymentRef: webhookData.reference || webhookData.paymentLinkId,
        },
        req,
      })

      return Response.json({ success: true })
    } catch (error: any) {
      return Response.json({ error: error.message || 'Invalid payOS webhook' }, { status: 400 })
    }
  },
}
