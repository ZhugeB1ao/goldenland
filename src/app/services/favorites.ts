import type { AxiosRequestConfig } from 'axios'
import { deleteJSON, getJSON, postJSON } from '@/app/lib/http'

type FavoriteIdsResponse = {
  property_ids: number[]
}

const normalizePropertyIds = (rawIds: unknown[]): number[] => {
  const idSet = new Set<number>()

  for (const rawId of rawIds) {
    const parsed = Number(rawId)
    if (!Number.isInteger(parsed) || parsed <= 0) continue
    idSet.add(parsed)
  }

  return Array.from(idSet)
}

export async function fetchFavoritePropertyIds(config?: AxiosRequestConfig): Promise<number[]> {
  const response = await getJSON<FavoriteIdsResponse>('/api/me/favorites', config)

  return normalizePropertyIds(Array.isArray(response.property_ids) ? response.property_ids : [])
}

export async function addFavorite(propertyId: number, config?: AxiosRequestConfig): Promise<void> {
  await postJSON('/api/me/favorites', { property_id: propertyId }, config)
}

export async function removeFavorite(propertyId: number, config?: AxiosRequestConfig): Promise<void> {
  await deleteJSON(`/api/me/favorites/${propertyId}`, config)
}

export async function bulkMergeFavorites(
  propertyIds: number[],
  config?: AxiosRequestConfig,
): Promise<number[]> {
  const response = await postJSON<FavoriteIdsResponse, { property_ids: number[] }>(
    '/api/me/favorites/bulk',
    { property_ids: propertyIds },
    config,
  )

  return normalizePropertyIds(Array.isArray(response.property_ids) ? response.property_ids : [])
}
