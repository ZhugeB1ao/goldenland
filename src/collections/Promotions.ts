import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access'

export const Promotions: CollectionConfig = {
  slug: 'promotions',

  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'name',
      'code',
      'discountType',
      'discountValue',
      'isActive',
      'startDate',
      'endDate',
    ],
  },

  access: {
    create: adminOnly,
    read: () => true,
    update: adminOnly,
    delete: adminOnly,
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },

    {
      name: 'description',
      type: 'textarea',
    },

    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Ma khuyen mai nguoi dung nhap khi mua goi',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value),
        ],
      },
    },

    {
      name: 'discountType',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Giảm %',
          value: 'percent',
        },
        {
          label: 'Giảm số tiền',
          value: 'fixed',
        },
      ],
    },

    {
      name: 'discountValue',
      type: 'number',
      required: true,
      min: 0,
    },

    {
      name: 'maxDiscount',
      type: 'number',
      min: 0,
    },

    {
      name: 'appliesToPackages',
      type: 'relationship',
      relationTo: 'packages',
      hasMany: true,
      required: true,
    },

    {
      name: 'startDate',
      type: 'date',
      required: true,
    },

    {
      name: 'endDate',
      type: 'date',
      required: true,
    },

    {
      name: 'allowVoucherStacking',
      type: 'checkbox',
      defaultValue: true,
    },

    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
    },

    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
