import type { CollectionConfig } from 'payload'

import { activeOrAdmin, adminOnly } from '@/access'

export const PostingPrices: CollectionConfig = {
    slug: 'posting-prices',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'postType', 'displayMultiplier', 'dailyPrice', 'recommendedDurationDays', 'isActive'],
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
            admin: { description: 'VD: Tin thường, VIP bạc, VIP vàng, VIP kim cương' },
        },
        {
            name: 'description',
            type: 'textarea',
            admin: { description: 'Mô tả ngắn quyền lợi/độ ưu tiên của loại tin' },
        },
        {
            name: 'postType',
            type: 'select',
            required: true,
            index: true,
            options: [
                { label: 'Tin thường', value: 'normal' },
                { label: 'VIP bạc', value: 'silver' },
                { label: 'VIP vàng', value: 'gold' },
                { label: 'VIP kim cương', value: 'diamond' },
            ],
        },
        {
            name: 'displayMultiplier',
            type: 'number',
            required: true,
            min: 1,
            defaultValue: 1,
            admin: { description: 'Số lần hiển thị/ưu tiên nhiều hơn so với tin thường. VD: 8, 15, 30' },
        },
        {
            name: 'dailyPrice',
            type: 'number',
            required: true,
            min: 0,
            admin: { description: 'Giá 1 ngày (VNĐ)' },
        },
        {
            name: 'recommendedDurationDays',
            type: 'number',
            required: true,
            min: 1,
            defaultValue: 15,
            admin: { description: 'Số ngày đề xuất khi user chọn loại tin này' },
        },
        {
            name: 'durationOptions',
            type: 'array',
            required: true,
            minRows: 1,
            admin: { description: 'Các mốc ngày được phép chọn. Ngày càng nhiều có thể đặt % ưu đãi càng cao.' },
            fields: [
                {
                    name: 'durationDays',
                    type: 'number',
                    required: true,
                    min: 1,
                    admin: { description: 'Số ngày hiển thị' },
                },
                {
                    name: 'discountPercent',
                    type: 'number',
                    min: 0,
                    max: 100,
                    defaultValue: 0,
                    admin: { description: 'Giảm trên giá/ngày, VD: 5 nghĩa là giảm 5%' },
                },
                {
                    name: 'label',
                    type: 'text',
                    admin: { description: 'Nhãn hiển thị tùy chọn, VD: Đề xuất, Tiết kiệm 5%' },
                },
            ],
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
