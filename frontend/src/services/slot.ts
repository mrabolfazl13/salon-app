import apiClient from './api'

export interface Slot {
  id: number
  venue_id: number
  slot_date: string
  start_time: string
  duration: number
  base_price: number
  current_price: number
  status: 'available' | 'booked' | 'blocked' | 'in_competition'
  is_competition_enabled: boolean
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
}