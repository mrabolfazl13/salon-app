import apiClient from './api'

export const competitionService = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/competitions', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/competitions/${id}`)
    return response.data
  },

  start: async (data: { slotId: number; offeredPrice: number }) => {
    const response = await apiClient.post('/competitions/start', data)
    return response.data
  },

  placeBid: async (slotId: number, offeredPrice: number) => {
    const response = await apiClient.post(`/competitions/${slotId}/bid`, { offeredPrice })
    return response.data
  },

  getBestBid: async (slotId: number) => {
    const response = await apiClient.get(`/competitions/slot/${slotId}/best`)
    return response.data
  },

  getMyBids: async () => {
    const response = await apiClient.get('/competitions/my-bids')
    return response.data
  },

  getMyWins: async () => {
    const response = await apiClient.get('/competitions/my-wins')
    return response.data
  },
}