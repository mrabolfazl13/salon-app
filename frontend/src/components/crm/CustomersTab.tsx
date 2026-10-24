// frontend/src/components/crm/CustomersTab.tsx
// «مشتریان» — نوار فیلتر (جست‌وجو/segment/VIP/مرتب‌سازی) + جدول با صفحه‌بندی
// سمت سرور + سوییچ سریع VIP + پنل جزئیات (CustomerDetailDialog).

import React, { useEffect, useId, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { EmptyBox, ErrorBox, LoadingBox, Pager, formatRial } from '@/components/finance/shared'
import { formatJalaliDate, toPersianDigits } from '@/lib/jalali'
import { useCrmCustomers, useUpdateCrmCustomer } from '@/hooks/useCrm'
import type { CrmCustomerRow, CrmSort } from '@/services/crm'
import CustomerDetailDialog from './CustomerDetailDialog'
import { ForbiddenPanel, SegmentChip, SEGMENT_LABELS, SEGMENT_ORDER, ConsentIcon, crmErrorMessage, isForbidden } from './shared'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
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

const PAGE_SIZE = 20

const SORT_OPTIONS: { value: CrmSort; label: string }[] = [
  { value: 'last_visit', label: 'آخرین بازدید' },
  { value: 'spend', label: 'بیشترین پرداختی' },
  { value: 'bookings', label: 'بیشترین رزرو' },
]

const TAG_CHIP = 'inline-flex h-4 items-center rounded-md bg-violet-600/[0.08] px-1.5 text-[0.6rem] font-semibold text-violet-700 dark:text-violet-300'
const MOBILE_CHIP = 'inline-flex h-[22px] items-center rounded-lg px-2 text-[0.68rem] font-bold leading-none'

interface Props {
  venueId: number
}

const CustomersTab: React.FC<Props> = ({ venueId }) => {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState<string | null>(null)
  const [vipOnly, setVipOnly] = useState(false)
  const [sort, setSort] = useState<CrmSort>('last_visit')
  const [page, setPage] = useState(1)
  const [detailUserId, setDetailUserId] = useState<number | null>(null)

  const searchId = useId()

  // debounce جست‌وجو
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const params = useMemo(
    () => ({
      venue_id: venueId,
      search: search || undefined,
      segment: segment ?? undefined,
      is_vip: vipOnly ? true : undefined,
      sort,
      status: 'all' as const,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    [venueId, search, segment, vipOnly, sort, page],
  )

  const query = useCrmCustomers(params)
  const updateCustomer = useUpdateCrmCustomer()
  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const toggleVip = (row: CrmCustomerRow) => {
    updateCustomer.mutate(
      { userId: row.user_id, venueId, data: { is_vip: !row.is_vip } },
      {
        onSuccess: () => toast.success(row.is_vip ? 'VIP برداشته شد' : 'مشتری ویژه شد ⭐'),
        onError: (err) => toast.error(crmErrorMessage(err, 'خطا در تغییر وضعیت VIP')),
      },
    )
  }

  const inactiveBadge = (row: CrmCustomerRow) => {
    if (row.inactive_days === null) return <span className="text-[0.68rem] text-muted-foreground">بدون بازدید</span>
    const color = row.segment === 'dormant' ? '#64748b' : row.segment === 'at_risk' ? '#ef4444' : '#059669'
    return (
      <span className="ms-1.5 text-[0.68rem] font-bold tabular-nums" style={{ color }}>
        {toPersianDigits(row.inactive_days)} روز
      </span>
    )
  }

  return (
    <div>
      {/* نوار فیلتر */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex min-w-full flex-col gap-1.5 sm:min-w-[260px] sm:flex-1 md:flex-none">
          <Label htmlFor={searchId}>جست‌وجوی مشتری</Label>
          <Input
            id={searchId}
            placeholder="جست‌وجوی نام یا شماره موبایل..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="گروه مشتری">
          {SEGMENT_ORDER.map((s) => {
            const active = segment === s
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => { setSegment(active ? null : s); setPage(1) }}
                className={
                  active
                    ? 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-[9px] bg-blue-600 px-3 text-[0.68rem] font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    : 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-[9px] bg-muted px-3 text-[0.68rem] font-bold text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                }
              >
                {SEGMENT_LABELS[s]}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          aria-pressed={vipOnly}
          onClick={() => { setVipOnly((v) => !v); setPage(1) }}
          className={
            vipOnly
              ? 'inline-flex min-h-11 items-center gap-1.5 rounded-[9px] bg-amber-500 px-3 text-[0.68rem] font-bold text-stone-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              : 'inline-flex min-h-11 items-center gap-1.5 rounded-[9px] border border-border bg-card px-3 text-[0.68rem] font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          }
        >
          <Icon icon="mdi:star" className="h-4 w-4" aria-hidden="true" />
          فقط VIP
        </button>
        <div className="ms-auto min-w-[150px]">
          <Select value={sort} onValueChange={(v) => { setSort(v as CrmSort); setPage(1) }}>
            <SelectTrigger aria-label="مرتب‌سازی مشتریان" className="min-h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {query.isPending ? (
        <LoadingBox text="در حال دریافت مشتریان..." />
      ) : query.isError ? (
        isForbidden(query.error) ? <ForbiddenPanel /> : (
          <ErrorBox message={crmErrorMessage(query.error, 'دریافت مشتریان ممکن نشد')} onRetry={() => query.refetch()} />
        )
      ) : items.length === 0 ? (
        <EmptyBox icon="mdi:account-group-outline" title="مشتری‌ای با این فیلترها پیدا نشد" text="ابتدا در سالن خود رزرو ثبت کنید تا مشتریان اینجا نمایش داده شوند." />
      ) : (
        <>
          <div className="hidden overflow-auto rounded-lg border border-border bg-card shadow-sm md:block">
            <Table aria-label="لیست مشتریان" className="min-w-[880px]">
              <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80">
                <TableRow className="hover:bg-transparent">
                  {['مشتری', 'موبایل', 'رزرو', 'مجموع پرداختی', 'مانده', 'امتیاز', 'آخرین بازدید', 'گروه', ''].map((h, i) => (
                    <TableHead key={i} scope="col" className="whitespace-nowrap font-extrabold">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow
                    key={row.user_id}
                    tabIndex={0}
                    onClick={() => setDetailUserId(row.user_id)}
                    // سطر کلیک‌پذیر بدون کیبورد = کنترل دست‌نیافتنی
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setDetailUserId(row.user_id)
                      }
                    }}
                    className="cursor-pointer hover:bg-blue-600/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[0.68rem] font-bold text-foreground">
                          {row.full_name ?? '—'}
                        </span>
                        {row.tags.slice(0, 2).map((t) => (
                          <span key={t} className={TAG_CHIP}>{t}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell dir="ltr" className="tabular-nums text-foreground">{row.phone ?? '—'}</TableCell>
                    <TableCell className="tabular-nums text-foreground">{toPersianDigits(row.bookings_count)}</TableCell>
                    <TableCell className="whitespace-nowrap font-bold text-foreground tabular-nums">{formatRial(row.total_spend)}</TableCell>
                    <TableCell
                      className={
                        row.balance_due > 0
                          ? 'whitespace-nowrap font-extrabold text-red-600 tabular-nums dark:text-red-400'
                          : row.balance_due < 0
                            ? 'whitespace-nowrap font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400'
                            : 'whitespace-nowrap font-extrabold text-muted-foreground tabular-nums'
                      }
                    >
                      {row.balance_due > 0 ? formatRial(row.balance_due) : row.balance_due < 0 ? formatRial(-row.balance_due) + ' (اعتبار)' : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="inline-flex h-[22px] items-center gap-1 rounded-lg bg-amber-500/10 px-2 text-[0.68rem] font-extrabold text-amber-700 tabular-nums dark:text-amber-400"
                            tabIndex={0}
                          >
                            <Icon icon="mdi:star-four-points" className="h-3.5 w-3.5" aria-hidden="true" />
                            {toPersianDigits(row.loyalty_balance ?? 0)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>امتیاز وفاداری</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="block text-[0.68rem] font-semibold text-foreground tabular-nums">
                        {row.last_booking_date ? formatJalaliDate(row.last_booking_date, { format: 'numeric' }) : '—'}
                      </span>
                      {inactiveBadge(row)}
                    </TableCell>
                    <TableCell><SegmentChip segment={row.segment} /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex px-1">
                              <ConsentIcon consent={row.marketing_consent} />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>رضایت بازاریابی</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => toggleVip(row)}
                              disabled={updateCustomer.isPending}
                              aria-label={row.is_vip ? `خارج کردن ${row.full_name ?? row.phone ?? ''} از مشتریان ویژه` : `افزودن ${row.full_name ?? row.phone ?? ''} به مشتریان ویژه`}
                              aria-pressed={row.is_vip}
                              className={
                                row.is_vip
                                  ? 'inline-flex min-h-11 w-11 items-center justify-center rounded-lg text-amber-500 transition-colors hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'
                                  : 'inline-flex min-h-11 w-11 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'
                              }
                            >
                              <Icon icon={row.is_vip ? 'mdi:star' : 'mdi:star-outline'} className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{row.is_vip ? 'حذف از مشتریان ویژه' : 'افزودن به مشتریان ویژه'}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {items.map((row) => (
              <div
                key={row.user_id}
                className="relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm active:scale-[0.98]"
              >
                {/* کنترل‌های تعاملی بیرون از دکمهٔ کارت‌اند: دکمهٔ تودرتو در HTML مجاز نیست
                    و روی نامِ دکمه هم سایه می‌اندازد */}
                <div className="absolute top-3.5 end-3.5 flex items-center gap-1">
                  <ConsentIcon consent={row.marketing_consent} />
                  <button
                    type="button"
                    onClick={() => toggleVip(row)}
                    disabled={updateCustomer.isPending}
                    aria-label={`مشتری ویژه: ${row.full_name ?? row.phone ?? ''}`}
                    aria-pressed={row.is_vip}
                    className={
                      row.is_vip
                        ? 'inline-flex min-h-11 w-11 items-center justify-center rounded-lg text-amber-500 transition-colors hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        : 'inline-flex min-h-11 w-11 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    }
                  >
                    <Icon icon={row.is_vip ? 'mdi:star' : 'mdi:star-outline'} className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`مشاهده جزئیات ${row.full_name ?? row.phone ?? 'مشتری'}`}
                  onClick={() => setDetailUserId(row.user_id)}
                  className="block w-full cursor-pointer appearance-none rounded-xl border-0 bg-transparent p-0 m-0 text-start font-[inherit] text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="mb-3 min-w-0 pe-[92px]">
                    <p className="truncate text-[0.68rem] font-extrabold text-foreground">
                      {row.full_name ?? '—'}
                    </p>
                    <p className="block text-[0.68rem] text-muted-foreground" dir="ltr">
                      {row.phone ?? '—'}
                    </p>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-2">
                    <SegmentChip segment={row.segment} />
                    <span className={`${MOBILE_CHIP} gap-1 bg-blue-600/[0.08] text-blue-700 dark:text-blue-300`}>
                      <Icon icon="mdi:calendar-check-outline" className="h-3.5 w-3.5" aria-hidden="true" />
                      {`${toPersianDigits(row.bookings_count)} رزرو`}
                    </span>
                    <span className={`${MOBILE_CHIP} gap-1 bg-amber-500/10 text-amber-700 tabular-nums dark:text-amber-400`}>
                      <Icon icon="mdi:star-four-points" className="h-3.5 w-3.5" aria-hidden="true" />
                      {toPersianDigits(row.loyalty_balance ?? 0)}
                    </span>
                    {row.tags.slice(0, 2).map((t) => (
                      <span key={t} className={`${MOBILE_CHIP} bg-violet-600/[0.08] text-violet-700 dark:text-violet-300`}>{t}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-dashed border-border pt-3">
                    <div>
                      <span className="block text-[0.68rem] text-muted-foreground">پرداختی</span>
                      <span className="block text-[0.68rem] font-extrabold text-foreground tabular-nums">
                        {formatRial(row.total_spend)}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[0.68rem] text-muted-foreground">مانده</span>
                      <span
                        className={
                          row.balance_due > 0
                            ? 'block text-[0.68rem] font-extrabold text-red-600 tabular-nums dark:text-red-400'
                            : row.balance_due < 0
                              ? 'block text-[0.68rem] font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400'
                              : 'block text-[0.68rem] font-extrabold text-muted-foreground tabular-nums'
                        }
                      >
                        {row.balance_due > 0 ? formatRial(row.balance_due) : row.balance_due < 0 ? formatRial(-row.balance_due) : '—'}
                      </span>
                    </div>
                    <div className="text-end">
                      <span className="block text-[0.68rem] text-muted-foreground">بازدید</span>
                      <span className="block text-[0.68rem] font-bold text-foreground tabular-nums">
                        {row.last_booking_date ? formatJalaliDate(row.last_booking_date, { format: 'numeric' }) : '—'}
                      </span>
                      {inactiveBadge(row)}
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {!query.isPending && !query.isError && total > PAGE_SIZE && (
        <div className="mt-5 flex justify-center">
          <Pager count={totalPages} page={page} onChange={setPage} />
        </div>
      )}
      {!query.isPending && !query.isError && total > 0 && (
        <p className="mt-2 block text-center text-[0.68rem] text-muted-foreground">
          {toPersianDigits(total)} مشتری — صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
        </p>
      )}

      <CustomerDetailDialog userId={detailUserId} venueId={venueId} onClose={() => setDetailUserId(null)} />
    </div>
  )
}

export default CustomersTab
