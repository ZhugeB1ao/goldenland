// @ts-nocheck
import type { CollectionConfig } from 'payload'

import { ownerOrAdmin, adminOnly } from '@/access'

export const Favorites: CollectionConfig = {
    slug: 'favorites',
    admin: {
        defaultColumns: ['user', 'property', 'createdAt'],
    },
    indexes: [
        {
            fields: ['user', 'property'],
            unique: true,
        },
    ],
    access: {
        create: ownerOrAdmin('user'),
        read: ownerOrAdmin('user'),
        update: adminOnly,
        delete: ownerOrAdmin('user'),
    },
    fields: [
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            index: true,
        },
        {
            name: 'property',
            type: 'relationship',
            relationTo: 'properties',
            required: true,
        },
    ],
    hooks: {
        // Ngăn yêu thích trùng
        beforeChange: [
            async ({ data, operation, req }) => {
                if (operation === 'create' && data?.user && data?.property) {
                    const existing = await req.payload.find({
                        collection: 'favorites',
                        where: {
                            user: { equals: data.user },
                            property: { equals: data.property },
                        },
                        limit: 1,
                    })
                    if (existing.docs.length > 0) {
                        throw new Error('Đã yêu thích tin này rồi')
                    }
                }
                return data
            },
        ],
    },
}
