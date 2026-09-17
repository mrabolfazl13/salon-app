// frontend/src/services/loyalty.ts
// قرارداد با backend/app/api/v1/loyalty.py — موجودی = SUM دفتر فقط-افزودنی.
import apiClient from './api'

export interface LoyaltyPoint {
  id: number
  points: number
  reason: string
  source_type: string | null
  source_id: number | null
  created_at: string
}

export interface LoyaltyHistory {
  user_id: number
  balance: number
  /** ریالِ ارزش هر امتیاز — از تنظیمات سرور (LOYALTY_RIALS_PER_POINT) */
  point_value_rial: number
  history: LoyaltyPoint[]
}

export const loyaltyService = {
  me: async (limit = 10): Promise<LoyaltyHistory> => {
    const response = await apiClient.get('/loyalty/me', { params: { limit } })
    return response.data
  },
}