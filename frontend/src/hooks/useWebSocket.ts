import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import type { NotificationItem } from '@/services/notification'

// تبدیل آدرس HTTP API به آدرس WebSocket
const getWsBase = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
  try {
    const url = new URL(apiUrl)
    const proto = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${url.host}`
  } catch {
    return 'ws://localhost:8000'
  }
}

interface WsPayload {
  id?: number
  type?: string
  notif_type?: string
  title?: string
  message?: string
  data?: Record<string, unknown>
}

/**
 * اتصال WebSocket بلادرنگ برای دریافت اعلان‌ها.
 * پس از احراز هویت متصل می‌شود، در logout قطع می‌شود،
 * و با exponential backoff دوباره تلاش می‌کند.
 */
export const useWebSocket = () => {
  const userId = useAuthStore((s) => s.user?.id)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closedRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !userId) return

    closedRef.current = false
    retryRef.current = 0

    const connect = () => {
      if (closedRef.current) return

      const wsUrl = `${getWsBase()}/ws/user/${userId}`
      let ws: WebSocket
      try {
        ws = new WebSocket(wsUrl)
      } catch {
        scheduleRetry()
        return
      }
      wsRef.current = ws

      ws.onopen = () => {
        retryRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as WsPayload
          if (payload.type !== 'user_notification') return

          const { addNotification } = useNotificationStore.getState()
          const notif: NotificationItem = {
            id: payload.id ?? Date.now(),
            user_id: userId,
            title: payload.title || 'اعلان جدید',
            message: payload.message || '',
            data: payload.data ?? null,
            type: payload.notif_type || 'info',
            is_read: false,
            created_at: new Date().toISOString(),
          }
          addNotification(notif)
          toast(notif.title, { icon: '🔔', duration: 4000 })
        } catch {
          // پیام غیر JSON نادیده گرفته می‌شود
        }
      }

      ws.onclose = () => {
        if (!closedRef.current) scheduleRetry()
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    const scheduleRetry = () => {
      // exponential backoff: 2s, 4s, 8s ... حداکثر ۶۰ ثانیه
      const delay = Math.min(2000 * 2 ** retryRef.current, 60000)
      retryRef.current += 1
      timerRef.current = setTimeout(connect, delay)
    }

    connect()

    return () => {
      closedRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [isAuthenticated, userId])
}

export default useWebSocket
