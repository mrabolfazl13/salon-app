// src/services/coach.test.ts
// آینهٔ قرارداد A1 بک‌اند (app/api/v1/coach.py): مسیرها و بدنهٔ درخواست‌ها نباید
// بی‌صدا عوض شوند — مخصوصاً نام فیلد `status` و `settled` که سرویس می‌خواند.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()

vi.mock('@/services/api', () => {
  const client = {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    put: (...args: unknown[]) => put(...args),
  }
  // services/coach.ts همان مسیر team.ts را می‌رود: import پیش‌فرضِ apiClient
  return { apiClient: client, default: client }
})

import { coachService } from '@/services/coach'

beforeEach(() => {
  get.mockReset()
  post.mockReset()
  put.mockReset()
})

describe('coachService', () => {
  it('posts a session to /coach/sessions with the snake_case contract', async () => {
    post.mockResolvedValue({ data: { id: 9 } })
    const payload = {
      client_phone: '09121110000',
      starts_at: '2026-10-18T18:00',
      duration_min: 60,
      fee: 200000,
    }
    await coachService.createSession(payload)
    expect(post).toHaveBeenCalledWith('/coach/sessions', payload)
  })

  it('passes list filters through as query params', async () => {
    get.mockResolvedValue({ data: { total: 0, items: [] } })
    await coachService.listSessions({ status: 'attended', limit: 50, as_client: true })
    expect(get).toHaveBeenCalledWith('/coach/sessions', {
      params: { status: 'attended', limit: 50, as_client: true },
    })
  })

  it('sends attendance as {status} and settle as {settled}', async () => {
    put.mockResolvedValue({ data: { id: 3 } })
    await coachService.setAttendance(3, 'absent')
    expect(put).toHaveBeenNthCalledWith(1, '/coach/sessions/3/attendance', { status: 'absent' })
    await coachService.setSettled(3, false)
    expect(put).toHaveBeenNthCalledWith(2, '/coach/sessions/3/settle', { settled: false })
  })

  it('unwraps the dashboard and the clients envelope', async () => {
    get
      .mockResolvedValueOnce({ data: { today: [], upcoming: [], today_count: 0, month_sessions: 0, month_revenue: 0, month_outstanding: 0, active_clients: 0 } })
      .mockResolvedValueOnce({ data: { items: [{ user_id: 1, full_name: 'x', phone: '09121110000', sessions: 2, last_session_at: null, fee_total: 0 }] } })
    await expect(coachService.getDashboard()).resolves.toMatchObject({ today_count: 0 })
    await expect(coachService.getClients()).resolves.toEqual({
      items: [{ user_id: 1, full_name: 'x', phone: '09121110000', sessions: 2, last_session_at: null, fee_total: 0 }],
    })
  })
})
