import type { CollectionConfig } from 'payload'

import { adminOnly, adminOnlyField, checkAdmin, selfOrAdminByID, anyone } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'fullName',
  },
  auth: true,
  access: {
    admin: ({ req: { user } }) => user?.role === 'admin',
    create: () => true,
    read: anyone,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true

      return {
        id: {
          equals: user.id,
        },
      }
    },
    delete: adminOnly,
  },
  fields: [
    // --- Thông tin cơ bản ---
    {
      name: 'fullName',
      type: 'text',
      required: true,
      maxLength: 150,
    },
    {
      name: 'phone',
      type: 'text',
      unique: true,
      maxLength: 20,
    },
    {
      name: 'avatar_id',
      type: 'text',
      admin: {
        description: 'URL ảnh đại diện từ bucket/Avatar',
      },
    },

    // --- Role (hardcode, không tạo collection riêng) ---
    {
      name: 'role',
      type: 'select',
      defaultValue: 'user',
      required: true,
      saveToJWT: true,
      access: {
        update: adminOnlyField,
      },
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
    },

    // --- Tài chính ---
    {
      name: 'balance',
      type: 'number',
      defaultValue: 0,
      min: 0,
      access: {
        read: selfOrAdminByID,
        update: adminOnlyField,
      },
      admin: {
        description: 'Số dư tài khoản (VNĐ)',
      },
    },

    // --- Quyền lợi gói Membership ---
    {
      name: 'activePackage',
      type: 'relationship',
      relationTo: 'packages',
      admin: {
        description: 'Gói Membership đang sử dụng',
      },
    },
    {
      name: 'packageExpiresAt',
      type: 'date',
      admin: {
        description: 'Ngày hết hạn gói Membership',
      },
    },

    {
      name: 'availableVouchers',
      type: 'array',
      admin: {
        description: 'Các voucher user đang có (được tặng từ gói)',
      },
      fields: [
        {
          name: 'quantity',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: { description: 'Số lượng voucher còn lại' },
        },
        {
          name: 'discountValue',
          type: 'number',
          min: 0,
          admin: { description: 'Giá trị giảm giá (VNĐ)' },
        },
        {
          name: 'appliedFor',
          type: 'select',
          options: [
            { label: 'Tin thường', value: 'normal' },
            { label: 'VIP bạc', value: 'silver' },
            { label: 'VIP vàng', value: 'gold' },
            { label: 'VIP kim cương', value: 'diamond' },
          ],
          admin: { description: 'Loại tin được áp dụng' },
        },
      ],
    },

    // --- Trạng thái ---
    {
      name: 'isVerified',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },

    // --- Token (ẩn khỏi admin panel) ---
    {
      name: 'verificationToken',
      type: 'text',
      access: {
        read: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        hidden: true,
      },
    },
    {
      name: 'resetToken',
      type: 'text',
      access: {
        read: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        hidden: true,
      },
    },
    {
      name: 'resetTokenExp',
      type: 'date',
      access: {
        read: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        hidden: true,
      },
    },

    // --- Theo dõi ---
    {
      name: 'lastLoginAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Lần đăng nhập cuối',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc

        const existing = await req.payload.find({
          collection: 'profiles',
          where: {
            user: {
              equals: doc.id,
            },
          },
          limit: 1,
          req,
        })

        if (existing.docs.length === 0) {
          await req.payload.create({
            collection: 'profiles',
            data: {
              user: doc.id,
              displayName: doc.fullName,
            },
            req,
          })
        }

        return doc
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        if (!id) return

        const userProfiles = await req.payload.find({
          collection: 'profiles',
          where: {
            user: {
              equals: id,
            },
          },
          limit: 50,
          req,
        })

        for (const profile of userProfiles.docs) {
          await req.payload.delete({
            collection: 'profiles',
            id: profile.id,
            req,
          })
        }
      },
    ],
  },
}
