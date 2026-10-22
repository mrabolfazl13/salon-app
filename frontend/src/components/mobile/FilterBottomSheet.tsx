import React, { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { cn, formatPrice } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/shadcn/dialog'
import { Switch } from '@/components/ui/shadcn/switch'
import { Button } from '@/components/ui/shadcn/button'
import PrimaryButton from './PrimaryButton'
import { SPORTS, type Sport } from './SportChip'

export interface VenueFilters {
  category?: 'futsal' | 'gym'
  sportKey?: string
  minPrice?: number
  maxPrice?: number
  amenities?: string[]
  verifiedOnly?: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  /** حداکثر قیمت در داده‌ها (برای مقیاس اسلایدر) */
  priceCeiling: number
  /** لیست امکانات موجود در نتایج */
  amenityOptions: string[]
  value: VenueFilters
  onApply: (filters: VenueFilters) => void
}

const PRICE_FLOOR = 0

/** اسلایدر دو دستگیره‌ای بومی — بدون وابستگی اضافه، سازگار با RTL */
const PriceRangeSlider: React.FC<{
  value: [number, number]
  min: number
  max: number
  step: number
  onChange: (value: [number, number]) => void
}> = ({ value, min, max, step, onChange }) => {
  const [lo, hi] = value
  const span = Math.max(1, max - min)
  const startPct = ((lo - min) / span) * 100
  const widthPct = ((hi - lo) / span) * 100

  const inputClass =
    'pointer-events-none absolute inset-x-0 top-1/2 z-10 h-9 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent outline-none ' +
    '[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent ' +
    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-card [&::-webkit-slider-thumb]:shadow-md ' +
    '[&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-card ' +
    'focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-ring/50 focus-visible:[&::-webkit-slider-thumb]:ring-offset-2 focus-visible:[&::-webkit-slider-thumb]:ring-offset-background'

  return (
    <div className="relative mb-4 h-9 w-full">
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted" />
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
        style={{ insetInlineStart: `${startPct}%`, width: `${widthPct}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={lo}
        onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
        aria-label="حداقل قیمت"
        aria-valuetext={formatPrice(lo)}
        className={cn(inputClass, 'z-20')}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={hi}
        onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
        aria-label="حداکثر قیمت"
        aria-valuetext={formatPrice(hi)}
        className={inputClass}
      />
    </div>
  )
}

const chipClass = (on: boolean) =>
  cn(
    'inline-flex min-h-9 items-center gap-1.5 rounded-[10px] border px-3 text-[0.68rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    on
      ? 'border-amber-500 bg-amber-500/[0.12] text-amber-800 dark:border-amber-400 dark:bg-amber-400/15 dark:text-amber-300'
      : 'border-transparent bg-slate-900/[0.04] text-foreground hover:bg-slate-900/[0.07] dark:bg-white/[0.06] dark:hover:bg-white/[0.1]'
  )

/** فیلترها به‌صورت Bottom Sheet در موبایل — هرگز سایدبار نیست */
const FilterBottomSheet: React.FC<Props> = ({
  open,
  onClose,
  priceCeiling,
  amenityOptions,
  value,
  onApply,
}) => {
  const ceiling = Math.max(priceCeiling, 100000)
  const [draft, setDraft] = useState<VenueFilters>(value)

  // همگام‌سازی با فیلترهای اعمال‌شده هر بار که شیت باز می‌شود
  useEffect(() => {
    if (open) setDraft(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const priceRange = useMemo<[number, number]>(
    () => [draft.minPrice ?? PRICE_FLOOR, draft.maxPrice ?? ceiling],
    [draft.minPrice, draft.maxPrice, ceiling],
  )

  const activeCount = useMemo(() => {
    let n = 0
    if (draft.category) n += 1
    if (draft.minPrice != null || draft.maxPrice != null) n += 1
    if (draft.verifiedOnly) n += 1
    n += draft.amenities?.length ?? 0
    return n
  }, [draft])

  const handleSport = (sport: Sport) => {
    setDraft((d) =>
      d.sportKey === sport.key
        ? { ...d, sportKey: undefined, category: undefined }
        : { ...d, sportKey: sport.key, category: sport.category },
    )
  }

  const toggleAmenity = (a: string) => {
    setDraft((d) => {
      const cur = d.amenities ?? []
      return {
        ...d,
        amenities: cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a],
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="inset-x-0 bottom-0 top-auto z-[70] max-h-[86dvh] translate-y-0 gap-0 overflow-y-auto rounded-t-3xl border-x-0 border-b-0 p-0 sm:inset-x-0 sm:bottom-0 sm:start-0 sm:top-auto sm:w-full sm:max-w-none sm:translate-x-0 rtl:sm:translate-x-0">
        <DialogTitle className="sr-only">فیلترها</DialogTitle>
        <DialogDescription className="sr-only">
          فیلتر سالن‌ها بر اساس نوع ورزش، محدوده قیمت و امکانات
        </DialogDescription>

        <div className="px-5 pb-[calc(24px_+_env(safe-area-inset-bottom))] pt-3">
          {/* هندل + هدر */}
          <div className="mb-1 flex justify-center">
            <div className="h-1 w-10 rounded-full bg-slate-900/[0.12] dark:bg-white/[0.16]" />
          </div>
          <div className="mb-4 flex items-center justify-between gap-2 pe-10">
            <p className="text-[1.05rem] font-extrabold text-foreground">
              فیلترها
              {activeCount > 0 && (
                <span className="ms-2 text-[0.68rem] font-bold text-amber-700 dark:text-amber-400">
                  ({activeCount.toLocaleString('fa-IR')})
                </span>
              )}
            </p>
          </div>

          {/* نوع ورزش */}
          <p className="mb-1.5 text-[0.85rem] font-bold text-foreground">نوع ورزش</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {SPORTS.map((sport) => {
              const on = draft.sportKey === sport.key
              return (
                <button
                  key={sport.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => handleSport(sport)}
                  className={chipClass(on)}
                >
                  <Icon
                    icon={sport.icon}
                    aria-hidden="true"
                    style={{ width: 16, height: 16 }}
                    className="text-amber-600 dark:text-amber-400"
                  />
                  {sport.label}
                  {on && <Icon icon="mdi:check" aria-hidden="true" style={{ width: 15, height: 15 }} />}
                </button>
              )
            })}
          </div>

          {/* محدوده قیمت */}
          <p className="mb-1 text-[0.85rem] font-bold text-foreground">محدوده قیمت</p>
          <p className="mb-1 text-[0.68rem] text-muted-foreground">
            {formatPrice(priceRange[0])} تا {formatPrice(priceRange[1])}
          </p>
          <PriceRangeSlider
            value={priceRange}
            min={PRICE_FLOOR}
            max={ceiling}
            step={50000}
            onChange={([lo, hi]) =>
              setDraft((d) => ({
                ...d,
                minPrice: lo <= PRICE_FLOOR ? undefined : lo,
                maxPrice: hi >= ceiling ? undefined : hi,
              }))
            }
          />

          {/* امکانات */}
          {amenityOptions.length > 0 && (
            <>
              <p className="mb-1.5 text-[0.85rem] font-bold text-foreground">امکانات</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {amenityOptions.slice(0, 12).map((a) => {
                  const on = draft.amenities?.includes(a) ?? false
                  return (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleAmenity(a)}
                      className={chipClass(on)}
                    >
                      {a}
                      {on && <Icon icon="mdi:check" aria-hidden="true" style={{ width: 15, height: 15 }} />}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* فقط تأیید شده */}
          <label
            htmlFor="venue-verified-only"
            className="mb-4 flex min-h-9 cursor-pointer items-center justify-between gap-3"
          >
            <span className="flex items-center gap-2">
              <Icon
                icon="mdi:shield-check"
                aria-hidden="true"
                className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
              />
              <span className="text-[0.85rem] font-bold text-foreground">فقط سالن‌های تأیید شده</span>
            </span>
            <Switch
              id="venue-verified-only"
              checked={draft.verifiedOnly ?? false}
              onCheckedChange={(checked) =>
                setDraft((d) => ({ ...d, verifiedOnly: checked || undefined }))
              }
              aria-label="فقط سالن‌های تأیید شده"
            />
          </label>

          {/* اکشن‌ها */}
          <div className="flex gap-3">
            <PrimaryButton
              className="flex-[2]"
              onClick={() => {
                onApply(draft)
                onClose()
              }}
            >
              اعمال فیلتر
            </PrimaryButton>
            <Button
              variant="outline"
              className="flex-1 font-bold text-muted-foreground"
              onClick={() => {
                const empty: VenueFilters = {}
                setDraft(empty)
                onApply(empty)
                onClose()
              }}
            >
              پاک کردن
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FilterBottomSheet
