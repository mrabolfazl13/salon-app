import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

export interface DateOption {
  iso: string // YYYY-MM-DD
  weekday: string // شنبه
  day: string // ۱۲
  month: string // شهریور
  isToday: boolean
}

interface Props {
  dates: DateOption[]
  value: string
  onChange: (iso: string) => void
}

/** انتخاب تاریخ — اسکرول افقی با فلش‌های قبلی/بعدی (جهت‌دار برای RTL) */
const DateSelector: React.FC<Props> = ({ dates, value, onChange }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const currentIndex = useMemo(() => Math.max(0, dates.findIndex((d) => d.iso === value)), [dates, value])

  const scrollBy = (dir: -1 | 1) => {
    const next = Math.min(dates.length - 1, Math.max(0, currentIndex + dir))
    onChange(dates[next].iso)
    scrollRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        disabled={currentIndex <= 0}
        aria-label="تاریخ قبل"
        className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary-ink transition-colors enabled:hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon icon="mdi:chevron-right" style={{ width: 22, height: 22 }} />
      </button>

      <div
        ref={scrollRef}
        className="scrollbar-hide flex flex-1 snap-x snap-mandatory gap-2 overflow-x-auto py-1"
      >
        {dates.map((d) => {
          const active = d.iso === value
          return (
            <motion.button
              key={d.iso}
              type="button"
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={() => onChange(d.iso)}
              aria-pressed={active}
              className={cn(
                'flex min-w-[62px] shrink-0 snap-center flex-col items-center rounded-lg px-2 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border border-transparent bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-stone-900 shadow-lg shadow-amber-500/25'
                  : 'border border-border bg-card text-foreground hover:bg-muted/60'
              )}
            >
              {/* opacity روی متن ۱۲px کنتراست را به ۴٫۰:۱ می‌رساند (مهر = #7b7f8a) — ممیزی axe F-21 */}
              <span
                className={cn(
                  'text-[0.68rem] font-semibold',
                  active ? 'text-stone-900/90' : 'text-foreground/80'
                )}
              >
                {d.isToday ? 'امروز' : d.weekday}
              </span>
              <span className="text-[1.15rem] font-extrabold leading-[1.3]">{d.day}</span>
              <span
                className={cn(
                  'text-[0.68rem] font-medium',
                  active ? 'text-stone-900/90' : 'text-foreground/80'
                )}
              >
                {d.month}
              </span>
            </motion.button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(1)}
        disabled={currentIndex >= dates.length - 1}
        aria-label="تاریخ بعد"
        className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary-ink transition-colors enabled:hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon icon="mdi:chevron-left" style={{ width: 22, height: 22 }} />
      </button>
    </div>
  )
}

/** ساخت لیست تاریخ برای n روز آینده */
export const buildDateOptions = (days = 14, startDate = new Date()): DateOption[] =>
  Array.from({ length: days }).map((_, i) => {
    const dt = new Date(startDate)
    dt.setDate(startDate.getDate() + i)
    const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    return {
      iso,
      weekday: dt.toLocaleDateString('fa-IR', { weekday: 'long' }),
      day: dt.toLocaleDateString('fa-IR', { day: 'numeric' }),
      month: dt.toLocaleDateString('fa-IR', { month: 'long' }),
      isToday: i === 0,
    }
  })

export default DateSelector
