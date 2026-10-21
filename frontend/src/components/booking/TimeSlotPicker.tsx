import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { cn, formatPrice } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'

interface TimeSlot {
  id: number
  date: string
  startTime: string
  endTime: string
  price: number
  available: boolean
  // وضعیت خام سانس از بک‌اند: available | booked | blocked | in_competition | reserved | ...
  status?: string
}

interface TimeSlotPickerProps {
  slots: TimeSlot[]
  onSelect?: (slot: TimeSlot) => void
  onBid?: (slot: TimeSlot) => void
}

// تعیین وضعیت با fallback امن: اگر status نبود از available حدس بزن؛
// وضعیت‌های ناشناختهٔ آینده باعث کرش نمی‌شوند (chip «نامشخص»، غیرقابل‌کلیک)
const statusOf = (slot: TimeSlot): string => slot.status ?? (slot.available ? 'available' : 'booked')
const isAvailableSlot = (slot: TimeSlot): boolean => statusOf(slot) === 'available'
const isBidableSlot = (slot: TimeSlot): boolean => statusOf(slot) === 'in_competition'

// برچسب وضعیت برای نام قابل‌خواندن دکمهٔ سانس (صفحه‌خوان فقط «۱۸:۰۰» نمی‌خواند)
const STATUS_LABEL: Record<string, string> = {
  available: 'آزاد',
  booked: 'پر',
  blocked: 'مسدود',
  reserved: 'رزرو قرارداد',
  in_competition: 'رقابت با بقیه',
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isToday = date.toDateString() === today.toDateString()
  const isTomorrow = date.toDateString() === tomorrow.toDateString()

  const dayName = date.toLocaleDateString('fa-IR', { weekday: 'long' })
  const dayNumber = date.toLocaleDateString('fa-IR', { day: 'numeric' })
  const monthName = date.toLocaleDateString('fa-IR', { month: 'long' })

  if (isToday) return `امروز - ${dayNumber} ${monthName}`
  if (isTomorrow) return `فردا - ${dayNumber} ${monthName}`
  return `${dayName} ${dayNumber} ${monthName}`
}

const chipBase = 'mt-1.5 inline-flex h-5 items-center gap-1 rounded-md px-2 text-xs'

const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'available':
      return (
        <span className={cn(chipBase, 'bg-green-500/10 font-semibold text-emerald-600 dark:text-emerald-400')}>
          آزاد
        </span>
      )
    case 'booked':
      return (
        <span className={cn(chipBase, 'bg-red-600 font-semibold text-white')}>
          پر
        </span>
      )
    case 'blocked':
      return (
        <span className={cn(chipBase, 'bg-slate-900/[0.06] font-semibold text-slate-400 dark:bg-white/10 dark:text-slate-500')}>
          مسدود
        </span>
      )
    case 'reserved':
      return (
        <span className={cn(chipBase, 'bg-violet-500/[0.12] font-bold text-violet-600 dark:text-violet-300')}>
          رزرو قرارداد
        </span>
      )
    case 'in_competition':
      return (
        <span className={cn(chipBase, 'bg-gradient-to-br from-amber-500 to-violet-600 font-bold text-white')}>
          <Icon icon="mdi:gavel" className="h-3 w-3" />
          رقابت با بقیه
        </span>
      )
    default:
      return (
        <span className={cn(chipBase, 'bg-slate-900/[0.06] font-semibold text-slate-400 dark:bg-white/10 dark:text-slate-500')}>
          نامشخص
        </span>
      )
  }
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ slots, onSelect, onBid }) => {
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (slot: TimeSlot) => {
    setSelected(slot.id)
    onSelect?.(slot)
  }

  // Group slots by date
  const groupedSlots = useMemo(() => {
    const groups: { [date: string]: TimeSlot[] } = {}
    slots.forEach(slot => {
      if (!groups[slot.date]) {
        groups[slot.date] = []
      }
      groups[slot.date].push(slot)
    })
    // Sort dates
    const sortedDates = Object.keys(groups).sort()
    return sortedDates.map(date => ({
      date,
      slots: groups[date],
    }))
  }, [slots])

  if (!slots || slots.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/[0.02] px-4 py-12 text-center dark:bg-white/[0.02]">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-600/[0.08]">
          <Icon icon="mdi:calendar-remove" className="h-10 w-10" style={{ color: '#2563eb' }} />
        </div>
        <p className="mb-1 text-base font-semibold text-foreground">سانسی موجود نیست</p>
        <p className="text-sm text-muted-foreground">برای تاریخ انتخاب شده سانسی یافت نشد</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Icon icon="mdi:clock-outline" className="h-5 w-5" style={{ color: '#2563eb' }} />
          سانس‌های موجود
        </h3>
        <span className="inline-flex items-center rounded-lg bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {`${slots.filter(isAvailableSlot).length} سانس آزاد`}
        </span>
      </div>

      {groupedSlots.map((group, groupIndex) => (
        <div key={group.date} className={groupIndex < groupedSlots.length - 1 ? 'mb-6' : 'mb-0'}>
          {/* Date Header */}
          <div className={cn('mb-4 flex items-center gap-3', groupIndex > 0 && 'mt-2')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-blue-600/10 to-violet-600/10">
              <Icon icon="mdi:calendar" className="h-[18px] w-[18px]" style={{ color: '#2563eb' }} />
            </div>
            <h4 className="text-sm font-bold text-foreground">{formatDate(group.date)}</h4>
            <span className="inline-flex h-[22px] items-center rounded-md bg-blue-600/[0.08] px-2 text-xs font-semibold text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
              {`${group.slots.filter(isAvailableSlot).length} سانس`}
            </span>
          </div>

          {/* Slots Grid */}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {group.slots.map((slot, index) => {
              const st = statusOf(slot)
              const bidable = isBidableSlot(slot)
              const reserved = st === 'reserved'
              const clickable = isAvailableSlot(slot) || bidable
              const isSelected = selected === slot.id

              const card = (
                <button
                  type="button"
                  disabled={!clickable}
                  aria-pressed={isSelected}
                  aria-label={`سانس ${slot.startTime} تا ${slot.endTime}، ${formatPrice(slot.price)} ریال، ${STATUS_LABEL[st]}`}
                  onClick={() => {
                    if (isAvailableSlot(slot)) handleSelect(slot)
                    else if (bidable) onBid?.(slot)
                  }}
                  className={cn(
                    'relative block min-h-24 w-full overflow-hidden rounded-xl p-3 text-center transition-all duration-300',
                    'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                    clickable ? 'opacity-100' : 'cursor-not-allowed opacity-[0.55]',
                    isSelected
                      ? 'border-2 border-blue-600 shadow-md'
                      : bidable
                        ? 'border-[1.5px] border-violet-600/50 bg-violet-600/[0.04] hover:-translate-y-[3px] hover:border-violet-600 hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)]'
                        : reserved
                          ? 'border border-violet-500/35 bg-violet-500/5'
                          : 'border border-border bg-card shadow-sm',
                    clickable && !bidable && !isSelected && 'hover:-translate-y-[3px] hover:border-blue-400 hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)]'
                  )}
                >
                  {/* نوار انتخاب */}
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-blue-600 to-violet-600"
                    />
                  )}

                  {/* Time */}
                  <p className="mb-0.5 text-[0.85rem] font-bold text-foreground">{slot.startTime}</p>
                  <span className="mb-2 block text-xs text-slate-400 dark:text-slate-500">{slot.endTime}</span>

                  {/* Divider */}
                  <div className="mb-2 h-px bg-slate-900/[0.06] dark:bg-white/10" />

                  {/* Price */}
                  <p
                    className={cn(
                      'text-[0.8rem] font-bold',
                      bidable ? 'text-violet-600 dark:text-violet-300' : 'text-blue-600 dark:text-blue-400',
                      reserved && 'line-through'
                    )}
                  >
                    {formatPrice(slot.price)}
                  </p>

                  {/* Status */}
                  <StatusChip status={st} />

                  {/* Selected Check */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                      style={{ position: 'absolute', top: 6, insetInlineStart: 6 }}
                    >
                      <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600">
                        <Icon icon="mdi:check" className="h-3 w-3" style={{ color: 'white' }} />
                      </div>
                    </motion.div>
                  )}
                </button>
              )

              return (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  {reserved ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block">{card}</span>
                      </TooltipTrigger>
                      <TooltipContent>این سانس مربوط به قرارداد است</TooltipContent>
                    </Tooltip>
                  ) : (
                    card
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default TimeSlotPicker
