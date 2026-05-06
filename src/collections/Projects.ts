import type { CollectionConfig } from 'payload'

import { adminOnly, statusOrAdmin } from '@/access'

export const Projects: CollectionConfig = {
    slug: 'projects',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'investor', 'status', 'createdAt'],
    },
    access: {
        create: adminOnly,
        read: statusOrAdmin('status', 'active'),
        update: adminOnly,
        delete: adminOnly,

    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                // ============================
                // TAB 1: Thông tin cơ bản
                // ============================
                {
                    label: 'Cơ bản',
                    fields: [
                        {
                            name: 'name',
                            type: 'text',
                            required: true,
                            maxLength: 255,
                        },
                        {
                            name: 'slug',
                            type: 'text',
                            unique: true,
                            maxLength: 300,
                        },
                        {
                            name: 'description',
                            type: 'richText',
                        },
                        {
                            name: 'investor',
                            type: 'relationship',
                            relationTo: 'investors',
                            admin: {
                                description: 'Chủ đầu tư',
                            },
                        },
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'totalArea',
                                    type: 'number',
                                    min: 0,
                                    admin: { description: 'Tổng diện tích (ha)' },
                                },
                                {
                                    name: 'totalUnits',
                                    type: 'number',
                                    min: 0,
                                    admin: { description: 'Tổng số căn/lô' },
                                },
                            ],
                        },
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'priceFrom',
                                    type: 'number',
                                    min: 0,
                                    admin: { description: 'Giá từ (triệu)' },
                                },
                                {
                                    name: 'priceTo',
                                    type: 'number',
                                    min: 0,
                                    admin: { description: 'Giá đến (triệu)' },
                                },
                            ],
                        },
                        {
                            name: 'propertyTypes',
                            type: 'select',
                            hasMany: true,
                            options: [
                                { label: 'Nhà riêng', value: 'house' },
                                { label: 'Chung cư', value: 'apartment' },
                                { label: 'Đất nền', value: 'land' },
                                { label: 'Biệt thự', value: 'villa' },
                                { label: 'Shophouse', value: 'shophouse' },
                                { label: 'Condotel', value: 'condotel' },
                            ],
                            admin: { description: 'Loại hình BĐS trong dự án' },
                        },
                        {
                            name: 'startDate',
                            type: 'date',
                            admin: { description: 'Ngày khởi công' },
                        },
                        {
                            name: 'completionDate',
                            type: 'date',
                            admin: { description: 'Ngày dự kiến bàn giao' },
                        },
                    ],
                },

                // ============================
                // TAB 2: Vị trí
                // ============================
                {
                    label: 'Vị trí',
                    fields: [
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'provinceCode',
                                    type: 'text',
                                },
                                {
                                    name: 'wardCode',
                                    type: 'text',
                                },
                            ],
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
                                    name: 'latitude',
                                    type: 'number',
                                    admin: { step: 0.0000001 },
                                },
                                {
                                    name: 'longitude',
                                    type: 'number',
                                    admin: { step: 0.0000001 },
                                },
                            ],
                        },
                    ],
                },

                // ============================
                // TAB 3: Phân khu
                // ============================
                {
                    label: 'Phân khu',
                    fields: [
                        {
                            name: 'zones',
                            type: 'array',
                            admin: {
                                description: 'Danh sách phân khu trong dự án',
                            },
                            fields: [
                                {
                                    name: 'name',
                                    type: 'text',
                                    required: true,
                                    admin: { description: 'Tên phân khu (VD: Zone A, Khu Hồng)' },
                                },
                                {
                                    name: 'description',
                                    type: 'textarea',
                                },
                                {
                                    name: 'totalUnits',
                                    type: 'number',
                                    min: 0,
                                },
                                {
                                    name: 'status',
                                    type: 'select',
                                    defaultValue: 'upcoming',
                                    options: [
                                        { label: 'Sắp mở bán', value: 'upcoming' },
                                        { label: 'Đang mở bán', value: 'selling' },
                                        { label: 'Đã bán hết', value: 'sold_out' },
                                    ],
                                },
                            ],
                        },
                    ],
                },

                // ============================
                // TAB 4: Media
                // ============================
                {
                    label: 'Media',
                    fields: [
                        {
                            name: 'thumbnail',
                            type: 'upload',
                            relationTo: 'media',
                            admin: { description: 'Ảnh đại diện dự án' },
                        },
                        {
                            name: 'images',
                            type: 'array',
                            maxRows: 30,
                            fields: [
                                {
                                    name: 'image',
                                    type: 'upload',
                                    relationTo: 'media',
                                    required: true,
                                },
                                {
                                    name: 'caption',
                                    type: 'text',
                                },
                            ],
                        },
                        {
                            name: 'masterPlan',
                            type: 'upload',
                            relationTo: 'media',
                            admin: { description: 'Ảnh mặt bằng tổng thể' },
                        },
                        {
                            name: 'videoUrl',
                            type: 'text',
                            admin: { description: 'Link YouTube' },
                        },
                    ],
                },

                // ============================
                // TAB 5: Quản lý
                // ============================
                {
                    label: 'Quản lý',
                    fields: [
                        {
                            name: 'status',
                            type: 'select',
                            defaultValue: 'draft',
                            required: true,
                            options: [
                                { label: 'Nháp', value: 'draft' },
                                { label: 'Đang hiển thị', value: 'active' },
                                { label: 'Tạm ẩn', value: 'hidden' },
                            ],
                        },
                        {
                            name: 'saleStatus',
                            type: 'select',
                            defaultValue: 'active',
                            options: [
                                { label: 'Đang mở bán', value: 'active' },
                                { label: 'Sắp mở bán', value: 'upcoming' },
                                { label: 'Đã bàn giao', value: 'completed' },
                            ],
                            admin: { description: 'Trạng thái mở bán (hiển thị cho khách)' },
                        },
                        {
                            name: 'isFeatured',
                            type: 'checkbox',
                            defaultValue: false,
                            admin: { description: 'Hiển thị ở trang chủ' },
                        },
                        {
                            name: 'views',
                            type: 'number',
                            defaultValue: 0,
                            admin: {
                                description: 'Lượt xem (tự động cập nhật)',
                                readOnly: true,
                            },
                        },
                    ],
                },

                // ============================
                // TAB 6: SEO
                // ============================
                {
                    label: 'SEO',
                    fields: [
                        {
                            name: 'seoTitle',
                            type: 'text',
                            maxLength: 70,
                        },
                        {
                            name: 'seoDescription',
                            type: 'textarea',
                            maxLength: 160,
                        },
                    ],
                },
            ],
        },
    ],

    // Tự sinh slug
    hooks: {
        beforeChange: [
            ({ data }) => {
                if (data?.name && !data?.slug) {
                    data.slug = data.name
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/đ/g, 'd')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '')
                }
                return data
            },
        ],
    },
}