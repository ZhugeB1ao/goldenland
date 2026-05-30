import { createClient } from '@supabase/supabase-js'
import type { CollectionConfig } from 'payload'

import { authenticated, ownerOrAdmin, statusOrOwnerOrAdmin, adminOnlyField } from '@/access'
import {
    refreshScheduledProperties,
    SCHEDULE_CONTEXT_KEY,
} from '@/hooks/refreshScheduledProperties'

const PROPERTIES_BUCKET = 'Properties'

const normalizeProjectID = (project: unknown): string | null => {
    if (typeof project === 'string' || typeof project === 'number') return String(project)
    if (project && typeof project === 'object' && 'id' in project) {
        const id = (project as { id?: unknown }).id
        if (typeof id === 'string' || typeof id === 'number') return String(id)
    }
    return null
}

const extractStreetFromAddress = (address: string | null | undefined): string | null => {
    const firstSegment = address
        ?.split(',')
        .map((segment) => segment.trim())
        .find(Boolean)

    if (!firstSegment) return null

    const normalized = firstSegment
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')

    if (
        normalized.startsWith('phuong ') ||
        normalized.startsWith('xa ') ||
        normalized.startsWith('thi tran ') ||
        normalized.startsWith('thi xa ') ||
        normalized.startsWith('dac khu ') ||
        normalized.startsWith('quan ') ||
        normalized.startsWith('huyen ') ||
        normalized.startsWith('thanh pho ') ||
        normalized.startsWith('tp ') ||
        normalized.startsWith('tinh ')
    ) {
        return null
    }

    return firstSegment
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
    house: 'nhà riêng',
    apartment: 'căn hộ',
    land: 'đất nền',
    villa: 'biệt thự',
    townhouse: 'nhà phố',
    shophouse: 'shophouse',
    penthouse: 'penthouse',
    condotel: 'condotel',
    warehouse: 'kho xưởng',
    commercial: 'mặt bằng',
}

const truncateText = (value: string, maxLength: number): string => {
    if (value.length <= maxLength) return value
    return value.slice(0, maxLength).replace(/\s+\S*$/, '').trim()
}

const cleanText = (value: unknown): string | null => {
    if (typeof value !== 'string') return null
    const trimmed = value.trim().replace(/\s+/g, ' ')
    return trimmed || null
}

const buildPropertySEO = (data: Record<string, unknown>, projectName?: string | null) => {
    const title = cleanText(data.title)
    const description = cleanText(data.description)
    const address = cleanText(data.address)
    const street = cleanText(data.street)
    const propertyType =
        typeof data.propertyType === 'string'
            ? PROPERTY_TYPE_LABELS[data.propertyType] || data.propertyType
            : 'bất động sản'
    const location = address || street
    const projectText = projectName ? ` tại ${projectName}` : ''
    const locationText = location ? `, ${location}` : ''

    const seoTitle = truncateText(title || `Bán ${propertyType}${projectText}${locationText}`, 70)
    const seoDescription = truncateText(
        description ||
        `Thông tin ${propertyType}${projectText}${location ? ` ở ${location}` : ''}. Xem chi tiết giá, diện tích, vị trí và liên hệ tư vấn.`,
        160,
    )
    const seoKeywords = truncateText(
        [
            title,
            propertyType,
            projectName,
            address,
            street,
            'bất động sản',
            'nhà đất',
        ]
            .filter(Boolean)
            .join(', '),
        255,
    )

    return {
        seoTitle,
        seoDescription,
        seoKeywords,
    }
}

const extractPropertyImagePath = (imageUrl: unknown): string | null => {
    if (typeof imageUrl !== 'string' || !imageUrl.trim()) return null

    try {
        const { pathname } = new URL(imageUrl)
        const marker = `/storage/v1/object/public/${PROPERTIES_BUCKET}/`
        const markerIndex = pathname.indexOf(marker)

        if (markerIndex === -1) return null

        return decodeURIComponent(pathname.slice(markerIndex + marker.length))
    } catch {
        return null
    }
}

const deletePropertyImagesFromBucket = async (imageUrls: unknown[]) => {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) return

    const paths = Array.from(
        new Set(imageUrls.map(extractPropertyImagePath).filter((path): path is string => Boolean(path))),
    )

    if (paths.length === 0) return

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { error } = await supabase.storage.from(PROPERTIES_BUCKET).remove(paths)

    if (error) {
        throw new Error(`Không thể xóa ảnh tin đăng khỏi bucket: ${error.message}`)
    }
}

export const Properties: CollectionConfig = {
    slug: 'properties',
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'price', 'status', 'createdAt'],
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
                            name: 'postType',
                            type: 'select',
                            defaultValue: 'normal',
                            options: [
                                { label: 'Thường', value: 'normal' },
                                { label: 'VIP Bạc', value: 'silver' },
                                { label: 'VIP Vàng', value: 'gold' },
                                { label: 'VIP Kim Cương', value: 'diamond' },
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
                                    name: 'durationDays',
                                    type: 'number',
                                    defaultValue: 15,
                                    min: 1,
                                    admin: { description: 'Số ngày hiển thị của tin đăng' },
                                },
                            ],
                        },
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'scheduledPublishAt',
                                    type: 'date',
                                    admin: {
                                        date: {
                                            pickerAppearance: 'dayAndTime',
                                        },
                                        description: 'Tin pending sẽ tự chuyển active khi tới thời điểm này',
                                    },
                                },
                                {
                                    name: 'expiresAt',
                                    type: 'date',
                                    admin: {
                                        date: {
                                            pickerAppearance: 'dayAndTime',
                                        },
                                        description: 'Tin active sẽ tự chuyển expired khi quá thời điểm này',
                                    },
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
                            },
                        },
                        {
                            name: 'label',
                            type: 'select',
                            defaultValue: 'normal',
                            admin: {
                                hidden: true,
                                description: 'Deprecated: giữ cột cũ để tránh xoá dữ liệu, dùng postType thay thế.',
                            },
                            options: [
                                { label: 'Thường', value: 'normal' },
                                { label: 'VIP', value: 'vip' },
                                { label: 'Hot', value: 'hot' },
                                { label: 'Premium', value: 'premium' },
                            ],
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
                            maxLength: 255,
                        },
                        {
                            name: 'seoDescription',
                            type: 'textarea',
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
        beforeOperation: [
            async ({ operation, req, context }) => {
                if (context?.[SCHEDULE_CONTEXT_KEY]) return

                // Chỉ trigger trên find/findByID — không trigger trên count
                // vì count chỉ đếm số lượng, không cần data mới nhất về lịch đăng
                if (operation === 'find' || operation === 'findByID') {
                    await refreshScheduledProperties(req)
                }
            },
        ],
        beforeChange: [
            async ({ data, operation, originalDoc, req }) => {
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

                const projectId = normalizeProjectID(data?.project ?? originalDoc?.project)
                let projectName: string | null = null

                if (projectId) {
                    const project = await req.payload.findByID({
                        collection: 'projects',
                        id: projectId,
                        depth: 0,
                        overrideAccess: false,
                        req,
                        select: {
                            name: true,
                            provinceCode: true,
                            wardCode: true,
                            address: true,
                            latitude: true,
                            longitude: true,
                        },
                    })

                    projectName = cleanText(project.name)
                    data.provinceCode = project.provinceCode || null
                    data.wardCode = project.wardCode || null
                    data.street = extractStreetFromAddress(project.address) || null
                    data.address = project.address || null

                    if (typeof project.latitude === 'number') {
                        data.latitude = project.latitude
                    }
                    if (typeof project.longitude === 'number') {
                        data.longitude = project.longitude
                    }
                }

                if (operation === 'create') {
                    const generatedSEO = buildPropertySEO(data, projectName)
                    data.seoTitle = cleanText(data.seoTitle) || generatedSEO.seoTitle
                    data.seoDescription = cleanText(data.seoDescription) || generatedSEO.seoDescription
                    data.seoKeywords = cleanText(data.seoKeywords) || generatedSEO.seoKeywords
                }

                return data
            },
        ],
        beforeDelete: [
            async ({ id, req }) => {
                const property = await req.payload.findByID({
                    collection: 'properties',
                    id,
                    depth: 0,
                    overrideAccess: true,
                    req,
                    select: {
                        images: true,
                    },
                })

                const imageUrls = Array.isArray(property.images)
                    ? property.images.map((item) => item?.image)
                    : []

                await deletePropertyImagesFromBucket(imageUrls)
            },
        ],
    },
}
