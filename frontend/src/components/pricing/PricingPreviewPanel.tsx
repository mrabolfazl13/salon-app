// frontend/src/components/pricing/PricingPreviewPanel.tsx
// «پیش‌نمایش» موتور قیمت — POST /pricing/preview همان مسیرِ لحظه‌ی رزرو را اجرا
// می‌کند: مبنای سالن + زنجیره‌ی قوانینِ منطبق → قیمت نهایی. محاسباتی است، ذخیره نمی‌کند.

import React, { useId, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import PersianDatePicker from '@/components/ui/PersianDatePicker'
import { extractError, formatRial } from '@/components/finance/shared'
import { getTodayISO, toPersianDigits } from '@/lib/jalali'
import { usePricingPreview } from '@/hooks/usePricing'
import { MODIFIER_LABELS, faTime, parseIntFa, timeToHHMM } from './shared'
import type { PricingPreview } from '@/services/pricing'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Separator } from '@/components/ui/shadcn/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'

interface Props {
  venueId: number
}

const PricingPreviewPanel: React.FC<Props> = ({ venueId }) => {
  const [date, setDate] = useState(getTodayISO())
  const [time, setTime] = useState('18:00')
  const [duration, setDuration] = useState('90')
  const [baseOverride, setBaseOverride] = useState('')
  const [result, setResult] = useState<PricingPreview | null>(null)
  const preview = usePricingPreview()

  const timeId = useId()
  const baseId = useId()

  const run = () => {
    setResult(null)
    if (!date) {
      toast.error('تاریخ را انتخاب کنید')
      return
    }
    const st = timeToHHMM(time)
    if (!st) {
      toast.error('ساعت را به شکل ۱۸:۳۰ وارد کنید')
      return
    }
    const dur = parseIntFa(duration)
    if (!dur || dur < 15 || dur > 240) {
      toast.error('مدت باید بین ۱۵ تا ۲۴۰ دقیقه باشد')
      return
    }
    let base: number | null = null
    if (baseOverride.trim()) {
      const b = parseIntFa(baseOverride)
      if (b === null || b < 0) {
        toast.error('مبنای دلخواه نامعتبر است')
        return
      }
      base = b
    }
    preview.mutate(
      { venue_id: venueId, slot_date: date, start_time: st, base_price: base, duration: dur },
      {
        onSuccess: (data) => setResult(data),
        onError: (err) => toast.error(extractError(err, 'خطا در پیش‌نمایش قیمت')),
      },
    )
  }

  return (
    <div className="rounded-2xl border border-blue-600/[0.18] bg-gradient-to-br from-blue-600/[0.04] to-violet-600/[0.04] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon icon="mdi:eye-outline" className="h-5 w-5" style={{ color: '#2563eb' }} aria-hidden="true" />
        <h2 className="text-sm font-extrabold text-foreground">پیش‌نمایش قیمت — همان موتور لحظه‌ی رزرو</h2>
      </div>
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-[170px] flex-[1_1_180px]">
          <PersianDatePicker label="تاریخ" value={date} onChange={setDate} size="small" clearable={false} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={timeId}>ساعت شروع</Label>
          <Input
            id={timeId}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            dir="ltr"
            className="w-[120px] tabular-nums"
          />
        </div>
        <div className="flex min-w-[130px] flex-col gap-1.5">
          <Label id="pp-duration-label" htmlFor="pp-duration-select">مدت (دقیقه)</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger id="pp-duration-select" aria-labelledby="pp-duration-label" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[60, 75, 90, 120].map((d) => (
                <SelectItem key={d} value={String(d)}>{toPersianDigits(d)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-[140px] flex-[1_1_150px] flex-col gap-1.5">
          <Label htmlFor={baseId}>مبنای دلخواه (ریال)</Label>
          <Input
            id={baseId}
            value={baseOverride}
            onChange={(e) => setBaseOverride(e.target.value)}
            placeholder="خالی = پیش‌فرض سالن"
            className="tabular-nums"
          />
        </div>
        <Button
          onClick={run}
          disabled={preview.isPending}
          className="self-end bg-gradient-to-br from-blue-600 to-violet-600 font-bold text-white hover:from-blue-700 hover:to-violet-700"
        >
          {preview.isPending ? (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              role="status"
              aria-label="در حال بارگذاری"
            />
          ) : (
            <Icon icon="mdi:calculator-variant-outline" className="h-4 w-4" aria-hidden="true" />
          )}
          محاسبه
        </Button>
      </div>

      {result && (
        <div className="mt-5">
          <Separator className="mb-4" />
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-xs font-semibold text-foreground tabular-nums">
              {`مبنا: ${formatRial(result.base_price)}`}
            </span>
            <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-xs text-foreground tabular-nums">
              {`زمان بررسی: ${toPersianDigits(result.slot_date)} — ${faTime(result.start_time)}`}
            </span>
            {result.is_holiday && (
              <span className="inline-flex items-center rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                این تاریخ تعطیل است 🔔
              </span>
            )}
          </div>
          {result.rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">هیچ قانونی روی این سانس اعمال نشد — قیمت = مبنا.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold text-muted-foreground">زنجیره‌ی قوانین اعمال‌شده (به ترتیب اجرا):</p>
              {result.rules.map((r, idx) => (
                <div
                  key={`${r.rule_id}-${idx}`}
                  className="flex items-center justify-between gap-2 rounded-[10px] bg-blue-600/[0.05] px-3 py-1.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon icon="mdi:tag-outline" className="h-[15px] w-[15px] shrink-0" style={{ color: '#2563eb' }} aria-hidden="true" />
                    <p className="min-w-0 truncate text-sm font-bold text-foreground">
                      {r.label || `قانون #${toPersianDigits(r.rule_id)}`}
                    </p>
                    <span className="inline-flex h-5 shrink-0 items-center rounded-md bg-muted px-1.5 text-xs text-foreground tabular-nums">
                      {`${MODIFIER_LABELS[r.modifier_type] ?? r.modifier_type} ${toPersianDigits(Math.abs(r.modifier_type === 'percent' ? r.value / 100 : r.value))}${r.modifier_type === 'percent' ? '٪' : ' ریال'}`}
                    </span>
                  </div>
                  <span
                    dir="rtl"
                    className={
                      r.delta > 0
                        ? 'whitespace-nowrap text-sm font-extrabold text-red-600 tabular-nums dark:text-red-400'
                        : r.delta < 0
                          ? 'whitespace-nowrap text-sm font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400'
                          : 'whitespace-nowrap text-sm font-extrabold text-muted-foreground tabular-nums'
                    }
                  >
                    {r.delta >= 0 ? '+' : '−'}{formatRial(Math.abs(r.delta))}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-600/[0.08] p-4">
            <span className="text-sm font-extrabold text-emerald-900 dark:text-emerald-300">قیمت نهایی این سانس</span>
            <span className="text-lg font-black text-emerald-700 tabular-nums dark:text-emerald-400">{formatRial(result.final_price)}</span>
          </div>
          {preview.isPending && <LoadingBoxCompact />}
        </div>
      )}
    </div>
  )
}

const LoadingBoxCompact: React.FC = () => (
  <div className="mt-3 flex justify-center">
    <span
      className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
      role="status"
      aria-label="در حال بارگذاری"
    />
  </div>
)

export default PricingPreviewPanel
