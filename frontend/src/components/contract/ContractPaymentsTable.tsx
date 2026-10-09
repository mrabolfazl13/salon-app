// frontend/src/components/contract/ContractPaymentsTable.tsx
// تقویم اقساط قرارداد — سررسید جلالی، مبلغ (ریال)، وضعیت مشتق‌شده؛
// دکمه «پرداخت» (درگاه شبیه‌سازی‌شده) برای مالک و «ابطال» برای مدیر.

import React from 'react'
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import { formatJalaliDate, formatJalaliDateTime } from '@/lib/jalali'
import { formatRial, installmentState, StatusChip, toPersianDigits } from '@/components/contract/shared'
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

const cellHead = { fontWeight: 700, fontSize: '0.76rem', whiteSpace: 'nowrap' as const }
const cellBody = { fontSize: '0.82rem' }

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
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        تقویم اقساط هنوز تولید نشده است — پس از تأیید قرارداد توسط مدیر صادر می‌شود.
      </Typography>
    )
  }

  const sorted = [...payments].sort((a, b) => (a.due_date < b.due_date ? -1 : 1))

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 560 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={cellHead}>قسط</TableCell>
            <TableCell sx={cellHead}>سررسید</TableCell>
            <TableCell sx={cellHead}>مبلغ</TableCell>
            <TableCell sx={cellHead}>وضعیت</TableCell>
            <TableCell sx={cellHead}>توضیحات</TableCell>
            <TableCell align="left" sx={cellHead}>عملکرد</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((p) => {
            const state = installmentState(p)
            const payable = canPay && !p.is_paid && !p.is_voided
            const markable = canMarkPaid && !p.is_paid && !p.is_voided
            const voidable = canVoid && !p.is_voided
            return (
              <TableRow key={p.id} sx={{ opacity: p.is_voided ? 0.55 : 1 }}>
                <TableCell sx={cellBody}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Icon
                      icon={p.record_type === 'down_payment' ? 'mdi:bank-outline' : 'mdi:calendar-text-outline'}
                      className="h-4 w-4"
                      style={{ color: p.record_type === 'down_payment' ? '#7c3aed' : '#6b7280' }}
                    />
                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                      {p.label || (p.record_type === 'down_payment' ? 'پیش‌پرداخت' : `قسط ${toPersianDigits(p.installment_no ?? 0)}`)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ ...cellBody, whiteSpace: 'nowrap' }}>{formatJalaliDate(p.due_date)}</TableCell>
                <TableCell sx={{ ...cellBody, fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ textDecoration: p.is_voided ? 'line-through' : 'none' }}>
                    {formatRial(p.amount)}
                  </span>
                </TableCell>
                <TableCell><StatusChip label={state.label} color={state.color} /></TableCell>
                <TableCell sx={{ ...cellBody, maxWidth: 240 }}>
                  {p.is_paid && !p.is_voided ? (
                    <Typography variant="caption" color="text.secondary">
                      پرداخت {formatJalaliDateTime(p.paid_at)}
                      {p.transaction_id && (
                        <> — کد تراکنش <span dir="ltr" style={{ fontSize: '0.75rem' }}>{p.transaction_id.slice(0, 8)}</span></>
                      )}
                    </Typography>
                  ) : p.is_voided ? (
                    <Tooltip title={p.void_reason || ''}>
                      <Typography variant="caption" color="error.main">باطل: {p.void_reason || '—'}</Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
                <TableCell align="left" sx={{ whiteSpace: 'nowrap' }}>
                  {payable && (
                    <Button
                      size="small"
                      variant="contained"
                      disabled={busyPaymentId === p.id}
                      onClick={() => onPay?.(p)}
                      sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem' }}
                      startIcon={busyPaymentId === p.id
                        ? undefined
                        : <Icon icon="mdi:credit-card-outline" className="h-4 w-4" />}
                    >
                      {busyPaymentId === p.id ? '...' : 'پرداخت'}
                    </Button>
                  )}
                  {markable && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      disabled={busyMarkPaidId === p.id}
                      onClick={() => onMarkPaid?.(p)}
                      sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', ml: 0.5 }}
                      startIcon={busyMarkPaidId === p.id
                        ? undefined
                        : <Icon icon="mdi:cash-outline" className="h-4 w-4" />}
                    >
                      {busyMarkPaidId === p.id ? '...' : 'دریافت نقدی'}
                    </Button>
                  )}
                  {voidable && (
                    <Button
                      size="small"
                      color="error"
                      variant="text"
                      disabled={busyPaymentId === p.id}
                      onClick={() => onVoid?.(p)}
                      sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem' }}
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
    </TableContainer>
  )
}

export default ContractPaymentsTable