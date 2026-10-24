// frontend/src/components/deals/PricingBreakdown.tsx
// «جزئیات قیمت» — نمایش مرحله‌به‌مرحله‌ی pricing_breakdown پاسخ رزرو:
// base → قوانین → (تطبیق سرور) → دیل → کوپن → امتیاز → قابل پرداخت. همه ارقام سمت سرور.

import React, { useId, useState } from 'react'
import { Icon } from '@iconify/react'
import { cn, formatPrice } from '@/lib/utils'
import { toPersianDigits } from '@/lib/jalali'

export interface BreakdownRuleEntry {
  rule_id: number
  label: string
  modifier_type: string
  value: number
  delta: number
}

export interface BreakdownStep {
  step: string
  amount: number
  rules?: BreakdownRuleEntry[]
  code?: string
  points?: number
}

export interface BreakdownPayload {
  steps: BreakdownStep[]
  payable: number | null
}

const STEP_LABELS: Record<string, string> = {
  base: 'قیمت پایه سانس',
  pricing_rules: 'قوانین قیمت‌گذاری',
  server_adjustments: 'تطبیق قیمت سرور',
  deal: 'تخفیف لحظه آخری',
  coupon: 'کد تخفیف',
  loyalty: 'امتیاز وفاداری',
}

const MODIFIER_FA: Record<string, string> = {
  percent: '٪',
  fixed: 'تومان',
  absolute: 'قیمت قطعی',
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

/** نرم‌الیز ورودیِ هر شکل از سرور (رشته‌ی JSON هم در pending ممکن است) به آرایه مراحل */
export function normalizeBreakdown(raw: unknown): BreakdownStep[] | null {
  let value = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }
  if (!Array.isArray(value) || value.length === 0) return null
  return value as BreakdownStep[]
}

const AmountRow: React.FC<{ label: React.ReactNode; amount: number; strong?: boolean; subRow?: boolean }> = ({ label, amount, strong = false, subRow = false }) => {
  const zero = amount === 0
  return (
    <div className={cn('flex items-center justify-between gap-3', subRow ? 'py-0.5 pe-6' : 'py-1 pe-0')}>
      <span
        className={cn(
          'min-w-0 truncate',
          subRow
            ? 'text-[0.68rem] font-normal text-muted-foreground'
            : strong
              ? 'text-[0.68rem] font-extrabold text-foreground'
              : 'text-[0.68rem] font-semibold text-slate-700 dark:text-slate-300'
        )}
      >
        {label}
      </span>
      <span
        dir="rtl"
        className={cn(
          'whitespace-nowrap tabular-nums',
          subRow ? 'text-[0.68rem]' : 'text-[0.68rem]',
          strong ? 'font-black' : 'font-bold',
          zero ? 'text-muted-foreground' : amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
        )}
      >
        {amount > 0 ? `+${formatPrice(amount)}` : amount < 0 ? `−${formatPrice(Math.abs(amount))}` : formatPrice(0)}
      </span>
    </div>
  )
}

const PricingBreakdown: React.FC<{ steps: BreakdownStep[]; payable: number | null }> = ({ steps, payable }) => {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  if (!steps || steps.length === 0) return null

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-white/70 dark:bg-white/[0.03]">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o) } }}
        className="flex cursor-pointer select-none items-center justify-between gap-2 px-3.5 py-2.5"
      >
        <div className="flex items-center gap-2">
          <Icon icon="mdi:receipt-text-outline" style={{ width: 18, height: 18, color: '#2563eb' }} />
          <span className="text-[0.68rem] font-extrabold text-foreground">جزئیات قیمت</span>
        </div>
        <div className="flex items-center gap-1">
          {isNumber(payable) && (
            <span className="text-[0.68rem] text-muted-foreground">
              قابل پرداخت:{' '}
              <b className="tabular-nums text-emerald-700 dark:text-emerald-400">{formatPrice(payable)}</b>
            </span>
          )}
          {/* ردیف خودش role=button است؛ دکمهٔ تودرتو یک tab stop تکراری می‌سازد */}
          <Icon icon={open ? 'mdi:chevron-up' : 'mdi:chevron-down'} aria-hidden="true" style={{ width: 18, height: 18, color: '#64748b' }} />
        </div>
      </div>
      <div className={cn('grid transition-all duration-200', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div id={panelId} className="border-t border-dashed border-border px-3.5 pb-3">
            {steps.map((s, i) => {
              const label =
                s.step === 'coupon' && s.code
                  ? `کد تخفیف (${s.code})`
                  : s.step === 'loyalty' && s.points
                    ? `امتیاز وفاداری (${toPersianDigits(s.points)} امتیاز)`
                    : STEP_LABELS[s.step] ?? s.step
              return (
                <div key={`${s.step}-${i}`}>
                  <AmountRow label={label} amount={s.amount} />
                  {s.step === 'pricing_rules' && Array.isArray(s.rules) && (s.rules as BreakdownRuleEntry[]).length > 0 && (
                    <div>
                      {(s.rules as BreakdownRuleEntry[]).map((r, ri) => (
                        <AmountRow
                          key={`${r.rule_id}-${ri}`}
                          subRow
                          label={
                            <span className="inline-flex items-center gap-2">
                              <Icon icon="mdi:tag-outline" style={{ width: 12, height: 12, opacity: 0.6 }} />
                              {r.label || `قانون #${toPersianDigits(r.rule_id)}`}
                              <span className="text-muted-foreground">
                                {r.modifier_type === 'percent'
                                  ? `${toPersianDigits((r.value / 100).toLocaleString('fa-IR', { maximumFractionDigits: 1 }))}٪`
                                  : MODIFIER_FA[r.modifier_type] ?? ''}
                              </span>
                            </span>
                          }
                          amount={r.delta}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {isNumber(payable) && <AmountRow label="💳 مبلغ قابل پرداخت" amount={payable} strong />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingBreakdown
