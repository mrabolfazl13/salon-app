// src/pages/manager/shifts/ManagerShifts.test.tsx
// نمای هفتگی شیفت (P020): سلول‌ها باید روزِ درستِ دیوارِ تهران را بگیرند (بدون
// تبدیل منطقهٔ زمانی)، دامنهٔ سالن فقط کد staff.manage را نشان دهد، و تعارض/خطای
// بک‌اند با متن فارسی خودش به کاربر برسد.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const list = vi.fn()
const create = vi.fn()
const update = vi.fn()
const cancel = vi.fn()
const exportCsv = vi.fn()

vi.mock('@/services/shift', () => ({
  shiftService: {
    list: (...a: unknown[]) => list(...a as []),
    create: (...a: unknown[]) => create(...a as []),
    update: (...a: unknown[]) => update(...a as []),
    cancel: (...a: unknown[]) => cancel(...a as []),
    exportCsv: (...a: unknown[]) => exportCsv(...a as []),
    summary: vi.fn(),
  },
}))

const listStaff = vi.fn()
vi.mock('@/services/staff', () => ({
  staffService: { listStaff: (...a: unknown[]) => listStaff(...a as []) },
}))

const managedVenues: {
  data: ManagedVenue[]
  isPending: boolean
  isError: boolean
  error: unknown
  refetch: () => void
} = { data: [], isPending: false, isError: false, error: null, refetch: vi.fn() }
vi.mock('@/hooks/useStaffMe', () => ({ useManagedVenues: () => managedVenues }))

// Layout نوار ناوبری + روتر می‌آورد؛ تست فقط محتوای صفحه را می‌خواهد
vi.mock('@/components/layout/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('react-hot-toast', () => ({
  default: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

import ManagerShifts from './ManagerShifts'
import type { ManagedVenue } from '@/hooks/useStaffMe'
import type { ShiftRow } from '@/types/shift'
import type { StaffRow } from '@/services/staff'

// ─── همان ریاضیِ شنبه‌محور صفحه، برای ساختن testid روزها ───
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (s: string, n: number) => {
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  return iso(dt)
}
const weekIndexOf = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return (new Date(y, m - 1, d).getDay() + 1) % 7
}
const today = iso(new Date())
const weekStart = addDays(today, -weekIndexOf(today))
const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

const person = (over: Partial<StaffRow> = {}): StaffRow => ({
  id: 1,
  venue_id: 4,
  user_id: 12,
  user_name: 'سارا',
  user_phone: '09121110001',
  position: 'reception',
  permissions: ['staff.manage'],
  is_custom_permissions: false,
  is_active: true,
  created_by: null,
  created_at: null,
  removed_at: null,
  ...over,
})

const shift = (over: Partial<ShiftRow> = {}): ShiftRow => ({
  id: 1,
  venue_id: 4,
  user_id: 12,
  user_name: 'سارا',
  position: 'reception',
  starts_at: `${days[0]}T08:00:00+03:30`,
  ends_at: `${days[0]}T16:00:00+03:30`,
  duration_min: 480,
  status: 'scheduled',
  notes: null,
  created_by: 2,
  ...over,
})

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ManagerShifts />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  managedVenues.data = [{ id: 4, name: 'سالن مرکزی', permissions: null }]
  managedVenues.isPending = false
  managedVenues.isError = false
  managedVenues.error = null
  listStaff.mockResolvedValue([person()])
  list.mockResolvedValue({ total: 1, items: [shift()] })
  create.mockResolvedValue(shift({ id: 77 }))
  update.mockResolvedValue(shift({ id: 1, status: 'done' }))
  cancel.mockResolvedValue(shift({ id: 1, status: 'cancelled' }))
  exportCsv.mockResolvedValue(new Blob(['x'], { type: 'text/csv' }))
  // downloadBlob یک <a download> می‌سازد؛ ناوبری jsdom لازم نیست
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:shifts'), configurable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true })
})

describe('ManagerShifts', () => {
  it('puts the shift on the Tehran wall-clock day, not the UTC one', async () => {
    // 00:30 تهران = 21:00 روز قبل در UTC؛ تبدیل با toISOString()/getHours() چیپ را
    // به روز کناری می‌انداخت — اینجا دقیقاً همان حالت بررسی می‌شود.
    list.mockResolvedValue({
      total: 1,
      items: [shift({ starts_at: `${days[6]}T00:30:00+03:30`, ends_at: `${days[6]}T08:30:00+03:30` })],
    })
    renderPage()
    const cell = await screen.findByTestId(`shift-cell-12-${days[6]}`)
    expect(within(cell).getByTestId('shift-chip-1')).toHaveTextContent('۰۰:۳۰')
    expect(within(screen.getByTestId(`shift-cell-12-${days[5]}`)).queryByTestId('shift-chip-1')).toBeNull()
  })

  it('asks the shifts of the active venue over the visible week', async () => {
    renderPage()
    await screen.findByTestId('shift-week-grid')
    expect(list).toHaveBeenCalledWith(4, { from: `${weekStart}T00:00:00`, to: `${addDays(weekStart, 7)}T00:00:00` })

    fireEvent.click(screen.getByTestId('shift-next-week'))
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(4, {
      from: `${addDays(weekStart, 7)}T00:00:00`,
      to: `${addDays(weekStart, 14)}T00:00:00`,
    }))
  })

  it('hides venues without the staff.manage code', async () => {
    managedVenues.data = [
      { id: 4, name: 'سالن مرکزی', permissions: null },
      { id: 5, name: 'سالن جنوب', permissions: ['booking.view'] },
    ]
    renderPage()
    await screen.findByTestId('shift-venue-4')
    expect(screen.queryByTestId('shift-venue-5')).toBeNull()
  })

  it('creates a shift from the week cell with the naive Tehran timestamp', async () => {
    list.mockResolvedValue({ total: 0, items: [] })
    renderPage()
    fireEvent.click(await screen.findByTestId(`shift-add-12-${days[2]}`))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByTestId('shift-save'))
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    expect(create.mock.calls[0][0]).toMatchObject({
      venue_id: 4,
      user_id: 12,
      starts_at: `${days[2]}T08:00:00`,
      ends_at: `${days[2]}T16:00:00`,
      notes: null,
    })
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('شیفت ثبت شد'))
  })

  it('refuses a shorter-than-15-minute shift before calling the API', async () => {
    renderPage()
    fireEvent.click(await screen.findByTestId(`shift-add-12-${days[0]}`))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('پایان'), { target: { value: '08:10' } })
    fireEvent.click(within(dialog).getByTestId('shift-save'))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(expect.stringContaining('۱۵ دقیقه')))
    expect(create).not.toHaveBeenCalled()
  })

  it('shows the backend conflict sentence when the overlap is rejected', async () => {
    create.mockRejectedValue({
      response: { status: 400, data: { detail: 'تعارض شیفت: این فرد در شیفت #۳ (۱۴۰۴-۰۷-۲۶ ۰۸:۰۰ تا ۱۶:۰۰) حضور دارد.' } },
    })
    renderPage()
    fireEvent.click(await screen.findByTestId(`shift-add-12-${days[0]}`))
    fireEvent.click(within(screen.getByRole('dialog')).getByTestId('shift-save'))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(expect.stringContaining('تعارض شیفت')))
  })

  it('cancels an existing shift from the edit dialog', async () => {
    renderPage()
    fireEvent.click(await screen.findByTestId('shift-chip-1'))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('ویرایش شیفت')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByTestId('shift-cancel-action'))
    await waitFor(() => expect(cancel).toHaveBeenCalledWith(1))
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('شیفت لغو شد'))
  })

  it('downloads the monthly csv for the month in the picker', async () => {
    renderPage()
    await screen.findByTestId('shift-week-grid')
    fireEvent.click(screen.getByTestId('shift-export'))
    await waitFor(() => expect(exportCsv).toHaveBeenCalledWith(4, today.slice(0, 7)))
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled())
  })

  it('keeps the summary KPIs off cancelled shifts', async () => {
    list.mockResolvedValue({
      total: 2,
      items: [shift(), shift({ id: 2, status: 'cancelled', duration_min: 480 })],
    })
    renderPage()
    expect(await screen.findByText('۸ ساعت')).toBeInTheDocument()
    expect(screen.getByText('۲ شیفت ثبت‌شده')).toBeInTheDocument()
  })

  it('reports the friendly empty state when no active staff exists', async () => {
    listStaff.mockResolvedValue([person({ is_active: false })])
    renderPage()
    expect(await screen.findByText('کاری برای شیفت دادن نیست')).toBeInTheDocument()
  })

  it('separates a 403 on the venue scope from a transport error', async () => {
    managedVenues.isError = true
    managedVenues.error = { isAxiosError: true, response: { status: 403 }, message: 'forbidden' }
    renderPage()
    expect(await screen.findByText('دسترسی ندارید')).toBeInTheDocument()

    managedVenues.error = { isAxiosError: true, response: { status: 500 }, message: 'boom' }
    renderPage()
    expect(await screen.findByText('خطا در دریافت سالن‌ها')).toBeInTheDocument()
  })

  it('surfaces the shift-list error text instead of an empty grid', async () => {
    list.mockRejectedValue({ response: { status: 400, data: { detail: 'بازهٔ زمانی نامعتبر است.' } } })
    renderPage()
    expect(await screen.findByText('بازهٔ زمانی نامعتبر است.')).toBeInTheDocument()
    expect(screen.queryByTestId('shift-week-grid')).toBeNull()
  })
})
