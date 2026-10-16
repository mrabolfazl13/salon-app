// src/pages/tournaments/Tournaments.test.tsx
// فهرست تورنمنت‌ها: اکشن‌های چرخهٔ حیات فقط برای برگزارکننده (یا super_admin) دیده
// می‌شود و قرعه‌کشی با کمتر از دو تیم غیرفعال است — همان گیت‌هایی که بک‌اند با
// ۴۰۳/۴۰۰ اعمال می‌کند؛ UI نباید کاربر را به سمت خطا بفرستد.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const list = vi.fn()
const create = vi.fn()
const openRegistration = vi.fn()
const draw = vi.fn()
const cancel = vi.fn()
const navigate = vi.fn()

vi.mock('@/services/tournament', () => ({
  tournamentService: {
    list: (...a: unknown[]) => list(...a as []),
    create: (...a: unknown[]) => create(...a as []),
    openRegistration: (...a: unknown[]) => openRegistration(...a as []),
    draw: (...a: unknown[]) => draw(...a as []),
    cancel: (...a: unknown[]) => cancel(...a as []),
  },
}))

vi.mock('@/components/layout/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>()
  return { ...mod, useNavigate: () => navigate }
})

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

import TournamentsPage from './Tournaments'
import { useAuthStore } from '@/store/authStore'
import type { Tournament } from '@/types/tournament'

const tournament = (over: Partial<Tournament> = {}): Tournament => ({
  id: 1,
  name: 'جام زمستانه',
  description: null,
  sport: 'futsal',
  organizer_id: 7,
  organizer_name: 'میزبان',
  venue_id: null,
  status: 'draft',
  format: 'single_elimination',
  starts_at: '2026-11-01T18:00:00+03:30',
  entry_fee: 500000,
  drawn_at: null,
  completed_at: null,
  winner_team_id: null,
  winner_team_name: null,
  team_count: 0,
  ...over,
})

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <TournamentsPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ user: { id: 7, fullName: 'میزبان', phone: '09121110000', role: 'user', isVerified: true, isActive: true }, isAuthenticated: true })
  list.mockResolvedValue({ total: 1, items: [tournament()] })
  create.mockResolvedValue(tournament({ id: 2 }))
  openRegistration.mockResolvedValue(tournament({ status: 'registration' }))
  draw.mockResolvedValue({ tournament: tournament({ status: 'drawn' }), rounds: [], participants: [] })
  cancel.mockResolvedValue(tournament({ status: 'cancelled' }))
})

describe('Tournaments', () => {
  it('کارت هر تورنمنت با برچسب وضعیت و تعداد تیم می‌سازد و با کلیک باز می‌کند', async () => {
    list.mockResolvedValue({ total: 2, items: [tournament(), tournament({ id: 2, name: 'جام بهار', status: 'completed', team_count: 8, winner_team_name: 'پارس' })] })
    renderPage()
    const root = await screen.findByTestId('tournament-list')
    expect(within(root).getAllByTestId(/^tournament-card-/)).toHaveLength(2)
    expect(root).toHaveTextContent('۸ تیم')
    expect(root).toHaveTextContent('پارس')
    fireEvent.click(within(root).getByText('جام بهار'))
    expect(navigate).toHaveBeenCalledWith('/tournaments/2')
  })

  it('قرعه‌کشی را فقط روی دو تیم یا بیشتر فعال می‌کند', async () => {
    list.mockResolvedValue({ total: 1, items: [tournament({ status: 'registration', team_count: 1 })] })
    renderPage()
    const card = await screen.findByTestId('tournament-card-1')
    expect(within(card).getByRole('button', { name: 'قرعه‌کشی' })).toBeDisabled()
  })

  it('مهمان هیچ اکشن برگزارکننده‌ای نمی‌بیند', async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false })
    renderPage()
    const card = await screen.findByTestId('tournament-card-1')
    expect(within(card).queryByRole('button', { name: 'بازکردن ثبت‌نام' })).not.toBeInTheDocument()
    expect(within(card).queryByLabelText('لغو تورنمنت')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tournament-new')).not.toBeInTheDocument()
  })

  it('super_admin تورنمنت دیگران را هم مدیریت می‌کند', async () => {
    useAuthStore.setState({ user: { id: 99, fullName: 'سرپرست', phone: '09129990000', role: 'super_admin', isVerified: true, isActive: true } })
    list.mockResolvedValue({ total: 1, items: [tournament({ organizer_id: 7 })] })
    renderPage()
    const card = await screen.findByTestId('tournament-card-1')
    fireEvent.click(within(card).getByRole('button', { name: 'بازکردن ثبت‌نام' }))
    await waitFor(() => expect(openRegistration).toHaveBeenCalledWith(1))
  })

  it('با نام کوتاه تورنمنت نمی‌سازد و با نام درست payload کامل می‌فرستد', async () => {
    renderPage()
    fireEvent.click(await screen.findByTestId('tournament-new'))
    const dialog = await screen.findByTestId('tournament-create-dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'ساخت تورنمنت' }))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(expect.stringContaining('حداقل')))
    expect(create).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByLabelText('نام تورنمنت'), { target: { value: 'جام قدس' } })
    // فیلد ورودی فقط رقم ASCII نگه می‌دارد ⇒ حرف‌های اضافه باید حذف شوند
    fireEvent.change(within(dialog).getByLabelText('ورودی هر تیم (ریال)'), { target: { value: 'abc40000' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'ساخت تورنمنت' }))
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    expect(create.mock.calls[0][0]).toMatchObject({ name: 'جام قدس', entry_fee: 40000, description: null })
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
  })

  it('پیام خطای فهرست را فارسی نشان می‌دهد', async () => {
    list.mockRejectedValue({ isAxiosError: true, response: { status: 403, data: { detail: 'دسترسی ندارید.' } } })
    renderPage()
    expect(await screen.findByText(/دریافت فهرست تورنمنت‌ها ممکن نشد/)).toBeInTheDocument()
  })
})
