// frontend/src/components/finance/StatementDialog.tsx
// صورت‌حساب کرونولوژیک یک شخص (موجودی جاری + ردیف افتتاحیه/اختتامیه) و
// ثبت پرداخت نقدی برای همان شخص (POST /finance/accounts/{user_id}/payments).

import React, { useId, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import Dialog from '@/components/ui/Dialog'
import { PersianDateRangePicker } from '@/components/ui/PersianDatePicker'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Separator } from '@/components/ui/shadcn/separator'
import { Textarea } from '@/components/ui/shadcn/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import {
  useAccountStatement,
  useRecordAccountPayment,
  type FinanceVenue,
} from '@/hooks/useFinance'
import {
  TX_METHOD_LABELS,
  TX_STATUS_COLORS,
  TX_STATUS_LABELS,
  TX_TYPE_LABELS,
  labelOf,
  parseAmountInput,
  formatRial,
  extractError,
  StatusChip,
  LoadingBox,
  ErrorBox,
  EmptyBox,
} from './shared'
import type { TransactionMethod } from '@/services/finance'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'

interface Props {
  open: boolean
  onClose: () => void
  userId: number | null
  userName?: string | null
  venues: FinanceVenue[]
  /** مدیر (غیر ادمین) باید سالن بدهد؛ سرپرست می‌تواند سراسری ثبت کند */
  venueRequired?: boolean
}

const STATEMENT_HEADERS = ['تاریخ', 'نوع', 'مبلغ', 'اثر', 'موجودی جاری', 'وضعیت', 'شرح'] as const

const StatementDialog: React.FC<Props> = ({ open, onClose, userId, userName, venues, venueRequired = false }) => {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [payOpen, setPayOpen] = useState(false)

  const scope = useMemo(
    () => ({ from: from || undefined, to: to || undefined }),
    [from, to],
  )

  const statement = useAccountStatement(open ? userId : null, scope, open)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" title={`صورت‌حساب — ${userName || `کاربر #${userId ?? ''}`}`}>
      <div className="mb-4">
        <PersianDateRangePicker
          size="small"
          start={from}
          end={to}
          onStartChange={setFrom}
          onEndChange={setTo}
        />
      </div>

      {statement.isPending && open ? <LoadingBox text="در حال دریافت صورت‌حساب..." /> : null}
      {statement.isError ? (
        <ErrorBox
          message={extractError(statement.error, 'خطا در دریافت صورت‌حساب')}
          onRetry={() => statement.refetch()}
        />
      ) : null}

      {statement.data && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-blue-600/[0.06] p-3">
              <p className="text-xs font-semibold text-muted-foreground">موجودی افتتاحیه</p>
              <p className="mt-0.5 text-sm font-extrabold tabular-nums text-foreground">{formatRial(statement.data.opening_balance)}</p>
            </div>
            <div
              className={
                statement.data.closing_balance > 0
                  ? 'rounded-xl bg-red-500/[0.08] p-3'
                  : 'rounded-xl bg-emerald-500/[0.08] p-3'
              }
            >
              <p className="text-xs font-semibold text-muted-foreground">موجودی اختتامیه</p>
              <p
                className={
                  statement.data.closing_balance > 0
                    ? 'mt-0.5 text-sm font-extrabold tabular-nums text-red-600 dark:text-red-400'
                    : 'mt-0.5 text-sm font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400'
                }
              >
                {formatRial(statement.data.closing_balance)}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Button
                onClick={() => setPayOpen(true)}
                disabled={statement.data.closing_balance <= 0}
                title={statement.data.closing_balance <= 0 ? 'شخص بدهکار نیست' : undefined}
                className="h-full min-h-14 w-full rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-800 font-bold text-white hover:from-emerald-800 hover:to-emerald-900"
              >
                <Icon icon="mdi:cash-plus" className="h-5 w-5" />
                ثبت پرداخت
              </Button>
            </div>
          </div>

          {statement.data.entries.length === 0 ? (
            <EmptyBox icon="mdi:file-document-outline" title="ردیفی در این بازه نیست" text="برای بازه انتخاب‌شده تراکنشی ثبت نشده است." />
          ) : (
            <div
              role="region"
              aria-label="ردیف‌های صورت‌حساب، قابل پیمایش با کیبورد"
              tabIndex={0}
              className="max-h-[380px] overflow-auto rounded-xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <table className="w-full border-collapse text-[0.78rem]">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
                  <tr>
                    {STATEMENT_HEADERS.map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="whitespace-nowrap px-2.5 py-2 text-start font-bold text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {statement.data.entries.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="whitespace-nowrap px-2.5 py-1.5 text-foreground tabular-nums">
                        {formatJalaliDateTime(e.occurred_at, { format: 'numeric' })}
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-1.5 text-foreground">{labelOf(TX_TYPE_LABELS, e.type)}</td>
                      <td className="whitespace-nowrap px-2.5 py-1.5 text-foreground tabular-nums">{formatRial(e.amount, false)}</td>
                      <td
                        className={
                          e.delta > 0
                            ? 'whitespace-nowrap px-2.5 py-1.5 font-bold text-red-600 tabular-nums dark:text-red-400'
                            : 'whitespace-nowrap px-2.5 py-1.5 font-bold text-emerald-700 tabular-nums dark:text-emerald-400'
                        }
                      >
                        {e.delta > 0 ? '+' : ''}{formatRial(e.delta, false)}
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-1.5 font-bold text-foreground tabular-nums">{formatRial(e.running_balance, false)}</td>
                      <td className="px-2.5 py-1.5">
                        <StatusChip label={labelOf(TX_STATUS_LABELS, e.status)} color={TX_STATUS_COLORS[e.status] ?? '#6b7280'} />
                      </td>
                      <td className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap px-2.5 py-1.5 text-muted-foreground">
                        {toPersianDigits(e.description || '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {userId !== null && (
        <PaymentDialog
          open={payOpen}
          onClose={() => setPayOpen(false)}
          userId={userId}
          userName={userName ?? statement.data?.full_name ?? null}
          venues={venues}
          venueRequired={venueRequired}
        />
      )}
    </Dialog>
  )
}

// ─────────────── ثبت پرداخت ───────────────

const METHOD_OPTIONS: TransactionMethod[] = ['cash', 'card_to_card', 'gateway', 'pos', 'credit', 'other']

const generateIdempotencyKey = () =>
  `pay-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const PaymentDialog: React.FC<{
  open: boolean
  onClose: () => void
  userId: number
  userName?: string | null
  venues: FinanceVenue[]
  venueRequired?: boolean
}> = ({ open, onClose, userId, userName, venues, venueRequired = false }) => {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<TransactionMethod>('cash')
  const [venueId, setVenueId] = useState<number | ''>(venues.length === 1 ? venues[0].id : '')
  const [description, setDescription] = useState('')
  const [idempotencyKey] = useState(generateIdempotencyKey)

  const amountId = useId()
  const descId = useId()
  const methodId = useId()
  const venueSelectId = useId()

  const mutation = useRecordAccountPayment()

  const reset = () => {
    setAmount('')
    setMethod('cash')
    setDescription('')
    onClose()
  }

  const submit = () => {
    const parsed = amount.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[,\s]/g, '')
    const value = Number(parsed)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('مبلغ را به درستی وارد کنید')
      return
    }
    if (venueRequired && venueId === '') {
      toast.error('انتخاب سالن الزامی است')
      return
    }
    mutation.mutate(
      {
        userId,
        data: {
          amount: Math.round(value),
          method,
          venue_id: venueId === '' ? null : venueId,
          description: description.trim(),
          idempotency_key: idempotencyKey,
        },
      },
      {
        onSuccess: (tx) => {
          toast.success(`پرداخت ثبت شد (ردیف #${tx.id})`)
          reset()
        },
        onError: (err) => toast.error(extractError(err, 'خطا در ثبت پرداخت')),
      },
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" title={`ثبت پرداخت — ${userName || `کاربر #${userId}`}`}>
      <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor={amountId}>مبلغ (ریال)</Label>
          <Input
            id={amountId}
            autoFocus
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={methodId}>روش</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as TransactionMethod)}>
            <SelectTrigger id={methodId} aria-labelledby={methodId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHOD_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>{TX_METHOD_LABELS[m] ?? m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={venueSelectId}>سالن</Label>
          <Select
            value={venueId === '' ? '' : String(venueId)}
            onValueChange={(v) => setVenueId(v === 'global' ? '' : Number(v))}
          >
            <SelectTrigger id={venueSelectId} aria-required={venueRequired || undefined}>
              <SelectValue placeholder={venueRequired ? 'انتخاب سالن' : 'سراسری (بدون سالن)'} />
            </SelectTrigger>
            <SelectContent>
              {!venueRequired && <SelectItem value="global">سراسری (بدون سالن)</SelectItem>}
              {venues.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor={descId}>شرح</Label>
          <Textarea
            id={descId}
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <Separator className="mt-4" />
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
          انصراف
        </Button>
        <span className="ms-auto inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
          <Icon icon="mdi:bank-outline" className="h-4 w-4" aria-hidden="true" />
          {`مبلغ: ${formatRial(Number.isNaN(parseAmountInput(amount)) ? 0 : parseAmountInput(amount))}`}
        </span>
        <Button
          onClick={submit}
          disabled={mutation.isPending}
          className="bg-gradient-to-br from-emerald-700 to-emerald-800 text-white hover:from-emerald-800 hover:to-emerald-900"
        >
          {mutation.isPending ? 'در حال ثبت...' : 'ثبت پرداخت'}
        </Button>
      </div>
    </Dialog>
  )
}

export default StatementDialog
