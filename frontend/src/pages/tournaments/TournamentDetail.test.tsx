// src/pages/tournaments/TournamentDetail.test.tsx
// براکت باید از پاسخ /tournaments/{id}/bracket ساخته شود و پیشروی برنده را به سرویس
// بسپارد (نه محاسبهٔ محلی). گیت برگزارکننده هم همین‌جا تست می‌شود: کاربر معمولی هیچ
// دکمهٔ نتیجه/قرعه‌کشی/لغو نمی‌بیند، چون بک‌اند روی همان‌ها ۴۰۳ می‌دهد.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const bracket = vi.fn()
const standings = vi.fn()
const openRegistration = vi.fn()
const draw = vi.fn()
const cancel = vi.fn()
const registerTeam = vi.fn()
const withdrawTeam = vi.fn()
const setResult = vi.fn()
const getMyTeams = vi.fn()

vi.mock('@/services/tournament', () => ({
  tournamentService: {
    bracket: (...a: unknown[]) => bracket(...a as []),
    standings: (...a: unknown[]) => standings(...a as []),
    openRegistration: (...a: unknown[]) => openRegistration(...a as []),
    draw: (...a: unknown[]) => draw(...a as []),
    cancel: (...a: unknown[]) => cancel(...a as []),
    registerTeam: (...a: unknown[]) => registerTeam(...a as []),
    withdrawTeam: (...a: unknown[]) => withdrawTeam(...a as []),
    setResult: (...a: unknown[]) => setResult(...a as []),
  },
}))

vi.mock('@/services/team', () => ({
  teamService: { getMyTeams: () => getMyTeams() },
}))

vi.mock('@/components/layout/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

const navigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>()
  return { ...mod, useNavigate: () => navigate, useParams: () => ({ id: '1' }) }
})

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

import TournamentDetailPage from './TournamentDetail'
import { useAuthStore } from '@/store/authStore'
import type { Tournament, TournamentBracket, TournamentMatch } from '@/types/tournament'
import type { Team } from '@/types/team'

const match = (over: Partial<TournamentMatch>): TournamentMatch => ({
  id: 201,
  round_id: 101,
  position: 1,
  team_a_id: 11,
  team_a_name: 'پارس',
  team_b_id: 12,
  team_b_name: 'سپید',
  score_a: 3,
  score_b: 1,
  status: 'final',
  winner_team_id: 11,
  next_match_id: 301,
  next_slot: 'a',
  ...over,
})

const tournament = (over: Partial<Tournament> = {}): Tournament => ({
  id: 1,
  name: 'جام زمستانه',
  description: null,
  sport: 'futsal',
  organizer_id: 7,
  organizer_name: 'میزبان',
  venue_id: 4,
  status: 'in_progress',
  format: 'single_elimination',
  starts_at: '2026-11-01T18:00:00+03:30',
  entry_fee: 500000,
  drawn_at: '2026-10-30T18:00:00+03:30',
  completed_at: null,
  winner_team_id: null,
  winner_team_name: null,
  team_count: 4,
  ...over,
})

const drawnBracket = (rounds: TournamentBracket['rounds'], participants: TournamentBracket['participants']) => ({
  tournament: tournament(),
  rounds,
  participants,
})

const fourTeams = [
  { team_id: 11, team_name: 'پارس', seed: 1, status: 'registered' as const },
  { team_id: 12, team_name: 'سپید', seed: 4, status: 'registered' as const },
  { team_id: 13, team_name: 'آرش', seed: 2, status: 'registered' as const },
  { team_id: 14, team_name: 'کاووش', seed: 3, status: 'registered' as const },
]

const team = (over: Partial<Team> & Pick<Team, 'id' | 'name'>): Team =>
  ({
    sport: 'futsal',
    visibility: 'private',
    captain_id: 3,
    is_active: true,
    member_count: 5,
    quota: 12,
    is_official: false,
    official_since: null,
    created_at: '2026-01-01T00:00:00+00:00',
    updated_at: '2026-01-01T00:00:00+00:00',
    my_role: 'captain',
    my_status: 'active',
    has_open_join_request: false,
    has_pending_invitation: false,
    ...over,
  }) as Team

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <TournamentDetailPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ user: { id: 7, fullName: 'میزبان', phone: '09121110000', role: 'user', isVerified: true, isActive: true }, isAuthenticated: true })
  standings.mockResolvedValue({ items: [] })
  getMyTeams.mockResolvedValue([team({ id: 13, name: 'آرش' })])
  openRegistration.mockResolvedValue(tournament({ status: 'registration' }))
  draw.mockResolvedValue(drawnBracket([], fourTeams))
  cancel.mockResolvedValue(tournament({ status: 'cancelled' }))
  registerTeam.mockResolvedValue({ participant_id: 41, team_id: 13, team_name: 'آرش', seed: null })
  withdrawTeam.mockResolvedValue({ participant_id: 41, status: 'withdrawn' })
  setResult.mockResolvedValue(match({ status: 'final', score_a: 3, score_b: 1, winner_team_id: 11 }))
})

describe('TournamentDetail — براکت', () => {
  it('ستون‌ها را به ترتیب مرحله و فقط برای دیدار آماده دکمهٔ نتیجه می‌گذارد', async () => {
    bracket.mockResolvedValue(drawnBracket(
      [
        { id: 101, number: 1, name: 'نیمه‌نهایی', matches: [match({ id: 201 }), match({ id: 202, position: 2, team_a_id: 13, team_a_name: 'آرش', team_b_id: 14, team_b_name: 'کاووش', score_a: null, score_b: null, status: 'ready', winner_team_id: null })] },
        { id: 102, number: 2, name: 'نهایی', matches: [match({ id: 301, round_id: 102, position: 1, team_b_id: null, team_b_name: null, score_a: null, score_b: null, status: 'pending', winner_team_id: null, next_match_id: null, next_slot: null })] },
      ],
      fourTeams,
    ))
    renderPage()
    const root = await screen.findByTestId('tournament-bracket')
    // «نهایی» زیررشتهٔ «نیمه‌نهایی» است ⇒ ترتیب با ستون‌ها سنجیده می‌شود، نه با indexOf
    const columns = Array.from(root.children) as HTMLElement[]
    expect(columns).toHaveLength(2)
    expect(columns[0].textContent?.startsWith('نیمه‌نهایی')).toBe(true)
    expect(columns[1].textContent?.startsWith('نهایی')).toBe(true)
    expect(within(root).getAllByTestId(/^bracket-match-/)).toHaveLength(3)
    expect(within(root).getByTestId('bracket-match-301')).toHaveTextContent('در انتظار تیم')
    const readyButtons = within(root).getAllByRole('button', { name: 'ثبت نتیجه' })
    expect(readyButtons).toHaveLength(1)
  })

  it('نتیجه را به سرویس می‌فرستد و از تساوی جلو می‌گیرد (بدون فراخوان سرویس)', async () => {
    bracket.mockResolvedValue(drawnBracket(
      [{ id: 101, number: 1, name: 'نیمه‌نهایی', matches: [match({ id: 202, team_a_id: 13, team_a_name: 'آرش', team_b_id: 14, team_b_name: 'کاووش', score_a: null, score_b: null, status: 'ready', winner_team_id: null })] }],
      fourTeams,
    ))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'ثبت نتیجه' }))
    const dialog = await screen.findByTestId('tournament-result-dialog')
    const inputs = within(dialog).getAllByLabelText('گل')
    fireEvent.change(inputs[0], { target: { value: '2' } })
    fireEvent.change(inputs[1], { target: { value: '2' } })
    fireEvent.click(within(dialog).getByTestId('tournament-result-submit'))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(expect.stringContaining('مساوی')))
    expect(setResult).not.toHaveBeenCalled()

    fireEvent.change(inputs[1], { target: { value: '1' } })
    fireEvent.click(within(dialog).getByTestId('tournament-result-submit'))
    await waitFor(() => expect(setResult).toHaveBeenCalledWith(202, 2, 1))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
  })

  it('کاربر غیربرگزارکننده هیچ دکمهٔ مدیریتی نمی‌بیند', async () => {
    useAuthStore.setState({ user: { id: 3, fullName: 'مهمان', phone: '09122220000', role: 'user', isVerified: true, isActive: true } })
    bracket.mockResolvedValue(drawnBracket(
      [{ id: 101, number: 1, name: 'نیمه‌نهایی', matches: [match({ id: 202, status: 'ready', score_a: null, score_b: null, winner_team_id: null })] }],
      fourTeams,
    ))
    renderPage()
    await screen.findByTestId('tournament-bracket')
    expect(screen.queryByRole('button', { name: 'ثبت نتیجه' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('tournament-cancel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tournament-draw')).not.toBeInTheDocument()
  })

  it('پس از اتمام، رده‌بندی نهایی را از سرویس می‌خواند', async () => {
    standings.mockResolvedValue({ items: [
      { rank: 1, team_id: 11, team_name: 'پارس', label: 'قهرمان' },
      { rank: 2, team_id: 13, team_name: 'آرش', label: 'نایب‌قهرمان' },
      { rank: 3, team_id: 12, team_name: 'سپید', label: 'نیمه‌نهایی' },
      { rank: 3, team_id: 14, team_name: 'کاووش', label: 'نیمه‌نهایی' },
    ] })
    bracket.mockResolvedValue({
      tournament: tournament({ status: 'completed', winner_team_id: 11, winner_team_name: 'پارس', completed_at: '2026-11-02T20:00:00+03:30' }),
      rounds: [{ id: 101, number: 1, name: 'نیمه‌نهایی', matches: [match({ id: 201 })] }],
      participants: fourTeams,
    })
    renderPage()
    const table = await screen.findByTestId('tournament-standings')
    await waitFor(() => expect(standings).toHaveBeenCalledWith(1))
    expect(within(table).getAllByRole('row')).toHaveLength(5)
    expect(table).toHaveTextContent('نایب‌قهرمان')
    expect(screen.getByTestId('tournament-kpis')).toHaveTextContent('پارس')
  })
})

describe('TournamentDetail — ثبت‌نام و قرعه‌کشی', () => {
  it('در پیش‌نویس ثبت‌نام را باز می‌کند و فهرست تیم‌ها را پیش از قرعه‌کشی نشان می‌دهد', async () => {
    bracket.mockResolvedValue({ tournament: tournament({ status: 'draft', team_count: 2 }), rounds: [], participants: fourTeams.slice(0, 2) })
    renderPage()
    fireEvent.click(await screen.findByTestId('tournament-open'))
    await waitFor(() => expect(openRegistration).toHaveBeenCalledWith(1))
    const table = await screen.findByTestId('tournament-participants')
    expect(table).toHaveTextContent('سپید')
    expect(screen.queryByTestId('tournament-bracket')).not.toBeInTheDocument()
  })

  it('با کمتر از دو تیم قرعه‌کشی غیرفعال است', async () => {
    bracket.mockResolvedValue({ tournament: tournament({ status: 'registration', team_count: 1 }), rounds: [], participants: fourTeams.slice(0, 1) })
    renderPage()
    expect(await screen.findByTestId('tournament-draw')).toBeDisabled()
  })

  it('فقط تیم‌های کاپیتانِ ثبت‌نشده را در دیالوگ ثبت تیم می‌گذارد', async () => {
    getMyTeams.mockResolvedValue([team({ id: 13, name: 'آرش' }), team({ id: 11, name: 'پارس' }), team({ id: 99, name: 'دیگران', my_role: 'member' })])
    bracket.mockResolvedValue({ tournament: tournament({ status: 'registration', team_count: 2 }), rounds: [], participants: fourTeams.slice(0, 2) })
    renderPage()
    fireEvent.click(await screen.findByTestId('tournament-register'))
    const dialog = await screen.findByTestId('tournament-register-dialog')
    // لیبلِ TextFieldِ select به input مخفی اشاره می‌کند و MUI منو را با mouseDown باز می‌کند
    fireEvent.mouseDown(within(dialog).getByRole('combobox'))
    const options = await screen.findAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual(['آرش'])
    fireEvent.click(options[0])
    fireEvent.click(within(dialog).getByRole('button', { name: /ثبت تیم/ }))
    await waitFor(() => expect(registerTeam).toHaveBeenCalledWith(1, 13, null))
  })

  it('خطای سرویس را با پیام فارسی روی صفحه می‌آورد', async () => {
    bracket.mockRejectedValue({ isAxiosError: true, response: { status: 404, data: { detail: 'تورنمنت یافت نشد.' } } })
    renderPage()
    expect(await screen.findByText(/دریافت تورنمنت ممکن نشد/)).toBeInTheDocument()
  })
})
