import type { CollectionConfig } from 'payload'

import { activeOrAdmin, adminOnly } from '@/access'

export const Packages: CollectionConfig = {
    slug: 'packages',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'price', 'totalListings', 'bonusVouchers', 'isActive'],
    },
    access: {
        create: adminOnly,
        read: activeOrAdmin('isActive'),
        update: adminOnly,
        delete: adminOnly,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            maxLength: 255,
            admin: { description: 'VD: Gói Cơ bản, Gói VIP, Gói Premium' },
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'subtitle',
            type: 'text',
        },
        {
            name: 'isBestSeller',
            type: 'checkbox',
            defaultValue: false,
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'price',
                    type: 'number',
                    required: true,
                    min: 0,
                    admin: { description: 'Giá gói (VNĐ)' },
                },
                {
                    name: 'originalPrice',
                    type: 'number',
                    min: 0,
                    admin: { description: 'Giá gốc (hiển thị gạch ngang)' },
                },
            ],
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'totalProperties',
                    type: 'number',
                    required: true,
                    min: 1,
                    admin: { description: 'Số lượt đăng tin' },
                },
                {
                    name: 'durationDays',
                    type: 'number',
                    required: true,
                    min: 1,
                    admin: { description: 'Thời hạn gói (ngày)' },
                },
            ],
        },
        {
            name: 'propertyDurationDays',
            type: 'number',
            required: true,
            min: 1,
            defaultValue: 30,
            admin: { description: 'Mỗi tin đăng hiển thị bao nhiêu ngày' },
        },
        {
            name: 'bonusVouchers',
            type: 'array',
            admin: { description: 'Danh sách voucher tặng kèm khi mua gói' },
            fields: [
                {
                    name: 'quantity',
                    type: 'number',
                    min: 1,
                    defaultValue: 1,
                    admin: { description: 'Số lượng' },
                },
                {
                    name: 'discountValue',
                    type: 'number',
                    min: 0,
                    defaultValue: 0,
                    admin: { description: 'Giá trị giảm giá (VNĐ)' },
                },
                {
                    name: 'appliedFor',
                    type: 'select',
                    options: [
                        { label: 'Tin thường', value: 'normal' },
                        { label: 'Tin VIP', value: 'vip' },
                        { label: 'Tin đặc biệt', value: 'special' },
                    ],
                    admin: { description: 'Loại tin được áp dụng voucher' },
                },
            ],
        },
        {
            name: 'features',
            type: 'array',
            admin: { description: 'Danh sách tính năng gói' },
            fields: [
                {
                    name: 'feature',
                    type: 'text',
                    required: true,
                },
                // {
                //     name: 'isAvailable',
                //     type: 'checkbox',
                //     defaultValue: true,
                //     admin: { description: 'Tính năng này có khả dụng không?' },
                // },
            ],
        },
        {
            name: 'postType',
            type: 'select',
            defaultValue: 'normal',
            options: [
                { label: 'Tin thường', value: 'normal' },
                { label: 'Tin VIP', value: 'vip' },
            ],
            admin: { description: 'Loại tin được đăng từ gói này' },
        },
        {
            name: 'sort',
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