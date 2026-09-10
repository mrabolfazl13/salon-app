import { apiClient } from './api'

export interface NotificationItem {
  id: number
  user_id: number
  title: string
  message: string
  data: Record<string, unknown> | null
  type: string
  is_read: boolean
  created_at: string
}

export const notificationService = {
  getAll: async (params?: {
    limit?: number
    offset?: number
    unread_only?: boolean
  }): Promise<NotificationItem[]> => {
    const { data } = await apiClient.get('/notifications/', { params })
    return data
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get('/notifications/unread-count')
    return data.count as number
  },

  markAsRead: async (id: number): Promise<NotificationItem> => {
    const { data } = await apiClient.put(`/notifications/${id}/read`)
    return data
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all')
  },
}
