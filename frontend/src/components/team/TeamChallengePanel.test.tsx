// src/components/team/TeamChallengePanel.test.tsx
// صندوق چالش‌ها (P010): فیلترها باید همان کلیدهای query بک‌اند را بفرستند
// (direction + status)، درِ پاسخ فقط برای مدیر باز شود، و «پس‌گرفتن» تنها در
// خروجی‌ها باشد — بک‌اند هم آن را فقط از سوی فرستنده می‌پذیرد.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import type { ChallengeRow } from '@/types/matching'

const challenges = vi.fn()
const accept = vi.fn()
const decline = vi.fn()
const cancel = vi.fn()

vi.mock('@/services/matching', () => ({
  matchingService: {
    challenges: (...a: unknown[]) => challenges(...a as []),
    acceptChallenge: (...a: unknown[]) => accept(...a as []),
    declineChallenge: (...a: unknown[]) => decline(...a as []),
    cancelChallenge: (...a: unknown[]) => cancel(...a as []),
    suggestions: vi.fn(),
    sendChallenge: vi.fn(),
  },
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

import TeamChallengePanel from './TeamChallengePanel'

const row = (over: Partial<ChallengeRow> = {}): ChallengeRow => ({
  id: 55,
  from_team_id: 11,
  from_team_name: 'شاهین',
  to_team_id: 7,
  to_team_name: 'تیم ما',
  created_by: 3,
  created_by_name: 'کاپیتان شاهین',
  accepted_by: null,
  accepted_by_name: null,
  responded_at: null,
  message: 'جمعه عصر هماهنگ کنیم؟',
  response_note: null,
  proposed_date: '2026-10-23',
  proposed_time: '18:00:00',
  proposed_venue_id: 4,
  proposed_venue_name: 'سالن مرکزی',
  status: 'pending',
  expires_at: '2026-10-23T18:00:00+00:00',
  created_at: '2026-10-16T10:00:00+00:00',
  direction: 'inbox',
  ...over,
})

function renderPanel(canRespond = true) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <TeamChallengePanel teamId={7} canRespond={canRespond} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  challenges.mockResolvedValue({ team_id: 7, items: [row()], total: 1 })
  accept.mockResolvedValue(row({ status: 'accepted' }))
  decline.mockResolvedValue(row({ status: 'declined' }))
  cancel.mockResolvedValue(row({ status: 'cancelled' }))
})

describe('TeamChallengePanel', () => {
  it('opens on the pending inbox with the API filter keys', async () => {
    renderPanel()
    await screen.findByTestId('challenge-card-55')
    expect(challenges).toHaveBeenCalledWith({ team_id: 7, direction: 'inbox', status: 'pending' })
  })

  it('switches direction and drops the status filter when the toggle is off', async () => {
    renderPanel()
    fireEvent.click(await screen.findByTestId('challenge-view-outbox'))
    await waitFor(() => expect(challenges).toHaveBeenLastCalledWith({ team_id: 7, direction: 'outbox', status: 'pending' }))
    fireEvent.click(screen.getByTestId('challenge-filter-pending'))
    await waitFor(() => expect(challenges).toHaveBeenLastCalledWith({ team_id: 7, direction: 'outbox', status: undefined }))
  })

  it('accepts an incoming challenge without any extra dialog', async () => {
    renderPanel()
    fireEvent.click(await screen.findByTestId('challenge-accept-55'))
    await waitFor(() => expect(accept).toHaveBeenCalledWith(55, undefined))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('چالش «شاهین» پذیرفته شد.'))
  })

  it('collects a reason when declining and sends it as the response note', async () => {
    renderPanel()
    fireEvent.click(await screen.findByTestId('challenge-decline-open-55'))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/دلیل/), { target: { value: 'آن هفته میزبان هستیم' } })
    fireEvent.click(within(dialog).getByTestId('challenge-decline-confirm'))
    await waitFor(() => expect(decline).toHaveBeenCalledWith(55, 'آن هفته میزبان هستیم'))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('چالش «شاهین» رد شد.'))
  })

  it('keeps the pull-back action only on outgoing challenges', async () => {
    challenges.mockResolvedValue({ team_id: 7, items: [row({ direction: 'outbox' })], total: 1 })
    renderPanel()
    fireEvent.click(await screen.findByTestId('challenge-view-outbox'))
    const card = await screen.findByTestId('challenge-card-55')
    expect(within(card).getByTestId('challenge-cancel-55')).toBeInTheDocument()
    expect(within(card).queryByTestId('challenge-accept-55')).toBeNull()
    fireEvent.click(within(card).getByTestId('challenge-cancel-55'))
    await waitFor(() => expect(cancel).toHaveBeenCalledWith(55))
  })

  it('shows no respond/pull-back control to a plain member', async () => {
    renderPanel(false)
    const card = await screen.findByTestId('challenge-card-55')
    expect(within(card).queryByTestId('challenge-accept-55')).toBeNull()
    expect(within(card).queryByTestId('challenge-decline-open-55')).toBeNull()
    expect(screen.getByText(/فقط کاپیتان و مدیران می‌توانند/)).toBeInTheDocument()
  })

  it('renders an answered challenge as history with the response note', async () => {
    challenges.mockResolvedValue({
      team_id: 7,
      items: [row({ status: 'declined', response_note: 'میزبان هستیم', expires_at: '2026-10-20T18:00:00+00:00' })],
      total: 1,
    })
    renderPanel()
    fireEvent.click(await screen.findByTestId('challenge-filter-pending'))
    const card = await screen.findByTestId('challenge-card-55')
    expect(within(card).getByText('رد شد')).toBeInTheDocument()
    expect(within(card).getByText('پاسخ: میزبان هستیم')).toBeInTheDocument()
    expect(within(card).queryByTestId('challenge-accept-55')).toBeNull()
  })

  it('warns that accepting does not create a booking', async () => {
    renderPanel()
    const card = await screen.findByTestId('challenge-card-55')
    expect(within(card).getByText('پذیرش رزرو نمی‌سازد؛ سالن را جدا رزرو کنید.')).toBeInTheDocument()
  })

  it('offers the matchmaking entry point when the history is empty', async () => {
    challenges.mockResolvedValue({ team_id: 7, items: [], total: 0 })
    renderPanel()
    fireEvent.click(await screen.findByTestId('challenge-filter-pending'))
    expect(await screen.findByText(/از بخش «حریف‌یابی»/)).toBeInTheDocument()
  })

  it('surfaces the 410 expired sentence from the server', async () => {
    accept.mockRejectedValue({
      isAxiosError: true,
      response: { status: 410, data: { detail: { code: 'CHALLENGE_EXPIRED', message: 'مهلت تمام شد' } } },
    })
    renderPanel()
    fireEvent.click(await screen.findByTestId('challenge-accept-55'))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(expect.stringContaining('مهلت پاسخ به این چالش تمام شده است')))
  })
})
