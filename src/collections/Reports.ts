import type { CollectionConfig } from 'payload'

import { authenticated, ownerOrAdmin, adminOnly } from '@/access'

export const Reports: CollectionConfig = {
    slug: 'reports',
    admin: {
        useAsTitle: 'reason',
        defaultColumns: ['reason', 'property', 'reporter', 'status', 'createdAt'],
    },
    access: {
        create: authenticated,
        read: ownerOrAdmin('reporter'),
        update: adminOnly,
        delete: adminOnly,
    },
    fields: [
        {
            name: 'property',
            type: 'relationship',
            relationTo: 'properties',
            required: true,
            admin: { description: 'Tin bị báo cáo' },
        },
        {
            name: 'reporter',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            admin: { description: 'Người báo cáo' },
        },
        {
            name: 'reason',
            type: 'select',
            required: true,
            options: [
                { label: 'Tin giả / Lừa đảo', value: 'scam' },
                { label: 'Sai thông tin', value: 'wrong_info' },
                { label: 'Trùng lặp', value: 'duplicate' },
                { label: 'Ảnh không đúng', value: 'wrong_image' },
                { label: 'Đã bán nhưng chưa gỡ', value: 'sold_not_removed' },
                { label: 'Khác', value: 'other' },
            ],
        },
        {
            name: 'detail',
            type: 'textarea',
            admin: {
                description: 'Chi tiết bổ sung',
                condition: (data) => data?.reason === 'other',
            },
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'pending',
            options: [
                { label: 'Chờ xử lý', value: 'pending' },
                { label: 'Đang xem xét', value: 'reviewing' },
                { label: 'Đã xử lý', value: 'resolved' },
                { label: 'Bỏ qua', value: 'dismissed' },
            ],
        },
        {
            name: 'adminNote',
            type: 'textarea',
            admin: { description: 'Ghi chú xử lý' },
        },
        {
            name: 'resolvedBy',
            type: 'relationship',
            relationTo: 'users',
            admin: {
                description: 'Người xử lý',
                condition: (data) => data?.status === 'resolved' || data?.status === 'dismissed',
            },
        },
    ],
}