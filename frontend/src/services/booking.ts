// frontend/src/services/booking.ts
import apiClient from './api'
import type { CollectInPersonBody, ReceiptSubmitBody } from '@/types/booking'

export const bookingService = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/bookings', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/bookings/${id}`)
    return response.data
  },

  create: async (data: { slotId: number; discountCode?: string | null; useLoyaltyPoints?: boolean }): Promise<any> => {
    // Backend expects snake_case: { slot_id, discount_code?, use_loyalty_points? }
    // هیچ مبلغی از کلاینت پذیرفته نمی‌شود — کوپن/امتیاز فقط ارجاع‌اند
    const response = await apiClient.post('/bookings', {
      slot_id: data.slotId,
      discount_code: data.discountCode?.trim() || undefined,
      use_loyalty_points: !!data.useLoyaltyPoints,
    })
    return response.data
  },

  cancel: async (id: number) => {
    const response = await apiClient.delete(`/bookings/${id}`)
    return response.data
  },

  getUpcoming: async (daysAhead: number = 7) => {
    const response = await apiClient.get('/bookings/upcoming', { params: { days_ahead: daysAhead } })
    return response.data
  },

  getPast: async (limit: number = 20) => {
    const response = await apiClient.get('/bookings/past', { params: { limit } })
    return response.data
  },

  getVenueBookings: async (venueId: number, startDate?: string, endDate?: string) => {
    const response = await apiClient.get(`/bookings/venue/${venueId}`, {
      params: { start_date: startDate, end_date: endDate }
    })
    return response.data
  },

  // ===== رزروهای در انتظار تأیید مدیر سالن (Redis) =====

  getMyPending: async () => {
    const response = await apiClient.get('/bookings/pending/my')
    return response.data
  },

  getVenuePending: async (venueId: number) => {
    const response = await apiClient.get(`/bookings/venue/${venueId}/pending`)
    return response.data
  },

  confirmPending: async (pendingId: string) => {
    const response = await apiClient.post(`/bookings/pending/${pendingId}/confirm`)
    return response.data
  },

  rejectPending: async (pendingId: string) => {
    const response = await apiClient.post(`/bookings/pending/${pendingId}/reject`)
    return response.data
  },

  cancelPending: async (pendingId: string) => {
    const response = await apiClient.delete(`/bookings/pending/${pendingId}`)
    return response.data
  },

  // ===== فیش واریزی / پرداخت در محل =====

  /** ثبت فیش واریزی توسط صاحب رزرو — 201 { message, receipt_status } */
  submitReceipt: async (bookingId: number, body: ReceiptSubmitBody) => {
    const response = await apiClient.post(`/bookings/${bookingId}/receipt`, body)
    return response.data
  },

  /** تأیید فیش توسط مدیر — { message, receipt_status, amount } */
  approveReceipt: async (bookingId: number) => {
    const response = await apiClient.post(`/bookings/${bookingId}/receipt/approve`)
    return response.data
  },

  /** رد فیش توسط مدیر — دلیل حداقل ۴ حرف — { message, receipt_status } */
  rejectReceipt: async (bookingId: number, reason: string) => {
    const response = await apiClient.post(`/bookings/${bookingId}/receipt/reject`, { reason })
    return response.data
  },

  /** ثبت دریافت وجه در محل توسط مدیر — { message, amount } */
  collectInPerson: async (bookingId: number, body: CollectInPersonBody = {}) => {
    const response = await apiClient.post(`/bookings/${bookingId}/collect-in-person`, body)
    return response.data
  },
}