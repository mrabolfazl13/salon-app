import apiClient from './api'

export const contractService = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/contracts', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/contracts/${id}`)
    return response.data
  },

  create: async (data: any) => {
    const response = await apiClient.post('/contracts', data)
    return response.data
  },

  cancelSession: async (data: { contractId: number; sessionDate: string; reason: string }) => {
    const response = await apiClient.post('/contracts/cancel-session', data)
    return response.data
  },

  renew: async (contractId: number, newEndDate: string) => {
    const response = await apiClient.post(`/contracts/${contractId}/renew`, { newEndDate })
    return response.data
  },

  getCalendar: async (contractId: number, year: number, month: number) => {
    const response = await apiClient.get(`/contracts/${contractId}/calendar`, {
      params: { year, month },
    })
    return response.data
  },

  getSummary: async (contractId: number) => {
    const response = await apiClient.get(`/contracts/${contractId}/summary`)
    return response.data
  },

  getUpcomingSessions: async (daysAhead: number = 7) => {
    const response = await apiClient.get('/contracts/upcoming-sessions', {
      params: { daysAhead },
    })
    return response.data
  },
}