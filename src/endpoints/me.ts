import type { Endpoint } from 'payload'

export const meProfile: Endpoint = {
  path: '/me/profile',
  method: 'get',
  handler: async (req) => {
    const { payload, user } = req

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const result = await payload.find({
        collection: 'profiles',
        where: { user: { equals: user.id } },
        limit: 1,
        overrideAccess: false,
        req, // Enforce access control
      })

      const profile = result.docs[0] || null
      return Response.json({ profile })
    } catch (error: any) {
      return Response.json({ error: error.message }, { status: 500 })
    }
  },
}
