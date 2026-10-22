// frontend/src/components/finance/TransactionsPanel.tsx
// «هزینه‌ها و تراکنش‌ها» — دفتر کل با صفحه‌بندی سمت سرور (limit/offset)، فیلترهای
// چیپسی جهت/نوع/وضعیت + بازه جلالی، خروجی CSV با همان فیلترها (دانلود blob)،
// ابطال با دلیل اجباری و ساخت ردیف دستی.

import React, { useId, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/shadcn/button'
import { Label } from '@/components/ui/shadcn/label'
import { Separator } from '@/components/ui/shadcn/separator'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/shadcn/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import { PersianDateRangePicker } from '@/components/ui/PersianDatePicker'
import {
  useExportTransactionsCsv,
  useTransactions,
  useVoidTransaction,
  type FinanceVenue,
} from '@/hooks/useFinance'
import { useAuthStore } from '@/store/authStore'
import {
  ErrorBox,
  LoadingBox,
  Pager,
  SectionCard,
  StatusChip,
  TX_DIRECTION_LABELS,
  TX_METHOD_LABELS,
  TX_SOURCE_LABELS,
  TX_STATUS_COLORS,
  TX_STATUS_LABELS,
  TX_TYPE_LABELS,
  downloadBlob,
  extractError,
  formatRial,
  labelOf,
  statusPairOf,
} from './shared'
import TransactionEntryDialog from './TransactionEntryDialog'
import ExpenseCategoriesPanel from './ExpenseCategoriesPanel'
import type { FinanceTransaction } from '@/services/finance'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'

const PAGE_SIZE = 25
const ALL = 'all' as const

type DirectionFilter = typeof ALL | 'income' | 'expense'
type StatusFilter = typeof ALL | 'pending' | 'cleared' | 'voided'

const DIRECTION_CHIPS: { value: DirectionFilter; label: string; color: string }[] = [
  { value: ALL, label: 'همه', color: '#64748b' },
  { value: 'income', label: 'درآمد', color: '#059669' },
  { value: 'expense', label: 'هزینه', color: '#d97706' },
]

const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: ALL, label: 'همه وضعیت‌ها' },
  { value: 'cleared', label: 'قطعی' },
  { value: 'pending', label: 'در انتظار' },
  { value: 'voided', label: 'باطل' },
]

const TransactionsPanel: React.FC<{ venues: FinanceVenue[] }> = ({ venues }) => {
  const [venueSel, setVenueSel] = useState<number | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [direction, setDirection] = useState<DirectionFilter>(ALL)
  const [status, setStatus] = useState<StatusFilter>(ALL)
  const [type, setType] = useState<string>(ALL)
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [voidTx, setVoidTx] = useState<FinanceTransaction | null>(null)

  const filters = useMemo(
    () => ({
      venue_id: venueSel === 'all' ? undefined : venueSel,
      from: from || undefined,
      to: to || undefined,
      direction: direction === ALL ? undefined : direction,
      status: status === ALL ? undefined : status,
      type: type === ALL ? undefined : type,
    }),
    [venueSel, from, to, direction, status, type],
  )

  const params = useMemo(
    () => ({ ...filters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    [filters, page],
  )

  const { data, isPending, isFetching, isError, error, refetch } = useTransactions(params)
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const exportCsv = useExportTransactionsCsv()
  const handleExport = () => {
    exportCsv.mutate(
      { ...filters, limit: 20000 },
      {
        onSuccess: (blob) => {
          downloadBlob(blob, 'finance_transactions.csv')
          toast.success('فایل CSV آماده شد')
        },
        onError: (err) => toast.error(extractError(err, 'خطا در دریافت خروجی CSV')),
      },
    )
  }

  const resetPageAnd = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setPage(1)
  }

  return (
    <div>
      {/* ردیف اقدامات */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {DIRECTION_CHIPS.map((chip) => {
            const active = direction === chip.value
            const pair = statusPairOf(null, chip.color)
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => resetPageAnd(setDirection)(chip.value)}
                className="inline-flex min-h-[40px] items-center rounded-md px-2 text-[0.68rem] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  backgroundColor: active ? pair.main : 'rgba(0,0,0,0.04)',
                  color: active ? pair.on : undefined,
                }}
              >
                {chip.label}
              </button>
            )
          })}
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={handleExport} disabled={exportCsv.isPending} className="h-7 px-2 text-[0.68rem]">
            {exportCsv.isPending ? (
              <span
                className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                role="status"
                aria-label="در حال بارگذاری"
              />
            ) : (
              <Icon icon="mdi:file-download-outline" className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            خروجی CSV
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="h-7 px-2 text-[0.68rem]">
            <Icon icon="mdi:plus" className="h-3.5 w-3.5" aria-hidden="true" />
            ثبت ردیف دستی
          </Button>
        </div>
      </div>

      <SectionCard title="دفتر کل تراکنش‌ها" icon="mdi:book-ledger-outline" color="#2563eb" dense>
        {/* فیلترها */}
        <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-12">
          <div className="col-span-2 sm:col-span-4">
            <PersianDateRangePicker size="small" start={from} end={to} onStartChange={resetPageAnd(setFrom)} onEndChange={resetPageAnd(setTo)} />
          </div>
          <div className="col-span-1 sm:col-span-3">
            <Label id="tx-type-label" className="mb-1 block text-[0.68rem]">نوع</Label>
            <Select value={type} onValueChange={(v) => resetPageAnd(setType)(v)}>
              <SelectTrigger className="h-9 text-[0.68rem]" aria-labelledby="tx-type-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>همه انواع</SelectItem>
                {Object.entries(TX_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1 sm:col-span-3">
            <Label id="tx-status-label" className="mb-1 block text-[0.68rem]">وضعیت</Label>
            <Select value={status} onValueChange={(v) => resetPageAnd(setStatus)(v as StatusFilter)}>
              <SelectTrigger className="h-9 text-[0.68rem]" aria-labelledby="tx-status-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_CHIPS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 sm:col-span-2">
            <Label id="tx-venue-label" className="mb-1 block text-[0.68rem]">سالن</Label>
            <Select
              value={venueSel === 'all' ? 'all' : String(venueSel)}
              onValueChange={(v) => resetPageAnd(setVenueSel)(v === 'all' ? 'all' : Number(v))}
            >
              <SelectTrigger className="h-9 text-[0.68rem]" aria-labelledby="tx-venue-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
          <span className="text-[0.65rem] text-muted-foreground">
            {data ? `مجموع ${toPersianDigits(total)} ردیف — صفحه ${toPersianDigits(page)} از ${toPersianDigits(totalPages)}` : ''}
            {isFetching && data ? ' — به‌روزرسانی...' : ''}
          </span>
          {(direction !== ALL || status !== ALL || type !== ALL || venueSel !== 'all' || from || to) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDirection(ALL)
                setStatus(ALL)
                setType(ALL)
                setVenueSel('all')
                setFrom('')
                setTo('')
                setPage(1)
              }}
              className="text-[0.65rem] h-6 px-1.5"
            >
              <Icon icon="mdi:filter-remove-outline" className="h-3.5 w-3.5" aria-hidden="true" />
              پاک‌سازی فیلترها
            </Button>
          )}
        </div>

        {isPending && items.length === 0 ? (
          <LoadingBox text="در حال دریافت دفتر کل..." />
        ) : isError ? (
          <ErrorBox message={extractError(error, 'خطا در دریافت تراکنش‌ها')} onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <div className="py-4 text-center">
            <Icon icon="mdi:book-open-page-variant-outline" className="h-7 w-7" style={{ color: '#64748b' }} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              ردیفی با این فیلترها یافت نشد
            </p>
          </div>
        ) : (
          <div
            role="region"
            aria-label="تراکنش‌های مالی، قابل پیمایش با کیبورد"
            tabIndex={0}
            className="max-h-[480px] overflow-auto rounded-lg border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Table aria-label="تراکنش‌های مالی">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="text-[0.65rem]">ردیف</TableHead>
                  <TableHead scope="col" className="text-[0.65rem]">تاریخ</TableHead>
                  <TableHead scope="col" className="text-[0.65rem]">نوع / منبع</TableHead>
                  <TableHead scope="col" className="text-[0.65rem]">طرف‌حساب / شرح</TableHead>
                  <TableHead scope="col" className="text-[0.65rem]">سالن</TableHead>
                  <TableHead scope="col" className="text-[0.65rem]">روش</TableHead>
                  <TableHead scope="col" className="text-[0.65rem]">وضعیت</TableHead>
                  <TableHead scope="col" className="text-[0.65rem]">مبلغ</TableHead>
                  <TableHead scope="col" className="text-end text-[0.65rem]">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((tx) => {
                  const voided = tx.status === 'voided'
                  const income = tx.direction === 'income'
                  const venueName = tx.venue_id ? venues.find((v) => v.id === tx.venue_id)?.name ?? `#${toPersianDigits(tx.venue_id)}` : 'سراسری'
                  return (
                    <TableRow
                      key={tx.id}
                      className={voided ? 'bg-red-500/[0.04] hover:bg-red-500/[0.07]' : 'hover:bg-blue-600/[0.03]'}
                    >
                      <TableCell>
                        <span className="font-mono text-[0.68rem] font-bold">
                          #{toPersianDigits(tx.id)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="whitespace-nowrap text-[0.68rem]">
                          {formatJalaliDateTime(tx.occurred_at, { format: 'numeric' })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-0.5">
                          <StatusChip label={labelOf(TX_TYPE_LABELS, tx.type)} color={income ? '#059669' : '#d97706'} />
                          <span className="text-[0.65rem] text-muted-foreground">
                            {labelOf(TX_SOURCE_LABELS, tx.source_type)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.75rem] font-semibold text-foreground" title={tx.counterparty_name ?? ''}>
                          {tx.counterparty_name || (tx.expense_category_name ? `دسته: ${tx.expense_category_name}` : '—')}
                        </p>
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[0.65rem] text-muted-foreground" title={tx.description}>
                          {voided && tx.void_reason ? `ابطال: ${tx.void_reason}` : tx.description || ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="whitespace-nowrap text-[0.68rem]">{venueName}</span>
                      </TableCell>
                      <TableCell>
                        <span className="whitespace-nowrap text-[0.68rem]">{labelOf(TX_METHOD_LABELS, tx.method)}</span>
                      </TableCell>
                      <TableCell>
                        <StatusChip label={labelOf(TX_STATUS_LABELS, tx.status)} color={TX_STATUS_COLORS[tx.status] ?? '#6b7280'} />
                      </TableCell>
                      <TableCell>
                        <p
                          dir="rtl"
                          className={`whitespace-nowrap text-[0.75rem] font-extrabold tabular-nums ${
                            voided
                              ? 'text-gray-400 line-through dark:text-gray-500'
                              : income
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-red-700 dark:text-red-400'
                          }`}
                        >
                          {income ? '+' : '-'}{formatRial(tx.amount, false)}
                        </p>
                      </TableCell>
                      <TableCell className="text-end">
                        {!voided && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setVoidTx(tx)}
                            className="text-[0.68rem] font-bold text-red-600 hover:text-red-700 dark:text-red-400 h-6 px-1.5"
                          >
                            ابطال
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {total > PAGE_SIZE && (
          <Pager className="mt-3" count={totalPages} page={page} onChange={setPage} />
        )}
      </SectionCard>

      <div className="mt-4">
        <ExpenseCategoriesPanel venues={venues} />
      </div>

      <TransactionEntryDialog open={createOpen} onClose={() => setCreateOpen(false)} venues={venues} />
      <VoidTransactionDialog tx={voidTx} onClose={() => setVoidTx(null)} />
    </div>
  )
}

// ─────────────── ابطال با دلیل اجباری ───────────────

const VoidTransactionDialog: React.FC<{ tx: FinanceTransaction | null; onClose: () => void }> = ({ tx, onClose }) => {
  const [reason, setReason] = useState('')
  const reasonId = useId()
  const voidTx = useVoidTransaction()
  const isSuper = useAuthStore((s) => s.user?.role === 'super_admin')

  const trimmed = reason.trim()
  const valid = trimmed.length >= 3 && trimmed.length <= 300

  const close = () => {
    setReason('')
    onClose()
  }

  const submit = () => {
    if (!tx || !valid) return
    voidTx.mutate(
      { txId: tx.id, reason: trimmed },
      {
        onSuccess: () => {
          toast.success(`ردیف #${toPersianDigits(tx.id)} باطل شد`)
          close()
        },
        onError: (err) => toast.error(extractError(err, 'خطا در ابطال ردیف')),
      },
    )
  }

  return (
    <Dialog open={tx !== null} onClose={close} maxWidth="xs" title="ابطال ردیف دفتر کل">
      {tx && (
        <>
          <div className="mb-3 flex items-center gap-2.5 rounded-lg bg-red-500/[0.06] p-2.5">
            <Icon icon="mdi:cash-remove" className="h-5 w-5" style={{ color: '#ef4444' }} />
            <div className="min-w-0">
              <p className="text-[0.75rem] font-extrabold text-foreground">
                {formatRial(tx.amount)} · {labelOf(TX_TYPE_LABELS, tx.type)} ({labelOf(TX_DIRECTION_LABELS, tx.direction)})
              </p>
              <span className="text-[0.65rem] text-muted-foreground">
                ردیف #{toPersianDigits(tx.id)} — {formatJalaliDateTime(tx.occurred_at, { format: 'numeric' })}
              </span>
            </div>
          </div>
          {!isSuper && tx.venue_id === null && (
            <p className="mb-1.5 block text-[0.65rem] text-amber-700 dark:text-amber-400">
              توجه: ردیف بدون سالن برای مدیران قابل ابطال نیست (۴۰۳).
            </p>
          )}
          <Label htmlFor={reasonId} className="mb-1 block text-[0.68rem]">
            دلیل ابطال <span className="text-red-600">*</span>
          </Label>
          <Textarea
            id={reasonId}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            rows={2}
            aria-invalid={reason.length > 0 && !valid ? true : undefined}
          />
          <p className={reason.length > 0 && !valid ? 'mt-1 text-[0.6rem] text-red-600 dark:text-red-400' : 'mt-1 text-[0.6rem] text-muted-foreground'}>
            {valid ? '' : 'حداقل ۳ و حداکثر ۳۰۰ نویسه (اجباری)'}
          </p>
          <Separator className="mt-3" />
          <div className="mt-2.5 flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={voidTx.isPending} className="h-7 px-2 text-[0.68rem]">انصراف</Button>
            <Button
              variant="destructive"
              onClick={submit}
              disabled={!valid || voidTx.isPending}
              className="h-7 px-2 text-[0.68rem]"
            >
              {voidTx.isPending ? 'در حال ابطال...' : 'ابطال قطعی'}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  )
}

export default TransactionsPanel
