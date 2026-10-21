// frontend/src/components/contract/ContractPaymentsTable.tsx
// تقویم اقساط قرارداد — سررسید جلالی، مبلغ (ریال)، وضعیت مشتق‌شده؛
// دکمه «پرداخت» (درگاه شبیه‌سازی‌شده) برای مالک و «ابطال» برای مدیر.

import React from 'react'
import { Icon } from '@iconify/react'
import { formatJalaliDate, formatJalaliDateTime } from '@/lib/jalali'
import { formatRial, installmentState, StatusChip, toPersianDigits } from '@/components/contract/shared'
import { Button } from '@/components/ui/shadcn/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'
import type { ContractPaymentData } from '@/services/contract'

interface ContractPaymentsTableProps {
  payments: ContractPaymentData[]
  /** مالک قرارداد باشد (فقط پرداخت‌کننده مجاز است) */
  canPay?: boolean
  /** مدیر سالن باشد */
  canVoid?: boolean
  /** نمای مدیر: دریافت نقدی (POST mark-paid — cashier/branch/owner با finance.record_payment) */
  canMarkPaid?: boolean
  busyPaymentId?: number | null
  busyMarkPaidId?: number | null
  onPay?: (payment: ContractPaymentData) => void
  onVoid?: (payment: ContractPaymentData) => void
  onMarkPaid?: (payment: ContractPaymentData) => void
}

const ContractPaymentsTable: React.FC<ContractPaymentsTableProps> = ({
  payments,
  canPay = false,
  canVoid = false,
  canMarkPaid = false,
  busyPaymentId = null,
  busyMarkPaidId = null,
  onPay,
  onVoid,
  onMarkPaid,
}) => {
  if (payments.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        تقویم اقساط هنوز تولید نشده است — پس از تأیید قرارداد توسط مدیر صادر می‌شود.
      </p>
    )
  }

  const sorted = [...payments].sort((a, b) => (a.due_date < b.due_date ? -1 : 1))

  return (
    <Table aria-label="اقساط قرارداد" className="min-w-[560px] text-[0.82rem]">
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className="whitespace-nowrap text-[0.76rem] font-bold">قسط</TableHead>
          <TableHead scope="col" className="whitespace-nowrap text-[0.76rem] font-bold">سررسید</TableHead>
          <TableHead scope="col" className="whitespace-nowrap text-[0.76rem] font-bold">مبلغ</TableHead>
          <TableHead scope="col" className="whitespace-nowrap text-[0.76rem] font-bold">وضعیت</TableHead>
          <TableHead scope="col" className="whitespace-nowrap text-[0.76rem] font-bold">توضیحات</TableHead>
          <TableHead scope="col" className="whitespace-nowrap text-end text-[0.76rem] font-bold">عملکرد</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((p) => {
          const state = installmentState(p)
          const payable = canPay && !p.is_paid && !p.is_voided
          const markable = canMarkPaid && !p.is_paid && !p.is_voided
          const voidable = canVoid && !p.is_voided
          return (
            <TableRow key={p.id} className={p.is_voided ? 'opacity-[0.55]' : undefined}>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Icon
                    icon={p.record_type === 'down_payment' ? 'mdi:bank-outline' : 'mdi:calendar-text-outline'}
                    className="h-4 w-4"
                    style={{ color: p.record_type === 'down_payment' ? '#7c3aed' : '#6b7280' }}
                  />
                  <span className="text-[0.82rem] font-bold">
                    {p.label || (p.record_type === 'down_payment' ? 'پیش‌پرداخت' : `قسط ${toPersianDigits(p.installment_no ?? 0)}`)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatJalaliDate(p.due_date)}</TableCell>
              <TableCell className="whitespace-nowrap font-bold tabular-nums">
                <span className={p.is_voided ? 'line-through' : undefined}>
                  {formatRial(p.amount)}
                </span>
              </TableCell>
              <TableCell><StatusChip label={state.label} color={state.color} /></TableCell>
              <TableCell className="max-w-[240px]">
                {p.is_paid && !p.is_voided ? (
                  <span className="text-xs text-muted-foreground">
                    پرداخت {formatJalaliDateTime(p.paid_at)}
                    {p.transaction_id && (
                      <> — کد تراکنش <span dir="ltr" className="text-[0.75rem]">{p.transaction_id.slice(0, 8)}</span></>
                    )}
                  </span>
                ) : p.is_voided ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-red-600 dark:text-red-400">باطل: {p.void_reason || '—'}</span>
                    </TooltipTrigger>
                    <TooltipContent>{p.void_reason || ''}</TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-end">
                {payable && (
                  <Button
                    size="sm"
                    disabled={busyPaymentId === p.id}
                    onClick={() => onPay?.(p)}
                    className="text-xs font-bold"
                  >
                    {busyPaymentId === p.id ? '...' : (
                      <>
                        <Icon icon="mdi:credit-card-outline" className="h-4 w-4" />
                        پرداخت
                      </>
                    )}
                  </Button>
                )}
                {markable && (
                  <Button
                    size="sm"
                    disabled={busyMarkPaidId === p.id}
                    onClick={() => onMarkPaid?.(p)}
                    className="me-1 text-xs font-bold !bg-none bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {busyMarkPaidId === p.id ? '...' : (
                      <>
                        <Icon icon="mdi:cash-outline" className="h-4 w-4" />
                        دریافت نقدی
                      </>
                    )}
                  </Button>
                )}
                {voidable && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyPaymentId === p.id}
                    onClick={() => onVoid?.(p)}
                    className="text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
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
  )
}

export default ContractPaymentsTable
