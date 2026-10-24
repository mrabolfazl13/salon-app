// src/components/finance/VenueComparisonPanel.test.tsx
// C6/P007 — دو قانونی که این تست‌ها باید بشکنند اگر پنل نقض کند:
// ۱) هیچ عددی محلی ساخته نمی‌شود (rank/share/net_change/اشغال همگی از سرور) و
// ۲) «دادهٔ نبود» با صفر یکی نمی‌شود — سالنی که رزرو ندارد میانگینش «—» است.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import type { VenueComparisonResponse, VenueComparisonRow } from '@/services/finance'
import { formatPct, formatRial } from '@/components/finance/shared'
import { toJalaliDisplay } from '@/lib/jalali'

const getVenueComparison = vi.fn()

vi.mock('@/services/finance', () => ({
  financeService: {
    getVenueComparison: (...a: unknown[]) => getVenueComparison(...a as [object]),
  },
}))

/** hookهای مالی queryKey/enabled را به userId گره می‌زنند — بدون کاربرِ setشده،
 *  query هرگز فعال نمی‌شود و این تست‌ها بی‌دلیل قرمز می‌مانند */
vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector?: (s: { user: { id: number } }) => unknown) =>
    selector ? selector({ user: { id: 9 } }) : { user: { id: 9 } },
}))

import VenueComparisonPanel from './VenueComparisonPanel'

const row = (over: Partial<VenueComparisonRow> = {}): VenueComparisonRow => ({
  venue_id: 7,
  venue_name: 'سالن مرکزی',
  income: 1_000_000,
  expense: 200_000,
  net: 800_000,
  prev_net: 400_000,
  net_change: 400_000,
  share_pct: 66.7,
  transactions: 4,
  bookings: 3,
  cancelled: 1,
  cancel_rate: 25,
  booking_revenue: 900_000,
  avg_per_booking: 300_000,
  customers: 2,
  total_active_slots: 4,
  occupied_slots: 3,
  occupancy_rate: 75,
  rank: 1,
  ...over,
})

const response = (rows: VenueComparisonRow[]): VenueComparisonResponse => ({
  from_date: '2026-05-05',
  to_date: '2026-05-11',
  prev_from_date: '2026-04-28',
  prev_to_date: '2026-05-04',
  venue_ids: [7, 8],
  rows,
  totals: {
    venues: rows.length,
    income: rows.reduce((s, r) => s + r.income, 0),
    expense: rows.reduce((s, r) => s + r.expense, 0),
    net: rows.reduce((s, r) => s + r.net, 0),
    transactions: rows.reduce((s, r) => s + r.transactions, 0),
    bookings: rows.reduce((s, r) => s + r.bookings, 0),
    cancelled: rows.reduce((s, r) => s + r.cancelled, 0),
    total_active_slots: rows.reduce((s, r) => s + r.total_active_slots, 0),
    occupied_slots: rows.reduce((s, r) => s + r.occupied_slots, 0),
    occupancy_rate: 60,
  },
})

const SCOPE: { venue_id?: number; from?: string; to?: string } = {
  venue_id: undefined,
  from: '2026-05-05',
  to: '2026-05-11',
}

/** پیش‌فرض jsdom موبایل است (matches:false)؛ برای مسیر دسکتاپ matchMedia را جمع می‌کنیم */
function setDesktop(on: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: on && query.includes('600px'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

function renderPanel(scope = SCOPE) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <VenueComparisonPanel scope={scope} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  getVenueComparison.mockReset()
  setDesktop(false)
})

describe('VenueComparisonPanel — خواندن از سرور', () => {
  it('asks for exactly the scope the dashboard filter holds', async () => {
    getVenueComparison.mockResolvedValue(response([row()]))
    renderPanel()
    await waitFor(() => expect(getVenueComparison).toHaveBeenCalled())
    expect(getVenueComparison).toHaveBeenCalledWith({ from: '2026-05-05', to: '2026-05-11' })
  })

  it('keeps venue_id when the manager narrowed the report to one hall', async () => {
    getVenueComparison.mockResolvedValue(response([row()]))
    renderPanel({ venue_id: 7, from: '2026-05-05', to: '2026-05-11' })
    await waitFor(() => expect(getVenueComparison).toHaveBeenCalledWith({ venue_id: 7, from: '2026-05-05', to: '2026-05-11' }))
  })

  it('prints the server rank, net and share without recomputing them', async () => {
    getVenueComparison.mockResolvedValue(
      response([row(), row({ venue_id: 8, venue_name: 'سالن شمال', net: 150_000, net_change: -50_000, share_pct: 33.3, rank: 2 })]),
    )
    renderPanel()
    expect(await screen.findByTestId('rank-7')).toHaveTextContent('۱')
    expect(screen.getByTestId('rank-8')).toHaveTextContent('۲')
    expect(screen.getByTestId('venue-card-7')).toHaveTextContent(formatRial(800_000))
    expect(screen.getByTestId('venue-card-8')).toHaveTextContent(formatRial(150_000))
    expect(screen.getAllByTestId('share-bar')[0]).toHaveTextContent(formatPct(66.7))
    expect(screen.getByTestId('comparison-venues')).toHaveTextContent('۲ سالن')
  })

  it('shows the domain totals and the previous window it compared against', async () => {
    getVenueComparison.mockResolvedValue(response([row()]))
    renderPanel()
    await screen.findByTestId('net-7')
    expect(screen.getByText(`خالص دامنه: ${formatRial(800_000)}`)).toBeInTheDocument()
    // بازهٔ نمایش‌داده‌شده باید از payload سرور بیاید، نه از from/to جاری
    expect(screen.getByText(new RegExp(toJalaliDisplay('2026-04-28')))).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(toJalaliDisplay('2026-05-05')))).toBeNull()
  })

  it('marks a fall against the previous window with ▼', async () => {
    getVenueComparison.mockResolvedValue(response([row({ net_change: -120_000 })]))
    renderPanel()
    expect(await screen.findByText(`▼ ${formatRial(120_000)}`)).toBeInTheDocument()
  })
})

describe('VenueComparisonPanel — نبود داده ≠ صفر', () => {
  it('renders «—» for a venue with no paid booking, not ۰ ریال', async () => {
    getVenueComparison.mockResolvedValue(
      response([row(), row({ venue_id: 9, venue_name: 'سالن تازه', bookings: 0, cancelled: 0, cancel_rate: 0, avg_per_booking: null, net: 0, net_change: 0, share_pct: 0, rank: 2 })]),
    )
    renderPanel()
    expect(await screen.findByTestId('avg-9')).toHaveTextContent('—')
    expect(screen.getByTestId('avg-7')).toHaveTextContent(formatRial(300_000))
  })

  it('names a venue the ledger never labelled from its id, not an empty cell', async () => {
    getVenueComparison.mockResolvedValue(response([row({ venue_name: null })]))
    renderPanel()
    expect(await screen.findByTestId('venue-card-7')).toHaveTextContent('سالن #۷')
  })

  it('has an empty state when the scope holds no venue', async () => {
    getVenueComparison.mockResolvedValue(response([]))
    renderPanel()
    expect(await screen.findByText('سالنی در این دامنه نیست')).toBeInTheDocument()
  })
})

describe('VenueComparisonPanel — وضعیت‌های خطا', () => {
  it('surfaces a failed fetch with a retry that asks again', async () => {
    getVenueComparison.mockRejectedValue(new Error('boom'))
    renderPanel()
    expect(await screen.findByText('خطا در دریافت مقایسهٔ سالن‌ها')).toBeInTheDocument()
    const calls = getVenueComparison.mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: /تلاش دوباره/ }))
    await waitFor(() => expect(getVenueComparison.mock.calls.length).toBeGreaterThan(calls))
  })
})

describe('VenueComparisonPanel — جدول دسکتاپ', () => {
  it('renders one accessible table row per venue with occupancy denominator', async () => {
    setDesktop(true)
    getVenueComparison.mockResolvedValue(response([row(), row({ venue_id: 8, venue_name: 'سالن شمال', rank: 2 })]))
    renderPanel()
    const table = await screen.findByRole('table', { name: 'مقایسهٔ سالن‌ها' })
    expect(table).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(3) // سرستون + دو سالن
    expect(table.textContent).toContain('۳/۴ سانس')
    expect(table.textContent).toContain('لغو ۲۵٪')
  })
})
