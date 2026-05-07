export const PROPERTY_TYPES = [
    { label: 'Tất cả loại', value: '' },
    { label: 'Chung cư', value: 'apartment' },
    { label: 'Nhà riêng', value: 'house' },
    { label: 'Biệt thự', value: 'villa' },
    { label: 'Đất nền', value: 'land' },
    { label: 'Shophouse', value: 'shophouse' },
    { label: 'Condotel', value: 'condotel' },
]

export const STATUS_OPTIONS = [
    { label: 'Tất cả', value: '' },
    { label: 'Đang mở bán', value: 'active' },
    { label: 'Sắp mở bán', value: 'upcoming' },
    { label: 'Đã bàn giao', value: 'completed' },
]

export const PROVINCES = [
    { label: 'Toàn quốc', value: '' },
    { label: 'Hà Nội', value: '01' },
    { label: 'TP. Hồ Chí Minh', value: '79' },
    { label: 'Đà Nẵng', value: '48' },
    { label: 'Hải Phòng', value: '31' },
    { label: 'Cần Thơ', value: '92' },
    { label: 'Bà Rịa - Vũng Tàu', value: '77' },
    { label: 'Bình Dương', value: '74' },
    { label: 'Đồng Nai', value: '75' },
    { label: 'Khánh Hòa', value: '56' },
    { label: 'Quảng Nam', value: '49' },
    { label: 'Lâm Đồng', value: '68' },
    { label: 'Thanh Hóa', value: '38' },
]

export const PRICE_RANGES = [
    { label: 'Tất cả', min: '', max: '' },
    { label: 'Dưới 2 tỷ', min: '', max: '2000' },
    { label: '2 - 5 tỷ', min: '2000', max: '5000' },
    { label: '5 - 10 tỷ', min: '5000', max: '10000' },
    { label: '10 - 20 tỷ', min: '10000', max: '20000' },
    { label: 'Trên 20 tỷ', min: '20000', max: '' },
]

export const SORT_OPTIONS = [
    { label: 'Mới nhất', value: '-createdAt' },
    { label: 'Nổi bật nhất', value: '-views' },
    { label: 'Giá tăng dần', value: 'priceFrom' },
    { label: 'Giá giảm dần', value: '-priceFrom' },
    { label: 'Quy mô lớn nhất', value: '-totalUnits' },
]

export function formatPrice(p?: number): string {
    if (!p) return ''
    if (p >= 1000) return `${(p / 1000).toFixed(1)} tỷ`
    return `${p} triệu`
}

export function formatDate(d?: string): string {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('vi-VN')
}

export function lexicalToHtml(content: any): string {
    if (!content?.root) return ''
    const processNode = (node: any): string => {
        if (node.type === 'text') {
            let t = node.text || ''
            if (node.format & 1) t = `<strong>${t}</strong>`
            if (node.format & 2) t = `<em>${t}</em>`
            if (node.format & 8) t = `<u>${t}</u>`
            return t
        }
        if (node.type === 'linebreak') return '<br>'
        const children = (node.children || []).map(processNode).join('')
        switch (node.type) {
            case 'paragraph': return `<p>${children || '<br>'}</p>`
            case 'heading': return `<h${node.tag}>${children}</h${node.tag}>`
            case 'list': return node.listType === 'bullet' ? `<ul>${children}</ul>` : `<ol>${children}</ol>`
            case 'listitem': return `<li>${children}</li>`
            case 'quote': return `<blockquote>${children}</blockquote>`
            case 'link': return `<a href="${node.url || '#'}">${children}</a>`
            default: return children
        }
    }
    return processNode(content.root)
}
