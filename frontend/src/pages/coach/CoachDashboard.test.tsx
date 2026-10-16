// src/pages/coach/CoachDashboard.test.tsx
// پنل مربی باید اعداد داشبورد را از سرویس بگیرد و نوشتن‌ها را با payload درست بفرستد.
// نقش‌گیت ۴۰۳ هم همین‌جا پوشش داده می‌شود: پیام فارسی بک‌اند باید روی صفحه خوانده شود.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const getDashboard = vi.fn()
const listSessions = vi.fn()
const getClients = vi.fn()
const setAttendance = vi.fn()
const setSettled = vi.fn()
const createSession = vi.fn()

vi.mock('@/services/coach', () => ({
  coachService: {
    getDashboard: () => getDashboard(),
    listSessions: (...a: unknown[]) => listSessions(...a as []),
    getClients: () => getClients(),
    setAttendance: (...a: unknown[]) => setAttendance(...a as []),
    setSettled: (...a: unknown[]) => setSettled(...a as []),
    createSession: (...a: unknown[]) => createSession(...a as []),
  },
}))

// Layout نوار ناوبری + روتر می‌آورد؛ تست فقط محتوای صفحه را می‌خواهد
vi.mock('@/components/layout/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

import CoachDashboard from './CoachDashboard'
import type { CoachSession } from '@/types/coach'

const session = (over: Partial<CoachSession> = {}): CoachSession => ({
  id: 1,
  coach_id: 7,
  coach_name: 'مربی',
  client_id: 3,
  client_name: 'شاگرد اول',
  client_phone: '09121110000',
  venue_id: null,
  slot_id: null,
  starts_at: '2026-10-16T15:00:00+00:00',
  ends_at: '2026-10-16T16:00:00+00:00',
  duration_min: 60,
  status: 'scheduled',
  fee: 150000,
  fee_settled: false,
  notes: null,
  attended_at: null,
  ...over,
})

const dashboardFixture = {
  today: [session()],
  upcoming: [session({ id: 2, starts_at: '2026-10-20T15:00:00+00:00', ends_at: '2026-10-20T16:00:00+00:00' })],
  today_count: 1,
  month_sessions: 4,
  month_revenue: 600000,
  month_outstanding: 150000,
  active_clients: 3,
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <CoachDashboard />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getDashboard.mockResolvedValue(dashboardFixture)
  listSessions.mockResolvedValue({ total: 1, items: [session()] })
  getClients.mockResolvedValue({ items: [{ user_id: 3, full_name: 'شاگرد اول', phone: '09121110000', sessions: 2, last_session_at: null, fee_total: 300000 }] })
  setAttendance.mockResolvedValue(session({ status: 'attended' }))
  setSettled.mockResolvedValue(session({ status: 'attended', fee_settled: true }))
  createSession.mockResolvedValue(session({ id: 5 }))
})

describe('CoachDashboard', () => {
  it('renders KPI figures taken from the dashboard payload', async () => {
    renderPage()
    expect(await screen.findByText('۶۰۰٬۰۰۰ ریال')).toBeInTheDocument()
    expect(screen.getByText('۱۵۰٬۰۰۰ ریال')).toBeInTheDocument()
    expect(screen.getByText(/۳ شاگرد فعال/)).toBeInTheDocument()
  })

  it('lists today and upcoming sessions with client names', async () => {
    renderPage()
    const today = await screen.findByTestId('coach-today')
    expect(today).toHaveTextContent('شاگرد اول')
    expect(screen.getByTestId('coach-upcoming')).toBeInTheDocument()
  })

  it('sends the tapped attendance status to the service', async () => {
    renderPage()
    const card = within(await screen.findByTestId('coach-today')).getByTestId('coach-session-1')
    fireEvent.click(card.querySelector('[aria-label="ثبت حضور"]')!)
    await waitFor(() => expect(setAttendance).toHaveBeenCalledWith(1, 'attended'))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
  })

  it('settles only attended sessions and shows the button when unpaid', async () => {
    getDashboard.mockResolvedValue({ ...dashboardFixture, today: [session({ status: 'attended' })] })
    renderPage()
    const card = within(await screen.findByTestId('coach-today')).getByTestId('coach-session-1')
    fireEvent.click(card.querySelector('button.MuiButton-root')!)
    await waitFor(() => expect(setSettled).toHaveBeenCalledWith(1, true))
  })

  it('refetches the history with the chosen status filter', async () => {
    renderPage()
    await screen.findByTestId('coach-history')
    const group = screen.getByTestId('coach-status-filter')
    fireEvent.click(group.querySelectorAll('button')[2])
    await waitFor(() =>
      expect(listSessions).toHaveBeenCalledWith(expect.objectContaining({ status: 'attended' })),
    )
  })

  it('creates a session only with a valid client phone', async () => {
    renderPage()
    fireEvent.click(await screen.findByTestId('coach-new-session'))
    const dialog = await screen.findByTestId('coach-session-dialog')
    const submit = within(dialog).getByRole('button', { name: /ثبت جلسه/ })
    fireEvent.click(submit)
    await waitFor(() => expect(toastError).toHaveBeenCalled())
    expect(createSession).not.toHaveBeenCalled()

    const phoneInput = within(dialog).getByLabelText(/شماره شاگرد/)
    fireEvent.change(phoneInput, { target: { value: '09121110000' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /ثبت جلسه/ }))
    await waitFor(() => expect(createSession).toHaveBeenCalledTimes(1))
    expect(createSession.mock.calls[0][0]).toMatchObject({
      client_phone: '09121110000',
      duration_min: 60,
    })
  })

  it('surfaces the backend 403 text when the account is not a coach', async () => {
    getDashboard.mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: { detail: 'این بخش فقط برای حساب‌های با نقش مربی فعال است.' } },
    })
    renderPage()
    expect(await screen.findByText(/این بخش فقط برای حساب‌های با نقش مربی/)).toBeInTheDocument()
  })
})
