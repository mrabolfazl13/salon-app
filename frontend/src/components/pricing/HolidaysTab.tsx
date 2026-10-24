// frontend/src/components/pricing/HolidaysTab.tsx
// تقویم مناسبت‌ها — افزودن تک/دسته‌ای (POST /holidays/bulk) و حذف.
// دامنه: سراسری فقط سرپرست؛ سالن‌ای مالک/برنچ‌منیجر. یکتایی تاریخ سراسری است.

import React, { useId, useMemo, useState } from 'react'
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
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Switch } from '@/components/ui/shadcn/switch'
import { Textarea } from '@/components/ui/shadcn/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'

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

  const nameId = useId()
  const globalId = useId()
  const bulkTextId = useId()
  const bulkGlobalId = useId()

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
    <div className="flex flex-col gap-6">
      <SectionCard
        title="تعطیلات و مناسبت‌های تقویم"
        icon="mdi:calendar-multiple"
        color="#0891b2"
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkOpen(true)}
              className="font-semibold"
            >
              <Icon icon="mdi:format-list-bulleted" className="h-4 w-4" aria-hidden="true" />
              افزودن دسته‌ای
            </Button>
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              className="bg-gradient-to-br from-cyan-700 to-cyan-800 font-bold text-white hover:from-cyan-800 hover:to-cyan-900"
            >
              <Icon icon="mdi:plus" className="h-4 w-4" aria-hidden="true" />
              مناسبت جدید
            </Button>
          </div>
        }
      >
        <p className="mb-4 text-[0.68rem] text-muted-foreground">
          روزهای تعطیل روی موتور قیمت اثر می‌گذارند (قوانین «فقط تعطیلات» فعال و قوانین عادی غیرفعال می‌شوند).
          مناسبت سراسری همه‌ی سالن‌ها را تعطیل می‌کند و فقط سرپرست سیستم می‌تواند آن را ثبت کند.
        </p>

        {holidaysQuery.isPending ? (
          <LoadingBox text="در حال بارگذاری تقویم..." />
        ) : holidaysQuery.isError ? (
          <ErrorBox message="خطا در دریافت تقویم مناسبت‌ها" onRetry={() => holidaysQuery.refetch()} />
        ) : list.length === 0 ? (
          <EmptyBox icon="mdi:calendar-blank-outline" title="مناسبتی ثبت نشده" text="در دو سال پیشِ‌رو تعطیلی‌ای ثبت نشده است." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <Table aria-label="تعطیلات و مناسبت‌ها">
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className="font-bold">تاریخ (جلالی)</TableHead>
                  <TableHead scope="col" className="font-bold">روز</TableHead>
                  <TableHead scope="col" className="font-bold">نام</TableHead>
                  <TableHead scope="col" className="font-bold">دامنه</TableHead>
                  <TableHead scope="col" className="text-center font-bold">حذف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...list]
                  .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date))
                  .map((h) => (
                    <TableRow key={h.id} className="hover:bg-blue-600/[0.02]">
                      <TableCell className="whitespace-nowrap font-semibold text-foreground tabular-nums">{formatJalaliDate(h.holiday_date, { format: 'numeric' })}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{formatJalaliDate(h.holiday_date, { format: 'full' }).split(' ')[0]}</TableCell>
                      <TableCell className="text-foreground">{h.name}</TableCell>
                      <TableCell>
                        {h.venue_id == null ? (
                          <span className="inline-flex items-center rounded-lg bg-red-500/15 px-2 py-0.5 text-[0.68rem] font-bold text-red-700 dark:text-red-400">
                            سراسری
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-[0.68rem] font-semibold text-foreground">
                            {venueNameById(h.venue_id) ?? '—'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(h)}
                          className="text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
                        >
                          <Icon icon="mdi:trash-can-outline" className="h-4 w-4" aria-hidden="true" />
                          حذف
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* دیالوگ افزودن تک */}
      <Dialog
        open={addOpen}
        onOpenChange={(next) => {
          if (!next && !createHoliday.isPending) closeAdd()
        }}
      >
        <DialogContent aria-describedby={undefined} className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-700 to-cyan-800 text-white">
                <Icon icon="mdi:calendar-multiple" className="h-5 w-5" aria-hidden="true" />
              </span>
              <DialogTitle className="text-lg font-extrabold text-foreground">افزودن مناسبت</DialogTitle>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={nameId}>نام مناسبت</Label>
              <Input
                id={nameId}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثلاً: عید آکادمی"
              />
            </div>
            <PersianDatePicker label="تاریخ" value={newDate} onChange={setNewDate} size="small" clearable={false} />
            {isSuper && (
              <div className="flex items-center gap-2">
                <Switch id={globalId} checked={globalScope} onCheckedChange={setGlobalScope} />
                <Label htmlFor={globalId} className="cursor-pointer text-[0.68rem] font-normal text-foreground">
                  سراسری (روی همه سالن‌ها)
                </Label>
              </div>
            )}
            {!isSuper && venueId != null && (
              <p className="text-[0.68rem] text-muted-foreground">ثبت برای: {venueNameById(venueId)}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={closeAdd} disabled={createHoliday.isPending} variant="outline">
                انصراف
              </Button>
              <Button
                onClick={submitAdd}
                disabled={createHoliday.isPending}
                className="bg-gradient-to-br from-cyan-700 to-cyan-800 font-bold text-white hover:from-cyan-800 hover:to-cyan-900"
              >
                {createHoliday.isPending ? '...' : 'ثبت'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* دیالوگ افزودن دسته‌ای */}
      <Dialog
        open={bulkOpen}
        onOpenChange={(next) => {
          if (!next && !bulkHoliday.isPending) setBulkOpen(false)
        }}
      >
        <DialogContent aria-describedby={undefined} className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-700 to-cyan-800 text-white">
                <Icon icon="mdi:calendar-multiple" className="h-5 w-5" aria-hidden="true" />
              </span>
              <DialogTitle className="text-lg font-extrabold text-foreground">افزودن دسته‌ای مناسبت‌ها</DialogTitle>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-[0.68rem] text-muted-foreground">
              هر خط: «نام | تاریخ» — تاریخ جلالی (۱۴۰۵/۰۷/۰۱) یا میلادی (2026-09-23). ردیف‌های تکراری/موجود با پیام سرور رد می‌شوند.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={bulkTextId}>فهرست مناسبت‌ها</Label>
              <Textarea
                id={bulkTextId}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={6}
                placeholder={'جشن سالن | ۱۴۰۵/۰۷/۰۱\nمراسه تقدیر | ۱۴۰۵/۰۸/۱۵'}
                className="font-sans"
              />
            </div>
            {isSuper && (
              <div className="flex items-center gap-2">
                <Switch id={bulkGlobalId} checked={bulkGlobal} onCheckedChange={setBulkGlobal} />
                <Label htmlFor={bulkGlobalId} className="cursor-pointer text-[0.68rem] font-normal text-foreground">
                  سراسری (فقط سرپرست)
                </Label>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setBulkOpen(false)} disabled={bulkHoliday.isPending} variant="outline">
                انصراف
              </Button>
              <Button
                onClick={submitBulk}
                disabled={bulkHoliday.isPending}
                className="bg-gradient-to-br from-cyan-700 to-cyan-800 font-bold text-white hover:from-cyan-800 hover:to-cyan-900"
              >
                {bulkHoliday.isPending ? 'در حال ثبت...' : 'ثبت دسته‌ای'}
              </Button>
            </div>
          </div>
        </DialogContent>
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
    </div>
  )
}

export default HolidaysTab
