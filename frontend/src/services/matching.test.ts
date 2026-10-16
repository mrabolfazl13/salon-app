// src/services/matching.test.ts
// آینهٔ قرارداد P010 بک‌اند (app/api/v1/matching.py): نام مسیرها و کلیدهای query
// نباید بی‌صدا عوض شود — مخصوصاً `direction` (inbox/outbox/all) و bodyِ `{note}`
// که بک‌اند در ChallengeRespond انتظار دارد (null = بدون یادداشت).

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

import { matchingService } from '@/services/matching'

beforeEach(() => {
  get.mockReset()
  post.mockReset()
})

describe('matchingService', () => {
  it('reads suggestions from /matching/teams/{id} with limit and sport', async () => {
    get.mockResolvedValue({ data: { team_id: 7, items: [], total: 0, basis: {} } })
    await matchingService.suggestions(7, { limit: 20, sport: 'futsal' })
    expect(get).toHaveBeenCalledWith('/matching/teams/7', { params: { limit: 20, sport: 'futsal' } })
  })

  it('sends team_id, direction and status as query params for the inbox', async () => {
    get.mockResolvedValue({ data: { team_id: 7, items: [], total: 0 } })
    await matchingService.challenges({ team_id: 7, direction: 'inbox', status: 'pending' })
    expect(get).toHaveBeenCalledWith('/matching/challenges', {
      params: { team_id: 7, direction: 'inbox', status: 'pending' },
    })
  })

  it('omits an unset status instead of sending an empty string', async () => {
    get.mockResolvedValue({ data: { team_id: 7, items: [], total: 0 } })
    await matchingService.challenges({ team_id: 7, direction: 'all' })
    const params = get.mock.calls[0][1].params as Record<string, unknown>
    expect(params).toEqual({ team_id: 7, direction: 'all' })
    expect(params.status).toBeUndefined()
  })

  it('posts the challenge with the snake_case create payload', async () => {
    post.mockResolvedValue({ data: { id: 3 } })
    const payload = {
      from_team_id: 7,
      to_team_id: 11,
      message: 'جمعه عصر هماهنگ کنیم؟',
      proposed_date: '2026-10-23',
      proposed_time: '18:00:00',
    }
    await matchingService.sendChallenge(payload)
    expect(post).toHaveBeenCalledWith('/matching/challenges', payload)
  })

  it('sends note: null on accept/decline when no note was typed', async () => {
    post.mockResolvedValue({ data: { id: 3, status: 'accepted' } })
    await matchingService.acceptChallenge(3)
    expect(post).toHaveBeenCalledWith('/matching/challenges/3/accept', { note: null })
    await matchingService.declineChallenge(3, 'آن هفته میزبان هستیم')
    expect(post).toHaveBeenCalledWith('/matching/challenges/3/decline', { note: 'آن هفته میزبان هستیم' })
  })

  it('cancels without a body', async () => {
    post.mockResolvedValue({ data: { id: 3, status: 'cancelled' } })
    await matchingService.cancelChallenge(3)
    expect(post).toHaveBeenCalledWith('/matching/challenges/3/cancel')
  })
})
