// frontend/src/components/ui/PersianDatePicker.tsx
// Reusable Jalali date picker: displays a Shamsi month grid, but the public
// value/onChange contract is Gregorian ISO (YYYY-MM-DD) so API payloads and
// the data layer are untouched. Empty value = clearable '' (useful for filters).

import React, { useId, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/shadcn/label'
import { Button } from '@/components/ui/shadcn/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/shadcn/popover'
import {
  fromJalali,
  getTodayISO,
  jalaliMonthLength,
  jalaliMonthNames,
  jalaliWeekdayNamesShort,
  toJalali,
  toPersianDigits,
  formatJalaliDate,
} from '@/lib/jalali'

export interface PersianDatePickerProps {
  /** Gregorian ISO date (YYYY-MM-DD); '' means empty */
  value: string
  onChange: (iso: string) => void
  label?: string
  size?: 'small' | 'medium'
  fullWidth?: boolean
  disabled?: boolean
  readOnly?: boolean
  error?: boolean
  helperText?: React.ReactNode
  /** Gregorian ISO bounds for selectable days */
  min?: string
  max?: string
  /** show "پاک کردن" in the panel (default: true) */
  clearable?: boolean
  /** پشتیبانی قدیمی از پراپ MUI — نادیده گرفته می‌شود (فراخوانی‌های موجود نمی‌شکنند) */
  sx?: object
}

interface View {
  jy: number
  jm: number
}

const shiftMonth = (v: View, delta: number): View => {
  const n = v.jy * 12 + (v.jm - 1) + delta
  return { jy: Math.floor(n / 12), jm: ((n % 12) + 12) % 12 + 1 }
}

const cellBase: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.9rem',
  fontWeight: 600,
  background: 'transparent',
  color: '#0f172a',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}

/** دکمهٔ آیکونی ۴۴px — همان هدف لمسی IconButton قبلی */
const navButtonClass =
  'inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  value,
  onChange,
  label,
  fullWidth = true,
  disabled = false,
  readOnly = false,
  error = false,
  helperText,
  min,
  max,
  clearable = true,
}) => {
  const anchorRef = useRef<HTMLDivElement>(null)
  const inputId = useId()
  const helpId = `${inputId}-help`
  const [open, setOpen] = useState(false)

  const selected = useMemo(() => toJalali(value), [value])
  const todayIso = getTodayISO()

  const [view, setView] = useState<View>(() => {
    const j = toJalali(value) ?? toJalali(todayIso)
    return { jy: j!.jy, jm: j!.jm }
  })

  const openPanel = () => {
    if (disabled || readOnly) return
    const j = toJalali(value) ?? toJalali(todayIso)
    if (j) setView({ jy: j.jy, jm: j.jm })
    setOpen(true)
  }

  const monthLen = jalaliMonthLength(view.jy, view.jm)
  const firstWeekday = useMemo(() => {
    const iso = fromJalali(view.jy, view.jm, 1)
    const dt = new Date(`${iso}T00:00:00`)
    return (dt.getDay() + 1) % 7 // Saturday-first column index
  }, [view.jy, view.jm])

  const canPick = (iso: string) =>
    (!min || iso >= min) && (!max || iso <= max)

  const pick = (iso: string) => {
    onChange(iso)
    setOpen(false)
  }

  const prevYear = shiftMonth({ jy: view.jy - 1, jm: view.jm }, 0)
  const nextYear = shiftMonth({ jy: view.jy + 1, jm: view.jm }, 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={anchorRef} className={cn('relative', fullWidth ? 'w-full' : 'w-auto')}>
          {label && (
            <Label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              {label}
            </Label>
          )}
          {/* چون خود فیلد dir=ltr است، پیچِ آیکن هم در همان جهت ltr تعریف می‌شود
              تا start/end همیشه به همان سمتِ متنِ تاریخ بچسبد. */}
          <div dir="ltr" className="relative">
            <input
              id={inputId}
              value={value ? formatJalaliDate(value, { format: 'numeric', digits: 'en' }) : ''}
              disabled={disabled}
              placeholder={value ? undefined : '—'}
              dir="ltr"
              readOnly
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-invalid={error || undefined}
              aria-describedby={helperText ? helpId : undefined}
              onClick={openPanel}
              /* بدون آیکنِ دکمه‌ای، خودِ فیلد با کیبورد هم باید تقویم را باز کند */
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                  e.preventDefault()
                  openPanel()
                }
              }}
              className={cn(
                'flex h-11 w-full rounded-[10px] border border-input bg-card px-2.5 text-start text-[0.8rem] text-foreground shadow-sm transition-colors',
                'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-red-500 focus-visible:ring-red-500',
                readOnly ? 'cursor-default' : 'cursor-pointer',
                !readOnly && 'ps-9',
              )}
            />
            {/* آیکن تنها نشانهٔ بصری است؛ هدف لمسی خودِ فیلد ۴۴px است و دکمهٔ ۴۴px
                جداگانه فقط عرض متن را می‌خورد و تاریخ را می‌برید. فیلد و آیکن داخل
                پوشش dir=ltr‌اند، پس ps/start منطقى معادل سمت متنِ تاریخ می‌شود. */}
            {!readOnly && (
              <span className="pointer-events-none absolute start-2.5 top-1/2 flex -translate-y-1/2 items-center text-primary">
                <Icon icon="mdi:calendar-month-outline" className="h-5 w-5" />
              </span>
            )}
          </div>
          {helperText && (
            <p
              id={helpId}
              className={cn(
                'mt-1.5 text-xs',
                error ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
              )}
            >
              {helperText}
            </p>
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent align="start" dir="rtl" className="w-auto rounded-[14px] p-3">
        <div className="w-[308px]">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex">
              {/* convention RTL این پروژه (DateSelector/SlotWeekGrid): «قبل» با شیولرون راست،
                  «بعد» با شیولرون چپ — چون جریان خواندن راست‌به‌چپ است */}
              <button type="button" onClick={() => setView(prevYear)} aria-label="سال قبل" className={navButtonClass}>
                <Icon icon="mdi:chevron-double-right" className="h-[18px] w-[18px]" />
              </button>
              <button type="button" onClick={() => setView(shiftMonth(view, -1))} aria-label="ماه قبل" className={navButtonClass}>
                <Icon icon="mdi:chevron-right" className="h-[18px] w-[18px]" />
              </button>
            </div>
            <p className="text-[0.95rem] font-bold text-foreground">
              {toPersianDigits(`${jalaliMonthNames[view.jm - 1]} ${view.jy}`)}
            </p>
            <div className="flex">
              <button type="button" onClick={() => setView(shiftMonth(view, 1))} aria-label="ماه بعد" className={navButtonClass}>
                <Icon icon="mdi:chevron-left" className="h-[18px] w-[18px]" />
              </button>
              <button type="button" onClick={() => setView(nextYear)} aria-label="سال بعد" className={navButtonClass}>
                <Icon icon="mdi:chevron-double-left" className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>

          {/* ۷ ستون واقعی — گرید CSS به‌جای Grid دوازده‌ستونهٔ MUI که تقویم را
              ۱۲ روز در هر ردیف می‌چید (روزهای هفته با ستون‌ها ناهم‌تراز می‌شد) */}
          <div className="mb-1 grid grid-cols-7">
            {jalaliWeekdayNamesShort.map((d) => (
              <span
                key={d}
                className="text-center text-xs font-bold leading-7 text-muted-foreground"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-4">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <span key={`b${i}`} />
            ))}
            {Array.from({ length: monthLen }).map((_, i) => {
              const jd = i + 1
              const iso = fromJalali(view.jy, view.jm, jd)
              const isSelected = !!selected && selected.jy === view.jy && selected.jm === view.jm && selected.jd === jd
              const isToday = iso === todayIso
              const enabled = !!iso && canPick(iso)
              return (
                <div key={jd} className="flex justify-center">
                  <button
                    type="button"
                    disabled={!enabled}
                    onClick={() => pick(iso)}
                    style={{
                      ...cellBase,
                      background: isSelected
                        ? 'linear-gradient(135deg, #2563eb, #7c3aed)'
                        : 'transparent',
                      color: isSelected ? '#fff' : enabled ? '#0f172a' : 'rgba(15,23,42,0.25)',
                      cursor: enabled ? 'pointer' : 'default',
                      boxShadow: !isSelected && isToday ? 'inset 0 0 0 1.5px #2563eb' : 'none',
                    }}
                    aria-pressed={isSelected}
                    aria-label={iso ? formatJalaliDate(iso, { format: 'full' }) : undefined}
                  >
                    {toPersianDigits(jd)}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-2 flex justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const t = toJalali(todayIso)!
                setView({ jy: t.jy, jm: t.jm })
                if (canPick(todayIso)) pick(todayIso)
              }}
              className="h-11 text-xs font-semibold"
            >
              امروز
            </Button>
            {clearable && value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
                className="h-11 text-xs font-semibold text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                پاک کردن
              </Button>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export interface PersianDateRangePickerProps {
  start: string
  end: string
  onStartChange: (iso: string) => void
  onEndChange: (iso: string) => void
  startLabel?: string
  endLabel?: string
  size?: 'small' | 'medium'
  spacing?: number
}

/** دو انتخابگر کنار هم با محدودیت متقابل (پایان >= شروع) */
export const PersianDateRangePicker: React.FC<PersianDateRangePickerProps> = ({
  start,
  end,
  onStartChange,
  onEndChange,
  startLabel = 'از تاریخ',
  endLabel = 'تا تاریخ',
  size = 'medium',
  spacing = 2,
}) => (
  <div className="grid grid-cols-2" style={{ gap: `${spacing * 8}px` }}>
    <div>
      <PersianDatePicker label={startLabel} value={start} onChange={onStartChange} max={end || undefined} size={size} />
    </div>
    <div>
      <PersianDatePicker label={endLabel} value={end} onChange={onEndChange} min={start || undefined} size={size} />
    </div>
  </div>
)

export default PersianDatePicker
