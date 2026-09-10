import apiClient from './api'

// شکل کاربر از سمت بک‌اند (snake_case)
export interface AdminUser {
  id: number
  phone: string
  full_name: string
  role: 'user' | 'venue_manager' | 'club_admin' | 'super_admin'
  is_active: boolean
  is_verified: boolean
  created_at: string
  last_login?: string | null
}

export interface UserStats {
  total_users: number
  active_users: number
  inactive_users: number
  verified_users: number
  unverified_users: number
  by_role: Record<string, number>
}

export interface VenueStats {
  total_venues: number
  verified_venues: number
  pending_venues: number
}

export const adminService = {
  // لیست تمام کاربران
  getUsers: async (): Promise<AdminUser[]> => {
    const response = await apiClient.get('/admin/users')
    return response.data
  },

  // آمار کاربران
  getUserStats: async (): Promise<UserStats> => {
    const response = await apiClient.get('/admin/stats/users')
    return response.data
  },

  // آمار سالن‌ها
  getVenueStats: async (): Promise<VenueStats> => {
    const response = await apiClient.get('/admin/stats/venues')
    return response.data
  },

  // سالن‌های در انتظار تایید
  getPendingVenues: async (): Promise<any[]> => {
    const response = await apiClient.get('/admin/pending-venues')
    return response.data
  },

  // تایید یک سالن
  verifyVenue: async (venueId: number) => {
    const response = await apiClient.post(`/admin/verify-venue/${venueId}`)
    return response.data
  },

  // مدیران سالن در انتظار تایید
  getPendingManagers: async (): Promise<AdminUser[]> => {
    const response = await apiClient.get('/admin/pending-managers')
    return response.data
  },

  // تایید حساب مدیر سالن
  approveUser: async (userId: number) => {
    const response = await apiClient.post(`/admin/users/${userId}/approve`)
    return response.data
  },

  // رد حساب مدیر سالن
  rejectUser: async (userId: number) => {
    const response = await apiClient.post(`/admin/users/${userId}/reject`)
    return response.data
  },
}