// frontend/src/components/contract/ContractList.tsx
// کارت‌های لیست قرارداد کاربر — چیپ وضعیت از نگارخانه مرکزی، بنر «در انتظار تأیید مدیر»
// و نمایش دلیل رد/لغو. ورودی مستقیماً ContractData بک‌اند است.

import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { cn, formatDate } from '@/lib/utils'
import { statusColorToken } from '@/components/finance/shared'
import {
  contractStatusMeta,
  faNum,
  formatRial,
  paymentStatusMeta,
  pyDayNames,
  RECURRENCE_LABELS,
} from '@/components/contract/shared'
import { Button } from '@/components/ui/shadcn/button'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import type { ContractData } from '@/services/contract'

interface ContractListProps {
  contracts: ContractData[]
  venueNames: Record<number, string>
  onView?: (id: number) => void
}

/**
 * رنگ متن چیپ از توکن سمانتیک می‌آید (هگزهای کنفیگ ≈۳٫۲–۳٫۸:۱ برای متن رد می‌شوند)؛
 * توکن‌های سمانتیک به کلاس‌های Tailwind (با نسخه‌ی دارک) و هگزهای بدون معادل به استایل درجا نگاشت می‌شوند.
 */
const chipTone = (hex: string): { className?: string; style?: React.CSSProperties } => {
  const token = statusColorToken(hex)
  switch (token) {
    case 'success':
      return { className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' }
    case 'warning':
      return { className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' }
    case 'error':
      return { className: 'bg-red-500/15 text-red-700 dark:text-red-300' }
    case 'info':
      return { className: 'bg-blue-500/15 text-blue-700 dark:text-blue-300' }
    default:
      return { style: { backgroundColor: `${hex}1f`, color: hex } }
  }
}

const ContractList: React.FC<ContractListProps> = ({ contracts, venueNames, onView }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      {contracts.map((contract, index) => {
        const meta = contractStatusMeta(contract.status)
        const payMeta = paymentStatusMeta(contract.payment_status)
        const statusTone = chipTone(meta.color)
        const payTone = chipTone(payMeta.color)
        return (
          <div key={contract.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-xl dark:hover:shadow-black/40">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white',
                        contract.status === 'pending'
                          ? 'bg-amber-600'
                          : contract.status === 'rejected'
                            ? 'bg-red-600'
                            : 'bg-blue-600',
                      )}
                    >
                      <Icon
                        icon={contract.status === 'pending' ? 'mdi:hourglass-top' : 'mdi:file-document'}
                        style={{ width: 24, height: 24, color: 'white' }}
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {venueNames[contract.venue_id] || `سالن #${faNum(contract.venue_id)}`}
                      </p>
                      <p className="text-[0.68rem] text-muted-foreground">
                        {`${formatDate(contract.start_date)} - ${formatDate(contract.end_date)} | `}
                        {`${(contract.days && contract.days.length ? contract.days : [contract.day_of_week]).map((d) => pyDayNames[d] ?? '—').join('، ')} ${(contract.start_time || '').slice(0, 5)} | `}
                        {RECURRENCE_LABELS[contract.recurrence] || contract.recurrence}
                      </p>
                      {(contract.days?.length ?? 0) > 1 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {contract.days!.map((d) => (
                            <span
                              key={d}
                              className="inline-flex h-[18px] items-center rounded-md bg-blue-500/10 px-1.5 text-[0.75rem] font-bold text-blue-700 dark:text-blue-300"
                            >
                              {pyDayNames[d] ?? `روز ${d}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {contract.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-[0.68rem] font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                        <Icon icon="mdi:account-clock-outline" className="h-4 w-4" aria-hidden="true" />
                        در انتظار تأیید مدیر
                      </span>
                    )}
                    <span
                      className={cn('inline-flex items-center rounded-lg px-2 py-0.5 text-[0.68rem] font-bold', statusTone.className)}
                      style={statusTone.style}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>

                {contract.status === 'rejected' && contract.reject_reason && (
                  <Alert variant="destructive" className="mt-4 text-[0.8rem]">
                    <AlertDescription>
                      {`دلیل رد درخواست: ${contract.reject_reason}`}
                    </AlertDescription>
                  </Alert>
                )}
                {contract.status === 'cancelled' && contract.cancel_reason && (
                  <Alert variant="warning" className="mt-4 text-[0.8rem]">
                    <AlertDescription>
                      {`دلیل لغو: ${contract.cancel_reason}`}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-[0.68rem] text-muted-foreground">قیمت هر جلسه</p>
                    <p className="text-[0.68rem] font-semibold text-foreground">
                      {formatRial(contract.discounted_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.68rem] text-muted-foreground">مبلغ کل</p>
                    <p className="text-[0.68rem] font-semibold text-primary">
                      {formatRial(contract.total_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.68rem] text-muted-foreground">وضعیت پرداخت</p>
                    <span
                      className={cn(
                        'inline-flex h-[22px] items-center rounded-lg px-2 text-[0.75rem] font-semibold',
                        payTone.className,
                      )}
                      style={payTone.style}
                    >
                      {payMeta.label}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView?.(contract.id)}
                      className="rounded-lg text-[0.68rem]"
                    >
                      مشاهده جزئیات
                      <Icon icon="mdi:arrow-left" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}

export default ContractList
