import type { Endpoint } from 'payload'

import { getPayOSClient } from '@/lib/payos'

export const topUpStatus: Endpoint = {
  path: '/top-up-status/:id',
  method: 'get',
  handler: async (req) => {
    const { user } = req
    const id = req.routeParams?.id

    if (!user) {
      return Response.json({ error: 'Chua dang nhap' }, { status: 401 })
    }

    if (!id || typeof id !== 'string') {
      return Response.json({ error: 'Thieu ma don nap tien' }, { status: 400 })
    }

    try {
      const order = await req.payload.findByID({
        collection: 'orders',
        id,
        depth: 0,
        overrideAccess: false,
        req,
      })

      if (order.orderType !== 'top_up') {
        return Response.json({ error: 'Don hang khong hop le' }, { status: 400 })
      }

      // Nếu đơn hàng đang pending, thử gọi API PayOS để kiểm tra trạng thái
      // Điều này rất quan trọng khi chạy localhost vì webhook của PayOS không gọi về localhost được
      if (order.status === 'pending' && order.providerOrderCode) {
        try {
          const payOS = getPayOSClient()
          const paymentLinkInfo = await payOS.paymentRequests.get(Number(order.providerOrderCode))
          
          if (paymentLinkInfo.status === 'PAID') {
            const updatedOrder = await req.payload.update({
              collection: 'orders',
              id: order.id,
              data: {
                status: 'paid',
                paidAt: new Date().toISOString(),
              },
              req,
            })
            
            return Response.json({
              success: true,
              order: updatedOrder.id,
              status: updatedOrder.status,
              amount: updatedOrder.totalAmount,
              paidAt: updatedOrder.paidAt,
            })
          }
        } catch (payosError) {
          // Bỏ qua lỗi PayOS nếu có (ví dụ timeout) và trả về trạng thái hiện tại trong DB
          console.error('Lỗi khi kiểm tra trạng thái PayOS:', payosError)
        }
      }

      return Response.json({
        success: true,
        order: order.id,
        status: order.status,
        amount: order.totalAmount,
        paidAt: order.paidAt,
      })
    } catch (error: any) {
      return Response.json({ error: error.message || 'Khong lay duoc trang thai nap tien' }, { status: 500 })
    }
  },
}
