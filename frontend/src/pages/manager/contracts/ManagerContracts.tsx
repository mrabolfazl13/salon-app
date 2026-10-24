// frontend/src/pages/manager/contracts/ManagerContracts.tsx
// «مدیریت قراردادها» — تب صف درخواست‌های PENDING (approve-with-changes/رد با دلیل)
// و تب همه قراردادها با فیلتر وضعیت/سالن/جستجو. جدول‌ها افقی اسکرول می‌شوند (الگوی کنسول مالی).
// نکته: ردیف مدیر شامل user_phone و outstanding_amount است (بک‌اند §8b) — صف تأیید
// و جدول «همه قراردادها» روزهای هفتگی چندروزه (contract.days) را کامل نشان می‌دهند.

import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import toast from 'react-hot-toast'
import {
  useManagerAllContracts,
  useManagerPendingContracts,
  useRejectContract,
} from '@/hooks/useContracts'
import { useManagedVenues } from '@/hooks/useStaffMe'
import {
  CONTRACT_STATUS_META,
  CONTRACT_TAB_STATUSES,
  contractStatusMeta,
  EmptyBox,
  ErrorBox,
  faNum,
  formatRial,
  paymentStatusMeta,
  pyDayNames,
  ReasonDialog,
  SectionCard,
  StatusChip,
  toPersianDigits,
} from '@/components/contract/shared'
import ContractApproveDialog, { type ApproveTarget } from '@/components/contract/manager/ContractApproveDialog'
import { ForbiddenPanel, isForbidden } from '@/components/crm/shared'
import type { ContractManagerRow, ContractStatusValue } from '@/services/contract'
import { formatJalaliDate, getTodayISO } from '@/lib/jalali'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs'
import { Input } from '@/components/ui/shadcn/input'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/shadcn/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/shadcn/table'
import { cn } from '@/lib/utils'

const timeWindow = (start: string, duration: number): string => {
  const [h, m] = (start || '00:00').slice(0, 5).split(':').map(Number)
  const end = ((h * 60 + (m || 0) + duration) % 1440)
  const eh = String(Math.floor(end / 60)).padStart(2, '0')
  const em = String(end % 60).padStart(2, '0')
  return `${toPersianDigits(start.slice(0, 5))} تا ${toPersianDigits(`${eh}:${em}`)}`
}

/** برچسب فارسی روز(های) هفته قرارداد — تک‌روزه fallback به day_of_week */
const dayNamesOf = (c: { day_of_week: number; days?: number[] }): string => {
  const days = c.days && c.days.length > 0 ? c.days : [c.day_of_week]
  return days.map((d) => pyDayNames[d] ?? '—').join('، ')
}

const actionBtn =
  'inline-flex min-h-9 items-center gap-1.5 rounded-[10px] px-3 text-[0.68rem] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const ManagerContracts: React.FC = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [venueFilter, setVenueFilter] = useState<number | ''>('')
  const [search, setSearch] = useState('')
  const [approveTarget, setApproveTarget] = useState<ApproveTarget | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ContractManagerRow | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const pendingQuery = useManagerPendingContracts(tab === 0)
  const allQuery = useManagerAllContracts(
    { status: (statusFilter || undefined) as ContractStatusValue | undefined, venue_id: venueFilter },
    tab === 1,
  )
  // فیلتر سالن — دامنه ادغام‌شده مدیر + کارمند (/staff/me)
  const venuesQuery = useManagedVenues(tab === 1)
  const rejectMutation = useRejectContract()

  const filteredRows = useMemo(() => {
    const rows = allQuery.data ?? []
    const q = search.trim()
    if (!q) return rows
    return rows.filter((r) =>
      (r.user_full_name || '').includes(q) ||
      String(r.contract.user_id) === q ||
      r.venue_name.includes(q) ||
      String(r.contract.id) === q)
  }, [allQuery.data, search])

  const approveFrom = (row: ContractManagerRow): ApproveTarget => ({
    contractId: row.contract.id,
    venueName: row.venue_name,
    userName: row.user_full_name,
    pricePerSession: row.contract.discounted_price,
    originalPrice: row.contract.original_price,
    totalSessions: row.total_sessions,
    currentPolicy: row.contract.cancellation_policy,
  })

  return (
    <Layout>
      <div className="py-4">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-extrabold md:text-3xl">مدیریت قراردادها</h1>
          <p className="text-[0.68rem] text-muted-foreground">صف تأیید و پرونده قراردادهای سالن‌های شما</p>
        </div>

        <Tabs value={String(tab)} onValueChange={(v) => setTab(Number(v))} className="mb-4">
          <TabsList>
            <TabsTrigger value="0" className="gap-2">
              <Icon icon="mdi:inbox-arrow-up" className="h-5 w-5" aria-hidden="true" />
              صف درخواست‌ها{pendingQuery.data ? ` (${toPersianDigits(pendingQuery.data.length)})` : ''}
            </TabsTrigger>
            <TabsTrigger value="1" className="gap-2">
              <Icon icon="mdi:file-document-multiple-outline" className="h-5 w-5" aria-hidden="true" />
              همه قراردادها
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ─────────── تب صف ─────────── */}
        {tab === 0 && (
          pendingQuery.isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2].map((i) => <Skeleton aria-hidden="true" key={i} className="h-[190px] rounded-lg" />)}
            </div>
          ) : pendingQuery.isError ? (
            isForbidden(pendingQuery.error) ? (
              <ForbiddenPanel detail="برای دیدن صف قراردادها باید contract.view (پذیرش به بالا) یا مدیریت سالن داشته باشید." />
            ) : (
              <ErrorBox message="دریافت صف درخواست‌ها ناموفق بود." onRetry={() => pendingQuery.refetch()} />
            )
          ) : (pendingQuery.data ?? []).length === 0 ? (
            <EmptyBox
              icon="mdi:inbox-arrow-up-outline"
              title="صف خالی است"
              text="درخواست در انتظار تأییدی برای سالن‌های شما وجود ندارد."
            />
          ) : (
            <div className="flex flex-col gap-4">
              {(pendingQuery.data ?? []).map((row) => {
                const c = row.contract
                const diffPct = c.original_price > 0
                  ? Math.round((1 - c.discounted_price / c.original_price) * 100) : 0
                return (
                  <div key={c.id} className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-3">
                    <div className="flex flex-wrap justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-sm font-extrabold">
                          {row.user_full_name || `کاربر #${faNum(c.user_id)}`}
                        </h2>
                        <p className="text-[0.68rem] text-muted-foreground" dir="ltr">
                          {`${row.user_phone || '—'} — ${row.venue_name}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusChip label={`قرارداد #${faNum(c.id)}`} color="#6b7280" />
                        <StatusChip
                          label={c.end_date >= getTodayISO() ? `سرعت: ${toPersianDigits(diffPct)}٪ تخفیف` : 'بازه منقضی'}
                          color={c.end_date >= getTodayISO() ? '#d97706' : '#6b7280'}
                        />
                        {(row.outstanding_amount ?? 0) > 0 && (
                          <StatusChip label={`معوق: ${formatRial(row.outstanding_amount ?? 0)}`} color="#dc2626" />
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <span className="text-[0.68rem] text-muted-foreground">زمان هفتگی</span>
                        <p className="text-[0.68rem] font-bold">
                          {`${dayNamesOf(c)} — ${timeWindow(c.start_time, c.duration)}`}
                        </p>
                        {(c.days?.length ?? 0) > 1 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {c.days!.map((d) => (
                              <span key={d} className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[0.68rem] font-bold text-primary">
                                {pyDayNames[d] ?? d}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-[0.68rem] text-muted-foreground">بازه و سانس‌ها</span>
                        <p className="text-[0.68rem] font-bold">
                          {`${formatJalaliDate(c.start_date)} تا ${formatJalaliDate(c.end_date)}`}
                        </p>
                        <span className="text-[0.68rem] text-muted-foreground/70">
                          {`${toPersianDigits(row.total_sessions)} سانس درخواستی`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[0.68rem] text-muted-foreground">قیمت پیشنهادی / قیمت پایه سانس</span>
                        <p className="text-[0.68rem] font-bold text-primary">
                          {formatRial(c.discounted_price)}
                        </p>
                        <span className="text-[0.68rem] text-muted-foreground/70">
                          {`پایه: ${formatRial(c.original_price)}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[0.68rem] text-muted-foreground">مبلغ کل / پیش‌پرداخت درخواستی</span>
                        <p className="text-[0.68rem] font-bold">{formatRial(c.total_amount)}</p>
                        <span className="text-[0.68rem] text-muted-foreground/70">
                          {c.down_payment_amount ? `پیش‌پرداخت: ${formatRial(c.down_payment_amount)}` : 'بدون پیش‌پرداخت'}
                        </span>
                      </div>
                    </div>

                    {c.description && (
                      <p className="mt-3 text-[0.8rem] text-muted-foreground">
                        {`یادداشت متقاضی: ${c.description}`}
                      </p>
                    )}

                    <hr className="my-3 border-border" />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/manager/contracts/${c.id}`)}
                        className={cn(actionBtn, 'bg-primary text-white hover:bg-primary/90')}
                      >
                        <Icon icon="mdi:eye-outline" className="h-4 w-4" aria-hidden="true" />
                        مشاهده و اقدام
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const t = approveFrom(row)
                          if (!Number.isFinite(t.totalSessions)) t.totalSessions = 0
                          setApproveTarget(t)
                        }}
                        className={cn(actionBtn, 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/10')}
                      >
                        <Icon icon="mdi:check-decagram-outline" className="h-4 w-4" aria-hidden="true" />
                        تأیید با تغییرات
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRejectTarget(row); setDialogError(null) }}
                        className={cn(actionBtn, 'border border-destructive/50 text-destructive hover:bg-destructive/10')}
                      >
                        <Icon icon="mdi:close-octagon-outline" className="h-4 w-4" aria-hidden="true" />
                        رد درخواست
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ─────────── تب همه قراردادها ─────────── */}
        {tab === 1 && (
          <SectionCard title="فیلترها" icon="mdi:filter-variant" dense>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={statusFilter === ''}
                  onClick={() => setStatusFilter('')}
                  className={cn(
                    'min-h-11 rounded-lg px-3 text-[0.68rem] font-semibold transition-colors',
                    statusFilter === ''
                      ? 'bg-primary text-white'
                      : 'border border-border hover:bg-muted'
                  )}
                >
                  همه
                </button>
                {CONTRACT_TAB_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={statusFilter === s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      'min-h-11 rounded-lg px-3 text-[0.68rem] font-semibold transition-colors',
                      statusFilter === s
                        ? 'bg-primary text-white'
                        : 'border border-border hover:bg-muted'
                    )}
                  >
                    {CONTRACT_STATUS_META[s].label}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <Select
                value={venueFilter === '' ? 'all' : String(venueFilter)}
                onValueChange={(v) => setVenueFilter(v === 'all' ? '' : Number(v))}
              >
                <SelectTrigger aria-label="سالن" className="min-w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه سالن‌ها</SelectItem>
                  {(venuesQuery.data ?? []).map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="جستجو: نام کاربر / شناسه"
                aria-label="جستجوی کاربر بر اساس نام یا شناسه"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[210px]"
              />
            </div>

            <div className="mt-4">
              {allQuery.isLoading ? (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((i) => <Skeleton aria-hidden="true" key={i} className="h-[52px] rounded-xl" />)}
                </div>
              ) : allQuery.isError ? (
                isForbidden(allQuery.error) ? (
                  <ForbiddenPanel detail="برای دیدن قراردادهای سالن باید contract.view (پذیرش به بالا) یا مدیریت سالن داشته باشید." />
                ) : (
                  <ErrorBox message="دریافت قراردادها ناموفق بود." onRetry={() => allQuery.refetch()} />
                )
              ) : filteredRows.length === 0 ? (
                <EmptyBox icon="mdi:file-search-outline" title="قراردادی با این فیلترها نیست" />
              ) : (
                <div className="overflow-x-auto">
                  <Table aria-label="لیست قراردادها" className="min-w-[880px]">
                    <TableHeader>
                      <TableRow>
                        {['#', 'متقاضی', 'سالن', 'بازه / برنامه', 'سانس', 'قیمت و کل', 'پرداخت', 'وضعیت', ''].map((h, i) => (
                          <TableHead scope="col" key={i} className="whitespace-nowrap text-[0.68rem] font-bold">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.map((row) => {
                        const c = row.contract
                        const pm = paymentStatusMeta(c.payment_status)
                        const sm = contractStatusMeta(c.status)
                        const go = () => navigate(`/manager/contracts/${c.id}`)
                        return (
                          <TableRow
                            key={c.id}
                            tabIndex={0}
                            onClick={go}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                go()
                              }
                            }}
                            className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                          >
                            <TableCell className="text-[0.8rem] font-bold">{faNum(c.id)}</TableCell>
                            <TableCell className="whitespace-nowrap text-[0.8rem]">
                              {row.user_full_name || `کاربر #${faNum(c.user_id)}`}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-[0.8rem]">{row.venue_name}</TableCell>
                            <TableCell className="whitespace-nowrap text-[0.68rem]">
                              {`${formatJalaliDate(c.start_date)} تا ${formatJalaliDate(c.end_date)}`}
                              <span className="block text-muted-foreground/70">
                                {`${dayNamesOf(c)} ${(c.start_time || '').slice(0, 5)}`}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-[0.8rem]">
                              {`${toPersianDigits(row.total_sessions)} کل / ${toPersianDigits(row.sessions_upcoming)} آینده`}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-[0.78rem]">
                              {formatRial(c.total_amount)}
                              <span className="block text-muted-foreground/70">
                                {`${formatRial(c.discounted_price)} / سانس`}
                              </span>
                            </TableCell>
                            <TableCell><StatusChip label={pm.label} color={pm.color} /></TableCell>
                            <TableCell><StatusChip label={sm.label} color={sm.color} /></TableCell>
                            <TableCell className="text-start">
                              <Icon icon="mdi:chevron-left" className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </SectionCard>
        )}
      </div>

      <ContractApproveDialog
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        target={approveTarget}
      />

      <ReasonDialog
        open={Boolean(rejectTarget)}
        title="رد درخواست قرارداد"
        description={
          rejectTarget
            ? `با رد، ${toPersianDigits(rejectTarget.sessions_upcoming)} سانس آینده در تقویم سالن آزاد می‌شود و به متقاضی «${rejectTarget.user_full_name || '—'}» اعلام می‌گردد.`
            : ''
        }
        reasonLabel="دلیل رد (حداقل ۳ کاراکتر)"
        confirmText="رد درخواست"
        loading={rejectMutation.isPending}
        errorText={dialogError}
        onClose={() => setRejectTarget(null)}
        onSubmit={async (reason) => {
          if (!rejectTarget) return
          try {
            await rejectMutation.mutateAsync({ contractId: rejectTarget.contract.id, reason })
            toast.success('درخواست رد و سانس‌ها آزاد شدند')
            setRejectTarget(null)
          } catch (err) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
            setDialogError(typeof detail === 'string' ? detail : 'رد درخواست ناموفق بود')
          }
        }}
      />
    </Layout>
  )
}

export default ManagerContracts
