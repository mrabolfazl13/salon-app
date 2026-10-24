// src/pages/finance/FinanceScopeBar.tsx
// فیلتر مشترک دامنهٔ گزارش‌ها (سالن + بازهٔ جلالی) + state آن.
// در نمای کلی و گزارش‌ها یکسان است تا کاربر بین صفحات سردرگم نشود.

import React, { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Label } from '@/components/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import PersianDatePicker from '@/components/ui/PersianDatePicker'
import type { FinanceVenue } from '@/hooks/useFinance'
import type { FinanceScopeParams } from '@/services/finance'
import { getTodayISO } from '@/lib/jalali'

export const isoDaysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const PRESETS = [
  { label: '۷ روز', days: 6 },
  { label: '۳۰ روز', days: 30 },
  { label: '۹۰ روز', days: 90 },
]

/**
 * دامنهٔ گزارش‌ها (سالن + بازه) با پشتیبان URL.
 * چرا URL: ورود از داشبورد سالن باید با «همین سالن» باز شود و جابه‌جایی بین
 * زیرصفحه‌های مالی/رفرش/اشتراک لینک، سالن انتخاب‌شده را از دست ندهد.
 */
export function useFinanceScope(initialDays = 30) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [venueSel, setVenueSelState] = useState<number | 'all'>(() => {
    const raw = Number(searchParams.get('venue_id'))
    return Number.isFinite(raw) && raw > 0 ? raw : 'all'
  })
  const [from, setFromState] = useState(() => searchParams.get('from') || isoDaysAgo(initialDays))
  const [to, setToState] = useState(() => searchParams.get('to') || getTodayISO())

  const patchParams = useCallback(
    (patch: { venue_id?: number | null; from?: string; to?: string }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if ('venue_id' in patch) {
            if (patch.venue_id) next.set('venue_id', String(patch.venue_id))
            else next.delete('venue_id')
          }
          if (patch.from !== undefined) {
            if (patch.from) next.set('from', patch.from)
            else next.delete('from')
          }
          if (patch.to !== undefined) {
            if (patch.to) next.set('to', patch.to)
            else next.delete('to')
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setVenueSel = useCallback(
    (value: number | 'all') => {
      setVenueSelState(value)
      patchParams({ venue_id: value === 'all' ? null : value })
    },
    [patchParams],
  )
  const setFrom = useCallback(
    (value: string) => {
      setFromState(value)
      patchParams({ from: value })
    },
    [patchParams],
  )
  const setTo = useCallback(
    (value: string) => {
      setToState(value)
      patchParams({ to: value })
    },
    [patchParams],
  )

  const scope = useMemo<FinanceScopeParams>(
    () => ({
      venue_id: venueSel === 'all' ? undefined : venueSel,
      from: from || undefined,
      to: to || undefined,
    }),
    [venueSel, from, to],
  )

  return { venueSel, setVenueSel, from, setFrom, to, setTo, scope }
}

interface Props {
  venues: FinanceVenue[]
  venueSel: number | 'all'
  onVenueChange: (value: number | 'all') => void
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

const pillBase =
  'inline-flex min-h-11 items-center justify-center rounded-md px-2.5 text-[0.7rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const FinanceScopeBar: React.FC<Props> = ({
  venues,
  venueSel,
  onVenueChange,
  from,
  to,
  onFromChange,
  onToChange,
}) => (
  <div className="rounded-xl border border-border bg-card p-2.5">
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1 sm:w-[180px]">
        <Label htmlFor="fin-scope-venue" className="text-[0.68rem] text-muted-foreground">
          سالن
        </Label>
        <Select
          value={venueSel === 'all' ? 'all' : String(venueSel)}
          onValueChange={(v) => onVenueChange(v === 'all' ? 'all' : Number(v))}
        >
          <SelectTrigger id="fin-scope-venue" className="min-h-11 text-[0.72rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه سالن‌های من</SelectItem>
            {venues.map((v) => (
              <SelectItem key={v.id} value={String(v.id)}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-1" role="group" aria-label="بازه‌های آماده">
        {PRESETS.map((preset) => {
          const active = from === isoDaysAgo(preset.days)
          return (
            <button
              key={preset.days}
              type="button"
              aria-pressed={active}
              onClick={() => {
                onFromChange(isoDaysAgo(preset.days))
                onToChange(getTodayISO())
              }}
              className={
                active
                  ? `${pillBase} bg-blue-600 text-white`
                  : `${pillBase} border border-border bg-background text-foreground hover:bg-muted`
              }
            >
              {preset.label}
            </button>
          )
        })}
      </div>

      <div className="flex min-w-0 flex-1 gap-2">
        <div className="min-w-0 flex-1">
          <PersianDatePicker size="small" label="از" value={from} onChange={onFromChange} max={to || undefined} />
        </div>
        <div className="min-w-0 flex-1">
          <PersianDatePicker size="small" label="تا" value={to} onChange={onToChange} min={from || undefined} />
        </div>
      </div>
    </div>
  </div>
)

export default FinanceScopeBar
