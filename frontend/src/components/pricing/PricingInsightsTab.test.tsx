// src/components/pricing/PricingInsightsTab.test.tsx
// C5 — «تقاضا و پیشنهاد»: دو قانونی که این صفحه باید بشکند اگر اشتباه شود:
// ۱) «بدون داده» هرگز صفر٪ نشان داده نشود (برچسب —)، و
// ۲) پیشنهاد قیمت تا وقتی قانون ساخته نشده هیچ قیمتی را عوض نکند؛ دکمهٔ «اعمال»
//    فقط دیالوگ قانون را با پیش‌نویس باز می‌کند و payload را به همان مسیر سرور می‌دهد.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import type { OccupancyBucket, OccupancyReport, PriceSuggestion } from '@/services/pricing'
import { getTodayISO } from '@/lib/jalali'

const occupancy = vi.fn()
const suggestion = vi.fn()
const createRule = vi.fn()

vi.mock('@/services/pricing', () => ({
  pricingService: {
    occupancy: (...a: unknown[]) => occupancy(...a as [number, number?]),
    suggestion: (...a: unknown[]) => suggestion(...a as [object]),
    createRule: (...a: unknown[]) => createRule(...a as [object]),
    listRules: vi.fn(),
  },
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

import PricingInsightsTab from './PricingInsightsTab'

const bucket = (over: Partial<OccupancyBucket> = {}): OccupancyBucket => ({
  weekday: 0,
  hour: 18,
  label: 'دوشنبه ۱۸:۰۰',
  slots: 4,
  bookings: 4,
  occupancy: 100,
  avg_paid: 200000,
  ...over,
})

const report = (buckets: OccupancyBucket[]): OccupancyReport => ({
  venue_id: 3,
  days: 90,
  start_date: '2026-07-18',
  end_date: '2026-10-15',
  total_slots: 8,
  total_bookings: 4,
  overall_occupancy: 50,
  overall_avg_paid: 200000,
  buckets,
})

const sug = (over: Partial<PriceSuggestion> = {}): PriceSuggestion => ({
  venue_id: 3,
  slot_date: getTodayISO(),
  start_time: '18:00:00',
  weekday: 0,
  hour: 18,
  days: 90,
  duration: 90,
  base_price: 200000,
  engine_price: 200000,
  rules: [],
  floor_price: 140000,
  ceiling_price: 260000,
  recommended_price: 225000,
  applies: true,
  confidence: 'medium',
  delta_percent: 12.5,
  demand_gap: 50,
  bucket: bucket(),
  overall_occupancy: 50,
  reasons: ['اشغال این دسته ۱۰۰٪ است در برابر میانگین سالن ۵۰٪'],
  ...over,
})

function renderTab() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <PricingInsightsTab venues={[{ id: 3, name: 'سالن مرکزی' }]} venueId={3} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  occupancy.mockReset().mockResolvedValue(report([bucket(), bucket({ weekday: 1, hour: 10, bookings: 0, occupancy: null, avg_paid: null })]))
  suggestion.mockReset().mockResolvedValue(sug())
  createRule.mockReset().mockResolvedValue({ id: 9 })
  toastSuccess.mockReset()
  toastError.mockReset()
})

describe('PricingInsightsTab — نقشهٔ اشغال', () => {
  it('asks the server for the 90-day window of the selected venue', async () => {
    renderTab()
    await waitFor(() => expect(occupancy).toHaveBeenCalledWith(3, 90))
  })

  it('renders occupancy with persian digits plus bookings/slots denominator', async () => {
    renderTab()
    const cell = await screen.findByTestId('insight-cell-0-18')
    expect(cell.textContent).toContain('۱۰۰٪')
    expect(cell.textContent).toContain('۴/۴')
    expect(cell.getAttribute('aria-label')).toContain('۴ رزرو از ۴ سانس')
  })

  it('shows «—» instead of a misleading ۰٪ when the denominator is missing', async () => {
    renderTab()
    const cell = await screen.findByTestId('insight-cell-1-10')
    expect(cell.textContent).toContain('—')
    expect(cell.textContent).not.toContain('۰٪')
    expect(cell.getAttribute('aria-label')).toContain('اشغال —')
  })

  it('marks combinations with no slot at all as empty, not as zero demand', async () => {
    renderTab()
    const empty = await screen.findByTestId('insight-empty-4-18')
    expect(empty.textContent).toBe('—')
    expect(screen.queryByTestId('insight-cell-4-18')).toBeNull()
  })

  it('prints the venue-level averages from the server payload', async () => {
    renderTab()
    const chip = await screen.findByTestId('insight-overall')
    expect(chip.textContent).toContain('۵۰٪')
    expect(screen.getByText('۴ رزرو از ۸ سانس')).toBeInTheDocument()
  })

  it('refetches with the window the manager picks', async () => {
    renderTab()
    await screen.findByTestId('insight-cell-0-18')
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /پنجرهٔ تاریخچه/ }))
    fireEvent.click(await screen.findByRole('option', { name: '۳۰ روز اخیر' }))
    await waitFor(() => expect(occupancy).toHaveBeenLastCalledWith(3, 30))
  })

  it('shows an empty state when the window has no active slot', async () => {
    occupancy.mockResolvedValue(report([]))
    renderTab()
    expect(await screen.findByText('داده‌ای برای این بازه وجود ندارد')).toBeInTheDocument()
  })

  it('surfaces a failed occupancy fetch with retry', async () => {
    occupancy.mockRejectedValue(new Error('boom'))
    renderTab()
    expect(await screen.findByText('خطا در دریافت تحلیل تقاضا')).toBeInTheDocument()
  })
})

describe('PricingInsightsTab — پیشنهاد قیمت', () => {
  it('sends the HH:mm:ss time and window the server expects', async () => {
    renderTab()
    fireEvent.click(await screen.findByTestId('insight-run'))
    await waitFor(() =>
      expect(suggestion).toHaveBeenCalledWith({
        venue_id: 3,
        slot_date: getTodayISO(),
        start_time: '18:00:00',
        duration: 90,
        days: 90,
      }),
    )
  })

  it('renders engine price as the anchor and the safe band around it', async () => {
    renderTab()
    fireEvent.click(await screen.findByTestId('insight-run'))
    expect(await screen.findByTestId('suggestion-engine')).toHaveTextContent('۲۰۰٬۰۰۰')
    expect(screen.getByTestId('suggestion-recommended')).toHaveTextContent('۲۲۵٬۰۰۰')
    expect(screen.getByTestId('suggestion-band')).toHaveTextContent('۱۴۰٬۰۰۰ تا ۲۶۰٬۰۰۰')
    expect(screen.getByTestId('suggestion-delta')).toHaveTextContent('+۱۲٫۵٪')
    expect(screen.getByTestId('suggestion-confidence')).toHaveTextContent('اطمینان متوسط')
    expect(screen.getByTestId('suggestion-occupancy')).toHaveTextContent('۴/۴')
  })

  it('says «بدون داده» for the bucket label when history has none', async () => {
    suggestion.mockResolvedValue(sug({ bucket: null }))
    renderTab()
    fireEvent.click(await screen.findByTestId('insight-run'))
    expect(await screen.findByTestId('suggestion-occupancy')).toHaveTextContent('بدون داده')
  })

  it('hides the apply action when the server does not recommend a change', async () => {
    suggestion.mockResolvedValue(sug({ applies: false, recommended_price: 200000, delta_percent: 0 }))
    renderTab()
    fireEvent.click(await screen.findByTestId('insight-run'))
    await screen.findByTestId('suggestion-no-action')
    expect(screen.queryByTestId('suggestion-apply')).toBeNull()
  })

  it('applies through the existing rule path with an absolute prefill', async () => {
    renderTab()
    fireEvent.click(await screen.findByTestId('insight-run'))
    fireEvent.click(await screen.findByTestId('suggestion-apply'))

    const amount = screen.getByLabelText('مبلغ (ریال)') as HTMLInputElement
    expect(amount.value).toBe('225000')
    fireEvent.click(screen.getByRole('button', { name: 'افزودن قانون' }))

    await waitFor(() => expect(createRule).toHaveBeenCalled())
    const payload = createRule.mock.calls[0][0]
    expect(payload).toMatchObject({
      venue_id: 3,
      day_of_week: 0,
      modifier_type: 'absolute',
      value: 225000,
      start_time: '18:00',
      end_time: '19:00',
    })
    expect(payload.label).toContain('پیشنهاد تقاضا')
    expect(toastSuccess).toHaveBeenCalled()
  })

  it('clamps the prefill window when the hour is the last of the day', async () => {
    suggestion.mockResolvedValue(sug({ hour: 23, start_time: '23:00:00', weekday: 5 }))
    renderTab()
    fireEvent.click(await screen.findByTestId('insight-run'))
    fireEvent.click(await screen.findByTestId('suggestion-apply'))
    fireEvent.click(screen.getByRole('button', { name: 'افزودن قانون' }))
    await waitFor(() => expect(createRule).toHaveBeenCalled())
    expect(createRule.mock.calls[0][0]).toMatchObject({ day_of_week: 5, end_time: null })
  })

  it('reports a failed suggestion without inventing a number', async () => {
    suggestion.mockRejectedValue(new Error('x'))
    renderTab()
    fireEvent.click(await screen.findByTestId('insight-run'))
    await waitFor(() => expect(toastError).toHaveBeenCalled())
    expect(screen.queryByTestId('suggestion-recommended')).toBeNull()
  })

  it('requires a venue before it computes anything', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={qc}>
        <PricingInsightsTab venues={[]} venueId={null} />
      </QueryClientProvider>,
    )
    expect(await screen.findByRole('heading', { name: /تحلیل تقاضا/ })).toBeInTheDocument()
    expect(occupancy).not.toHaveBeenCalled()
  })
})
