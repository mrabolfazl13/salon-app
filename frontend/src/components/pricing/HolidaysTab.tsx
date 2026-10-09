// frontend/src/components/pricing/HolidaysTab.tsx
// تقویم مناسبت‌ها — افزودن تک/دسته‌ای (POST /holidays/bulk) و حذف.
// دامنه: سراسری فقط سرپرست؛ سالن‌ای مالک/برنچ‌منیجر. یکتایی تاریخ سراسری است.

import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Switch,
  Table,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import PersianDatePicker from '@/components/ui/PersianDatePicker'
import ConfirmModal from '@/components/modals/ConfirmModal'
import { EmptyBox, ErrorBox, LoadingBox, SectionCard, extractError } from '@/components/finance/shared'
import { formatJalaliDate, getTodayISO } from '@/lib/jalali'
import { useAuthStore } from '@/store/authStore'
import { useBulkHolidays, useCreateHoliday, useDeleteHoliday, useHolidays } from '@/hooks/usePricing'
import type { Holiday, HolidayBulkItem } from '@/services/holidays'
import { parseDateInput } from './shared'
import type { FinanceVenue } from '@/hooks/useFinance'

interface Props {
  venues: FinanceVenue[]
  venueId: number | null
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** «نام | ۱۴۰۵-۰۶-۳۰» در هر خط → آیتم بنک؛ تاریخ جلالی یا میلادی */
function parseBulkLines(text: string, venueId: number | null, isNational: boolean): { items: HolidayBulkItem[]; errors: string[] } {
  const items: HolidayBulkItem[] = []
  const errors: string[] = []
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line, idx) => {
      const parts = line.split(/[|؛;]/).map((x) => x.trim()).filter(Boolean)
      if (parts.length < 2) {
        errors.push(`خط ${idx + 1}: قالب «نام | تاریخ» نیست`)
        return
      }
      const name = parts[0]
      const iso = parseDateInput(parts.slice(1).join(' '))
      if (!iso) {
        errors.push(`خط ${idx + 1}: تاریخ نامعتبر («${parts[1]}»)`)
        return
      }
      items.push({ date: iso, name: name.slice(0, 120), is_national: isNational, venue_id: venueId })
    })
  return { items, errors }
}

const HolidaysTab: React.FC<Props> = ({ venues, venueId }) => {
  const user = useAuthStore((s) => s.user)
  const isSuper = user?.role === 'super_admin'
  const range = useMemo(
    () => ({ start: getTodayISO(), end: addDaysIso(getTodayISO(), 730) }),
    [],
  )

  const [addOpen, setAddOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null)

  const holidaysQuery = useHolidays(range.start, range.end)
  const createHoliday = useCreateHoliday()
  const bulkHoliday = useBulkHolidays()
  const deleteHoliday = useDeleteHoliday()

  // فرم افزودن تک
  const [newDate, setNewDate] = useState('')
  const [newName, setNewName] = useState('')
  const [globalScope, setGlobalScope] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkGlobal, setBulkGlobal] = useState(false)

  const venueNameById = (id: number | null) => (id == null ? null : venues.find((v) => v.id === id)?.name ?? `سالن #${id}`)

  const list = holidaysQuery.data ?? []

  const closeAdd = () => {
    setAddOpen(false)
    setNewDate('')
    setNewName('')
    setGlobalScope(false)
  }

  const submitAdd = () => {
    if (!newName.trim()) {
      toast.error('نام مناسبت را وارد کنید')
      return
    }
    if (!newDate) {
      toast.error('تاریخ را انتخاب کنید')
      return
    }
    const targetGlobal = isSuper && globalScope
    if (!targetGlobal && venueId == null) {
      toast.error('ابتدا یک سالن انتخاب کنید')
      return
    }
    createHoliday.mutate(
      {
        holiday_date: newDate,
        name: newName.trim(),
        is_national: targetGlobal ? true : false,
        venue_id: targetGlobal ? null : venueId,
      },
      {
        onSuccess: () => {
          toast.success('مناسبت ثبت شد ✅')
          closeAdd()
        },
        onError: (err) => toast.error(extractError(err, 'خطا در ثبت مناسبت')),
      },
    )
  }

  const submitBulk = () => {
    const targetGlobal = isSuper && bulkGlobal
    if (!targetGlobal && venueId == null) {
      toast.error('برای افزودن دسته‌ای سالن انتخاب کنید')
      return
    }
    const { items, errors } = parseBulkLines(bulkText, targetGlobal ? null : venueId, targetGlobal)
    if (errors.length > 0) {
      toast.error(errors.slice(0, 2).join(' • '), { duration: 5000 })
      return
    }
    if (items.length === 0) {
      toast.error('هیچ ردیف معتبری پیدا نشد')
      return
    }
    bulkHoliday.mutate(items, {
      onSuccess: (res) => {
        toast.success(`${res.created} مناسبت از ${res.requested} درخواستی ثبت شد ✅`)
        setBulkOpen(false)
        setBulkText('')
        setBulkGlobal(false)
      },
      onError: (err) => toast.error(extractError(err, 'خطا در افزودن دسته‌ای')),
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <SectionCard
        title="تعطیلات و مناسبت‌های تقویم"
        icon="mdi:calendar-multiple"
        color="#0891b2"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setBulkOpen(true)}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
              startIcon={<Icon icon="mdi:format-list-bulleted" className="h-4 w-4" />}
            >
              افزودن دسته‌ای
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => setAddOpen(true)}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}
              startIcon={<Icon icon="mdi:plus" className="h-4 w-4" />}
            >
              مناسبت جدید
            </Button>
          </Box>
        }
      >
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          روزهای تعطیل روی موتور قیمت اثر می‌گذارند (قوانین «فقط تعطیلات» فعال و قوانین عادی غیرفعال می‌شوند).
          مناسبت سراسری همه‌ی سالن‌ها را تعطیل می‌کند و فقط سرپرست سیستم می‌تواند آن را ثبت کند.
        </Typography>

        {holidaysQuery.isPending ? (
          <LoadingBox text="در حال بارگذاری تقویم..." />
        ) : holidaysQuery.isError ? (
          <ErrorBox message="خطا در دریافت تقویم مناسبت‌ها" onRetry={() => holidaysQuery.refetch()} />
        ) : list.length === 0 ? (
          <EmptyBox icon="mdi:calendar-blank-outline" title="مناسبتی ثبت نشده" text="در دو سال پیشِ‌رو تعطیلی‌ای ثبت نشده است." />
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 700 }}>تاریخ (جلالی)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>روز</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>نام</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>دامنه</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>حذف</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...list]
                  .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date))
                  .map((h) => (
                    <TableRow key={h.id} sx={{ '&:hover': { bgcolor: 'rgba(37,99,235,0.02)' } }}>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatJalaliDate(h.holiday_date, { format: 'numeric' })}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>{formatJalaliDate(h.holiday_date, { format: 'full' }).split(' ')[0]}</TableCell>
                      <TableCell>{h.name}</TableCell>
                      <TableCell>
                        {h.venue_id == null ? (
                          <Chip size="small" color="error" label="سراسری" sx={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }} />
                        ) : (
                          <Chip size="small" label={venueNameById(h.venue_id) ?? '—'} sx={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 }} />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Button size="small" color="error" onClick={() => setDeleteTarget(h)} sx={{ textTransform: 'none' }} startIcon={<Icon icon="mdi:trash-can-outline" className="h-4 w-4" />}>
                          حذف
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>

      {/* دیالوگ افزودن تک */}
      <Dialog open={addOpen} onClose={createHoliday.isPending ? undefined : closeAdd} slotProps={{ paper: { sx: { borderRadius: '20px', maxWidth: 420, width: '100%', p: 1 } } }}>
        <DialogTitleSx title="افزودن مناسبت" />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5 }}>
          <TextField label="نام مناسبت" value={newName} onChange={(e) => setNewName(e.target.value)} fullWidth size="small" placeholder="مثلاً: عید آکادمی" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
          <PersianDatePicker label="تاریخ" value={newDate} onChange={setNewDate} size="small" clearable={false} />
          {isSuper && (
            <FormControlLabel
              control={<Switch checked={globalScope} onChange={(e) => setGlobalScope(e.target.checked)} />}
              label={<Typography variant="body2">سراسری (روی همه سالن‌ها)</Typography>}
            />
          )}
          {!isSuper && venueId != null && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>ثبت برای: {venueNameById(venueId)}</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button onClick={closeAdd} disabled={createHoliday.isPending} variant="outlined" sx={{ borderRadius: '10px', textTransform: 'none' }}>انصراف</Button>
          <Button onClick={submitAdd} variant="contained" disabled={createHoliday.isPending} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}>
            {createHoliday.isPending ? '...' : 'ثبت'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* دیالوگ افزودن دسته‌ای */}
      <Dialog open={bulkOpen} onClose={bulkHoliday.isPending ? undefined : () => setBulkOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: '20px' } } }}>
        <DialogTitleSx title="افزودن دسته‌ای مناسبت‌ها" />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            هر خط: «نام | تاریخ» — تاریخ جلالی (۱۴۰۵/۰۷/۰۱) یا میلادی (2026-09-23). ردیف‌های تکراری/موجود با پیام سرور رد می‌شوند.
          </Typography>
          <TextField
            label="فهرست مناسبت‌ها"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            multiline
            minRows={6}
            maxRows={14}
            placeholder={'جشن سالن | ۱۴۰۵/۰۷/۰۱\nمراسه تقدیر | ۱۴۰۵/۰۸/۱۵'}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontFamily: 'Vazirmatn, sans-serif' } }}
          />
          {isSuper && (
            <FormControlLabel
              control={<Switch checked={bulkGlobal} onChange={(e) => setBulkGlobal(e.target.checked)} />}
              label={<Typography variant="body2">سراسری (فقط سرپرست)</Typography>}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setBulkOpen(false)} disabled={bulkHoliday.isPending} variant="outlined" sx={{ borderRadius: '10px', textTransform: 'none' }}>انصراف</Button>
          <Button onClick={submitBulk} variant="contained" disabled={bulkHoliday.isPending} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}>
            {bulkHoliday.isPending ? 'در حال ثبت...' : 'ثبت دسته‌ای'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmModal
        open={deleteTarget != null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="حذف مناسبت"
        description={deleteTarget ? `مناسبت «${deleteTarget.name}» در تاریخ ${formatJalaliDate(deleteTarget.holiday_date)} حذف شود؟ قوانین «فقط تعطیلات» آن روز دیگر اعمال نمی‌شوند.` : ''}
        confirmText="حذف"
        variant="destructive"
        loading={deleteHoliday.isPending || createHoliday.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteHoliday.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success('مناسبت حذف شد')
              setDeleteTarget(null)
            },
            onError: (err) => toast.error(extractError(err, 'خطا در حذف')),
          })
        }}
      />
    </Box>
  )
}

const DialogTitleSx: React.FC<{ title: string }> = ({ title }) => (
  <Box sx={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', px: 3, py: 2.5, borderRadius: '14px 14px 0 0' }}>
    <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
      <Icon icon="mdi:calendar-multiple" className="h-5 w-5" />
      {title}
    </Typography>
  </Box>
)

export default HolidaysTab