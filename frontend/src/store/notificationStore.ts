import { create } from 'zustand'
import { notificationService, type NotificationItem } from '@/services/notification'

interface NotificationStore {
  notifications: NotificationItem[]
  unreadCount: number
  loading: boolean
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  addNotification: (n: NotificationItem) => void
  incrementUnread: () => void
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  reset: () => void
}

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true })
    try {
      const list = await notificationService.getAll({ limit: 30 })
      set({ notifications: list })
    } catch {
      // خطای شبکه نادیده گرفته می‌شود؛ شمارش از طریق fetchUnreadCount
    } finally {
      set({ loading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationService.getUnreadCount()
      set({ unreadCount: count })
    } catch {
      // ignore
    }
  },

  addNotification: (n) => {
    const exists = get().notifications.some((x) => x.id === n.id)
    set((state) => ({
      notifications: exists ? state.notifications : [n, ...state.notifications].slice(0, 30),
      unreadCount: state.unreadCount + 1,
    }))
  },

  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

  markAsRead: async (id) => {
    // به‌روزرسانی خوش‌بینانه برای پاسخگویی فوری UI
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - (
        state.notifications.find((n) => n.id === id && !n.is_read) ? 1 : 0
      )),
    }))
    try {
      await notificationService.markAsRead(id)
    } catch {
      // در خطا، وضعیت از سرور در fetch بعدی همگام می‌شود
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }))
    try {
      await notificationService.markAllAsRead()
    } catch {
      // ignore
    }
  },

  reset: () => set({ notifications: [], unreadCount: 0, loading: false }),
}))
