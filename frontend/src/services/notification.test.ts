import { describe, it, expect, vi, beforeEach } from 'vitest'

// آینهٔ قرارداد A1 بک‌اند: مسیرها و شکل پاسخ‌ها نباید بی‌صدا عوض شوند
const get = vi.fn()
const put = vi.fn()
vi.mock('@/services/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    put: (...args: unknown[]) => put(...args),
  },
}))

import { notificationService } from '@/services/notification'

beforeEach(() => {
  get.mockReset()
  put.mockReset()
})

describe('notificationService', () => {
  it('fetches the list from GET /notifications/ with params', async () => {
    get.mockResolvedValue({ data: [{ id: 1, is_read: false }] })
    const list = await notificationService.getAll({ limit: 30, unread_only: true })
    expect(get).toHaveBeenCalledWith('/notifications/', { params: { limit: 30, unread_only: true } })
    expect(list).toHaveLength(1)
  })

  it('unwraps the unread counter envelope', async () => {
    get.mockResolvedValue({ data: { count: 7 } })
    await expect(notificationService.getUnreadCount()).resolves.toBe(7)
    expect(get).toHaveBeenCalledWith('/notifications/unread-count')
  })

  it('marks one notification read via PUT /notifications/{id}/read', async () => {
    put.mockResolvedValue({ data: { id: 4, is_read: true } })
    const res = await notificationService.markAsRead(4)
    expect(put).toHaveBeenCalledWith('/notifications/4/read')
    expect(res.is_read).toBe(true)
  })

  it('marks everything read via PUT /notifications/read-all', async () => {
    put.mockResolvedValue({ data: { updated: 3 } })
    await notificationService.markAllAsRead()
    expect(put).toHaveBeenCalledWith('/notifications/read-all')
  })
})
