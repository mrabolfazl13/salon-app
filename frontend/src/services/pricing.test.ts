// src/services/pricing.test.ts
// آینهٔ قرارداد C5 بک‌اند (app/api/v1/pricing.py): /pricing/occupancy و /pricing/suggestion
// با query درست. هیچ عددی در فرانت ساخته نمی‌شود — پنجره، کف/سقف و ضریب همه سروری‌اند.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()

vi.mock('@/services/api', () => {
  const client = {
    get: (...args: unknown[]) => get(...args),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
  return { apiClient: client, default: client }
})

import { pricingService } from '@/services/pricing'

beforeEach(() => {
  get.mockReset()
})

describe('pricingService — تحلیل تقاضا (C5.1)', () => {
  it('reads the occupancy matrix from /pricing/occupancy', async () => {
    get.mockResolvedValue({ data: { venue_id: 3, buckets: [] } })
    await pricingService.occupancy(3, 30)
    expect(get).toHaveBeenCalledWith('/pricing/occupancy', {
      params: { venue_id: 3, days: 30 },
    })
  })

  it('sends days=null when the caller wants the server default window', async () => {
    get.mockResolvedValue({ data: { venue_id: 3, buckets: [] } })
    await pricingService.occupancy(3)
    expect(get).toHaveBeenCalledWith('/pricing/occupancy', {
      params: { venue_id: 3, days: null },
    })
  })

  it('keeps the existing rules contract untouched', async () => {
    get.mockResolvedValue({ data: [] })
    await pricingService.listRules(3, true)
    expect(get).toHaveBeenCalledWith('/pricing/rules', {
      params: { venue_id: 3, include_inactive: true },
    })
  })
})

describe('pricingService — پیشنهاد قیمت (C5.2)', () => {
  it('asks /pricing/suggestion with date, HH:mm:ss time and duration', async () => {
    get.mockResolvedValue({ data: { recommended_price: 225000 } })
    await pricingService.suggestion({
      venue_id: 3,
      slot_date: '2026-10-19',
      start_time: '18:00:00',
      days: 90,
    })
    expect(get).toHaveBeenCalledWith('/pricing/suggestion', {
      params: {
        venue_id: 3,
        slot_date: '2026-10-19',
        start_time: '18:00:00',
        duration: 90,
        days: 90,
      },
    })
  })

  it('passes an explicit duration instead of the 90-minute default', async () => {
    get.mockResolvedValue({ data: {} })
    await pricingService.suggestion({
      venue_id: 3,
      slot_date: '2026-10-19',
      start_time: '20:30:00',
      duration: 120,
    })
    expect(get).toHaveBeenCalledWith('/pricing/suggestion', {
      params: {
        venue_id: 3,
        slot_date: '2026-10-19',
        start_time: '20:30:00',
        duration: 120,
        days: null,
      },
    })
  })
})
