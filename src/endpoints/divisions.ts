import type { Endpoint } from 'payload'
import divisions from '../app/data/vietnam-divisions.json'

// Cấu trúc: [{ Code, FullName, Wards: [{ Code, FullName, ProvinceCode }] }]
// Nguồn: github.com/thanglequoc/vietnamese-provinces-database (v3.x, 34 tỉnh 2025)

// Lấy danh sách 34 tỉnh/thành phố
const getProvinces: Endpoint = {
    path: '/divisions/provinces',
    method: 'get',
    handler: () => {
        return Response.json(
            divisions.map((p) => ({
                code: p.Code,
                name: p.FullName,
            }))
        )
    },
}

// Lấy phường/xã theo tỉnh
const getWards: Endpoint = {
    path: '/divisions/wards/:provinceCode',
    method: 'get',
    handler: (req) => {
        const { provinceCode } = req.routeParams as { provinceCode: string }
        const province = divisions.find((p) => p.Code === provinceCode)

        if (!province) return Response.json([])

        return Response.json(
            province.Wards.map((w) => ({
                code: w.Code,
                name: w.FullName,
            }))
        )
    },
}

export const divisionEndpoints = [getProvinces, getWards]
