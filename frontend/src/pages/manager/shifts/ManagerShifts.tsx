// frontend/src/pages/manager/shifts/ManagerShifts.tsx
// زمان‌بندی شیفت پرسنل (P020) — نمای هفتگی شنبه‌محور، فرمی (بدون drag&drop).
// داده فقط از /api/v1/shifts و /api/v1/staff می‌آید (بدون mock).
// چرا تاریخ‌ها از خود رشته خوانده می‌شوند: بک‌اند +03:30 برمی‌گرداند، پس برچسب
// روز/ساعت باید همان دیوارِ تهران باشد — تبدیل با getHours() روی دستگاهی خارج از
// ایران شیفت را به روز کناری می‌انداخت.

import React, { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
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
import { radii, shadows } from '@/theme'

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
      <Stack spacing={2} sx={{ pt: 1, pb: 4 }}>
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
            <Icon icon="mdi:calendar-clock" style={{ verticalAlign: 'middle', marginLeft: 6 }} />
            شیفت پرسنل
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            برنامه‌ریزی هفتگی با تشخیص خودکار تداخل — یک نفر نمی‌تواند هم‌زمان دو شیفت داشته باشد.
          </Typography>
        </Box>

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
            <Card sx={{ p: 1.5, borderRadius: `${radii.card}px`, boxShadow: shadows.card }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                {venues.map((v) => (
                  <Button key={v.id} size="small"
                          data-testid={`shift-venue-${v.id}`}
                          variant={activeVenue === v.id ? 'contained' : 'outlined'}
                          onClick={() => setVenueId(v.id)}
                          sx={{ borderRadius: '10px', minHeight: 44 }}>
                    {v.name}
                  </Button>
                ))}
                <Box sx={{ flex: 1 }} />
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', gap: 0.5 }}>
                  <IconButton aria-label="هفتهٔ قبل" sx={{ width: 44, height: 44 }}
                              data-testid="shift-prev-week"
                              onClick={() => setWeekStart(addDays(weekStart, -7))}>
                    <Icon icon="mdi:chevron-right" style={{ width: 22, height: 22 }} />
                  </IconButton>
                  <Button size="small" onClick={() => setWeekStart(startOfWeek(today))}
                          sx={{ minHeight: 44, borderRadius: '10px' }}>
                    این هفته
                  </Button>
                  <IconButton aria-label="هفتهٔ بعد" sx={{ width: 44, height: 44 }}
                              data-testid="shift-next-week"
                              onClick={() => setWeekStart(addDays(weekStart, 7))}>
                    <Icon icon="mdi:chevron-left" style={{ width: 22, height: 22 }} />
                  </IconButton>
                </Stack>
              </Stack>
              <Divider sx={{ my: 1.25 }} />
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {`${formatJalaliDate(`${weekStart}T09:00:00`, { format: 'numeric' })} تا ${formatJalaliDate(`${addDays(weekStart, 6)}T09:00:00`, { format: 'numeric' })}`}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <TextField select size="small" label="ماه خروجی" value={exportMonth}
                           onChange={(e) => setExportMonth(e.target.value)}
                           sx={{ minWidth: 170 }}>
                  {monthChoices.map((m) => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </TextField>
                <Button variant="outlined" size="small" data-testid="shift-export"
                        disabled={exportShifts.isPending || !/^\d{4}-\d{2}$/.test(exportMonth)}
                        onClick={doExport} sx={{ borderRadius: '10px', minHeight: 44 }}>
                  {exportShifts.isPending ? 'در حال آماده‌سازی…' : 'خروجی CSV ماهانه'}
                </Button>
              </Stack>
            </Card>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <KpiCard label="ساعت کاری این هفته" value={hoursLabel(weekMinutes)}
                         icon="mdi:timer-outline" color="#2563eb"
                         sub={`${toPersianDigits(shifts.length)} شیفت ثبت‌شده`} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <KpiCard label="پرسنل در شیفت" icon="mdi:account-group-outline" color="#7c3aed"
                         value={toPersianDigits(new Set(shifts.map((s) => s.user_id)).size)}
                         sub={`از ${toPersianDigits(roster.length)} کارمند فعال`} />
              </Box>
            </Stack>

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
              <Card data-testid="shift-week-grid"
                    sx={{ p: 1.5, borderRadius: `${radii.card}px`, boxShadow: shadows.card, overflowX: 'auto' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 1, minWidth: 980 }}>
                  <Box sx={{ px: 1, py: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>پرسنل</Typography>
                  </Box>
                  {days.map((day, i) => (
                    <Box key={day} data-testid={`shift-day-${day}`} sx={{ px: 1, py: 0.5, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800 }}>{WEEKDAY_LABELS[i]}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {formatJalaliDate(`${day}T09:00:00`, { format: 'numeric' }).split('/').slice(1).join('/')}
                      </Typography>
                    </Box>
                  ))}
                  {roster.map((person) => (
                    <React.Fragment key={person.user_id}>
                      <Box sx={{ px: 1, py: 1, borderRight: '1px solid rgba(15,23,42,0.06)' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{person.user_name ?? '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {POSITION_LABELS[person.position as StaffPosition] ?? person.position}
                        </Typography>
                      </Box>
                      {days.map((day) => {
                        const cell = byCell.get(`${person.user_id}|${day}`) ?? []
                        const cellMinutes = cell
                          .filter((s) => s.status !== 'cancelled')
                          .reduce((sum, s) => sum + s.duration_min, 0)
                        return (
                          <Box key={`${person.user_id}-${day}`}
                               data-testid={`shift-cell-${person.user_id}-${day}`}
                               sx={{
                                 p: 0.5, minHeight: 76, borderRadius: '12px',
                                 bgcolor: cell.length ? 'rgba(37,99,235,0.04)' : 'transparent',
                                 display: 'flex', flexDirection: 'column', gap: 0.5,
                               }}>
                            {cell.map((s) => (
                              <Tooltip key={s.id}
                                       title={`${SHIFT_STATUS_LABELS[s.status]} · ${hoursLabel(s.duration_min)}${s.notes ? ` — ${s.notes}` : ''}`}>
                                <Box
                                  data-testid={`shift-chip-${s.id}`}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => openEdit(s)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') openEdit(s) }}
                                  sx={{
                                    cursor: 'pointer', px: 1, py: 0.75, borderRadius: '10px',
                                    minHeight: 44, display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', gap: 0.5,
                                    borderRight: `4px solid ${SHIFT_STATUS_COLORS[s.status]}`,
                                    bgcolor: s.status === 'cancelled' ? 'rgba(107,114,128,0.10)' : 'rgba(37,99,235,0.08)',
                                    textDecoration: s.status === 'cancelled' ? 'line-through' : 'none',
                                  }}
                                >
                                  <Typography variant="caption" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                                    {toPersianDigits(`${s.starts_at.slice(11, 16)}–${s.ends_at.slice(11, 16)}`)}
                                  </Typography>
                                  {cellMinutes > 0 && cell.length === 1 && (
                                    <Typography variant="caption" color="text.secondary">
                                      {hoursLabel(cellMinutes)}
                                    </Typography>
                                  )}
                                </Box>
                              </Tooltip>
                            ))}
                            <Button size="small" data-testid={`shift-add-${person.user_id}-${day}`}
                                    onClick={() => openNew(person.user_id, day)}
                                    startIcon={<Icon icon="mdi:plus" style={{ width: 16, height: 16 }} />}
                                    disabled={!activeVenue}
                                    sx={{ borderRadius: '10px', minHeight: 44, justifyContent: 'flex-start',
                                            fontSize: '0.72rem', color: 'text.secondary' }}>
                              افزودن
                            </Button>
                          </Box>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  روزهای آینده قابل ویرایش‌اند؛ تداخل با سالن‌های دیگرِ همان شخص هم رد می‌شود.
                </Typography>
              </Card>
            )}
          </>
        )}
      </Stack>

      <Dialog open={dialog !== null} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog?.id ? 'ویرایش شیفت' : 'شیفت جدید'}</DialogTitle>
        <DialogContent>
          {dialog && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                پرسنل: <strong>{roster.find((r) => r.user_id === dialog.user_id)?.user_name ?? `#${toPersianDigits(dialog.user_id)}`}</strong>
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField sx={{ flex: 2 }} size="small" type="date" label="روز"
                           slotProps={{ inputLabel: { shrink: true } }} value={dialog.date}
                           onChange={(e) => setDialog({ ...dialog, date: e.target.value })} />
                <TextField sx={{ flex: 1 }} size="small" type="time" label="شروع"
                           slotProps={{ inputLabel: { shrink: true } }} value={dialog.start}
                           onChange={(e) => setDialog({ ...dialog, start: e.target.value })} />
                <TextField sx={{ flex: 1 }} size="small" type="time" label="پایان"
                           slotProps={{ inputLabel: { shrink: true } }} value={dialog.end}
                           onChange={(e) => setDialog({ ...dialog, end: e.target.value })} />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                مدت: {hoursLabel(Math.max(0, minutesBetween(dialog.start, dialog.end)))}
                {' '}· مجاز: {toPersianDigits(MIN_MIN)} دقیقه تا {toPersianDigits(MAX_MIN / 60)} ساعت
              </Typography>
              <TextField size="small" multiline minRows={2} label="یادداشت"
                         value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} />
              {dialog.id ? (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 170 }}>
                    <InputLabel id="shift-status-label">وضعیت</InputLabel>
                    <Select labelId="shift-status-label" label="وضعیت"
                            value={shifts.find((s) => s.id === dialog.id)?.status ?? 'scheduled'}
                            onChange={(e) => {
                              const next = e.target.value as ShiftStatus
                              const current = shifts.find((s) => s.id === dialog.id)
                              if (current) setStatus(current, next)
                            }}>
                      {(['scheduled', 'done', 'cancelled'] as ShiftStatus[]).map((st) => (
                        <MenuItem key={st} value={st}>{SHIFT_STATUS_LABELS[st]}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ flex: 1 }} />
                  <Button color="error" variant="outlined" data-testid="shift-cancel-action"
                          disabled={busy}
                          onClick={() => {
                            const current = shifts.find((s) => s.id === dialog.id)
                            if (current) setStatus(current, 'cancelled')
                          }}>
                    لغو شیفت
                  </Button>
                </Stack>
              ) : null}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} sx={{ minHeight: 44 }}>بستن</Button>
          <Button variant="contained" data-testid="shift-save" disabled={busy || !dialog?.date}
                  onClick={submit}>
            {busy ? 'در حال ثبت…' : dialog?.id ? 'ذخیره تغییرات' : 'ثبت شیفت'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

export default ManagerShifts
