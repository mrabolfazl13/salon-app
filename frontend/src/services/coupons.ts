// frontend/src/services/coupons.ts
// قرارداد با backend/app/api/v1/coupons.py — اعمال کوپن فقط سمت سرور.
// percent = درصد×۱۰۰؛ venue_id=null یعنی سراسری (ساختش فقط سرپرست سیستم).
import apiClient from './api'

export type CouponType = 'percent' | 'fixed'

export interface Coupon {
  id: number
  code: string
  venue_id: number | null
  discount_type: CouponType
  value: number
  max_uses: number | null
  uses_count: number
  per_user_limit: number | null
  min_booking_amount: number | null
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  created_by: number | null
}

export interface CouponCreatePayload {
  code: string
  venue_id: number | null
  discount_type: CouponType
  value: number
  max_uses?: number | null
  per_user_limit?: number | null
  min_booking_amount?: number | null
  valid_from?: string | null
  valid_until?: string | null
}

export interface CouponUpdatePayload {
  discount_type?: CouponType
  value?: number
  max_uses?: number | null
  per_user_limit?: number | null
  min_booking_amount?: number | null
  valid_from?: string | null
  valid_until?: string | null
  is_active?: boolean
}

export const couponService = {
  list: async (venueId?: number | null): Promise<Coupon[]> => {
    const response = await apiClient.get('/coupons/', {
      params: venueId != null ? { venue_id: venueId } : {},
    })
    return response.data
  },

  create: async (data: CouponCreatePayload): Promise<Coupon> => {
    const response = await apiClient.post('/coupons/', data)
    return response.data
  },

  update: async (couponId: number, data: CouponUpdatePayload): Promise<Coupon> => {
    const response = await apiClient.put(`/coupons/${couponId}`, data)
    return response.data
  },

  /** حذف نرم — بک‌اند فقط غیرفعال می‌کند (ردیف مصرف‌شده برای ممیزی می‌ماند) */
  disable: async (couponId: number) => {
    const response = await apiClient.delete(`/coupons/${couponId}`)
    return response.data
  },
}