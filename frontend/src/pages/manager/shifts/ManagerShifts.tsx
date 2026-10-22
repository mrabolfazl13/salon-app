// frontend/src/pages/manager/shifts/ManagerShifts.tsx
// زمان‌بندی شیفت پرسنل (P020) — نمای هفتگی شنبه‌محور، فرمی (بدون drag&drop).
// داده فقط از /api/v1/shifts و /api/v1/staff می‌آید (بدون mock).
// چرا تاریخ‌ها از خود رشته خوانده می‌شوند: بک‌اند +03:30 برمی‌گرداند، پس برچسب
// روز/ساعت باید همان دیوارِ تهران باشد — تبدیل با getHours() روی دستگاهی خارج از
// ایران شیفت را به روز کناری می‌انداخت.

import React, { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import Layout from '@/components/layout/Layout'
import { EmptyState, Shimmer } from '@/components/mobile'
import {
  ErrorBox, KpiCard, downloadBlob, extractError,
} from '@/components/finance/shared'
import { POSITION_LABELS, isForbidden } from '@/components/crm/shared'
import { useManagedVenues } from '@/hooks/useStaffMe'
import { useQuery } from '@tanstack/react-query'
import { staffService, type StaffRow, type StaffPosition } from '@/services/staff'
import {
  useCancelShift, useCreateShift, useExportShifts, useShifts, useUpdateShift,
} from '@/hooks/useShifts'
import type { ShiftRow, ShiftStatus } from '@/types/shift'
import { formatJalaliDate, jalaliMonthNames, toJalali, toPersianDigits } from '@/lib/jalali'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/shadcn/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/shadcn/select'

export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  scheduled: 'برنامه‌ریزی‌شده',
  done: 'انجام‌شده',
  cancelled: 'لغوشده',
}

export const SHIFT_STATUS_COLORS: Record<ShiftStatus, string> = {
  scheduled: '#2563eb',
  done: '#16a34a',
  cancelled: '#6b7280',
}

const WEEKDAY_LABELS = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
const MIN_MIN = 15
const MAX_MIN = 720

const pad2 = (n: number) => String(n).padStart(2, '0')

/** 'YYYY-MM-DD' محلی — بدون پرش منطقهٔ زمانی (toISOString UTC می‌دهد) */
function isoDay(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function addDays(iso: string, days: number): string {
  const [y, m, dd] = iso.split('-').map(Number)
  const d = new Date(y, m - 1, dd)
  d.setDate(d.getDate() + days)
  return isoDay(d)
}

/** شنبه‌محور: Sat→0 … Fri→6 (خلافِ getDay که یکشنبه را صفر می‌گذارد) */
function weekIndexOf(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return (new Date(y, m - 1, d).getDay() + 1) % 7
}

function startOfWeek(iso: string): string {
  return addDays(iso, -weekIndexOf(iso))
}

function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

function minutesBetween(startHHMM: string, endHHMM: string): number {
  const [sh, sm] = startHHMM.split(':').map(Number)
  const [eh, em] = endHHMM.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

/** «۸ ساعت» — ساعت کاری در UI فارسی، دقیقه فقط در tooltip */
function hoursLabel(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h && m) return `${toPersianDigits(h)}س ${toPersianDigits(m)}د`
  if (h) return `${toPersianDigits(h)} ساعت`
  return `${toPersianDigits(m)} دقیقه`
}

function monthOf(iso: string): string {
  return iso.slice(0, 7)
}

const canManageVenue = (permissions: string[] | null) =>
  permissions === null || permissions.includes('staff.manage')

interface DialogState {
  user_id: number
  date: string
  start: string
  end: string
  notes: string
  /** نبود = شیفت جدید */
  id?: number
}

const ManagerShifts: React.FC = () => {
  const venuesQuery = useManagedVenues()
  const venues = useMemo(
    () => (venuesQuery.data ?? []).filter((v) => canManageVenue(v.permissions)),
    [venuesQuery.data],
  )
  const [venueId, setVenueId] = useState<number | null>(null)
  const activeVenue = venues.find((v) => v.id === venueId)?.id ?? venues[0]?.id ?? null

  const today = isoDay(new Date())
  const [weekStart, setWeekStart] = useState(startOfWeek(today))
  const days = useMemo(() => weekDays(weekStart), [weekStart])
  const weekEnd = addDays(weekStart, 7)

  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [exportMonth, setExportMonth] = useState(monthOf(today))
  // دوازده ماه اخیر با برچسب جلالی: `type="month"` بومی «October 2026» لاتین می‌ساخت
  const monthChoices = useMemo(() => {
    const [y, m] = monthOf(today).split('-').map(Number)
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(y, m - 1 - i, 1)
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const j = toJalali(`${value}-01`)
      return { value, label: j ? `${jalaliMonthNames[j.jm - 1]} ${toPersianDigits(j.jy)}` : value }
    })
  }, [today])

  const staffQuery = useQuery({
    queryKey: ['staff', 'for-shifts', activeVenue],
    queryFn: () => staffService.listStaff(activeVenue as number),
    enabled: activeVenue !== null,
  })
  const roster = useMemo(
    () => (staffQuery.data ?? []).filter((r: StaffRow) => r.is_active),
    [staffQuery.data],
  )

  const shiftsQuery = useShifts(activeVenue, { from: `${weekStart}T00:00:00`, to: `${weekEnd}T00:00:00` })
  const createShift = useCreateShift()
  const updateShift = useUpdateShift()
  const cancelShift = useCancelShift()
  const exportShifts = useExportShifts()

  const shifts = shiftsQuery.data?.items ?? []
  const byCell = useMemo(() => {
    const map = new Map<string, ShiftRow[]>()
    for (const s of shifts) {
      const key = `${s.user_id}|${s.starts_at.slice(0, 10)}`
      const list = map.get(key)
      if (list) list.push(s)
      else map.set(key, [s])
    }
    return map
  }, [shifts])

  const weekMinutes = shifts
    .filter((s) => s.status !== 'cancelled')
    .reduce((sum, s) => sum + s.duration_min, 0)

  const openNew = (user_id: number, date: string) =>
    setDialog({ user_id, date, start: '08:00', end: '16:00', notes: '' })
  const openEdit = (s: ShiftRow) => setDialog({
    id: s.id,
    user_id: s.user_id,
    date: s.starts_at.slice(0, 10),
    start: s.starts_at.slice(11, 16),
    end: s.ends_at.slice(11, 16),
    notes: s.notes ?? '',
  })
  const closeDialog = () => setDialog(null)

  const submit = () => {
    if (!dialog || !activeVenue) return
    const minutes = minutesBetween(dialog.start, dialog.end)
    if (minutes < MIN_MIN || minutes > MAX_MIN) {
      toast.error(`مدت شیفت باید بین ${toPersianDigits(MIN_MIN)} دقیقه تا ${toPersianDigits(MAX_MIN / 60)} ساعت باشد`)
      return
    }
    const starts_at = `${dialog.date}T${dialog.start}:00`
    const ends_at = `${dialog.date}T${dialog.end}:00`
    const notes = dialog.notes.trim() || null
    const onError = (err: unknown) => toast.error(extractError(err, 'ثبت شیفت ممکن نشد'))
    if (dialog.id) {
      updateShift.mutate({ id: dialog.id, data: { starts_at, ends_at, notes } },
        { onSuccess: () => { toast.success('شیفت به‌روز شد'); closeDialog() }, onError })
      return
    }
    createShift.mutate({ venue_id: activeVenue, user_id: dialog.user_id, starts_at, ends_at, notes },
      { onSuccess: () => { toast.success('شیفت ثبت شد'); closeDialog() }, onError })
  }

  const setStatus = (s: ShiftRow, status: ShiftStatus) => {
    const onError = (err: unknown) => toast.error(extractError(err, 'تغییر وضعیت شیفت ممکن نشد'))
    if (status === 'cancelled') {
      cancelShift.mutate(s.id, {
        onSuccess: () => { toast.success('شیفت لغو شد'); closeDialog() }, onError,
      })
      return
    }
    updateShift.mutate({ id: s.id, data: { status } }, {
      onSuccess: () => { toast.success(SHIFT_STATUS_LABELS[status] + ' شد'); closeDialog() },
      onError,
    })
  }

  const doExport = () => {
    if (!activeVenue) return
    exportShifts.mutate({ venueId: activeVenue, month: exportMonth }, {
      onSuccess: (blob) => {
        downloadBlob(blob, `shifts-${exportMonth}.csv`)
        toast.success('فایل شیفت‌ها دانلود شد')
      },
      onError: (err) => toast.error(extractError(err, 'گرفتن خروجی ممکن نشد')),
    })
  }

  const busy = createShift.isPending || updateShift.isPending || cancelShift.isPending

  const gridColumns = `minmax(150px, 1.2fr) repeat(7, minmax(118px, 1fr))`

  return (
    <Layout userRole="venue_manager">
      <div className="flex flex-col gap-4 pb-8 pt-2">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold md:text-xl">
            <Icon icon="mdi:calendar-clock" className="h-6 w-6 text-primary" aria-hidden="true" />
            شیفت پرسنل
          </h1>
          <p className="mt-1 text-[0.68rem] text-muted-foreground">
            برنامه‌ریزی هفتگی با تشخیص خودکار تداخل — یک نفر نمی‌تواند هم‌زمان دو شیفت داشته باشد.
          </p>
        </div>

        {venuesQuery.isPending ? (
          <Shimmer height={96} />
        ) : venuesQuery.isError ? (
          isForbidden(venuesQuery.error) ? (
            <EmptyState title="دسترسی ندارید" description="برای زمان‌بندی شیفت به کد «مدیریت کارکنان» نیاز دارید." />
          ) : (
            <ErrorBox message="خطا در دریافت سالن‌ها" onRetry={() => venuesQuery.refetch()} />
          )
        ) : venues.length === 0 ? (
          <EmptyState title="سالنی با دسترسی کارکنان ندارید"
                      description="در کنسول CRM کارمند را با موقعیت «مدیر شعبه» انتصاب کنید تا بتوانید شیفت بچینید." />
        ) : (
          <>
            <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                {venues.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    data-testid={`shift-venue-${v.id}`}
                    aria-pressed={activeVenue === v.id}
                    onClick={() => setVenueId(v.id)}
                    className={`min-h-9 rounded-[10px] px-3 text-[0.68rem] font-semibold transition-colors ${
                      activeVenue === v.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
                <div className="flex-1" />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="هفتهٔ قبل"
                    data-testid="shift-prev-week"
                    onClick={() => setWeekStart(addDays(weekStart, -7))}
                    className="flex h-9 w-11 items-center justify-center rounded-full transition-colors hover:bg-muted"
                  >
                    <Icon icon="mdi:chevron-right" className="h-[22px] w-[22px]" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekStart(startOfWeek(today))}
                    className="min-h-9 rounded-[10px] px-3 text-[0.68rem] font-semibold transition-colors hover:bg-muted"
                  >
                    این هفته
                  </button>
                  <button
                    type="button"
                    aria-label="هفتهٔ بعد"
                    data-testid="shift-next-week"
                    onClick={() => setWeekStart(addDays(weekStart, 7))}
                    className="flex h-9 w-11 items-center justify-center rounded-full transition-colors hover:bg-muted"
                  >
                    <Icon icon="mdi:chevron-left" className="h-[22px] w-[22px]" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <hr className="my-3 border-border" />
              <div className="flex flex-wrap items-center gap-2">
                <p className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold">
                  {/* دو تاریخ در یک رشتهٔ واحد در RTL برعکس دیده می‌شد؛ هر تاریخ
                      جدا رندر می‌شود تا شروع همیشه سمت راست بماند */}
                  <span dir="ltr">{formatJalaliDate(`${weekStart}T09:00:00`, { format: 'numeric' })}</span>
                  <span className="font-semibold text-muted-foreground">تا</span>
                  <span dir="ltr">{formatJalaliDate(`${addDays(weekStart, 6)}T09:00:00`, { format: 'numeric' })}</span>
                </p>
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                  <Label htmlFor="shift-export-month" className="text-[0.68rem] text-muted-foreground">ماه خروجی</Label>
                  <Select value={exportMonth} onValueChange={setExportMonth}>
                    <SelectTrigger id="shift-export-month" aria-label="ماه خروجی" className="min-w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthChoices.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  type="button"
                  data-testid="shift-export"
                  disabled={exportShifts.isPending || !/^\d{4}-\d{2}$/.test(exportMonth)}
                  onClick={doExport}
                  className="min-h-9 rounded-[10px] border border-border px-3 text-[0.68rem] font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exportShifts.isPending ? 'در حال آماده‌سازی…' : 'خروجی CSV ماهانه'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <KpiCard label="ساعت کاری این هفته" value={hoursLabel(weekMinutes)}
                         icon="mdi:timer-outline" color="#2563eb"
                         sub={`${toPersianDigits(shifts.length)} شیفت ثبت‌شده`} />
              </div>
              <div className="flex-1">
                <KpiCard label="پرسنل در شیفت" icon="mdi:account-group-outline" color="#7c3aed"
                         value={toPersianDigits(new Set(shifts.map((s) => s.user_id)).size)}
                         sub={`از ${toPersianDigits(roster.length)} کارمند فعال`} />
              </div>
            </div>

            {staffQuery.isError && (
              <ErrorBox message="خطا در دریافت کارکنان" onRetry={() => staffQuery.refetch()} />
            )}
            {shiftsQuery.isError && (
              <ErrorBox message={extractError(shiftsQuery.error, 'دریافت شیفت‌ها ممکن نشد')}
                        onRetry={() => shiftsQuery.refetch()} />
            )}

            {/* خطای لیست => فقط ErrorBox بالا می‌ماند؛ شبکه‌ای از سلول‌های خالی گمراه‌کننده است */}
            {!staffQuery.isPending && roster.length === 0 ? (
              <EmptyState title="کاری برای شیفت دادن نیست"
                          description="ابتدا از کنسول CRM کارمند اضافه کنید." />
            ) : shiftsQuery.isError ? null : shiftsQuery.isPending ? (
              <Shimmer height={320} />
            ) : (
              <div data-testid="shift-week-grid" className="overflow-x-auto rounded-lg border border-border bg-card p-3 shadow-sm">
                <div className="grid gap-2" style={{ gridTemplateColumns: gridColumns, minWidth: 980 }}>
                  <div className="px-2 py-1">
                    <span className="text-[0.68rem] font-extrabold">پرسنل</span>
                  </div>
                  {days.map((day, i) => (
                    <div key={day} data-testid={`shift-day-${day}`} className="px-2 py-1 text-center">
                      <span className="text-[0.68rem] font-extrabold">{WEEKDAY_LABELS[i]}</span>
                      <span className="block text-[0.68rem] text-muted-foreground">
                        {formatJalaliDate(`${day}T09:00:00`, { format: 'numeric' }).split('/').slice(1).join('/')}
                      </span>
                    </div>
                  ))}
                  {roster.map((person) => (
                    <React.Fragment key={person.user_id}>
                      <div className="border-e border-border px-2 py-2">
                        <p className="text-[0.68rem] font-bold">{person.user_name ?? '—'}</p>
                        <span className="text-[0.68rem] text-muted-foreground">
                          {POSITION_LABELS[person.position as StaffPosition] ?? person.position}
                        </span>
                      </div>
                      {days.map((day) => {
                        const cell = byCell.get(`${person.user_id}|${day}`) ?? []
                        const cellMinutes = cell
                          .filter((s) => s.status !== 'cancelled')
                          .reduce((sum, s) => sum + s.duration_min, 0)
                        return (
                          <div
                            key={`${person.user_id}-${day}`}
                            data-testid={`shift-cell-${person.user_id}-${day}`}
                            className={`flex min-h-[76px] flex-col gap-1 rounded-xl p-1 ${
                              cell.length ? 'bg-primary/5' : ''
                            }`}
                          >
                            {cell.map((s) => (
                              <div
                                key={s.id}
                                data-testid={`shift-chip-${s.id}`}
                                role="button"
                                tabIndex={0}
                                title={`${SHIFT_STATUS_LABELS[s.status]} · ${hoursLabel(s.duration_min)}${s.notes ? ` — ${s.notes}` : ''}`}
                                onClick={() => openEdit(s)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    openEdit(s)
                                  }
                                }}
                                className={`flex min-h-9 cursor-pointer items-center justify-between gap-1 rounded-[10px] border-r-4 px-2 py-1.5 ${
                                  s.status === 'cancelled'
                                    ? 'bg-gray-500/10 line-through'
                                    : 'bg-primary/10'
                                }`}
                                style={{ borderRightColor: SHIFT_STATUS_COLORS[s.status] }}
                              >
                                <span className="text-[0.68rem] font-extrabold tabular-nums">
                                  {toPersianDigits(`${s.starts_at.slice(11, 16)}–${s.ends_at.slice(11, 16)}`)}
                                </span>
                                {cellMinutes > 0 && cell.length === 1 && (
                                  <span className="text-[0.68rem] text-muted-foreground">
                                    {hoursLabel(cellMinutes)}
                                  </span>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              data-testid={`shift-add-${person.user_id}-${day}`}
                              onClick={() => openNew(person.user_id, day)}
                              disabled={!activeVenue}
                              className="inline-flex min-h-9 items-center justify-start gap-1 rounded-[10px] px-2 text-[0.72rem] font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                            >
                              <Icon icon="mdi:plus" className="h-4 w-4" aria-hidden="true" />
                              افزودن
                            </button>
                          </div>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </div>
                <p className="mt-2 block text-[0.68rem] text-muted-foreground">
                  روزهای آینده قابل ویرایش‌اند؛ تداخل با سالن‌های دیگرِ همان شخص هم رد می‌شود.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog?.id ? 'ویرایش شیفت' : 'شیفت جدید'}</DialogTitle>
          </DialogHeader>
          {dialog && (
            <div className="flex flex-col gap-4">
              <p className="text-[0.68rem] text-muted-foreground">
                پرسنل: <strong className="text-foreground">{roster.find((r) => r.user_id === dialog.user_id)?.user_name ?? `#${toPersianDigits(dialog.user_id)}`}</strong>
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-[2] space-y-1.5">
                  <Label htmlFor="shift-date">روز</Label>
                  <Input id="shift-date" type="date" dir="ltr" value={dialog.date}
                         onChange={(e) => setDialog({ ...dialog, date: e.target.value })} />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="shift-start">شروع</Label>
                  <Input id="shift-start" type="time" dir="ltr" value={dialog.start}
                         onChange={(e) => setDialog({ ...dialog, start: e.target.value })} />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="shift-end">پایان</Label>
                  <Input id="shift-end" type="time" dir="ltr" value={dialog.end}
                         onChange={(e) => setDialog({ ...dialog, end: e.target.value })} />
                </div>
              </div>
              <p className="text-[0.68rem] text-muted-foreground">
                مدت: {hoursLabel(Math.max(0, minutesBetween(dialog.start, dialog.end)))}
                {' '}· مجاز: {toPersianDigits(MIN_MIN)} دقیقه تا {toPersianDigits(MAX_MIN / 60)} ساعت
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="shift-notes">یادداشت</Label>
                <textarea
                  id="shift-notes"
                  rows={2}
                  value={dialog.notes}
                  onChange={(e) => setDialog({ ...dialog, notes: e.target.value })}
                  className="flex min-h-[72px] w-full rounded-xl border border-input bg-card px-4 py-2 text-[0.68rem] shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              {dialog.id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-[170px] space-y-1.5">
                    <Label htmlFor="shift-status">وضعیت</Label>
                    <Select
                      value={shifts.find((s) => s.id === dialog.id)?.status ?? 'scheduled'}
                      onValueChange={(next) => {
                        const current = shifts.find((s) => s.id === dialog.id)
                        if (current) setStatus(current, next as ShiftStatus)
                      }}
                    >
                      <SelectTrigger id="shift-status" aria-label="وضعیت شیفت">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(['scheduled', 'done', 'cancelled'] as ShiftStatus[]).map((st) => (
                          <SelectItem key={st} value={st}>{SHIFT_STATUS_LABELS[st]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1" />
                  <button
                    type="button"
                    data-testid="shift-cancel-action"
                    disabled={busy}
                    onClick={() => {
                      const current = shifts.find((s) => s.id === dialog.id)
                      if (current) setStatus(current, 'cancelled')
                    }}
                    className="min-h-9 rounded-xl border border-destructive/50 px-3 text-[0.68rem] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  >
                    لغو شیفت
                  </button>
                </div>
              ) : null}
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={closeDialog}
              className="min-h-9 rounded-xl px-4 text-[0.68rem] font-semibold transition-colors hover:bg-muted"
            >
              بستن
            </button>
            <button
              type="button"
              data-testid="shift-save"
              disabled={busy || !dialog?.date}
              onClick={submit}
              className="min-h-9 rounded-xl bg-primary px-4 text-[0.68rem] font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'در حال ثبت…' : dialog?.id ? 'ذخیره تغییرات' : 'ثبت شیفت'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

export default ManagerShifts
