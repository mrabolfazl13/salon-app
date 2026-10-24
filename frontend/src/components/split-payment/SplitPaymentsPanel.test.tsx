// src/components/split-payment/SplitPaymentsPanel.test.tsx
// پرداخت اشتراکی (P003): سه چیزی که امروز در UI غلط است —
// ۱) وضعیت PARTIAL (که بلافاصله پس از پرداختِ اولین سهم ساخته می‌شود) در
//    STATUS_LABELS/STATUS_COLORS نبود ⇒ چیپ خالی و bgcolor «undefined15»،
// ۲) هیچ راهی برای «پرداخت سهم من» وجود نداشت (سرویس آن را دارد، هیچ کامپوننتی
//    صدا نمی‌زند) ⇒ مسیر پول در وب بن‌جاست،
// ۳) مبلغ پرداخت‌شده/باقی‌مانده که سرور می‌فرستد هیچ‌جا نمایش داده نمی‌شد.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { useAuthStore } from '@/store/authStore'

const listByTeam = vi.fn()
const getById = vi.fn()
const payShare = vi.fn()
const cancel = vi.fn()

vi.mock('@/services/splitPayment', () => ({
  splitPaymentService: {
    listByTeam: (...a: unknown[]) => listByTeam(...(a as [])),
    getById: (...a: unknown[]) => getById(...(a as [])),
    payShare: (...a: unknown[]) => payShare(...(a as [])),
    cancel: (...a: unknown[]) => cancel(...(a as [])),
    create: vi.fn(),
  },
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: toastSuccess, error: toastError }),
}))

vi.mock('./SplitPaymentDialog', () => ({ default: () => null }))

import SplitPaymentsPanel from './SplitPaymentsPanel'
import { formatPrice } from '@/lib/utils'

/** پنل مبلغ‌ها را با قرارداد نمایشی پروژه (تومان) نشان می‌دهد، نه ارقام خام ریال */
const fmt = (n: number) => formatPrice(n)

const payment = (over: Record<string, unknown> = {}) => ({
  id: 41,
  team_id: 7,
  game_id: null,
  booking_id: null,
  amount: 100000,
  currency: 'IRR',
  method: 'EQUAL',
  status: 'PARTIAL',
  deadline: null,
  created_by: 1,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
  note: null,
  ...over,
})

const detail = (over: Record<string, unknown> = {}) => ({
  ...payment(),
  total_paid: 33400,
  remaining: 66600,
  shares: [
    { id: 501, split_payment_id: 41, user_id: 1, amount: 33400, percentage: null,
      status: 'PAID', paid_at: '2026-10-02T10:00:00Z', created_at: '2026-10-01T10:00:00Z', user_name: 'کاپیتان' },
    { id: 502, split_payment_id: 41, user_id: 2, amount: 33300, percentage: null,
      status: 'PENDING', paid_at: null, created_at: '2026-10-01T10:00:00Z', user_name: 'عضو دو' },
    { id: 503, split_payment_id: 41, user_id: 3, amount: 33300, percentage: null,
      status: 'PENDING', paid_at: null, created_at: '2026-10-01T10:00:00Z', user_name: 'عضو سه' },
  ],
  ...over,
})

const members = [
  { user_id: 1, full_name: 'کاپیتان', role: 'captain', status: 'active' },
  { user_id: 2, full_name: 'عضو دو', role: 'member', status: 'active' },
] as never

const team = { id: 7, name: 'تیم ما', sport: 'futsal' } as never

const renderPanel = () =>
  render(
    <SplitPaymentsPanel team={team} members={members} isManager={false} />
  )

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ user: { id: 2, fullName: 'عضو دو', phone: '09120000002',
    role: 'user', isVerified: true, isActive: true }, isAuthenticated: true })
  listByTeam.mockResolvedValue({ items: [payment()], total: 1 })
  getById.mockResolvedValue(detail())
})

describe('SplitPaymentsPanel — وضعیت‌ها', () => {
  it('وضعیت PARTIAL را با برچسب فارسی نشان می‌دهد (نه چیپ خالی)', async () => {
    renderPanel()
    const chip = await screen.findByText('نیمه‌پرداخت')
    expect(chip).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('undefined')
  })

  it('وضعیت EXPIRED هم برچسب و رنگ دارد', async () => {
    listByTeam.mockResolvedValue({ items: [payment({ status: 'EXPIRED' })], total: 1 })
    renderPanel()
    expect(await screen.findByText('مهلت گذشته')).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('undefined')
  })
})

describe('SplitPaymentsPanel — پرداخت سهم', () => {
  it('پیشرفت مالیِ پرداخت را از دادهٔ سرور نشان می‌دهد', async () => {
    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: /مشاهده جزئیات پرداخت #41/ }))
    expect(await screen.findByText(new RegExp(`${fmt(33400)}`))).toBeInTheDocument()
    expect(await screen.findByText(new RegExp(`${fmt(66600)}`))).toBeInTheDocument()
  })

  it('دکمهٔ «پرداخت سهم من» سهمِ خودِ کاربر را پرداخت و سپس جزئیات را تازه می‌کند', async () => {
    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: /مشاهده جزئیات پرداخت #41/ }))
    const btn = await screen.findByRole('button', { name: /پرداخت سهم من/ })
    payShare.mockResolvedValue({ ...detail().shares[1], status: 'PAID' })

    fireEvent.click(btn)

    await waitFor(() => expect(payShare).toHaveBeenCalledWith(41, 502, expect.anything()))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled())
    // جزئیات دوباره گرفته می‌شود تا باقی‌مانده و وضعیت تازه شود
    await waitFor(() => expect(getById).toHaveBeenCalledTimes(2))
  })

  it('سهمِ پرداخت‌شدهٔ خودِ کاربر دیگر دکمهٔ پرداخت ندارد', async () => {
    getById.mockResolvedValue(detail({
      status: 'COMPLETED',
      total_paid: 100000,
      remaining: 0,
      shares: detail().shares.map((s) => ({ ...s, status: 'PAID' })),
    }))
    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: /مشاهده جزئیات پرداخت #41/ }))
    expect(await screen.findAllByText('پرداخت‌شده')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: /پرداخت سهم من/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/باقی‌مانده/)).not.toBeInTheDocument()
  })

  it('خطای سرور را فارسی و در همان جای صفحه نشان می‌دهد', async () => {
    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: /مشاهده جزئیات پرداخت #41/ }))
    payShare.mockRejectedValue({ response: { data: { detail: 'سهم قبلاً پرداخت شده است' } } })

    fireEvent.click(await screen.findByRole('button', { name: /پرداخت سهم من/ }))

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('سهم قبلاً پرداخت شده است'))
  })
})

// راند ۲۶ (گرهٔ C11.6.2): سه برچسبِ CANCELLED/EXPIRED/OVERDUE تا پیش از این راند فقط در enum
// بودند و هیچ کدِ تولیدی نداشتند ⇒ sweepِ بک‌اند آن‌ها را می‌سازد و اینجا UI باید آن‌ها را
// نشان دهد؛ و لغوِ پرداختِ بی‌پول هم endpoint و دکمهٔ تأییددار شد.
describe('SplitPaymentsPanel — مهلت‌گذشتگی و لغو', () => {
  it('سهمِ OVERDUE را با برچسبِ خودش نشان می‌دهد (نه «در انتظار») و چیپِ والد EXPIRED را هم دارد', async () => {
    listByTeam.mockResolvedValue({ items: [payment({ status: 'EXPIRED' })], total: 1 })
    getById.mockResolvedValue(detail({
      status: 'EXPIRED',
      shares: detail().shares.map((s) => (s.status === 'PAID' ? s : { ...s, status: 'OVERDUE' })),
    }))
    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: /مشاهده جزئیات پرداخت #41/ }))
    expect(await screen.findAllByText('از مهلت گذشته')).toHaveLength(2)
    expect(document.body.textContent).not.toContain('undefined')
  })

  it('سازنده تا پیش از آمدنِ پول دکمهٔ لغو دارد و تأییدش سرور را صدا می‌زند و فهرست را تازه می‌کند', async () => {
    listByTeam.mockResolvedValue({ items: [payment({ status: 'PENDING', created_by: 2 })], total: 1 })
    getById.mockResolvedValue(detail({
      status: 'PENDING', created_by: 2, total_paid: 0, remaining: 100000,
      shares: detail().shares.map((s) => ({ ...s, status: 'PENDING', paid_at: null })),
    }))
    cancel.mockResolvedValue(payment({ status: 'CANCELLED', created_by: 2 }))

    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: /مشاهده جزئیات پرداخت #41/ }))
    fireEvent.click(await screen.findByRole('button', { name: /لغو این پرداخت/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'لغو پرداخت' }))

    await waitFor(() => expect(cancel).toHaveBeenCalledWith(41))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('پرداخت اشتراکی لغو شد'))
    await waitFor(() => expect(listByTeam).toHaveBeenCalledTimes(2))
  })

  it('عضوِ غیرسازنده دکمهٔ لغو نمی‌بیند', async () => {
    //BeforeEach: کاربر ۲، سازنده ۱ ⇒ فقط پرداختِ سهم، نه لغوِ کل
    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: /مشاهده جزئیات پرداخت #41/ }))
    expect(await screen.findByRole('button', { name: /پرداخت سهم من/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /لغو این پرداخت/ })).not.toBeInTheDocument()
  })

  it('وقتی پولی آمده دکمهٔ لغو پنهاست (سرور هم آن را رد می‌کند)', async () => {
    getById.mockResolvedValue(detail({ status: 'PARTIAL', created_by: 2 }))
    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: /مشاهده جزئیات پرداخت #41/ }))
    expect(await screen.findByText(new RegExp(fmt(33400)))).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /لغو این پرداخت/ })).not.toBeInTheDocument()
  })

  it('ردِ سرورِ لغو را فارسی در toast نشان می‌دهد و دیالوگ را نمی‌بندد', async () => {
    getById.mockResolvedValue(detail({ status: 'PENDING', created_by: 2, total_paid: 0 }))
    cancel.mockRejectedValue({
      response: { data: { detail: 'این پرداخت اشتراکی سهمِ پرداخت‌شده دارد؛ ابطالش بازگشت وجه می‌خواهد' } },
    })
    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: /مشاهده جزئیات پرداخت #41/ }))
    fireEvent.click(await screen.findByRole('button', { name: /لغو این پرداخت/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'لغو پرداخت' }))

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'این پرداخت اشتراکی سهمِ پرداخت‌شده دارد؛ ابطالش بازگشت وجه می‌خواهد'))
    expect(toastSuccess).not.toHaveBeenCalled()
    // دیالوگِ تأیید باز می‌ماند تا کاربر فرصت اصلاح داشته باشد (MUI آن را روی
    // دیالوگِ جزئیات می‌گذارد و دیالوگِ زیرین را aria-hidden می‌کند)
    expect(screen.getByText('لغو پرداخت اشتراکی')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'لغو پرداخت' })).toBeInTheDocument()
  })
})
