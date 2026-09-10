// frontend/src/services/booking.ts
import apiClient from './api'

export const bookingService = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/bookings', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/bookings/${id}`)
    return response.data
  },

  create: async (data: { slotId: number }) => {
    // Backend expects snake_case: { slot_id }
    const response = await apiClient.post('/bookings', { slot_id: data.slotId })
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
}
