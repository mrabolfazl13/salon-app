// frontend/src/components/manager/SlotWeekGrid.tsx
// «تقویم هفتگی» سانس‌ها — هفته جلالی شنبه تا جمعه + انتخاب سالن؛ داده از
// GET /slots/venue/{id}/range?start_date=&end_date=. گرید زمان×روز فشرده؛
// کلیک روی سلول → دیالوگ جزئیات با میان‌برهای block/unblock (ConfirmModal) و
// انتشار شگفت‌انگیز (بازاستفاده DealPublishDialog). اعتبار دسترسی سمت بک‌اند است
// (slot.block / deal.publish) — خطای ۴۰۳ با پیام فارسی توست می‌شود.

import React, { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import ConfirmModal from '@/components/modals/ConfirmModal'
import DealPublishDialog, { type PublishSlot } from '@/components/deals/DealPublishDialog'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/shadcn/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'
import { cn } from '@/lib/utils'
import { slotService, type Slot } from '@/services/slot'
import { extractError, faNum, statusColorToken } from '@/components/finance/shared'
import { formatJalaliDate, jalaliWeekdayNames, toPersianDigits } from '@/lib/jalali'

interface Props {
  venues: Array<{ id: number; name: string }>
  venueNameOf?: (venueId: number) => string
}

const STATUS_COLORS: Record<string, string> = {
  available: '#10b981',
  booked: '#2563eb',
  blocked: '#ef4444',
  in_competition: '#f59e0b',
  reserved: '#8b5cf6',
}

const STATUS_LABELS: Record<string, string> = {
  available: 'آزاد',
  booked: 'رزرو شده',
  blocked: 'مسدود',
  in_competition: 'مسابقه',
  reserved: 'رزرو قرارداد',
}

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** شنبه هفته‌ی شامل تاریخ مرجع (JS getDay: 0=یکشنبه … 6=شنبه) */
const saturdayOf = (ref: Date): Date => {
  const d = new Date(ref)
  const diff = (d.getDay() + 1) % 7
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

const isFutureSlot = (slot: Slot): boolean => {
  const now = new Date()
  const todayIso = toIso(now)
  if (slot.slot_date > todayIso) return true
  if (slot.slot_date < todayIso) return false
  const [h, m] = (slot.start_time || '00:00').slice(0, 5).split(':').map(Number)
  return now.getHours() * 60 + now.getMinutes() < h * 60 + (m || 0)
}

/** رنگ متن سلول: هگز تزئینی → توکن سمانتیک با کنتراست ≥۴٫۵:۱ (کلاس، با نسخه‌ی دارک) */
const accentClassOf = (hex: string): string | undefined => {
  switch (statusColorToken(hex)) {
    case 'success':
      return 'text-emerald-700 dark:text-emerald-300'
    case 'warning':
      return 'text-amber-700 dark:text-amber-300'
    case 'error':
      return 'text-red-700 dark:text-red-300'
    case 'info':
      return 'text-blue-700 dark:text-blue-300'
    default:
      return undefined
  }
}

const SlotWeekGrid: React.FC<Props> = ({ venues, venueNameOf }) => {
  const queryClient = useQueryClient()
  const [venueId, setVenueId] = useState<number | null>(null)
  const [weekStart, setWeekStart] = useState<Date>(() => saturdayOf(new Date()))
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [blockConfirm, setBlockConfirm] = useState<Slot | null>(null)
  const [publishSlot, setPublishSlot] = useState<PublishSlot | null>(null)

  const activeVenueId = venueId ?? venues[0]?.id ?? null
  const startDate = toIso(weekStart)
  const endDate = toIso(addDays(weekStart, 6))

  const slotsQuery = useQuery({
    queryKey: ['slots-week', activeVenueId, startDate, endDate],
    queryFn: () =>
      activeVenueId !== null
        ? slotService.getByVenueAndDateRange(activeVenueId, startDate, endDate)
        : Promise.resolve([]),
    enabled: activeVenueId !== null,
  })

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => toIso(addDays(weekStart, i))),
    [weekStart],
  )

  const byDay = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const day of days) map.set(day, [])
    for (const s of slotsQuery.data ?? []) {
      if (map.has(s.slot_date)) map.get(s.slot_date)!.push(s)
    }
    for (const arr of map.values()) arr.sort((a, b) => a.start_time.localeCompare(b.start_time))
    return map
  }, [slotsQuery.data, days])

  const times = useMemo(() => {
    const set = new Set<string>()
    for (const arr of byDay.values()) for (const s of arr) set.add(s.start_time.slice(0, 5))
    return Array.from(set).sort()
  }, [byDay])

  const refetch = () => {
    void queryClient.invalidateQueries({ queryKey: ['slots-week'] })
    setSelectedSlot(null)
  }

  const doBlock = async (slot: Slot) => {
    setBusyId(slot.id)
    try {
      await slotService.block(slot.id)
      toast.success('سانس مسدود شد')
      setBlockConfirm(null)
      refetch()
    } catch (err) {
      toast.error(extractError(err, 'خطا در مسدود کردن سانس'))
    } finally {
      setBusyId(null)
    }
  }

  const doUnblock = async (slot: Slot) => {
    setBusyId(slot.id)
    try {
      await slotService.unblock(slot.id)
      toast.success('سانس آزاد شد')
      refetch()
    } catch (err) {
      toast.error(extractError(err, 'خطا در آزاد کردن سانس'))
    } finally {
      setBusyId(null)
    }
  }

  const slotAt = (day: string, time: string): Slot | undefined =>
    byDay.get(day)?.find((s) => s.start_time.slice(0, 5) === time)

  const detailColor = selectedSlot ? (STATUS_COLORS[selectedSlot.status] || '#6b7280') : '#6b7280'
  const detailTitle = selectedSlot
    ? `سانس ${toPersianDigits(selectedSlot.start_time.slice(0, 5))} — ${formatJalaliDate(selectedSlot.slot_date, { format: 'full' })}`
    : 'جزئیات سانس'

  return (
    <div>
      {/* کنترل‌ها: سالن + ناوبری هفته جلالی */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {venues.length > 0 ? (
          <Select
            value={activeVenueId !== null ? String(activeVenueId) : undefined}
            onValueChange={(v) => setVenueId(Number(v))}
          >
            <SelectTrigger aria-label="سالن" className="h-11 min-w-[200px]">
              <SelectValue placeholder="سالن" />
            </SelectTrigger>
            <SelectContent>
              {venues.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="inline-flex items-center rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            سالنی در دسترس نیست
          </span>
        )}
        <div className="ms-auto flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            aria-label="هفته قبل"
            className="rounded-full"
          >
            <Icon icon="mdi:chevron-right" className="h-5 w-5" aria-hidden="true" />
          </Button>
          <p className="min-w-[190px] text-center text-sm font-extrabold text-foreground" dir="rtl">
            {`${formatJalaliDate(startDate, { format: 'numeric' })} — ${formatJalaliDate(endDate, { format: 'numeric' })}`}
          </p>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            aria-label="هفته بعد"
            className="rounded-full"
          >
            <Icon icon="mdi:chevron-left" className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setWeekStart(saturdayOf(new Date()))}
            className="rounded-lg text-xs font-bold"
          >
            این هفته
          </Button>
        </div>
      </div>

      {/* راهنمای وضعیت */}
      <div className="mb-3 flex flex-wrap gap-3">
        {Object.entries(STATUS_LABELS).map(([k, label]) => (
          <div key={k} className="flex items-center gap-1">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[k] }}
              aria-hidden="true"
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {slotsQuery.isPending && venues.length > 0 ? (
        <div role="status" aria-busy="true" className="py-10 text-center">
          <span
            aria-hidden="true"
            className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-blue-600"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            در حال بارگذاری سانس‌های هفته…
          </p>
        </div>
      ) : slotsQuery.isError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {extractError(slotsQuery.error, 'خطا در دریافت سانس‌های هفته')}
        </p>
      ) : times.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          در این هفته سانسی ثبت نشده است — از تب «سانس‌ها» یا «سالن‌های من» سانس تولید کنید.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <Table
            aria-label="سانس‌های هفته"
            className="min-w-[760px] border-collapse text-xs [&_td]:border [&_td]:border-border [&_td]:p-1 [&_th]:border [&_th]:border-border [&_th]:p-1"
          >
            <TableHeader>
              <TableRow className="bg-slate-50/90 dark:bg-slate-900/60">
                <TableHead scope="col" className="whitespace-nowrap text-xs font-extrabold">ساعت</TableHead>
                {days.map((day, i) => (
                  <TableHead scope="col" key={day} className="whitespace-nowrap text-center text-xs font-extrabold">
                    {jalaliWeekdayNames[i]}
                    <span className="block text-xs font-semibold text-muted-foreground">
                      {toPersianDigits(formatJalaliDate(day, { format: 'numeric' }).slice(5))}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {times.map((time) => (
                <TableRow key={time}>
                  <TableCell className="whitespace-nowrap font-mono text-xs font-extrabold" dir="ltr">
                    {toPersianDigits(time)}
                  </TableCell>
                  {days.map((day) => {
                    const slot = slotAt(day, time)
                    if (!slot) {
                      return (
                        <TableCell key={day} className="text-center text-xs text-muted-foreground">—</TableCell>
                      )
                    }
                    const color = STATUS_COLORS[slot.status] || '#6b7280'
                    const accentClass = accentClassOf(color)
                    // جدول متراکم است، اما هدف لمسی باید ≥۴۴px بماند (Material)
                    return (
                      <TableCell key={day} className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              aria-label={`سانس ${toPersianDigits(time)} ${jalaliWeekdayNames[days.indexOf(day)] ?? day}، ${STATUS_LABELS[slot.status] || slot.status}، ${faNum(slot.current_price)} ریال`}
                              className={cn(
                                'flex min-h-11 min-w-11 w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 font-[inherit] transition-all hover:-translate-y-px hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                accentClass,
                              )}
                              style={{
                                backgroundColor: `${color}14`,
                                border: `1px solid ${color}40`,
                                ...(accentClass ? {} : { color }),
                              }}
                            >
                              <span
                                className="h-[7px] w-[7px] rounded-full"
                                style={{ backgroundColor: color }}
                                aria-hidden="true"
                              />
                              <span className="text-xs font-extrabold leading-tight">
                                {faNum(slot.current_price)}
                              </span>
                              {/* وضعیت نباید فقط با رنگ فهمیده شود (WCAG 1.4.1) */}
                              {slot.status !== 'available' && (
                                <span className="text-[0.625rem] font-bold leading-none">
                                  {STATUS_LABELS[slot.status] || slot.status}
                                </span>
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{`${STATUS_LABELS[slot.status] || slot.status} — ${faNum(slot.current_price)}`}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* دیالوگ جزئیات/میان‌بر سانس */}
      <Dialog
        aria-label="جزئیات سانس"
        open={Boolean(selectedSlot)}
        onClose={() => setSelectedSlot(null)}
        title={detailTitle}
        titleIcon={<span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: detailColor }} />}
        maxWidth="xs"
        actions={
          selectedSlot && (() => {
            const s = selectedSlot
            const isBlockable = s.status === 'available' && !s.is_contract_slot && isFutureSlot(s)
            const isUnblockable = s.status === 'blocked' && isFutureSlot(s)
            return (
              <>
                {isBlockable && (
                  <>
                    <Button
                      size="sm"
                      disabled={busyId === s.id}
                      onClick={() => setBlockConfirm(s)}
                      className="rounded-xl font-bold !bg-none bg-amber-600 text-white hover:bg-amber-700"
                    >
                      مسدود کردن
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === s.id}
                      onClick={() => {
                        setPublishSlot({ id: s.id, venue_id: s.venue_id, slot_date: s.slot_date, start_time: s.start_time })
                        setSelectedSlot(null)
                      }}
                      className="rounded-xl font-bold"
                    >
                      انتشار شگفت‌انگیز
                    </Button>
                  </>
                )}
                {isUnblockable && (
                  <Button
                    size="sm"
                    disabled={busyId === s.id}
                    onClick={() => doUnblock(s)}
                    className="rounded-xl font-bold !bg-none bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {busyId === s.id ? (
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      />
                    ) : (
                      'آزاد کردن سانس'
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedSlot(null)}
                  className="ms-auto rounded-xl"
                >
                  بستن
                </Button>
              </>
            )
          })()
        }
      >
        {selectedSlot && (() => {
          const s = selectedSlot
          const color = STATUS_COLORS[s.status] || '#6b7280'
          const isBlockable = s.status === 'available' && !s.is_contract_slot && isFutureSlot(s)
          const isUnblockable = s.status === 'blocked' && isFutureSlot(s)
          return (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {`${venueNameOf?.(s.venue_id) ?? `سالن #${faNum(s.venue_id)}`} — ${faNum(s.duration)} دقیقه`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {STATUS_LABELS[s.status] || s.status}
                </span>
                <span className="inline-flex items-center rounded-lg border border-border px-2 py-0.5 text-xs font-bold text-foreground">
                  {`قیمت: ${faNum(s.current_price)}`}
                </span>
                {s.is_contract_slot && (
                  <span className="inline-flex items-center rounded-lg bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                    سانس قرارداد
                  </span>
                )}
              </div>
              {s.is_contract_slot && (
                <p className="text-xs text-muted-foreground">
                  سانس قرارداد از این مسیر مسدود نمی‌شود — قواعد استثنا/جابه‌جایی در پنل قراردادها است.
                </p>
              )}
              {!isBlockable && !isUnblockable && !s.is_contract_slot && s.status !== 'available' && s.status !== 'blocked' && (
                <p className="text-xs text-muted-foreground">
                  این وضعیت سانس اقدام مستقیمی ندارد — مشاهده‌ی اطلاعات.
                </p>
              )}
            </div>
          )
        })()}
      </Dialog>

      <ConfirmModal
        open={Boolean(blockConfirm)}
        onOpenChange={(v) => { if (!v) setBlockConfirm(null) }}
        title="مسدود این سانس؟"
        description={
          blockConfirm
            ? `سانس ${toPersianDigits(blockConfirm.start_time.slice(0, 5))} — ${formatJalaliDate(blockConfirm.slot_date, { format: 'long' })} مسدود می‌شود و از رزرو عمومی خارج خواهد شد.`
            : ''
        }
        confirmText="مسدود کردن"
        cancelText="انصراف"
        variant="destructive"
        loading={busyId === (blockConfirm?.id ?? -1)}
        onConfirm={() => { if (blockConfirm) void doBlock(blockConfirm) }}
      />

      <DealPublishDialog
        open={Boolean(publishSlot)}
        slots={publishSlot ? [publishSlot] : []}
        venueNameOf={(vid) => venueNameOf?.(vid) || `سالن #${faNum(vid)}`}
        onClose={() => setPublishSlot(null)}
        onPublished={() => {
          setPublishSlot(null)
          refetch()
        }}
      />
    </div>
  )
}

export default SlotWeekGrid
