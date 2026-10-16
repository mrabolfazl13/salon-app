// src/services/shift.test.ts
// آینهٔ قرارداد P020 بک‌اند (app/api/v1/shift.py): مسیرها و نام پارامترها نباید
// بی‌صدا عوض شوند — مخصوصاً aliasهای `from`/`to` (بک‌اند date_from/date_to را در
// query نمی‌پذیرد) و `month` خروجی CSV که فقط قالب YYYY-MM قبول می‌کند.

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
  // services/shift.ts همان مسیر بقیهٔ سرویس‌ها را می‌رود: import پیش‌فرضِ apiClient
  return { apiClient: client, default: client }
})

import { shiftService } from '@/services/shift'

beforeEach(() => {
  get.mockReset()
  post.mockReset()
  put.mockReset()
})

describe('shiftService', () => {
  it('lists the week with venue_id and the from/to aliases', async () => {
    get.mockResolvedValue({ data: { total: 0, items: [] } })
    await shiftService.list(4, { from: '2026-10-17T00:00:00', to: '2026-10-24T00:00:00' })
    expect(get).toHaveBeenCalledWith('/shifts', {
      params: { venue_id: 4, from: '2026-10-17T00:00:00', to: '2026-10-24T00:00:00' },
    })
  })

  it('posts a shift with the snake_case create payload', async () => {
    post.mockResolvedValue({ data: { id: 9 } })
    const payload = {
      venue_id: 4,
      user_id: 12,
      starts_at: '2026-10-18T08:00:00',
      ends_at: '2026-10-18T16:00:00',
      notes: null,
    }
    await shiftService.create(payload)
    expect(post).toHaveBeenCalledWith('/shifts', payload)
  })

  it('sends edits to PUT /shifts/{id} and cancel to POST /shifts/{id}/cancel', async () => {
    put.mockResolvedValue({ data: { id: 3 } })
    post.mockResolvedValue({ data: { id: 3 } })
    await shiftService.update(3, { status: 'done' })
    expect(put).toHaveBeenCalledWith('/shifts/3', { status: 'done' })
    await shiftService.cancel(3)
    expect(post).toHaveBeenCalledWith('/shifts/3/cancel')
  })

  it('reads the summary envelope over the same from/to keys', async () => {
    get.mockResolvedValue({
      data: { venue_id: 4, date_from: 'x', date_to: 'y', total_shifts: 0, total_min: 0, per_staff: [] },
    })
    await expect(shiftService.summary(4, '2026-10-01T00:00:00', '2026-11-01T00:00:00'))
      .resolves.toMatchObject({ venue_id: 4, per_staff: [] })
    expect(get).toHaveBeenCalledWith('/shifts/summary', {
      params: { venue_id: 4, from: '2026-10-01T00:00:00', to: '2026-11-01T00:00:00' },
    })
  })

  it('asks the export as a blob so the browser can save it', async () => {
    const blob = new Blob(['x'], { type: 'text/csv' })
    get.mockResolvedValue({ data: blob })
    await expect(shiftService.exportCsv(4, '2026-10')).resolves.toBe(blob)
    expect(get).toHaveBeenCalledWith('/shifts/export', {
      params: { venue_id: 4, month: '2026-10' },
      responseType: 'blob',
    })
  })
})
