import type { Endpoint } from 'payload'

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
