import apiClient from './api'

// شکل پاسخ رقابت از سمت بک‌اند (snake_case)
export interface Competition {
  id: number
  slot_id: number
  venue_id: number
  offered_price: number
  status: 'active' | 'won' | 'lost' | 'expired'
  expires_at: string
  created_at: string
}

// آیتم رقابت فعال برای بنر «رقابت‌های داغ» (از GET /competitions/active)
export interface ActiveCompetition {
  slot_id: number
  venue_id: number
  venue_name: string | null
  date: string
  start_time: string
  duration_minutes: number
  current_price: number
  best_price: number
  bid_count: number
  expires_at: string
}

export const competitionService = {
  // شروع رقابت قیمت برای یک سانس آزاد (فقط مدیر سالن مالک)
  start: async (data: { slotId: number; offeredPrice: number }): Promise<Competition> => {
    const response = await apiClient.post('/competitions/start', {
      slot_id: data.slotId,
      offered_price: data.offeredPrice,
    })
    return response.data
  },

  // ثبت پیشنهاد جدید (باید کمتر از بهترین پیشنهاد فعلی باشد)
  placeBid: async (slotId: number, offeredPrice: number): Promise<Competition> => {
    const response = await apiClient.post(`/competitions/${slotId}/bid`, {
      offered_price: offeredPrice,
    })
    return response.data
  },

  // بهترین (کمترین) پیشنهاد فعلی برای یک سانس
  getBestBid: async (slotId: number): Promise<{ best_price: number | null }> => {
    const response = await apiClient.get(`/competitions/slot/${slotId}/best`)
    return response.data
  },

  // رقابت‌های در جریان (عمومی) — برای بنر «رقابت‌های داغ» در خانه
  getActive: async (): Promise<{ items: ActiveCompetition[] }> => {
    const response = await apiClient.get('/competitions/active')
    return response.data
  },
}