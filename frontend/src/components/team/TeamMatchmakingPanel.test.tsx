// src/components/team/TeamMatchmakingPanel.test.tsx
// حریف‌یابی (P010): امتیاز و نشانه‌ها را سرور می‌سازد؛ اینجا باید
// ۱) سیگنالِ «بداده» صفر نشان داده نشود (کاربر آن را با حریف ضعیف اشتباه نگیرد)،
// ۲) درِ ارسال چالش فقط برای کاپیتان/مدیر باز شود،
// ۳) چالش با همان قالب بک‌اند (HH:mm:ss و شناسۀ دو تیم) ارسال و خطای ساختارمند
//    فارسی شود.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import type { MatchSuggestion } from '@/types/matching'
import type { Team } from '@/types/team'

const suggestions = vi.fn()
const sendChallenge = vi.fn()

vi.mock('@/services/matching', () => ({
  matchingService: {
    suggestions: (...a: unknown[]) => suggestions(...a as []),
    sendChallenge: (...a: unknown[]) => sendChallenge(...a as []),
    challenges: vi.fn(),
    acceptChallenge: vi.fn(),
    declineChallenge: vi.fn(),
    cancelChallenge: vi.fn(),
  },
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

import TeamMatchmakingPanel from './TeamMatchmakingPanel'

const team = (over: Partial<Team> = {}): Team => ({
  id: 7,
  name: 'تیم ما',
  sport: 'futsal',
  visibility: 'public',
  captain_id: 1,
  is_active: true,
  member_count: 8,
  quota: 12,
  is_official: false,
  created_at: '2026-09-01T10:00:00+03:30',
  updated_at: '2026-09-01T10:00:00+03:30',
  my_role: 'captain',
  my_status: 'active',
  has_open_join_request: false,
  has_pending_invitation: false,
  ...over,
})

const signal = (over: Partial<MatchSuggestion['level']> = {}) => ({ value: 0.8, weight: 0.45, note: null, ...over })

const row = (over: Partial<MatchSuggestion> = {}): MatchSuggestion => ({
  team_id: 11,
  team_name: 'شاهین',
  logo_url: null,
  sport: 'futsal',
  is_official: false,
  member_count: 9,
  score: 82,
  level: signal({ value: 0.9, note: '٪ برد ۷۰ در برابر ۶۶' }),
  region: signal({ weight: 0.35, value: 0.6, note: '۶ کیلومتر فاصله' }),
  schedule: { weight: 0.2, value: 0.5, note: '۲ بازۀ زمانی مشترک' },
  rank: 3,
  played: 6,
  won: 4,
  win_rate: 66.7,
  home_venue: { id: 4, name: 'سالن مرکزی', latitude: 35.7, longitude: 51.4 },
  distance_km: 6,
  shared_time_slots: 2,
  has_open_challenge: false,
  reasons: [],
  ...over,
})

function renderPanel(canChallenge = true) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <TeamMatchmakingPanel team={team()} canChallenge={canChallenge} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  suggestions.mockResolvedValue({
    team_id: 7,
    items: [row()],
    total: 1,
    basis: { pool: 14, results_used: 9, bookings_scanned: 31 },
  })
  sendChallenge.mockResolvedValue({ id: 55, to_team_name: 'شاهین', status: 'pending' })
})

describe('TeamMatchmakingPanel', () => {
  it('asks suggestions for this team and shows the score in Persian digits', async () => {
    renderPanel()
    const card = await screen.findByTestId('match-suggestion-11')
    expect(suggestions).toHaveBeenCalledWith(7, { limit: 20 })
    expect(within(card).getByText('۸۲')).toBeInTheDocument()
    expect(within(card).getByText(/۹ عضو/)).toBeInTheDocument()
  })

  it('reports what data stands behind the scores', async () => {
    renderPanel()
    expect(await screen.findByTestId('match-basis')).toHaveTextContent('۱۴ حریف بررسی شده')
  })

  it('labels an unavailable signal as «no data» instead of a zero bar', async () => {
    suggestions.mockResolvedValue({
      team_id: 7,
      items: [row({ distance_km: null, home_venue: null, region: { weight: 0.35, value: null, note: 'تیمی که سالن ثابت ندارد' } })],
      total: 1,
      basis: { pool: 14, results_used: 9, bookings_scanned: 31 },
    })
    renderPanel()
    const card = await screen.findByTestId('match-suggestion-11')
    expect(within(card).getByLabelText('نزدیکی سالن: داده ندارد')).toBeInTheDocument()
    expect(within(card).queryByLabelText('نزدیکی سالن: ۰٪')).toBeNull()
  })

  it('replaces the button with a chip when a challenge is already open', async () => {
    suggestions.mockResolvedValue({
      team_id: 7,
      items: [row({ has_open_challenge: true })],
      total: 1,
      basis: { pool: 14, results_used: 9, bookings_scanned: 31 },
    })
    renderPanel()
    const card = await screen.findByTestId('match-suggestion-11')
    expect(within(card).getByTestId('match-open-challenge-11')).toBeInTheDocument()
    expect(within(card).queryByTestId('match-challenge-open-11')).toBeNull()
  })

  it('hides the challenge action from a plain member', async () => {
    renderPanel(false)
    const card = await screen.findByTestId('match-suggestion-11')
    expect(within(card).queryByTestId('match-challenge-open-11')).toBeNull()
    expect(within(card).getByText('فقط کاپیتان یا مدیر تیم می‌تواند چالش بفرستد.')).toBeInTheDocument()
  })

  it('sends the proposal with the HH:mm:ss time the API expects', async () => {
    renderPanel()
    fireEvent.click(await screen.findByTestId('match-challenge-open-11'))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('پیام شما (اختیاری)'), { target: { value: 'جمعه عصر؟' } })
    fireEvent.change(within(dialog).getByLabelText('تاریخ پیشنهادی'), { target: { value: '2026-10-23' } })
    fireEvent.change(within(dialog).getByLabelText('ساعت پیشنهادی'), { target: { value: '18:00' } })
    fireEvent.click(within(dialog).getByTestId('match-challenge-send'))
    await waitFor(() => expect(sendChallenge).toHaveBeenCalledTimes(1))
    expect(sendChallenge.mock.calls[0][0]).toEqual({
      from_team_id: 7,
      to_team_id: 11,
      message: 'جمعه عصر؟',
      proposed_date: '2026-10-23',
      proposed_time: '18:00:00',
    })
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('چالش بازی به «شاهین» ارسال شد.'))
  })

  it('sends nothing when date and time are left blank', async () => {
    renderPanel()
    fireEvent.click(await screen.findByTestId('match-challenge-open-11'))
    fireEvent.click(await screen.findByTestId('match-challenge-send'))
    await waitFor(() => expect(sendChallenge).toHaveBeenCalledTimes(1))
    expect(sendChallenge.mock.calls[0][0]).toMatchObject({ message: undefined, proposed_date: undefined, proposed_time: undefined })
  })

  it('translates the structured 409 of an existing open challenge', async () => {
    sendChallenge.mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { detail: { code: 'CHALLENGE_OPEN_EXISTS', message: 'چالش باز وجود دارد' } } },
    })
    renderPanel()
    fireEvent.click(await screen.findByTestId('match-challenge-open-11'))
    fireEvent.click(await screen.findByTestId('match-challenge-send'))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(expect.stringContaining('یک چالش باز')))
  })

  it('shows the empty state when no opponent was found', async () => {
    suggestions.mockResolvedValue({ team_id: 7, items: [], total: 0, basis: { pool: 0, results_used: 0, bookings_scanned: 0 } })
    renderPanel()
    expect(await screen.findByText('حریفی پیدا نشد')).toBeInTheDocument()
  })

  it('surfaces the server error text instead of an empty list', async () => {
    suggestions.mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: { detail: { code: 'NOT_AUTHORIZED', message: 'دسترسی ندارید' } } },
    })
    renderPanel()
    expect(await screen.findByText('فقط کاپیتان یا مدیر تیم می‌تواند این کار را انجام دهد.')).toBeInTheDocument()
  })
})
