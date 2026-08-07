import apiClient from './api'

export const venueService = {
  getAll: async (params?: any) => {
    const response = await apiClient.get('/venues', { params })
    return response.data
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/venues/${id}`)
    return response.data
  },

  create: async (data: any) => {
    const response = await apiClient.post('/venues', data)
    return response.data
  },

  update: async (id: number, data: any) => {
    const response = await apiClient.put(`/venues/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/venues/${id}`)
    return response.data
  },

  getMyVenues: async () => {
    const response = await apiClient.get('/venues/my-venues')
    return response.data
  },

  verify: async (id: number) => {
    const response = await apiClient.post(`/venues/${id}/verify`)
    return response.data
  },

  getAmenities: async (id: number) => {
    const response = await apiClient.get(`/venues/${id}/amenities`)
    return response.data
  },
}