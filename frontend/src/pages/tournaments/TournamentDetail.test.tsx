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
import type { Tournament, TournamentBracket, TournamentMatch, TournamentRound } from '@/types/tournament'
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

  it('۴۰۴ را با حالت خالیِ «پیدا نشد» نشان می‌دهد، نه خطای عمومی', async () => {
    bracket.mockRejectedValue({ isAxiosError: true, response: { status: 404, data: { detail: 'تورنمنت یافت نشد.' } } })
    renderPage()
    expect(await screen.findByText(/این تورنمنت پیدا نشد/)).toBeInTheDocument()
  })

  it('خطای سرویس (غیر ۴۰۴) را با پیام فارسی و دکمهٔ تلاش دوباره می‌آورد', async () => {
    bracket.mockRejectedValue({ isAxiosError: true, response: { status: 500 } })
    renderPage()
    expect(await screen.findByText(/دریافت تورنمنت ممکن نشد/)).toBeInTheDocument()
  })
})

describe('TournamentDetail — لیگ (همه با همه)', () => {
  const league = (over: Partial<Tournament> = {}) => tournament({ format: 'round_robin', ...over })

  const leagueRound = (id: number, number: number, matches: TournamentMatch[], bye?: { id: number; name: string }) => ({
    id,
    number,
    name: `هفته ${number}`,
    matches,
    bye_team_id: bye?.id ?? null,
    bye_team_name: bye?.name ?? null,
  })

  it('هفته‌ها را با تیمِ استراحت‌کرده رندر می‌کند، نه با عنوان «براکت»', async () => {
    bracket.mockResolvedValue({
      tournament: league(),
      rounds: [
        leagueRound(201, 1, [match({ id: 301, round_id: 201, status: 'final' }),
                             match({ id: 302, round_id: 201, position: 2, team_a_id: 13, team_a_name: 'آرش', team_b_id: 14, team_b_name: 'کاووش', score_a: 2, score_b: 0, winner_team_id: 13 })]),
        leagueRound(202, 2, [match({ id: 303, round_id: 202, status: 'ready', score_a: null, score_b: null, winner_team_id: null })], { id: 14, name: 'کاووش' }),
      ],
      participants: fourTeams,
    })
    renderPage()
    const root = await screen.findByTestId('tournament-bracket')
    const columns = Array.from(root.children) as HTMLElement[]
    expect(columns).toHaveLength(2)
    expect(columns[0].textContent).toContain('هفته 1')
    expect(screen.getByText('برنامهٔ هفته‌ها')).toBeInTheDocument()
    expect(screen.getByTestId('tournament-bye-202')).toHaveTextContent('کاووش استراحت می‌کند')
    expect(screen.queryByTestId('tournament-bye-201')).not.toBeInTheDocument()
  })

  it('تساوی در لیگ نتیجهٔ واقعی است و به سرویس می‌رود', async () => {
    bracket.mockResolvedValue({
      tournament: league(),
      rounds: [leagueRound(201, 1, [match({ id: 301, round_id: 201, status: 'ready', score_a: null, score_b: null, winner_team_id: null })])],
      participants: fourTeams,
    })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'ثبت نتیجه' }))
    const dialog = await screen.findByTestId('tournament-result-dialog')
    expect(dialog).toHaveTextContent('تساوی مجاز است')
    const inputs = within(dialog).getAllByLabelText('گل')
    fireEvent.change(inputs[0], { target: { value: '2' } })
    fireEvent.change(inputs[1], { target: { value: '2' } })
    fireEvent.click(within(dialog).getByTestId('tournament-result-submit'))
    await waitFor(() => expect(setResult).toHaveBeenCalledWith(301, 2, 2))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining('جدول لیگ')))
    expect(toastError).not.toHaveBeenCalled()
  })

  it('جدول امتیازها را وسطِ راه می‌خواند و رتبهٔ مشترک را پلی‌آف اعلام می‌کند', async () => {
    bracket.mockResolvedValue({
      tournament: league({ status: 'in_progress' }),
      rounds: [leagueRound(201, 1, [match({ id: 301, round_id: 201, status: 'final' })])],
      participants: fourTeams,
    })
    standings.mockResolvedValue({ items: [
      { rank: 1, team_id: 11, team_name: 'پارس', played: 2, won: 1, drawn: 1, lost: 0,
        goals_for: 4, goals_against: 2, goal_difference: 2, points: 4, tied: true },
      { rank: 1, team_id: 13, team_name: 'آرش', played: 2, won: 1, drawn: 1, lost: 0,
        goals_for: 4, goals_against: 2, goal_difference: 2, points: 4, tied: true },
      { rank: 3, team_id: 12, team_name: 'سپید', played: 2, won: 0, drawn: 1, lost: 1,
        goals_for: 2, goals_against: 5, goal_difference: -3, points: 1, tied: false },
    ] })
    renderPage()
    await screen.findByTestId('league-row-11')
    const table = screen.getByTestId('tournament-standings')
    await waitFor(() => expect(standings).toHaveBeenCalledWith(1))
    expect(within(table).getAllByRole('row')).toHaveLength(4)
    expect(table).toHaveTextContent('امتیاز')
    expect(within(table).getByRole('row', { name: /پارس/ })).toHaveTextContent('۴')
    expect(await screen.findByTestId('league-tie-note')).toHaveTextContent('پلی‌آف')
    // رتبهٔ ۱ دوتایی ⇒ قهرمانی ساخته نمی‌شود، حتی اگر جدول باز باشد
    expect(screen.getByTestId('tournament-kpis')).toHaveTextContent('مشترک')
  })

  it('صدر جدولِ یک‌دانه را نشان می‌دهد و پلی‌آف نمی‌خواهد', async () => {
    bracket.mockResolvedValue({
      tournament: league({ status: 'in_progress' }),
      rounds: [leagueRound(201, 1, [match({ id: 301, round_id: 201, status: 'final' })])],
      participants: fourTeams,
    })
    standings.mockResolvedValue({ items: [
      { rank: 1, team_id: 11, team_name: 'پارس', played: 2, won: 2, drawn: 0, lost: 0,
        goals_for: 6, goals_against: 1, goal_difference: 5, points: 6, tied: false },
      { rank: 2, team_id: 13, team_name: 'آرش', played: 2, won: 1, drawn: 0, lost: 1,
        goals_for: 3, goals_against: 4, goal_difference: -1, points: 3, tied: false },
    ] })
    renderPage()
    // جدول پیش از رسیدن داده هم سرستون دارد ⇒ باید منتظر ردیف واقعی ماند
    await screen.findByTestId('league-row-11')
    expect(screen.getByTestId('tournament-kpis')).toHaveTextContent('پارس')
    expect(screen.queryByTestId('league-tie-note')).not.toBeInTheDocument()
  })

  it('رده‌بندی حذفی پیش از تمام‌شدن تورنمنت خوانده نمی‌شود', async () => {
    bracket.mockResolvedValue({
      tournament: tournament({ status: 'in_progress' }),
      rounds: [{ id: 101, number: 1, name: 'نیمه‌نهایی', matches: [match({ id: 201 })] }],
      participants: fourTeams,
    })
    renderPage()
    await screen.findByTestId('tournament-bracket')
    expect(standings).not.toHaveBeenCalled()
    expect(screen.queryByTestId('tournament-standings')).not.toBeInTheDocument()
  })
})

describe('TournamentDetail — دو-حذفی', () => {
  const de = (over: Partial<Tournament> = {}) => tournament({ format: 'double_elimination', ...over })

  // چهار تیم ⇒ براکتِ برندگان ۳ دیدار، براکتِ بازندگان ۲ دیدار، فینالِ بزرگ ۱ دیدار
  const deRounds = (): TournamentRound[] => ([
    { id: 101, number: 1, name: 'برندگان ۱', bracket: 'winners' as const, matches: [
      match({ id: 201, round_id: 101, status: 'ready', score_a: null, score_b: null, winner_team_id: null }),
      match({ id: 202, round_id: 101, position: 2, team_a_id: 13, team_a_name: 'آرش', team_b_id: 14,
              team_b_name: 'کاووش', status: 'ready', score_a: null, score_b: null, winner_team_id: null }),
    ] },
    { id: 102, number: 2, name: 'بازندگان ۱', bracket: 'losers' as const, matches: [
      match({ id: 203, round_id: 102, team_a_id: 11, team_a_name: 'پارس', team_b_id: 13, team_b_name: 'آرش',
              status: 'ready', score_a: null, score_b: null, winner_team_id: null,
              loser_next_match_id: 204, loser_next_slot: 'b' }),
    ] },
    { id: 103, number: 3, name: 'فینالِ بازندگان', bracket: 'losers' as const, matches: [
      match({ id: 204, round_id: 103, status: 'pending', score_a: null, score_b: null, winner_team_id: null }),
    ] },
    { id: 104, number: 4, name: 'فینالِ بزرگ', bracket: 'grand_final' as const, matches: [
      match({ id: 205, round_id: 104, status: 'pending', score_a: null, score_b: null, winner_team_id: null,
              next_match_id: null, next_slot: null }),
    ] },
  ])

  const deBracket = (over: Partial<Tournament> = {}) => ({
    tournament: de(over),
    rounds: deRounds(),
    participants: fourTeams,
  })

  it('دو براکت جدا می‌دهد: برندگان+فینالِ بزرگ در ستون اصلی و بازندگان جدا', async () => {
    bracket.mockResolvedValue(deBracket())
    renderPage()
    const main = await screen.findByTestId('tournament-bracket')
    const mainColumns = Array.from(main.children) as HTMLElement[]
    expect(mainColumns).toHaveLength(2)
    expect(mainColumns[0].textContent).toContain('برندگان ۱')
    expect(mainColumns[1].textContent).toContain('فینالِ بزرگ')
    expect(within(main).getAllByTestId(/^bracket-match-/).map((n) => n.dataset.testid))
      .toEqual(['bracket-match-201', 'bracket-match-202', 'bracket-match-205'])

    const losers = await screen.findByTestId('tournament-losers-bracket')
    expect(Array.from(losers.children)).toHaveLength(2)
    expect(within(losers).getByTestId('bracket-match-203')).toBeInTheDocument()
    expect(losers).toHaveTextContent('بازندگان ۱')
    expect(screen.getByText('براکت برندگان و فینالِ بزرگ')).toBeInTheDocument()
    expect(screen.getByText('براکت بازندگان')).toBeInTheDocument()
  })

  it('قانونِ بدونِ bracket reset را صریح می‌نویسد', async () => {
    bracket.mockResolvedValue(deBracket())
    renderPage()
    const note = await screen.findByTestId('double-elim-note')
    expect(note).toHaveTextContent('دومین باخت')
    expect(note).toHaveTextContent('bracket reset')
    expect(note).toHaveTextContent('فینالِ بزرگ یک دیدار است')
  })

  it('دیدارِ نیمهٔ برندگان: بازنده فقط یک باخت دارد', async () => {
    bracket.mockResolvedValue(deBracket())
    renderPage()
    const winnersMatch = await screen.findByTestId('bracket-match-201')
    fireEvent.click(within(winnersMatch).getByRole('button', { name: 'ثبت نتیجه' }))
    const dialog = await screen.findByTestId('tournament-result-dialog')
    expect(dialog).toHaveTextContent('فقط یک باخت دارد')
    const inputs = within(dialog).getAllByLabelText('گل')
    fireEvent.change(inputs[0], { target: { value: '2' } })
    fireEvent.change(inputs[1], { target: { value: '1' } })
    fireEvent.click(within(dialog).getByTestId('tournament-result-submit'))
    await waitFor(() => expect(setResult).toHaveBeenCalledWith(201, 2, 1))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining('یک باخت گرفت')))
    expect(toastError).not.toHaveBeenCalled()
  })

  it('دیدارِ نیمهٔ بازندگان: باخت دوم یعنی حذف', async () => {
    bracket.mockResolvedValue(deBracket())
    renderPage()
    // دیالوگ باز شده نباید دو بار در یک تست باز شود: MUI روی محتوا aria-hidden می‌گذارد
    // و پرس‌وجوی دومِ نقشِ button را بی‌اثر می‌کند.
    fireEvent.click(within(await screen.findByTestId('bracket-match-203')).getByRole('button', { name: 'ثبت نتیجه' }))
    const dialog = await screen.findByTestId('tournament-result-dialog')
    expect(dialog).toHaveTextContent('دومین باختش')
    const inputs = within(dialog).getAllByLabelText('گل')
    fireEvent.change(inputs[0], { target: { value: '1' } })
    fireEvent.change(inputs[1], { target: { value: '0' } })
    fireEvent.click(within(dialog).getByTestId('tournament-result-submit'))
    await waitFor(() => expect(setResult).toHaveBeenCalledWith(203, 1, 0))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining('حذف شد')))
  })

  it('فینالِ بزرگ را قهرمانی اعلام می‌کند، نه پیشروی', async () => {
    bracket.mockResolvedValue({
      tournament: de({ status: 'in_progress' }),
      rounds: [
        { id: 102, number: 2, name: 'بازندگان ۱', bracket: 'losers' as const, matches: [
          match({ id: 203, round_id: 102, status: 'final', score_a: 2, score_b: 0, winner_team_id: 11,
                  loser_next_match_id: 205, loser_next_slot: 'b' }),
        ] },
        { id: 104, number: 4, name: 'فینالِ بزرگ', bracket: 'grand_final' as const, matches: [
          match({ id: 205, round_id: 104, team_b_id: 12, team_b_name: 'سپید', status: 'ready',
                  score_a: null, score_b: null, winner_team_id: null, next_match_id: null, next_slot: null }),
        ] },
      ],
      participants: fourTeams,
    })
    renderPage()
    const gf = await screen.findByTestId('bracket-match-205')
    fireEvent.click(within(gf).getByRole('button', { name: 'ثبت نتیجه' }))
    const dialog = await screen.findByTestId('tournament-result-dialog')
    expect(dialog).toHaveTextContent('برنده قهرمان می‌شود')
    const inputs = within(dialog).getAllByLabelText('گل')
    fireEvent.change(inputs[0], { target: { value: '3' } })
    fireEvent.change(inputs[1], { target: { value: '0' } })
    fireEvent.click(within(dialog).getByTestId('tournament-result-submit'))
    await waitFor(() => expect(setResult).toHaveBeenCalledWith(205, 3, 0))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining('قهرمان مشخص شد')))
    // ستون اصلی فینالِ بزرگ را دارد و نیمهٔ بازندگان جدا می‌ماند
    expect(await screen.findByTestId('tournament-bracket')).toHaveTextContent('فینالِ بزرگ')
    expect(screen.getByTestId('tournament-losers-bracket')).toHaveTextContent('بازندگان ۱')
  })

  it('با مساوی در هر دو نیمه جلو می‌گیرد', async () => {
    bracket.mockResolvedValue(deBracket())
    renderPage()
    fireEvent.click(within(await screen.findByTestId('bracket-match-203')).getByRole('button', { name: 'ثبت نتیجه' }))
    const dialog = await screen.findByTestId('tournament-result-dialog')
    const inputs = within(dialog).getAllByLabelText('گل')
    fireEvent.change(inputs[0], { target: { value: '1' } })
    fireEvent.change(inputs[1], { target: { value: '1' } })
    fireEvent.click(within(dialog).getByTestId('tournament-result-submit'))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(expect.stringContaining('مساوی')))
    expect(setResult).not.toHaveBeenCalled()
  })

  it('رده‌بندی سه‌رتبه‌ایِ دو-حذفی را در همان جدولِ حذفی نشان می‌دهد', async () => {
    standings.mockResolvedValue({ items: [
      { rank: 1, team_id: 11, team_name: 'پارس', label: 'قهرمان' },
      { rank: 2, team_id: 12, team_name: 'سپید', label: 'نایب‌قهرمان' },
      { rank: 3, team_id: 13, team_name: 'آرش', label: 'نهاییِ براکت بازندگان' },
    ] })
    bracket.mockResolvedValue(deBracket({
      status: 'completed', winner_team_id: 11, winner_team_name: 'پارس',
      completed_at: '2026-11-02T20:00:00+03:30',
    }))
    renderPage()
    const table = await screen.findByTestId('tournament-standings')
    await waitFor(() => expect(standings).toHaveBeenCalledWith(1))
    expect(within(table).getAllByRole('row')).toHaveLength(4)
    expect(table).toHaveTextContent('نهاییِ براکت بازندگان')
    expect(screen.getByTestId('tournament-kpis')).toHaveTextContent('پارس')
  })

  it('پیش از قرعه‌کشی تعداد دیدارهای دو-حذفی را می‌گوید', async () => {
    bracket.mockResolvedValue({ tournament: de({ status: 'registration', team_count: 4 }), rounds: [], participants: fourTeams })
    renderPage()
    const hint = await screen.findByTestId('double-elim-plan-hint')
    expect(hint).toHaveTextContent('۶ دیدار')
    expect(screen.getByTestId('tournament-draw')).toBeEnabled()
  })

  it('تک‌حذفی هیچ براکتِ بازندگانی نمی‌گیرد', async () => {
    bracket.mockResolvedValue({
      tournament: tournament(),
      rounds: [{ id: 101, number: 1, name: 'نیمه‌نهایی', matches: [match({ id: 201 })] }],
      participants: fourTeams,
    })
    renderPage()
    await screen.findByTestId('tournament-bracket')
    expect(screen.queryByTestId('tournament-losers-bracket')).not.toBeInTheDocument()
    expect(screen.queryByTestId('double-elim-note')).not.toBeInTheDocument()
  })
})
