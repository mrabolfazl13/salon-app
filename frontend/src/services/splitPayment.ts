// frontend/src/services/splitPayment.ts
// سرویس API سیستم پرداخت اشتراکی تیم — مسیرهای /split-payments بک‌اند

import apiClient from './api'

export interface SplitPayment {
  id: number
  team_id: number
  game_id: number | null
  booking_id: number | null
  amount: number
  currency: string
  method: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE'
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  deadline: string | null
  created_by: number
  created_at: string
  updated_at: string
  note: string | null
}

export interface SplitPaymentShare {
  id: number
  split_payment_id: number
  user_id: number
  amount: number
  percentage: number | null
  status: 'PENDING' | 'PAID' | 'REFUNDED'
  paid_at: string | null
  created_at: string
  user_name?: string
}

export interface SplitPaymentDetail extends SplitPayment {
  shares: SplitPaymentShare[]
  total_paid: number
  remaining: number
}

export interface CreateSplitPaymentPayload {
  team_id: number
  game_id?: number
  booking_id?: number
  amount: number
  currency?: string
  method: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE'
  deadline?: string
  note?: string
  custom_shares?: Array<{ user_id: number; amount: number }>
  percentage_shares?: Array<{ user_id: number; percentage: number }>
}

export interface MarkSharePaidPayload {
  payment_method?: string
  transaction_ref?: string
  note?: string
}

export const splitPaymentService = {
  // ─────────────────────────── ایجاد پرداخت اشتراکی ───────────────────────────

  create: async (data: CreateSplitPaymentPayload): Promise<SplitPayment> => {
    const response = await apiClient.post('/split-payments/', data)
    return response.data
  },

  // ─────────────────────────── دریافت جزئیات با سهم‌ها ───────────────────────────

  getById: async (id: number): Promise<SplitPaymentDetail> => {
    const response = await apiClient.get(`/split-payments/${id}`)
    return response.data
  },

  // ─────────────────────────── علامت‌گذاری سهم به عنوان پرداخت‌شده ───────────────────────────

  payShare: async (splitPaymentId: number, shareId: number, data?: MarkSharePaidPayload): Promise<SplitPaymentShare> => {
    const response = await apiClient.post(
      `/split-payments/${splitPaymentId}/shares/${shareId}/pay`,
      data || {}
    )
    return response.data
  },

  // ─────────────────────────── لیست پرداخت‌های اشتراکی تیم ───────────────────────────

  listByTeam: async (teamId: number, limit = 50, offset = 0): Promise<{ items: SplitPayment[]; total: number }> => {
    const response = await apiClient.get(`/split-payments/team/${teamId}`, {
      params: { limit, offset }
    })
    return response.data
  },
}
