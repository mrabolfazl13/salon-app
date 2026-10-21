import type React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { cn, formatTimeFa, getSlotEndTime } from '@/lib/utils'
import Price from './Price'

export interface MobileSlot {
  id: number | string
  startTime: string
  endTime?: string
  price: number
  available: boolean
  duration?: number
  // وضعیت خام سانس از بک‌اند (available | booked | blocked | in_competition | reserved | ...)
  status?: string
}

interface Props {
  slot: MobileSlot
  selected?: boolean
  onSelect?: (slot: MobileSlot) => void
  onBid?: (slot: MobileSlot) => void
}

// تعیین وضعیت با fallback امن — وضعیت‌های ناشناختهٔ آینده UI را نمی‌شکنند
const statusOf = (slot: MobileSlot): string => slot.status ?? (slot.available ? 'available' : 'booked')

const HINT_BY_STATUS: Record<string, string> = {
  booked: 'رزرو شده',
  blocked: 'مسدود',
  reserved: 'رزرو قرارداد',
}

/** سانس قابل‌انتخاب (موبایل) — حالت انتخاب با گرادیان کهربایی برند */
const TimeSlot: React.FC<Props> = ({ slot, selected = false, onSelect, onBid }) => {
  const st = statusOf(slot)
  const bidable = st === 'in_competition'
  const isReserved = st === 'reserved'
  const disabled = !(slot.available || bidable)
  const end = slot.endTime ?? (slot.duration ? getSlotEndTime(slot.startTime, slot.duration) : undefined)

  const subLabel = bidable
    ? 'در حال رقابت قیمت'
    : isReserved
      ? 'رزرو قرارداد'
      : disabled
        ? HINT_BY_STATUS[st] ?? 'نامشخص'
        : slot.duration
          ? `${(slot.duration ?? 0).toLocaleString('fa-IR')} دقیقه`
          : 'سانس آزاد'

  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.15 }}
      disabled={disabled}
      onClick={() => {
        if (bidable) {
          onBid?.(slot)
        } else if (!disabled) {
          onSelect?.(slot)
        }
      }}
      aria-pressed={selected}
      title={isReserved ? 'این سانس مربوط به قرارداد است' : undefined}
      className={cn(
        'flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'border-[1.5px] border-transparent bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-lg shadow-amber-500/30'
          : bidable
            ? 'border-[1.5px] border-amber-600/45 bg-amber-500/5 dark:border-amber-400/45 dark:bg-amber-400/[0.06]'
            : disabled
              ? 'cursor-not-allowed border border-border bg-slate-900/[0.03] opacity-70 dark:bg-white/[0.03]'
              : 'border border-border bg-card hover:bg-muted/60'
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={cn(
            'flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl',
            selected
              ? 'bg-stone-900/15'
              : bidable
                ? 'bg-amber-500/[0.12] dark:bg-amber-400/15'
                : disabled
                  ? 'bg-muted'
                  : 'bg-blue-600/[0.07] dark:bg-blue-400/[0.12]'
          )}
        >
          <Icon
            icon={isReserved ? 'mdi:file-lock-outline' : bidable ? 'mdi:gavel' : disabled ? 'mdi:lock-clock' : 'mdi:clock-outline'}
            style={{ width: 20, height: 20 }}
            className={cn(
              selected && 'text-stone-900',
              !selected && bidable && 'text-amber-600 dark:text-amber-400',
              !selected && !bidable && disabled && 'text-slate-500',
              !selected && !bidable && !disabled && 'text-blue-600 dark:text-blue-400'
            )}
          />
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              'whitespace-nowrap text-[0.92rem] font-bold tabular-nums',
              selected ? 'text-stone-900' : disabled ? 'text-muted-foreground' : 'text-foreground'
            )}
          >
            {formatTimeFa(slot.startTime)}
            {end ? ` – ${formatTimeFa(end)}` : ''}
          </p>
          <p
            className={cn(
              'text-xs',
              selected
                ? 'text-stone-900/75'
                : bidable
                  ? 'text-amber-700 dark:text-amber-400'
                  : isReserved
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-muted-foreground'
            )}
          >
            {subLabel}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!disabled &&
          !bidable &&
          (selected ? (
            <Price value={slot.price} size="sm" color="#1c1917" />
          ) : (
            <Price value={slot.price} size="sm" />
          ))}
        {bidable && (
          <span className="flex items-center gap-1 rounded-full bg-gradient-to-br from-amber-500/[0.16] to-orange-500/[0.16] px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
            <Icon icon="mdi:gavel" aria-hidden="true" style={{ width: 13, height: 13 }} />
            رقابت با بقیه
          </span>
        )}
        {isReserved && (
          <span className="rounded-full bg-violet-500/[0.12] px-2.5 py-1 text-xs font-bold text-violet-700 dark:bg-violet-400/[0.16] dark:text-violet-300">
            قرارداد
          </span>
        )}
        {selected && !bidable && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900/[0.18]">
            <Icon icon="mdi:check" style={{ width: 16, height: 16, color: '#1c1917' }} />
          </span>
        )}
      </div>
    </motion.button>
  )
}

export default TimeSlot
