// src/pages/finance/analytics.ts
// تجمیع‌های خالص روی دفتر کل واقعی (بدون mock): سود و زیان، جریان نقدی،
// تفکیک هزینه و مشتریان برتر. همهٔ مبالغ ریال و INTEGER هستند.

import type { FinanceTransaction, FinanceScopeParams, SeriesPoint } from '@/services/finance'

export const isLive = (tx: FinanceTransaction) => tx.status !== 'voided'

/** بازهٔ قبلیِ هم‌طول (مبنا: from/to میلادی ISO) */
export function previousPeriod(scope: FinanceScopeParams): FinanceScopeParams {
  if (!scope.from || !scope.to) return {}
  const from = new Date(`${scope.from}T00:00:00Z`)
  const to = new Date(`${scope.to}T00:00:00Z`)
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1)
  const prevTo = new Date(from.getTime() - 86_400_000)
  const prevFrom = new Date(prevTo.getTime() - (days - 1) * 86_400_000)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { venue_id: scope.venue_id, from: iso(prevFrom), to: iso(prevTo) }
}

/** درصد تغییر؛ مبنای صفر ⇒ null (نمایش «—» بهتر از بی‌نهایت است) */
export function pctChange(current: number, prev: number | null | undefined): number | null {
  if (prev === null || prev === undefined || prev === 0) return null
  return ((current - prev) / Math.abs(prev)) * 100
}

export const sumOf = (items: FinanceTransaction[]) => items.reduce((s, t) => s + t.amount, 0)

export interface BreakdownRow {
  key: string
  label: string
  amount: number
  count: number
  share: number
}

/** تفکیک هزینه بر اساس دسته‌بندی — ردیف‌های ابطال‌شده کنار گذاشته می‌شوند */
export function expenseBreakdown(items: FinanceTransaction[]): BreakdownRow[] {
  const map = new Map<string, { label: string; amount: number; count: number }>()
  for (const tx of items) {
    if (!isLive(tx) || tx.direction !== 'expense') continue
    const key = tx.expense_category_id ? String(tx.expense_category_id) : 'none'
    const label = tx.expense_category_name || 'بدون دسته‌بندی'
    const row = map.get(key) ?? { label, amount: 0, count: 0 }
    row.amount += tx.amount
    row.count += 1
    map.set(key, row)
  }
  const rows = [...map.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.amount - a.amount)
  const total = rows.reduce((s, r) => s + r.amount, 0)
  return rows.map((r) => ({ ...r, share: total > 0 ? (r.amount / total) * 100 : 0 }))
}

export interface MethodFlowRow {
  method: string
  inflow: number
  outflow: number
  net: number
  count: number
}

/** جریان نقدی به تفکیک روش پرداخت */
export function methodFlow(items: FinanceTransaction[]): MethodFlowRow[] {
  const map = new Map<string, MethodFlowRow>()
  for (const tx of items) {
    if (!isLive(tx)) continue
    const row = map.get(tx.method) ?? { method: tx.method, inflow: 0, outflow: 0, net: 0, count: 0 }
    if (tx.direction === 'income') row.inflow += tx.amount
    else row.outflow += tx.amount
    row.net = row.inflow - row.outflow
    row.count += 1
    map.set(tx.method, row)
  }
  return [...map.values()].sort((a, b) => b.inflow + b.outflow - (a.inflow + a.outflow))
}

export interface CounterpartyRow {
  id: number
  name: string
  amount: number
  count: number
}

/** اشخاص برتر بر اساس گردش (پیش‌فرض: دریافت‌ها) */
export function topCounterparties(
  items: FinanceTransaction[],
  direction: 'income' | 'expense' = 'income',
  limit = 5,
): CounterpartyRow[] {
  const map = new Map<number, CounterpartyRow>()
  for (const tx of items) {
    if (!isLive(tx) || tx.direction !== direction || !tx.counterparty) continue
    const row = map.get(tx.counterparty) ?? {
      id: tx.counterparty,
      name: tx.counterparty_name || `کاربر #${tx.counterparty}`,
      amount: 0,
      count: 0,
    }
    row.amount += tx.amount
    row.count += 1
    map.set(tx.counterparty, row)
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, limit)
}

/** جمع بر اساس وضعیت (قطعی/در انتظار) برای بخش «در راه» جریان نقدی */
export function statusTotals(items: FinanceTransaction[]) {
  let cleared = 0
  let pending = 0
  let voided = 0
  for (const tx of items) {
    if (tx.status === 'voided') voided += tx.amount
    else if (tx.status === 'pending') pending += tx.amount
    else cleared += tx.amount
  }
  return { cleared, pending, voided }
}

/** خالص روزانهٔ نمودار سری (مبنای جریان نقدی روزانه) */
export const seriesTotals = (points: SeriesPoint[]) => {
  const income = points.reduce((s, p) => s + p.income, 0)
  const expense = points.reduce((s, p) => s + p.expense, 0)
  return { income, expense, net: income - expense }
}
