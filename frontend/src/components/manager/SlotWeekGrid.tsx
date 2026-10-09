// frontend/src/components/manager/SlotWeekGrid.tsx
// «تقویم هفتگی» سانس‌ها — هفته جلالی شنبه تا جمعه + انتخاب سالن؛ داده از
// GET /slots/venue/{id}/range?start_date=&end_date=. گرید زمان×روز فشرده؛
// کلیک روی سلول → دیالوگ جزئیات با میان‌برهای block/unblock (ConfirmModal) و
// انتشار شگفت‌انگیز (بازاستفاده DealPublishDialog). اعتبار دسترسی سمت بک‌اند است
// (slot.block / deal.publish) — خطای ۴۰۳ با پیام فارسی توست می‌شود.

import React, { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Icon } from '@iconify/react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import toast from 'react-hot-toast'

import ConfirmModal from '@/components/modals/ConfirmModal'
import DealPublishDialog, { type PublishSlot } from '@/components/deals/DealPublishDialog'
import { slotService, type Slot } from '@/services/slot'
import { extractError, faNum } from '@/components/finance/shared'
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

  return (
    <Box>
      {/* کنترل‌ها: سالن + ناوبری هفته جلالی */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        {venues.length > 0 ? (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>سالن</InputLabel>
            <Select
              label="سالن"
              value={activeVenueId ?? ''}
              onChange={(e) => setVenueId(Number(e.target.value))}
              sx={{ borderRadius: '10px' }}
            >
              {venues.map((v) => (
                <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Chip label="سالنی در دسترس نیست" size="small" color="warning" sx={{ borderRadius: '8px', fontWeight: 700 }} />
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 'auto' }}>
          <IconButton size="small" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label="هفته قبل">
            <Icon icon="mdi:chevron-right" className="h-5 w-5" />
          </IconButton>
          <Typography variant="body2" sx={{ fontWeight: 800, minWidth: 190, textAlign: 'center' }} dir="rtl">
            {`${formatJalaliDate(startDate, { format: 'numeric' })} — ${formatJalaliDate(endDate, { format: 'numeric' })}`}
          </Typography>
          <IconButton size="small" onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label="هفته بعد">
            <Icon icon="mdi:chevron-left" className="h-5 w-5" />
          </IconButton>
          <Button size="small" onClick={() => setWeekStart(saturdayOf(new Date()))} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
            این هفته
          </Button>
        </Box>
      </Box>

      {/* راهنمای وضعیت */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>
        {Object.entries(STATUS_LABELS).map(([k, label]) => (
          <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: STATUS_COLORS[k] }} />
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Box>
        ))}
      </Box>

      {slotsQuery.isPending && venues.length > 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <CircularProgress size={32} sx={{ color: '#2563eb' }} />
        </Box>
      ) : slotsQuery.isError ? (
        <Typography variant="body2" color="error.main">
          {extractError(slotsQuery.error, 'خطا در دریافت سانس‌های هفته')}
        </Typography>
      ) : times.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          در این هفته سانسی ثبت نشده است — از تب «سانس‌ها» یا «سالن‌های من» سانس تولید کنید.
        </Typography>
      ) : (
        <Box sx={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <Table size="small" sx={{ minWidth: 760, '& td, & th': { p: 0.5, border: '1px solid rgba(0,0,0,0.06)' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(248,250,252,0.9)' }}>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>ساعت</TableCell>
                {days.map((day, i) => (
                  <TableCell key={day} align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {jalaliWeekdayNames[i]}
                    <Typography component="div" variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {toPersianDigits(formatJalaliDate(day, { format: 'numeric' }).slice(5))}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {times.map((time) => (
                <TableRow key={time}>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'nowrap' }} dir="ltr">
                    {toPersianDigits(time)}
                  </TableCell>
                  {days.map((day) => {
                    const slot = slotAt(day, time)
                    if (!slot) {
                      return <TableCell key={day} align="center" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>—</TableCell>
                    }
                    const color = STATUS_COLORS[slot.status] || '#6b7280'
                    return (
                      <TableCell key={day} align="center" sx={{ p: 0.25 }}>
                        <Tooltip title={`${STATUS_LABELS[slot.status] || slot.status} — ${faNum(slot.current_price)}`}>
                          <Box
                            onClick={() => setSelectedSlot(slot)}
                            sx={{
                              cursor: 'pointer',
                              borderRadius: '8px',
                              px: 0.5,
                              py: 0.75,
                              minHeight: 34,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.25,
                              bgcolor: `${color}14`,
                              border: `1px solid ${color}40`,
                              transition: 'all .15s',
                              '&:hover': { bgcolor: `${color}26`, transform: 'translateY(-1px)' },
                            }}
                          >
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color }} />
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color, lineHeight: 1.2 }}>
                              {faNum(slot.current_price)}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* دیالوگ جزئیات/میان‌بر سانس */}
      <Dialog
        open={Boolean(selectedSlot)}
        onClose={() => setSelectedSlot(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '18px' } } }}
      >
        {selectedSlot && (() => {
          const s = selectedSlot
          const color = STATUS_COLORS[s.status] || '#6b7280'
          const isBlockable = s.status === 'available' && !s.is_contract_slot && isFutureSlot(s)
          const isUnblockable = s.status === 'blocked' && isFutureSlot(s)
          return (
            <>
              <DialogTitle sx={{ fontWeight: 800, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                {`سانس ${toPersianDigits(s.start_time.slice(0, 5))} — ${formatJalaliDate(s.slot_date, { format: 'full' })}`}
              </DialogTitle>
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {`${venueNameOf?.(s.venue_id) ?? `سالن #${faNum(s.venue_id)}`} — ${faNum(s.duration)} دقیقه`}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip size="small" label={STATUS_LABELS[s.status] || s.status} sx={{ borderRadius: '8px', fontWeight: 700, bgcolor: `${color}18`, color }} />
                  <Chip size="small" label={`قیمت: ${faNum(s.current_price)}`} variant="outlined" sx={{ borderRadius: '8px', fontWeight: 700 }} />
                  {s.is_contract_slot && (
                    <Chip size="small" label="سانس قرارداد" color="primary" sx={{ borderRadius: '8px', fontWeight: 700 }} />
                  )}
                </Box>
                {s.is_contract_slot && (
                  <Typography variant="caption" color="text.secondary">
                    سانس قرارداد از این مسیر مسدود نمی‌شود — قواعد استثنا/جابه‌جایی در پنل قراردادها است.
                  </Typography>
                )}
                {!isBlockable && !isUnblockable && !s.is_contract_slot && s.status !== 'available' && s.status !== 'blocked' && (
                  <Typography variant="caption" color="text.secondary">
                    این وضعیت سانس اقدام مستقیمی ندارد — مشاهده‌ی اطلاعات.
                  </Typography>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 2.5, pb: 2, gap: 1, flexWrap: 'wrap' }}>
                {isBlockable && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      disabled={busyId === s.id}
                      onClick={() => setBlockConfirm(s)}
                      sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700 }}
                    >
                      مسدود کردن
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={busyId === s.id}
                      onClick={() => {
                        setPublishSlot({ id: s.id, venue_id: s.venue_id, slot_date: s.slot_date, start_time: s.start_time })
                        setSelectedSlot(null)
                      }}
                      sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700 }}
                    >
                      انتشار شگفت‌انگیز
                    </Button>
                  </>
                )}
                {isUnblockable && (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    disabled={busyId === s.id}
                    onClick={() => doUnblock(s)}
                    sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 700 }}
                  >
                    {busyId === s.id ? <CircularProgress size={16} color="inherit" /> : 'آزاد کردن سانس'}
                  </Button>
                )}
                <Button size="small" onClick={() => setSelectedSlot(null)} sx={{ textTransform: 'none', borderRadius: '10px', mr: 'auto' }}>
                  بستن
                </Button>
              </DialogActions>
            </>
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
    </Box>
  )
}

export default SlotWeekGrid