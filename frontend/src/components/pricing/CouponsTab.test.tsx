// src/components/pricing/CouponsTab.test.tsx
// دو قولی که این صفحه باید بشکند اگر سرور برنگردد:
// ۱) «مصرف‌ها» ردیف‌های مصرفِ همان کد را از سرور می‌خواهد و نام/شماره/مبلغِ تخفیف را
//    نشان می‌دهد (گرهٔ C13.3.2 — تا راند ۲۵ این ردیف‌ها نوشته می‌شدند ولی هیچ‌جا خوانده
//    نمی‌شدند)، و
// ۲) «خالی = نامحدود» در فیلد سقف هر کاربر واقعاً null به سرور می‌رود (گرهٔ C21.2 —
//    پیش از این راند، برچسب دروغ می‌گفت چون سرور None را رد می‌کرد).

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import type { Coupon } from '@/services/coupons'

const list = vi.fn()
const update = vi.fn()
const create = vi.fn()
const disable = vi.fn()
const redemptions = vi.fn()

vi.mock('@/services/coupons', () => ({
  couponService: {
    list: (...a: unknown[]) => list(...(a as [])),
    create: (...a: unknown[]) => create(...(a as [])),
    update: (...a: unknown[]) => update(...(a as [])),
    disable: (...a: unknown[]) => disable(...(a as [])),
    redemptions: (...a: unknown[]) => redemptions(...(a as [])),
  },
}))

const toastSuccess = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: { success: (m: string) => toastSuccess(m), error: vi.fn() },
}))

import CouponsTab from './CouponsTab'

const coupon = (over: Partial<Coupon> = {}): Coupon => ({
  id: 41,
  code: 'NOUROZ',
  venue_id: 3,
  discount_type: 'percent',
  value: 2000,
  max_uses: 5,
  uses_count: 2,
  per_user_limit: 1,
  min_booking_amount: null,
  valid_from: null,
  valid_until: null,
  is_active: true,
  created_by: 7,
  ...over,
})

const redemption = (over: Partial<import('@/services/coupons').CouponRedemption> = {}) => ({
  id: 900,
  coupon_id: 41,
  user_id: 12,
  user_phone: '09351234567',
  user_full_name: 'مشتری یکم',
  booking_id: null,
  amount_discounted: 50000,
  status: 'ACTIVE' as const,
  released_at: null,
  created_at: '2026-10-07T10:20:00Z',
  ...over,
})

function renderTab() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <CouponsTab venues={[{ id: 3, name: 'سالن مرکزی' }]} venueId={3} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  list.mockReset().mockResolvedValue([coupon()])
  create.mockReset().mockResolvedValue(coupon())
  update.mockReset().mockResolvedValue(coupon())
  disable.mockReset().mockResolvedValue({ id: 41 })
  redemptions.mockReset().mockResolvedValue([redemption(), redemption({ id: 901, user_full_name: 'مشتری دوم', booking_id: 55, user_phone: '09359876543' })])
  toastSuccess.mockReset()
})

describe('CouponsTab — فهرست مصرف کد (C13.3.2)', () => {
  it('asks the server for the redemptions of the coupon the manager opened', async () => {
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: 'مصرف‌ها' }))
    await waitFor(() => expect(redemptions).toHaveBeenCalledWith(41))
  })

  it('shows who used the code, with the discount he got', async () => {
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: 'مصرف‌ها' }))
    expect(await screen.findByText('مشتری یکم')).toBeInTheDocument()
    expect(screen.getByText('مشتری دوم')).toBeInTheDocument()
    expect(screen.getByText('09351234567')).toBeInTheDocument()
    expect(screen.getAllByText('۵۰٬۰۰۰ ریال').length).toBe(2)
    // ردیفِ به رزرو وصل‌شده و ردیفِ معلق یکی نمی‌شوند
    expect(screen.getByText('در انتظار تأیید')).toBeInTheDocument()
    expect(screen.getByText(/رزرو ۵۵/)).toBeInTheDocument()
  })

  it('sums the discount of the listed redemptions', async () => {
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: 'مصرف‌ها' }))
    expect(await screen.findByText(/مجموع تخفیفِ مصرف‌های زنده: ۱۰۰٬۰۰۰ ریال/)).toBeInTheDocument()
  })

  it('ردیفِ لغوشده را از تاریخچه حذف نمی‌کند؛ برچسبش می‌کند', async () => {
    redemptions.mockResolvedValue([
      redemption(),
      redemption({
        id: 902, user_full_name: 'مشتری سوم', user_phone: '09351112233',
        status: 'RELEASED', released_at: '2026-10-08T09:00:00Z', booking_id: 77,
      }),
    ])
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: 'مصرف‌ها' }))
    expect(await screen.findByText('مشتری سوم')).toBeInTheDocument()
    expect(screen.getByText('لغوشده')).toBeInTheDocument()
    // ردیف ناپدید نشده ⇒ هر دو مبلغ در جدول‌اند
    expect(screen.getAllByText('۵۰٬۰۰۰ ریال').length).toBe(2)
    expect(screen.getByText(/رزرو ۷۷/)).toBeInTheDocument()
  })

  it('مجموعِ تخفیف فقط ردیف‌های زنده را می‌شمارد', async () => {
    redemptions.mockResolvedValue([
      redemption(),
      redemption({ id: 903, status: 'RELEASED', released_at: '2026-10-08T09:00:00Z' }),
    ])
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: 'مصرف‌ها' }))
    expect(await screen.findByText(/مجموع تخفیفِ مصرف‌های زنده: ۵۰٬۰۰۰ ریال · ۱ مورد لغو شده/))
      .toBeInTheDocument()
  })

  it('توضیح پایینِ جدول دیگر «ردیفش از این فهرست می‌رود» نیست', async () => {
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: 'مصرف‌ها' }))
    expect(await screen.findByText(/با برچسب\s*«لغوشده» در همین تاریخچه می‌ماند/)).toBeInTheDocument()
    expect(screen.queryByText(/ردیفش از این فهرست می‌رود/)).not.toBeInTheDocument()
  })

  it('says so when nobody used the code yet', async () => {
    redemptions.mockResolvedValue([])
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: 'مصرف‌ها' }))
    expect(await screen.findByText('هنوز کسی این کد را مصرف نکرده است')).toBeInTheDocument()
  })

  it('surfaces the server Persian message when the manager is not allowed to read it', async () => {
    redemptions.mockRejectedValue({ response: { data: { detail: 'فهرست مصرف کد تخفیف سراسری فقط برای سرپرست سیستم است' } } })
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: 'مصرف‌ها' }))
    expect(await screen.findByText(/فقط برای سرپرست سیستم است/)).toBeInTheDocument()
  })

  it('does not call the server before a coupon is opened', async () => {
    renderTab()
    await screen.findByRole('button', { name: 'مصرف‌ها' })
    expect(redemptions).not.toHaveBeenCalled()
  })
})

describe('CouponsTab — «خالی = نامحدود» واقعاً null می‌رود (C21.2)', () => {
  it('sends null when the per-user ceiling is cleared', async () => {
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /ویرایش/ }))
    const field = await screen.findByLabelText(/سقف هر کاربر/)
    fireEvent.change(field, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره تغییرات' }))
    await waitFor(() => expect(update).toHaveBeenCalled())
    const [couponId, payload] = update.mock.calls[0]
    expect(couponId).toBe(41)
    expect(payload.per_user_limit).toBeNull()
  })

  it('keeps the value the manager left untouched', async () => {
    renderTab()
    fireEvent.click(await screen.findByRole('button', { name: /ویرایش/ }))
    await screen.findByLabelText(/سقف هر کاربر/)
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره تغییرات' }))
    await waitFor(() => expect(update).toHaveBeenCalled())
    const [, payload] = update.mock.calls[0]
    expect(payload.per_user_limit).toBe(1)
    expect(payload.max_uses).toBe(5)
  })
})
