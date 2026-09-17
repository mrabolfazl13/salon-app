import apiClient from './api'

// وضعیت سانس — reserved یعنی سانس تعهدشدهٔ قرارداد؛ (string & {}) اجازه می‌دهد
// وضعیت‌های جدیدِ آیندهٔ بک‌اند بدون شکست UI (fallback «نامشخص») نمایش داده شوند
export type SlotStatus =
  | 'available'
  | 'booked'
  | 'blocked'
  | 'in_competition'
  | 'reserved'
  | (string & {})

export interface Slot {
  id: number
  venue_id: number
  slot_date: string
  start_time: string
  duration: number
  base_price: number
  current_price: number
  status: SlotStatus
  is_competition_enabled: boolean
  is_contract_slot: boolean
  // Open-slot deal (بازار لحظه‌آخری) — frontend deal chips
  is_deal?: boolean | null
  deal_price?: number | null
  deal_expires_at?: string | null
}

// پاسخ یکسان block/unblock — آینه‌ی SlotBlockResponse بک‌اند
export interface SlotBlockResult {
  slot_id: number
  venue_id: number
  status: SlotStatus
}

export const slotService = {
  // دریافت سانس‌های یک سالن برای یک تاریخ
  getByVenueAndDate: async (venueId: number, date: string): Promise<Slot[]> => {
    const response = await apiClient.get(`/slots/venue/${venueId}`, { params: { slot_date: date } })
    return response.data
  },

  // دریافت سانس‌های آزاد یک سالن برای یک تاریخ
  getAvailableByVenueAndDate: async (venueId: number, date: string): Promise<Slot[]> => {
    const response = await apiClient.get(`/slots/venue/${venueId}/available`, { params: { slot_date: date } })
    return response.data
  },

  // تولید سانس‌ها برای یک روز
  generateForDate: async (venueId: number, date: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/slots/venue/${venueId}/generate`, null, { params: { slot_date: date } })
    return response.data
  },

  // دریافت سانس‌ها برای بازه تاریخ
  getByVenueAndDateRange: async (venueId: number, startDate: string, endDate: string): Promise<Slot[]> => {
    const response = await apiClient.get(`/slots/venue/${venueId}/range`, { params: { start_date: startDate, end_date: endDate } })
    return response.data
  },

  // مسدود کردن سانس آزادِ آینده — slot.block (مالک/سرپرست/کارمند با کد)
  block: async (slotId: number): Promise<SlotBlockResult> => {
    const response = await apiClient.post(`/slots/${slotId}/block`)
    return response.data
  },

  // آزاد کردن سانس مسدودشده‌ی آینده — slot.block (بدون بدنه)
  unblock: async (slotId: number): Promise<SlotBlockResult> => {
    const response = await apiClient.post(`/slots/${slotId}/unblock`)
    return response.data
  },
}