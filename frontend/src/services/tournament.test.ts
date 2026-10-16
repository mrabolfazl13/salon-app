// src/services/tournament.test.ts
// آینهٔ قرارداد بک‌اند (app/api/v1/tournament.py): نام مسیرها و کلیدهای بدنهٔ
// درخواست. `score_a`/`score_b` و `seed: null` را سرویس مستقیم می‌خواند ⇒ اگر این‌ها
// بی‌صدا عوض شوند قرعه‌کشی/نتیجه‌ثبت‌کردن در prod می‌شکند.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()
const del = vi.fn()

vi.mock('@/services/api', () => {
  const client = {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    put: (...args: unknown[]) => put(...args),
    delete: (...args: unknown[]) => del(...args),
  }
  // همان الگوی services/coach.ts: import پیش‌فرضِ apiClient
  return { apiClient: client, default: client }
})

import { tournamentService } from '@/services/tournament'

beforeEach(() => {
  get.mockReset()
  post.mockReset()
  put.mockReset()
  del.mockReset()
})

describe('tournamentService', () => {
  it('lists with query params and unwraps the envelope', async () => {
    get.mockResolvedValue({ data: { total: 0, items: [] } })
    await expect(tournamentService.list({ status: 'in_progress', mine: true, limit: 20 }))
      .resolves.toEqual({ total: 0, items: [] })
    expect(get).toHaveBeenCalledWith('/tournaments', {
      params: { status: 'in_progress', mine: true, limit: 20 },
    })
  })

  it('posts the snake_case create payload', async () => {
    post.mockResolvedValue({ data: { id: 1 } })
    const payload = { name: 'تورنمنت زمستانه', starts_at: '2026-11-01T18:00', venue_id: 4, entry_fee: 500000 }
    await tournamentService.create(payload)
    expect(post).toHaveBeenCalledWith('/tournaments', payload)
  })

  it('sends seed as an explicit null when the captain does not choose one', async () => {
    post.mockResolvedValue({ data: { participant_id: 9, team_id: 3, team_name: 'استقلال', seed: 1 } })
    await tournamentService.registerTeam(1, 3)
    expect(post).toHaveBeenCalledWith('/tournaments/1/participants', { team_id: 3, seed: null })
    await tournamentService.registerTeam(1, 3, 2)
    expect(post).toHaveBeenLastCalledWith('/tournaments/1/participants', { team_id: 3, seed: 2 })
  })

  it('uses PUT …/open, POST …/draw and DELETE …/participants/{teamId}', async () => {
    get.mockResolvedValue({ data: { tournament: { id: 1 }, rounds: [], participants: [] } })
    post.mockResolvedValue({ data: { tournament: { id: 1 }, rounds: [], participants: [] } })
    put.mockResolvedValue({ data: { id: 1, status: 'registration' } })
    del.mockResolvedValue({ data: { participant_id: 9, status: 'withdrawn' } })
    await tournamentService.openRegistration(1)
    expect(put).toHaveBeenCalledWith('/tournaments/1/open')
    await tournamentService.draw(1)
    expect(post).toHaveBeenCalledWith('/tournaments/1/draw')
    await tournamentService.withdrawTeam(1, 3)
    expect(del).toHaveBeenCalledWith('/tournaments/1/participants/3')
  })

  it('records a result under the match path, not the tournament path', async () => {
    put.mockResolvedValue({ data: { id: 12, status: 'final' } })
    await tournamentService.setResult(12, 3, 1)
    expect(put).toHaveBeenCalledWith('/tournaments/matches/12/result', { score_a: 3, score_b: 1 })
  })

  it('reads bracket and standings from their own sub-paths', async () => {
    get.mockResolvedValue({ data: { items: [] } })
    await tournamentService.standings(5)
    expect(get).toHaveBeenLastCalledWith('/tournaments/5/standings')
    await tournamentService.bracket(5)
    expect(get).toHaveBeenLastCalledWith('/tournaments/5/bracket')
  })
})
