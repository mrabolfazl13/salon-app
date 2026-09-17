// frontend/src/services/deals.ts
// قرارداد با backend/app/api/v1/deals.py — بازار سانس‌های لحظه آخری.
// discount_percentِ دیل عددِ ۱..۹۹ است (برخلاف کوپن/قوانین که درصد×۱۰۰ ذخیره می‌شود).
import apiClient from './api'

export type DealTimeOfDay = 'morning' | 'afternoon' | 'evening'
export type DealSort = 'price_asc' | 'price_desc' | 'distance' | 'time'

export interface DealAvailableItem {
  slot_id: number
  venue_id: number
  venue_name: string
  slot_date: string
  start_time: string
  duration: number
  original_price: number
  deal_price: number
  savings: number
  discount_percent: number
  deal_expires_at: string | null
  distance_km: number | null
}

export interface DealAvailableParams {
  near_lat?: number
  near_lng?: number
  radius_km?: number
  max_price?: number
  time_of_day?: DealTimeOfDay
  sort?: DealSort
  limit?: number
}

export interface DealPublishPayload {
  venue_id: number
  slot_ids?: number[]
  date_from?: string
  date_to?: string
  discount_percent?: number
  deal_price?: number
  expires_in_minutes?: number | null
}

export interface DealPublishResult {
  published: number
  skipped: number
  slot_ids: number[]
  deal_expires_at: string | null
}

export const dealService = {
  available: async (params: DealAvailableParams = {}): Promise<DealAvailableItem[]> => {
    const response = await apiClient.get('/deals/available', { params })
    return response.data
  },

  publish: async (data: DealPublishPayload): Promise<DealPublishResult> => {
    const response = await apiClient.post('/deals/publish', data)
    return response.data
  },

  unpublish: async (slotId: number) => {
    const response = await apiClient.delete(`/deals/${slotId}/unpublish`)
    return response.data
  },

  getSubscription: async (): Promise<{ notify_deals: boolean }> => {
    const response = await apiClient.get('/deals/subscription')
    return response.data
  },

  /** بک‌اند enabled را به‌صورت query parameter می‌گیرد، نه body */
  setSubscription: async (enabled: boolean): Promise<{ notify_deals: boolean }> => {
    const response = await apiClient.put('/deals/subscription', null, { params: { enabled } })
    return response.data
  },
}