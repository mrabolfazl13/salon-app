// frontend/src/services/favorites.ts
// قرارداد با backend/app/api/v1/favorites.py — POST idempotent است (مهاجرت لیست محلی).
import apiClient from './api'

export const favoriteService = {
  list: async (): Promise<number[]> => {
    const response = await apiClient.get('/favorites')
    const ids = response.data?.venue_ids
    return Array.isArray(ids) ? ids.map(Number) : []
  },

  add: async (venueId: number): Promise<{ venue_id: number; favorite: boolean }> => {
    const response = await apiClient.post(`/favorites/${venueId}`)
    return response.data
  },

  remove: async (venueId: number): Promise<{ venue_id: number; favorite: boolean; removed: boolean }> => {
    const response = await apiClient.delete(`/favorites/${venueId}`)
    return response.data
  },
}