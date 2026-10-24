// frontend/src/components/game/PaymentSection.tsx
// بخش پرداخت بازی — خلاصه سهم‌ها (split)، پرداخت سهم کاربر جاری (mock)، «یادآوری پرداخت»
// (POST remind — فقط سازمان‌ده/ادمین؛ ۴۲۹ کول‌داون یک‌دقیقه‌ای) یا توضیح organizer_pays/free

import React, { useState } from 'react'
import { isAxiosError } from 'axios'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import type { Game, GamePayment, Participant } from '@/types/game'
import { usePayShare, usePaymentSummary, useRemindGamePayments } from '@/hooks/useGames'
import { useAuthStore } from '@/store/authStore'
import { formatPrice } from '@/utils/helpers'
import { chipInk } from '@/utils/contrast'
import { toPersianDigits } from '@/lib/jalali'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/shadcn/progress'
import { Separator } from '@/components/ui/shadcn/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'
import { Shimmer } from '@/components/mobile'
import { getGameError } from './shared'

interface Props {
  gameId: number
  game: Game
  participants: Participant[]
  currentUserId?: number | null
  /** سازمان‌ده یا ادمین بازی — دکمه «یادآوری پرداخت» */
  canManage?: boolean
}

const nameOf = (participants: Participant[], userId: number): string => {
  const p = participants.find((x) => x.user_id === userId)
  return p?.full_name || `کاربر ${userId.toLocaleString('fa-IR')}`
}

const PaymentRow: React.FC<{ payment: GamePayment; participants: Participant[] }> = ({ payment, participants }) => {
  const paid = payment.status === 'paid'
  // «پرداخت‌شده» با #15803d روی تیغِ خودش ۴٫۴۹:۱ بود — ممیزی axe F-21
  const ink = chipInk(paid ? '#15803d' : '#b45309', paid ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.12)')
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div
        className={cn(
          'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full',
          paid
            ? 'bg-emerald-600/[0.12] text-emerald-700 dark:text-emerald-400'
            : 'bg-amber-500/[0.14] text-amber-800 dark:text-amber-400'
        )}
      >
        <Icon icon={paid ? 'mdi:check-bold' : 'mdi:clock-outline'} style={{ width: 16, height: 16 }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.82rem] font-bold text-foreground">{nameOf(participants, payment.user_id)}</p>
      </div>
      <span className="text-[0.78rem] tabular-nums text-slate-600 dark:text-slate-300">{formatPrice(payment.amount)}</span>
      <span
        className="inline-flex h-[22px] items-center rounded-full px-2 text-[0.68rem] font-bold"
        style={{
          backgroundColor: paid ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.12)',
          color: ink,
        }}
      >
        {paid ? 'پرداخت‌شده' : 'در انتظار'}
      </span>
    </div>
  )
}

const PaymentSection: React.FC<Props> = ({ gameId, game, participants, currentUserId, canManage = false }) => {
  const enabled = game.payment_mode !== 'free'
  // بازدیدکنندهٔ مهمان صفحهٔ بازی را می‌بیند؛ سهم‌ها فقط برای عضو است (۴۰۳/۴۰۱ ندهد)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const summaryQ = usePaymentSummary(gameId, enabled && isAuthenticated)
  const payShare = usePayShare(gameId)
  const remind = useRemindGamePayments(gameId)
  // ۴۲۹ (هر دقیقه یک‌بار) → غیرفعال تا ریمونت/رفرش بعدی
  const [remindLocked, setRemindLocked] = useState(false)

  // حالت رایگان
  if (game.payment_mode === 'free') {
    return (
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
        <Icon icon="mdi:gift-outline" style={{ width: 18, height: 18 }} />
        <p className="text-[0.85rem] font-bold">این بازی رایگان است.</p>
      </div>
    )
  }

  // برگزارکننده پرداخت می‌کند — فقط اطلاع‌رسانی
  if (game.payment_mode === 'organizer_pays') {
    return (
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
        <Icon icon="mdi:account-cash-outline" style={{ width: 18, height: 18 }} />
        <p className="text-[0.85rem]">
          هزینه زمین ({formatPrice(game.total_price ?? 0)}) بر عهده برگزارکننده است و بازیکنان سهمی پرداخت نمی‌کنند.
        </p>
      </div>
    )
  }

  const summary = summaryQ.data
  const total = summary?.payments.length ?? 0
  const paidCount = summary?.paid_count ?? 0
  const progress = total > 0 ? (paidCount / total) * 100 : 0

  const unpaidCount = summary ? summary.payments.filter((p) => p.status !== 'paid').length : 0

  const handleRemind = () => {
    remind.mutate(undefined, {
      onSuccess: (data) => {
        const sent = typeof data?.sent === 'number' ? data.sent : 0
        if (sent === 0) toast('بدهکار جدیدی برای یادآوری نیست', { icon: '✅' })
        else toast.success(`${sent.toLocaleString('fa-IR')} یادآوری ارسال شد`)
      },
      onError: (err) => {
        if (isAxiosError(err) && err.response?.status === 429) setRemindLocked(true)
        toast.error(getGameError(err, 'ارسال یادآوری ناموفق بود'))
      },
    })
  }

  const myParticipant = currentUserId
    ? participants.find((p) => p.user_id === currentUserId && p.status === 'accepted')
    : undefined
  const myPayment = currentUserId ? summary?.payments.find((p) => p.user_id === currentUserId) : undefined
  const canPay = !!myParticipant && myPayment?.status !== 'paid'

  const handlePay = () => {
    if (!myParticipant) return
    payShare.mutate(myParticipant.id, {
      onSuccess: () => toast.success('سهم شما با موفقیت پرداخت شد'),
      onError: (err) => toast.error(getGameError(err)),
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {summaryQ.isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <Shimmer key={i} variant="rounded" height={40} className="w-full" />
          ))}
        </div>
      ) : summaryQ.isError ? (
        <p className="text-[0.85rem] text-muted-foreground">نمایش وضعیت پرداخت ممکن نیست.</p>
      ) : summary ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 items-center rounded-full bg-blue-600/[0.08] px-2 text-[0.68rem] font-extrabold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                {`سهم هر نفر: ${formatPrice(summary.price_per_player ?? game.price_per_player ?? 0)}`}
              </span>
              <p className="text-[0.68rem] text-muted-foreground">
                {`${paidCount.toLocaleString('fa-IR')} پرداخت‌شده از ${total.toLocaleString('fa-IR')}`}
              </p>
            </div>
            {canManage && summary && unpaidCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      size="sm"
                      variant="outline"
                      icon="mdi:bell-alert-outline"
                      loading={remind.isPending}
                      disabled={remindLocked}
                      onClick={handleRemind}
                    >
                      یادآوری پرداخت
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {remindLocked ? 'هر دقیقه فقط یک یادآوری قابل ارسال است' : `${unpaidCount.toLocaleString('fa-IR')} بازیکن بدهکار`}
                </TooltipContent>
              </Tooltip>
            )}
            {canPay && (
              <Button size="sm" variant="gradient" icon="mdi:credit-card-outline" loading={payShare.isPending} onClick={handlePay}>
                پرداخت سهم من
              </Button>
            )}
            {!canPay && myPayment?.status === 'paid' && (
              <span
                className="inline-flex h-6 items-center rounded-full px-2 text-[0.68rem] font-extrabold"
                style={{ backgroundColor: 'rgba(22,163,74,0.1)', color: chipInk('#15803d', 'rgba(22,163,74,0.1)') }}
              >
                سهم شما پرداخت شده ✓
              </span>
            )}
          </div>
          <Progress
            value={Math.min(progress, 100)}
            aria-label="پیشرفت پرداخت سهم‌ها"
            aria-valuetext={`${toPersianDigits(Math.round(Math.min(progress, 100)))}٪ پرداخت‌شده`}
            className="h-1.5 bg-amber-500/15 [&>div]:bg-emerald-600 [&>div]:rounded-full"
          />
          {summary.payments.length > 0 ? (
            <>
              <Separator />
              <div className="flex flex-col">
                {summary.payments.map((p) => (
                  <PaymentRow key={p.id} payment={p} participants={participants} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-[0.78rem] text-muted-foreground">
              هنوز سهمی ثبت نشده است — با پیوستن بازیکنان، سهم‌ها ساخته می‌شوند.
            </p>
          )}
        </>
      ) : null}
    </div>
  )
}

export default PaymentSection
