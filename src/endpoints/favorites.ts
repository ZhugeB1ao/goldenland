import type { Endpoint } from 'payload'

type FavoriteIdsResponse = {
  property_ids: number[]
}

const toPropertyId = (value: unknown): number | null => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

const uniquePropertyIds = (rawIds: unknown[]): number[] => {
  const idSet = new Set<number>()

  for (const rawId of rawIds) {
    const propertyId = toPropertyId(rawId)
    if (!propertyId) continue
    idSet.add(propertyId)
  }

  return Array.from(idSet)
}

const fetchFavoritePropertyIds = async (req: any, userId: number | string): Promise<number[]> => {
  const result = await req.payload.find({
    collection: 'favorites',
    where: {
      user: {
        equals: userId,
      },
    },
    depth: 0,
    limit: 10000,
    pagination: false,
    sort: '-createdAt',
    overrideAccess: false,
    req,
  })

  return uniquePropertyIds(result.docs.map((doc: any) => doc.property))
}

const ensureAuthenticated = (req: any): Response | null => {
  if (req.user) {
    return null
  }

  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

export const getFavorites: Endpoint = {
  path: '/me/favorites',
  method: 'get',
  handler: async (req) => {
    const authError = ensureAuthenticated(req)
    if (authError) return authError

    const userId = req.user!.id

    try {
      const propertyIds = await fetchFavoritePropertyIds(req, userId)
      const response: FavoriteIdsResponse = {
        property_ids: propertyIds,
      }

      return Response.json(response)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch favorites'

      return Response.json({ error: message }, { status: 500 })
    }
  },
}

export const createFavorite: Endpoint = {
  path: '/me/favorites',
  method: 'post',
  handler: async (req) => {
    const authError = ensureAuthenticated(req)
    if (authError) return authError

    const userId = req.user!.id

    try {
      const body = await req.json?.()
      const propertyId = toPropertyId(body?.property_id)

      if (!propertyId) {
        return Response.json({ error: 'Invalid property_id' }, { status: 400 })
      }

      const existing = await req.payload.find({
        collection: 'favorites',
        where: {
          and: [{ user: { equals: userId } }, { property: { equals: propertyId } }],
        },
        depth: 0,
        limit: 1,
        overrideAccess: false,
        req,
      })

      const alreadyExists = existing.docs.length > 0

      if (!alreadyExists) {
        await req.payload.create({
          collection: 'favorites',
          data: {
            user: userId,
            property: propertyId,
          },
          overrideAccess: false,
          req,
        })
      }

      return Response.json({
        success: true,
        property_id: propertyId,
        added: !alreadyExists,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add favorite'

      return Response.json({ error: message }, { status: 500 })
    }
  },
}

export const deleteFavorite: Endpoint = {
  path: '/me/favorites/:property_id',
  method: 'delete',
  handler: async (req) => {
    const authError = ensureAuthenticated(req)
    if (authError) return authError

    const userId = req.user!.id

    try {
      const propertyId = toPropertyId(req.routeParams?.property_id)

      if (!propertyId) {
        return Response.json({ error: 'Invalid property_id' }, { status: 400 })
      }

      const existing = await req.payload.find({
        collection: 'favorites',
        where: {
          and: [{ user: { equals: userId } }, { property: { equals: propertyId } }],
        },
        depth: 0,
        limit: 1,
        overrideAccess: false,
        req,
      })

      const existingDoc = existing.docs[0]

      if (existingDoc) {
        await req.payload.delete({
          collection: 'favorites',
          id: existingDoc.id,
          overrideAccess: false,
          req,
        })
      }

      return Response.json({
        success: true,
        property_id: propertyId,
        removed: Boolean(existingDoc),
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove favorite'

      return Response.json({ error: message }, { status: 500 })
    }
  },
}

export const bulkCreateFavorites: Endpoint = {
  path: '/me/favorites/bulk',
  method: 'post',
  handler: async (req) => {
    const authError = ensureAuthenticated(req)
    if (authError) return authError

    const userId = req.user!.id

    try {
      const body = await req.json?.()
      const propertyIds = uniquePropertyIds(Array.isArray(body?.property_ids) ? body.property_ids : [])

      if (propertyIds.length > 0) {
        const existing = await req.payload.find({
          collection: 'favorites',
          where: {
            and: [
              { user: { equals: userId } },
              { property: { in: propertyIds } },
            ],
          },
          depth: 0,
          limit: 10000,
          pagination: false,
          overrideAccess: false,
          req,
        })

        const existingSet = new Set<number>(
          uniquePropertyIds(existing.docs.map((doc: any) => doc.property)),
        )

        for (const propertyId of propertyIds) {
          if (existingSet.has(propertyId)) {
            continue
          }

          try {
            await req.payload.create({
              collection: 'favorites',
              data: {
                user: userId,
                property: propertyId,
              },
              overrideAccess: false,
              req,
            })
          } catch (error: unknown) {
            // Ignore duplicate errors for idempotent bulk sync.
            const message = error instanceof Error ? error.message.toLowerCase() : ''
            if (
              message.includes('đã yêu thích tin này rồi')
              || message.includes('đã lưu tin này rồi')
              || message.includes('duplicate')
            ) {
              continue
            }

            throw error
          }
        }
      }

      const finalPropertyIds = await fetchFavoritePropertyIds(req, userId)

      return Response.json({
        success: true,
        property_ids: finalPropertyIds,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to bulk sync favorites'

      return Response.json({ error: message }, { status: 500 })
    }
  },
}
