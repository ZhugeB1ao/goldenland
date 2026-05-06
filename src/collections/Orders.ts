import type { CollectionConfig } from 'payload'

import { authenticated, ownerOrAdmin, adminOnly } from '@/access'

export const Orders: CollectionConfig = {
    slug: 'orders',
    admin: {
        useAsTitle: 'orderCode',
        defaultColumns: ['orderCode', 'user', 'orderType', 'totalAmount', 'status', 'createdAt'],
    },
    access: {
        create: authenticated,
        read: ownerOrAdmin('user'),
        update: adminOnly,
        delete: adminOnly,
    },
    fields: [
        {
            name: 'orderCode',
            type: 'text',
            required: true,
            unique: true,
            admin: { readOnly: true, description: 'Tự sinh khi tạo order' },
        },
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
        },
        {
            name: 'orderType',
            type: 'select',
            required: true,
            options: [
                { label: 'Mua gói đăng tin', value: 'package' },
                { label: 'Đăng tin lẻ', value: 'single_post' },
                { label: 'Nạp tiền', value: 'top_up' },
            ],
        },

        // Liên kết tới gói hoặc bảng giá
        {
            name: 'package',
            type: 'relationship',
            relationTo: 'packages',
            admin: {
                condition: (data) => data?.orderType === 'package',
            },
        },
        {
            name: 'postingPrice',
            type: 'relationship',
            relationTo: 'posting-prices',
            admin: {
                condition: (data) => data?.orderType === 'single_post',
            },
        },
        {
            name: 'property',
            type: 'relationship',
            relationTo: 'properties',
            admin: {
                description: 'Tin đăng liên quan (nếu đăng tin lẻ)',
                condition: (data) => data?.orderType === 'single_post',
            },
        },

        // Voucher áp dụng
        {
            name: 'voucher',
            type: 'relationship',
            relationTo: 'vouchers',
            admin: { description: 'Voucher đã áp dụng (nếu có)' },
        },

        // Tài chính
        {
            type: 'row',
            fields: [
                {
                    name: 'originalAmount',
                    type: 'number',
                    required: true,
                    min: 0,
                    admin: { description: 'Giá gốc (VNĐ)' },
                },
                {
                    name: 'discountAmount',
                    type: 'number',
                    defaultValue: 0,
                    min: 0,
                    admin: { description: 'Giảm giá (VNĐ)' },
                },
                {
                    name: 'totalAmount',
                    type: 'number',
                    required: true,
                    min: 0,
                    admin: { description: 'Thành tiền (VNĐ)' },
                },
            ],
        },

        // Thanh toán
        {
            name: 'paymentMethod',
            type: 'select',
            options: [
                { label: 'Số dư tài khoản', value: 'balance' },
                { label: 'Chuyển khoản', value: 'bank_transfer' },
                { label: 'MoMo', value: 'momo' },
                { label: 'VNPay', value: 'vnpay' },
                { label: 'ZaloPay', value: 'zalopay' },
            ],
        },
        {
            name: 'paymentRef',
            type: 'text',
            admin: { description: 'Mã giao dịch từ cổng thanh toán' },
        },

        // Trạng thái
        {
            name: 'status',
            type: 'select',
            defaultValue: 'pending',
            required: true,
            options: [
                { label: 'Chờ thanh toán', value: 'pending' },
                { label: 'Đã thanh toán', value: 'paid' },
                { label: 'Đã huỷ', value: 'cancelled' },
                { label: 'Hoàn tiền', value: 'refunded' },
            ],
        },
        {
            name: 'paidAt',
            type: 'date',
            admin: {
                readOnly: true,
                condition: (data) => data?.status === 'paid',
            },
        },
        {
            name: 'adminNote',
            type: 'textarea',
            admin: { description: 'Ghi chú nội bộ' },
        },
    ],

    hooks: {
        beforeChange: [
            ({ data, operation }) => {
                // Tự sinh mã đơn hàng
                if (operation === 'create' && !data?.orderCode) {
                    const timestamp = Date.now().toString(36).toUpperCase()
                    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
                    data.orderCode = `ORD-${timestamp}-${random}`
                }
                // Tính thành tiền
                if (data?.originalAmount !== undefined) {
                    data.totalAmount = (data.originalAmount || 0) - (data.discountAmount || 0)
                    if (data.totalAmount < 0) data.totalAmount = 0
                }
                return data
            },
        ],
    },
}