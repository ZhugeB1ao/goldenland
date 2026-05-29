import type { AxiosRequestConfig } from 'axios'
import qs from 'qs'
import { deleteJSON, getJSON } from '@/app/lib/http'

export type ManagedProperty = {
  id: number
  title: string
  price: number
  priceUnit: string
  address?: string
  street?: string
  provinceCode?: string
  wardCode?: string
  status: string
  postType?: string
  propertyType: string
  area?: number
  createdAt: string
  images?: { image: string; sort: number }[]
}

export type ManagedPropertyStats = {
  active: number
  pending: number
  drafts: number
  expired: number
  sold: number
  total: number
}

type DashboardResponse = {
  balance?: number
  properties?: ManagedPropertyStats
}

type PropertiesResponse = {
  docs?: ManagedProperty[]
  totalPages?: number
}

const EMPTY_STATS: ManagedPropertyStats = {
  active: 0,
  pending: 0,
  drafts: 0,
  expired: 0,
  sold: 0,
  total: 0,
}

export async function fetchManagementDashboard(
  config?: AxiosRequestConfig,
): Promise<{ balance: number; stats: ManagedPropertyStats }> {
  const data = await getJSON<DashboardResponse>('/api/my/dashboard', config)

  return {
    balance: Number(data.balance || 0),
    stats: data.properties ? { ...EMPTY_STATS, ...data.properties } : EMPTY_STATS,
  }
}

export async function fetchManagementProperties(
  params: {
    userId: string | number
    status?: string
    page?: number
    limit?: number
  },
  config?: AxiosRequestConfig,
): Promise<{ properties: ManagedProperty[]; totalPages: number }> {
  const where: Record<string, unknown> = { user: { equals: params.userId } }

  if (params.status) {
    where.status = { equals: params.status }
  }

  const query = qs.stringify(
    {
      where,
      sort: '-createdAt',
      limit: params.limit ?? 10,
      page: params.page ?? 1,
      depth: 0,
    },
    { encodeValuesOnly: true },
  )

  const data = await getJSON<PropertiesResponse>(`/api/properties?${query}`, config)

  return {
    properties: Array.isArray(data.docs) ? data.docs : [],
    totalPages: Number(data.totalPages || 1),
  }
}

export async function deleteManagedProperty(
  propertyId: string | number,
  config?: AxiosRequestConfig,
): Promise<void> {
  await deleteJSON(`/api/properties/${propertyId}`, config)
}
