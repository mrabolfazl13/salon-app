// src/services/membership.test.ts
// آینهٔ قرارداد بک‌اند (app/api/v1/memberships.py): مسیر و بدنهٔ بازگشت وجه نباید
// بی‌صدا عوض شود — `reason` اختیاری است و بک‌اند آن را در توضیحِ ردیفِ دفتر کل می‌نویسد.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()

vi.mock('@/services/api', () => {
  const client = {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  }
  return { apiClient: client, default: client }
})

import { membershipService } from '@/services/membership'

beforeEach(() => {
  get.mockReset()
  post.mockReset()
})

describe('membershipService — بازگشت وجه اشتراک', () => {
  it('posts to the refund route with a null reason when none is given', async () => {
    post.mockResolvedValue({ data: { id: 3, status: 'refunded' } })
    const updated = await membershipService.refundPurchase(3)
    expect(post).toHaveBeenCalledWith('/memberships/purchases/3/refund', { reason: null })
    expect(updated.status).toBe('refunded')
  })

  it('trims the reason instead of sending padding to the ledger description', async () => {
    post.mockResolvedValue({ data: { id: 3, status: 'refunded' } })
    await membershipService.refundPurchase(3, '  انصراف مشتری  ')
    expect(post).toHaveBeenCalledWith('/memberships/purchases/3/refund', { reason: 'انصراف مشتری' })
  })

  it('sends an empty reason as null (the field is max_length=200 on the server)', async () => {
    post.mockResolvedValue({ data: { id: 3, status: 'refunded' } })
    await membershipService.refundPurchase(3, '   ')
    expect(post).toHaveBeenCalledWith('/memberships/purchases/3/refund', { reason: null })
  })

  it('keeps the paid-only consume route untouched beside the new refund route', async () => {
    post.mockResolvedValue({ data: { id: 7, sessions_remaining: 4 } })
    await membershipService.consumeSession(7)
    expect(post).toHaveBeenCalledWith('/memberships/purchases/7/consume')
  })
})
