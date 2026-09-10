import { apiClient } from './api'

// شکل فاکتور پرداخت از بک‌اند (snake_case)
export interface PaymentItem {
  id: number
  booking_id: number
  user_id: number
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  gateway: string
  authority: string | null
  transaction_id: string | null
  card_pan: string | null
  created_at: string
  paid_at: string | null
}

export interface CardPayData {
  card_number: string
  cvv: string
  month: number
  year: number
}

export const paymentService = {
  // ایجاد (یا بازیابی) فاکتور پرداخت برای یک رزرو تأییدشده
  create: async (bookingId: number): Promise<PaymentItem> => {
    const { data } = await apiClient.post('/payments/', { booking_id: bookingId })
    return data
  },

  // پرداخت فاکتور از طریق درگاه (شبیه‌سازی‌شده)
  pay: async (paymentId: number, card: CardPayData): Promise<PaymentItem> => {
    const { data } = await apiClient.post(`/payments/${paymentId}/pay`, card)
    return data
  },

  // تاریخچه پرداخت‌های کاربر جاری
  getMy: async (params?: { limit?: number; offset?: number }): Promise<PaymentItem[]> => {
    const { data } = await apiClient.get('/payments/my', { params })
    return data
  },
}
