import type { CollectionConfig } from 'payload'

import { authenticated, ownerOrAdmin, statusOrOwnerOrAdmin, adminOnlyField } from '@/access'

export const Properties: CollectionConfig = {
    slug: 'properties',
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'listingType', 'price', 'status', 'createdAt'],
    },
    access: {
        create: authenticated,
        read: statusOrOwnerOrAdmin('status', 'active', 'user'),
        update: ownerOrAdmin('user'),
        delete: ownerOrAdmin('user'),
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
                            name: 'title',
                            type: 'text',
                            required: true,
                            maxLength: 255,
                        },
                        {
                            name: 'slug',
                            type: 'text',
                            unique: true,
                            maxLength: 300,
                            admin: {
                                description: 'Tự sinh từ title nếu để trống',
                            },
                        },
                        {
                            name: 'description',
                            type: 'textarea',
                            required: true,
                        },
                        {
                            type: 'row', // 2 field trên 1 hàng
                            fields: [
                                {
                                    name: 'listingType',
                                    type: 'select',
                                    required: true,
                                    options: [
                                        { label: 'Bán', value: 'sale' },
                                        { label: 'Cho thuê', value: 'rent' },
                                    ],
                                },
                                {
                                    name: 'postType',
                                    type: 'select',
                                    defaultValue: 'normal',
                                    options: [
                                        { label: 'Thường', value: 'normal' },
                                        { label: 'VIP', value: 'vip' },
                                    ],
                                },
                            ],
                        },
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'price',
                                    type: 'number',
                                    required: true,
                                    min: 0,
                                },
                                {
                                    name: 'priceUnit',
                                    type: 'select',
                                    defaultValue: 'total',
                                    options: [
                                        { label: 'Tổng giá', value: 'total' },
                                        { label: 'Triệu/m²', value: 'per_m2' },
                                        { label: 'Triệu/tháng', value: 'per_month' },
                                        { label: 'Thoả thuận', value: 'negotiable' },
                                    ],
                                },
                            ],
                        },
                        {
                            name: 'propertyType',
                            type: 'select',
                            required: true,
                            options: [
                                { label: 'Nhà riêng', value: 'house' },
                                { label: 'Chung cư', value: 'apartment' },
                                { label: 'Đất nền', value: 'land' },
                                { label: 'Biệt thự', value: 'villa' },
                                { label: 'Nhà phố', value: 'townhouse' },
                                { label: 'Shophouse', value: 'shophouse' },
                                { label: 'Penthouse', value: 'penthouse' },
                                { label: 'Condotel', value: 'condotel' },
                                { label: 'Kho/Xưởng', value: 'warehouse' },
                                { label: 'Mặt bằng', value: 'commercial' },
                            ],
                        },
                    ],
                },

                // ============================
                // TAB 2: Chi tiết
                // ============================
                {
                    label: 'Chi tiết',
                    fields: [
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'area',
                                    type: 'number',
                                    min: 0,
                                    admin: { description: 'm²' },
                                },
                                {
                                    name: 'bedrooms',
                                    type: 'number',
                                    min: 0,
                                    max: 99,
                                },
                                {
                                    name: 'bathrooms',
                                    type: 'number',
                                    min: 0,
                                    max: 99,
                                },
                            ],
                        },
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'roadWidth',
                                    type: 'number',
                                    min: 0,
                                    admin: { description: 'Đường rộng (m)' },
                                },
                                {
                                    name: 'facadeWidth',
                                    type: 'number',
                                    min: 0,
                                    admin: { description: 'Mặt tiền (m)' },
                                },
                            ],
                        },
                        {
                            name: 'direction',
                            type: 'select',
                            options: [
                                { label: 'Đông', value: 'east' },
                                { label: 'Tây', value: 'west' },
                                { label: 'Nam', value: 'south' },
                                { label: 'Bắc', value: 'north' },
                                { label: 'Đông Bắc', value: 'northeast' },
                                { label: 'Đông Nam', value: 'southeast' },
                                { label: 'Tây Bắc', value: 'northwest' },
                                { label: 'Tây Nam', value: 'southwest' },
                            ],
                        },
                        {
                            name: 'legalStatus',
                            type: 'select',
                            options: [
                                { label: 'Sổ đỏ/Sổ hồng', value: 'red_book' },
                                { label: 'Hợp đồng mua bán', value: 'sale_contract' },
                                { label: 'Đang chờ sổ', value: 'pending' },
                                { label: 'Giấy tờ khác', value: 'other' },
                            ],
                        },
                        {
                            name: 'furnitureStatus',
                            type: 'select',
                            options: [
                                { label: 'Nội thất cao cấp', value: 'luxury' },
                                { label: 'Nội thất đầy đủ', value: 'full' },
                                { label: 'Nội thất cơ bản', value: 'basic' },
                                { label: 'Không nội thất', value: 'none' },
                            ],
                        },
                    ],
                },

                // ============================
                // TAB 3: Vị trí
                // ============================
                {
                    label: 'Vị trí',
                    fields: [
                        // Custom address picker UI
                        {
                            name: 'addressPicker',
                            type: 'ui',
                            admin: {
                                components: {
                                    Field: {
                                        path: '@/fields/AddressPicker',
                                        clientProps: {
                                            provinceField: 'provinceCode',
                                            wardField: 'wardCode',
                                        },
                                    },
                                },
                            },
                        },
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'provinceCode',
                                    type: 'text',
                                    admin: { hidden: true },
                                },
                                {
                                    name: 'wardCode',
                                    type: 'text',
                                    admin: { hidden: true },
                                },
                            ],
                        },
                        {
                            name: 'street',
                            type: 'text',
                            maxLength: 255,
                        },
                        {
                            name: 'address',
                            type: 'text',
                            maxLength: 500,
                            admin: { description: 'Địa chỉ đầy đủ hiển thị' },
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
                // TAB 4: Media
                // ============================
                {
                    label: 'Media',
                    fields: [
                        {
                            name: 'images',
                            type: 'array',
                            maxRows: 20,
                            admin: {
                                description: 'Tối đa 20 ảnh',
                            },
                            fields: [
                                {
                                    name: 'image',
                                    type: 'text',
                                    required: true,
                                    admin: { description: 'Link ảnh từ storage/v1/object/public/Properties/{properties_id}' }
                                },
                                {
                                    name: 'sort',
                                    type: 'number',
                                    defaultValue: 0,
                                },
                            ],
                        },
                        {
                            name: 'videoUrl',
                            type: 'text',
                            admin: { description: 'Link YouTube hoặc video' },
                        },
                    ],
                },

                // ============================
                // TAB 5: Trạng thái & Quản lý
                // ============================
                {
                    label: 'Quản lý',
                    fields: [
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'status',
                                    type: 'select',
                                    defaultValue: 'draft',
                                    required: true,
                                    options: [
                                        { label: 'Nháp', value: 'draft' },
                                        { label: 'Chờ duyệt', value: 'pending' },
                                        { label: 'Đang hiển thị', value: 'active' },
                                        { label: 'Hết hạn', value: 'expired' },
                                        { label: 'Đã bán', value: 'sold' },
                                        { label: 'Bị từ chối', value: 'rejected' },
                                    ],
                                },
                                {
                                    name: 'label',
                                    type: 'select',
                                    defaultValue: 'normal',
                                    options: [
                                        { label: 'Thường', value: 'normal' },
                                        { label: 'VIP', value: 'vip' },
                                        { label: 'Hot', value: 'hot' },
                                        { label: 'Premium', value: 'premium' },
                                    ],
                                },
                            ],
                        },
                        {
                            name: 'isVerified',
                            type: 'checkbox',
                            defaultValue: false,
                            admin: { description: 'Tin đã xác thực' },
                        },
                        {
                            name: 'verifiedBy',
                            type: 'relationship',
                            relationTo: 'users',
                            admin: {
                                description: 'Người duyệt tin',
                                condition: (data) => data?.isVerified,
                            },
                        },
                        {
                            name: 'verifiedAt',
                            type: 'date',
                            admin: {
                                condition: (data) => data?.isVerified,
                            },
                        },
                        {
                            name: 'rejectionReason',
                            type: 'textarea',
                            admin: {
                                condition: (data) => data?.status === 'rejected',
                                description: 'Lý do từ chối',
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
                        {
                            name: 'seoKeywords',
                            type: 'text',
                        },
                    ],
                },
            ],
        },

        // ============================
        // Relationships (nằm ngoài tabs)
        // ============================
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            access: {
                update: adminOnlyField,
            },
            admin: {
                position: 'sidebar',
                description: 'Người đăng tin',
            },
        },
        {
            name: 'project',
            type: 'relationship',
            relationTo: 'projects',
            admin: {
                position: 'sidebar',
                description: 'Thuộc dự án (nếu có)',
            },
        },
    ],

    // ============================
    // Hooks
    // ============================
    hooks: {
        beforeChange: [
            ({ data }) => {
                // Tự sinh slug từ title
                if (data?.title && !data?.slug) {
                    data.slug = data.title
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
