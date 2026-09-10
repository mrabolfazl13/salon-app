import apiClient from './api'

export interface ReviewResponse {
  id: number
  venue_id: number
  user_id: number
  rating: number
  comment: string | null
  created_at: string
  user_name: string | null
  venue_name: string | null
}

export interface ReviewCreate {
  venue_id: number
  rating: number
  comment?: string | null
}

export interface VenueRatingSummary {
  venue_id: number
  average_rating: number
  total_reviews: number
}

export const reviewService = {
  // دریافت نظرات یک سالن
  getByVenue: async (venueId: number, limit = 50, offset = 0): Promise<ReviewResponse[]> => {
    const response = await apiClient.get(`/reviews/venue/${venueId}`, { params: { limit, offset } })
    return response.data
  },

  // دریافت خلاصه امتیازات یک سالن
  getVenueSummary: async (venueId: number): Promise<VenueRatingSummary> => {
    const response = await apiClient.get(`/reviews/venue/${venueId}/summary`)
    return response.data
  },

  // دریافت نظرات کاربر جاری
  getMyReviews: async (limit = 50): Promise<ReviewResponse[]> => {
    const response = await apiClient.get('/reviews/my', { params: { limit } })
    return response.data
  },

  // ثبت نظر جدید
  create: async (data: ReviewCreate): Promise<ReviewResponse> => {
    const response = await apiClient.post('/reviews/', data)
    return response.data
  },

  // ویرایش نظر
  update: async (reviewId: number, data: ReviewCreate): Promise<ReviewResponse> => {
    const response = await apiClient.put(`/reviews/${reviewId}`, data)
    return response.data
  },

  // حذف نظر
  delete: async (reviewId: number): Promise<void> => {
    await apiClient.delete(`/reviews/${reviewId}`)
  },
}