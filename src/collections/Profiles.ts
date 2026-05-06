import type { CollectionConfig } from 'payload'

import { adminOnly, ownerOrAdmin } from '@/access'

export const Profiles: CollectionConfig = {
    slug: 'profiles',
    admin: {
        useAsTitle: 'displayName',
        defaultColumns: ['displayName', 'user', 'updatedAt'],
    },
    access: {
        read: ownerOrAdmin('user'),
        create: adminOnly,
        update: ownerOrAdmin('user'),
        delete: adminOnly,
    },
    fields: [
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            unique: true,
            index: true,
            admin: {
                position: 'sidebar',
                readOnly: true,
                description: 'One-to-one owner of this profile',
            },
        },
        {
            name: 'displayName',
            type: 'text',
            maxLength: 150,
        },
        {
            name: 'dateOfBirth',
            type: 'date',
        },
        {
            name: 'gender',
            type: 'select',
            options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' },
            ],
        },
        {
            name: 'bio',
            type: 'textarea',
            maxLength: 1000,
        },
        {
            name: 'address',
            type: 'text',
            maxLength: 500,
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'provinceCode',
                    type: 'text',
                    maxLength: 20,
                },
                {
                    name: 'wardCode',
                    type: 'text',
                    maxLength: 20,
                },
            ],
        },
    ],
}
