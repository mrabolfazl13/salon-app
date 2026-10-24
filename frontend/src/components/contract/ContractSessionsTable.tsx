// frontend/src/components/contract/ContractSessionsTable.tsx
// جدول سانس‌های قرارداد — چیپ وضعیت (SCHEDULED/COMPLETED/EXCLUDED/RESCHEDULED)،
// نمایش تاریخ/ساعت اصلی + جدید در صورت جابه‌جایی؛ گیت‌های کلاینتی قواعد بک‌اند:
// - کاربر: «درخواست حذف سانس» فقط برای سانس آینده با وضعیت scheduled/rescheduled
// - مدیر: «جابه‌جایی» و «استثنا/لغو» فقط برای سانس آینده‌ی قابل‌تغییر

import React from 'react'
import { Icon } from '@iconify/react'
import { formatJalaliDate, toPersianDigits } from '@/lib/jalali'
import {
  effectiveSession,
  isSessionFuture,
  isSessionMutable,
  SessionStatusChip,
  StatusChip,
} from '@/components/contract/shared'
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
import type { ContractSessionData } from '@/services/contract'

interface ContractSessionsTableProps {
  sessions: ContractSessionData[]
  /** پنل کاربر: دکمه درخواست حذف سانس */
  mode: 'user' | 'manager'
  busySessionId?: number | null
  onRequestCancel?: (session: ContractSessionData) => void
  onExclude?: (session: ContractSessionData) => void
  onReschedule?: (session: ContractSessionData) => void
}

const ContractSessionsTable: React.FC<ContractSessionsTableProps> = ({
  sessions,
  mode,
  busySessionId = null,
  onRequestCancel,
  onExclude,
  onReschedule,
}) => {
  if (sessions.length === 0) {
    return (
      <p className="py-4 text-center text-[0.68rem] text-muted-foreground">
        هنوز سانسی برای این قرارداد ثبت نشده است.
      </p>
    )
  }

  const sorted = [...sessions].sort((a, b) =>
    effectiveSession(a).date < effectiveSession(b).date ? -1 : 1)

  return (
    <Table aria-label="سانس‌های قرارداد" className="min-w-[620px] text-[0.82rem]">
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className="whitespace-nowrap text-[0.76rem] font-bold">تاریخ سانس</TableHead>
          <TableHead scope="col" className="whitespace-nowrap text-[0.76rem] font-bold">ساعت</TableHead>
          <TableHead scope="col" className="whitespace-nowrap text-[0.76rem] font-bold">مدت</TableHead>
          <TableHead scope="col" className="whitespace-nowrap text-[0.76rem] font-bold">وضعیت</TableHead>
          <TableHead scope="col" className="whitespace-nowrap text-[0.76rem] font-bold">یادداشت</TableHead>
          {mode === 'manager' && (
            <TableHead scope="col" className="whitespace-nowrap text-end text-[0.76rem] font-bold">عملکرد</TableHead>
          )}
          {mode === 'user' && (
            <TableHead scope="col" className="whitespace-nowrap text-end text-[0.76rem] font-bold">درخواست</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((cs) => {
          const eff = effectiveSession(cs)
          const moved = !!cs.rescheduled_date
          const mutable = isSessionMutable(cs)
          const future = isSessionFuture(cs)
          return (
            <TableRow key={cs.id} className={cs.status === 'excluded' ? 'opacity-[0.55]' : undefined}>
              <TableCell className="whitespace-nowrap">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[0.82rem] font-bold">
                    {formatJalaliDate(cs.session_date)}
                    {moved && <span className="text-[0.68rem] font-normal text-muted-foreground"> (اصلی)</span>}
                  </p>
                  {moved && (
                    <div className="flex items-center gap-1">
                      <Icon icon="mdi:arrow-conditional-right" className="h-3.5 w-3.5" style={{ color: '#d97706' }} />
                      <span className="text-[0.68rem] font-bold text-amber-800 dark:text-amber-300">
                        جدید: {formatJalaliDate(eff.date)}
                      </span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap" dir="ltr">
                {moved ? (
                  <div className="flex flex-col items-start">
                    <span className="text-[0.68rem] text-muted-foreground line-through">
                      {cs.start_time?.slice(0, 5)}
                    </span>
                    <span className="text-[0.82rem] font-bold text-amber-800 dark:text-amber-300">
                      {(cs.rescheduled_time || '').slice(0, 5)}
                    </span>
                  </div>
                ) : (
                  toPersianDigits((cs.start_time || '').slice(0, 5))
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {toPersianDigits(cs.duration)} دقیقه
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <SessionStatusChip status={cs.status} />
                  {future && !mutable && cs.status !== 'completed' && <StatusChip label="گذشته" color="#64748b" />}
                </div>
              </TableCell>
              <TableCell className="max-w-[220px]">
                {cs.exclusion_reason ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[0.68rem] text-red-600 dark:text-red-400">استثنا: {cs.exclusion_reason}</span>
                    </TooltipTrigger>
                    <TooltipContent>{cs.exclusion_reason}</TooltipContent>
                  </Tooltip>
                ) : cs.cancel_requested ? (
                  <StatusChip label="درخواست لغو ثبت شده" color="#d97706" />
                ) : (
                  <span className="text-[0.68rem] text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-end">
                {mode === 'manager' && (
                  <>
                    {mutable && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busySessionId === cs.id}
                          onClick={() => onReschedule?.(cs)}
                          className="text-[0.68rem] font-semibold"
                        >
                          جابه‌جایی
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busySessionId === cs.id}
                          onClick={() => onExclude?.(cs)}
                          className="ms-1 text-[0.68rem] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                        >
                          استثنا/لغو
                        </Button>
                      </>
                    )}
                    {!mutable && <span className="text-[0.68rem] text-muted-foreground">—</span>}
                  </>
                )}
                {mode === 'user' && (
                  <>
                    {mutable && !cs.cancel_requested && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busySessionId === cs.id}
                        onClick={() => onRequestCancel?.(cs)}
                        className="text-[0.68rem] font-semibold text-amber-800 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10"
                      >
                        درخواست حذف سانس
                      </Button>
                    )}
                    {(!mutable || cs.cancel_requested) && (
                      <span className="text-[0.68rem] text-muted-foreground">
                        {cs.cancel_requested ? 'در انتظار اقدام مدیر' : '—'}
                      </span>
                    )}
                  </>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export default ContractSessionsTable
