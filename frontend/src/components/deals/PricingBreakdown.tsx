// frontend/src/components/deals/PricingBreakdown.tsx
// «جزئیات قیمت» — نمایش مرحله‌به‌مرحله‌ی pricing_breakdown پاسخ رزرو:
// base → قوانین → (تطبیق سرور) → دیل → کوپن → امتیاز → قابل پرداخت. همه ارقام سمت سرور.

import React, { useState } from 'react'
import { Box, Collapse, IconButton, Typography } from '@mui/material'
import { Icon } from '@iconify/react'
import { formatRial } from '@/components/finance/shared'
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
  fixed: 'ریال',
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
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, py: subRow ? 0.2 : 0.55, pl: subRow ? 3 : 0 }}>
      <Typography
        variant={subRow ? 'caption' : 'body2'}
        sx={{ color: subRow ? 'text.secondary' : strong ? '#0f172a' : '#334155', fontWeight: strong ? 800 : subRow ? 400 : 600, minWidth: 0 }}
        noWrap
      >
        {label}
      </Typography>
      <Typography
        dir="rtl"
        variant={subRow ? 'caption' : 'body2'}
        sx={{
          fontWeight: strong ? 900 : 700,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
          color: zero ? '#64748b' : amount > 0 ? '#dc2626' : '#059669',
        }}
      >
        {amount > 0 ? `+${formatRial(amount)}` : amount < 0 ? `−${formatRial(Math.abs(amount))}` : formatRial(0)}
      </Typography>
    </Box>
  )
}

const PricingBreakdown: React.FC<{ steps: BreakdownStep[]; payable: number | null }> = ({ steps, payable }) => {
  const [open, setOpen] = useState(false)
  if (!steps || steps.length === 0) return null

  return (
    <Box
      sx={{
        borderRadius: '14px',
        border: '1px solid rgba(15,23,42,0.08)',
        background: 'rgba(255,255,255,0.7)',
        overflow: 'hidden',
      }}
    >
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 1.75, py: 1.25, cursor: 'pointer', userSelect: 'none' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon="mdi:receipt-text-outline" style={{ width: 18, height: 18, color: '#2563eb' }} />
          <Typography variant="body2" sx={{ fontWeight: 800 }}>جزئیات قیمت</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isNumber(payable) && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              قابل پرداخت: <b style={{ color: '#059669', fontVariantNumeric: 'tabular-nums' }}>{formatRial(payable)}</b>
            </Typography>
          )}
          <IconButton size="small" sx={{ color: '#64748b' }}>
            <Icon icon={open ? 'mdi:chevron-up' : 'mdi:chevron-down'} style={{ width: 18, height: 18 }} />
          </IconButton>
        </Box>
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 1.75, pb: 1.5, borderTop: '1px dashed rgba(15,23,42,0.08)' }}>
          {steps.map((s, i) => {
            const label =
              s.step === 'coupon' && s.code
                ? `کد تخفیف (${s.code})`
                : s.step === 'loyalty' && s.points
                  ? `امتیاز وفاداری (${toPersianDigits(s.points)} امتیاز)`
                  : STEP_LABELS[s.step] ?? s.step
            return (
              <Box key={`${s.step}-${i}`}>
                <AmountRow label={label} amount={i === 0 ? s.amount : s.amount} />
                {s.step === 'pricing_rules' && Array.isArray(s.rules) && (s.rules as BreakdownRuleEntry[]).length > 0 && (
                  <Box>
                    {(s.rules as BreakdownRuleEntry[]).map((r, ri) => (
                      <AmountRow
                        key={`${r.rule_id}-${ri}`}
                        subRow
                        label={
                          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                            <Icon icon="mdi:tag-outline" style={{ width: 12, height: 12, opacity: 0.6 }} />
                            {r.label || `قانون #${toPersianDigits(r.rule_id)}`}
                            <Box component="span" sx={{ color: 'text.secondary' }}>
                              {r.modifier_type === 'percent'
                                ? `${toPersianDigits((r.value / 100).toLocaleString('fa-IR', { maximumFractionDigits: 1 }))}٪`
                                : MODIFIER_FA[r.modifier_type] ?? ''}
                            </Box>
                          </Box>
                        }
                        amount={r.delta}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )
          })}
          {isNumber(payable) && <AmountRow label="💳 مبلغ قابل پرداخت" amount={payable} strong />}
        </Box>
      </Collapse>
    </Box>
  )
}

export default PricingBreakdown