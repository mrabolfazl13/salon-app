// frontend/src/components/deals/DealCard.tsx
// کارت سانس لحظه آخری — قیمت اصلی خط‌خورده + قیمت دیل + نشان صرفه‌جویی + شمارش معکوس.

import React from 'react'
import { Icon } from '@iconify/react'
import { formatJalaliDate, toPersianDigits } from '@/lib/jalali'
import { cn, formatPrice, formatTimeFa, getSlotEndTime } from '@/lib/utils'
import { parseUtcAware } from '@/components/pricing/shared'
import { Button } from '@/components/ui/shadcn/button'
import type { DealAvailableItem } from '@/services/deals'
import DealCountdown from './DealCountdown'

interface Props {
  deal: DealAvailableItem
  onBook: (deal: DealAvailableItem) => void
}

const isExpired = (d: DealAvailableItem): boolean =>
  d.deal_expires_at != null && parseUtcAware(d.deal_expires_at) <= Date.now()

/** نمایش «امروز / فردا / فلان‌روز» کنار تاریخ جلالی */
const dayHint = (slotDate: string): string => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${slotDate}T00:00:00`)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diffDays === 0) return 'امروز'
  if (diffDays === 1) return 'فردا'
  return ''
}

const DealCard: React.FC<Props> = ({ deal, onBook }) => {
  const expired = isExpired(deal)
  const end = getSlotEndTime(deal.start_time.slice(0, 5), deal.duration || 90)
  const hint = dayHint(deal.slot_date)

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border transition-all duration-200',
        expired
          ? 'border-border bg-slate-900/[0.02] opacity-[0.65]'
          : 'border-amber-500/35 bg-gradient-to-br from-amber-50/90 to-amber-100/[0.55] hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(245,158,11,0.18)] dark:from-amber-500/10 dark:to-amber-400/5'
      )}
    >
      <div className="absolute start-0 top-0 flex items-center gap-2 rounded-es-[14px] bg-gradient-to-br from-amber-700 to-red-600 px-3 py-1 text-[0.68rem] font-extrabold text-white">
        <Icon icon="mdi:fire" style={{ width: 13, height: 13 }} />
        تا ‪{toPersianDigits(deal.discount_percent)}٪‬ تخفیف
      </div>

      <div className="p-3 pt-9">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="min-w-0 truncate text-[0.68rem] font-extrabold text-foreground">{deal.venue_name}</h3>
          {deal.distance_km != null && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600/[0.08] px-2 py-0.5 text-[0.68rem] font-bold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
              <Icon icon="mdi:crosshairs-gps" style={{ width: 14, height: 14 }} />
              {`${toPersianDigits(Math.round(deal.distance_km * 10) / 10)} کیلومتر`}
            </span>
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:calendar-blank-outline" style={{ width: 15, height: 15, color: '#64748b' }} />
            <span className="text-[0.68rem] font-semibold text-slate-700 dark:text-slate-300">
              {formatJalaliDate(deal.slot_date, { format: 'long' })}
              {hint ? ` (${hint})` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="mdi:clock-outline" style={{ width: 15, height: 15, color: '#64748b' }} />
            <span dir="rtl" className="text-[0.68rem] font-semibold text-slate-700 dark:text-slate-300">
              {formatTimeFa(deal.start_time)} – {end}
            </span>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{formatPrice(deal.deal_price)}</span>
            <span className="text-[0.68rem] text-muted-foreground line-through">{formatPrice(deal.original_price)}</span>
          </div>
          <span className="inline-flex items-center rounded-lg bg-emerald-600/[0.12] px-2 py-0.5 text-[0.68rem] font-bold text-emerald-700 dark:text-emerald-400">
            {`${toPersianDigits(Math.round(deal.savings / 10))} تومان سود شما`}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <DealCountdown expiresAt={deal.deal_expires_at} compact />
          <Button
            size="sm"
            disabled={expired}
            onClick={() => onBook(deal)}
            className={cn(
              'gap-1 rounded-[10px] px-5 font-extrabold',
              expired
                ? 'bg-none bg-slate-900/10 text-muted-foreground shadow-none hover:bg-slate-900/10 dark:bg-white/10'
                : 'bg-gradient-to-br from-amber-700 to-red-600 text-white shadow-[0_4px_14px_rgba(239,68,68,0.3)] hover:from-amber-800 hover:to-red-700'
            )}
          >
            <Icon icon="mdi:lightning-bolt" className="h-4 w-4" />
            رزرو
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DealCard
