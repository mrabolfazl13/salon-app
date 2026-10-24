// src/pages/finance/CashFlow.tsx
// جریان نقدی دوره: ورودی/خروجی، خالص، تفکیک روش پرداخت، روند روزانه و
// مبالغ «در راه» (تراکنش‌های در انتظار تسویه). همه از دفتر کل واقعی.

import React, { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Icon } from '@iconify/react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useRevenueSeries, useScopeLedger } from '@/hooks/useFinance'
import { Button } from '@/components/ui/shadcn/button'
import {
  EmptyBox,
  ErrorBox,
  FinTooltip,
  LoadingBox,
  SectionCard,
  TX_METHOD_LABELS,
  extractError,
  faNum,
  formatPct,
  formatRial,
  formatRialCompact,
  jalaliDayLabel,
  labelOf,
  shortRialAxis,
} from '@/components/finance/shared'
import FinanceHeader from './FinanceHeader'
import FinanceScopeBar, { useFinanceScope } from './FinanceScopeBar'
import { isLive, methodFlow, statusTotals } from './analytics'
import type { FinanceOutletContext } from './context'

const CHART_TICK = { fontSize: 10.5, fill: '#64748b' }
const IN_COLOR = '#059669'
const OUT_COLOR = '#dc2626'

const CashFlow: React.FC = () => {
  const { venues } = useOutletContext<FinanceOutletContext>()
  const scopeState = useFinanceScope()
  const { scope } = scopeState

  const ledger = useScopeLedger(scope)
  const series = useRevenueSeries({ ...scope, group_by: 'day' })

  const items = useMemo(() => (ledger.data?.items ?? []).filter(isLive), [ledger.data])
  const methods = useMemo(() => methodFlow(items), [items])
  const status = useMemo(() => statusTotals(ledger.data?.items ?? []), [ledger.data])

  const inflow = items.filter((t) => t.direction === 'income').reduce((s, t) => s + t.amount, 0)
  const outflow = items.filter((t) => t.direction === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = inflow - outflow
  const cover = outflow > 0 ? inflow / outflow : null

  const dayPoints = useMemo(
    () =>
      (series.data?.points ?? []).map((p) => ({
        label: jalaliDayLabel(p.key),
        income: p.income,
        expense: p.expense,
      })),
    [series.data],
  )

  const loading = ledger.isPending || series.isPending
  const hasError = ledger.isError || series.isError

  return (
    <div className="min-h-screen bg-background pb-8">
      <FinanceHeader
        title="جریان نقدی"
        subtitle="پول وارد و خارج‌شده، روش‌های پرداخت و مبالغ در راه"
        backTo="/finance"
        backLabel="بازگشت به امور مالی"
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="min-h-11 gap-1.5 px-2.5 text-[0.72rem] print:hidden"
          >
            <Icon icon="mdi:printer-outline" className="h-3.5 w-3.5" aria-hidden="true" />
            چاپ
          </Button>
        }
      />

      <main className="mx-auto max-w-5xl space-y-3 px-3 py-3 sm:px-6 sm:py-4">
        <div className="print:hidden">
          <FinanceScopeBar
            venues={venues}
            venueSel={scopeState.venueSel}
            onVenueChange={scopeState.setVenueSel}
            from={scopeState.from}
            to={scopeState.to}
            onFromChange={scopeState.setFrom}
            onToChange={scopeState.setTo}
          />
        </div>

        {hasError ? (
          <SectionCard title="خطا" icon="mdi:alert-circle-outline" color="#b91c1c">
            <ErrorBox
              message={extractError(ledger.error ?? series.error, 'خطا در دریافت جریان نقدی')}
              onRetry={() => {
                void ledger.refetch()
                void series.refetch()
              }}
            />
          </SectionCard>
        ) : loading ? (
          <SectionCard title="جریان نقدی" icon="mdi:swap-horizontal">
            <LoadingBox text="در حال محاسبهٔ جریان نقدی..." />
          </SectionCard>
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-card p-3.5 shadow-sm sm:p-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-[0.7rem] font-semibold text-muted-foreground">ورودی نقد</p>
                  <p className="mt-1 text-[1.05rem] font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatRialCompact(inflow)}
                  </p>
                </div>
                <div>
                  <p className="text-[0.7rem] font-semibold text-muted-foreground">خروجی نقد</p>
                  <p className="mt-1 text-[1.05rem] font-extrabold tabular-nums text-red-600 dark:text-red-400">
                    {formatRialCompact(outflow)}
                  </p>
                </div>
                <div className="border-t border-border pt-2 sm:border-s sm:border-t-0 sm:ps-4 sm:pt-0">
                  <p className="text-[0.7rem] font-semibold text-muted-foreground">خالص جریان</p>
                  <p
                    className={
                      net >= 0
                        ? 'mt-1 text-[1.05rem] font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400'
                        : 'mt-1 text-[1.05rem] font-extrabold tabular-nums text-red-600 dark:text-red-400'
                    }
                  >
                    {formatRialCompact(net)}
                  </p>
                </div>
                <div className="border-t border-border pt-2 sm:border-s sm:border-t-0 sm:ps-4 sm:pt-0">
                  <p className="text-[0.7rem] font-semibold text-muted-foreground">پوشش هزینه</p>
                  <p className="mt-1 text-[1.05rem] font-extrabold tabular-nums text-foreground">
                    {cover === null ? '—' : formatPct(cover * 100)}
                  </p>
                  <p className="text-[0.62rem] text-muted-foreground">ورودی ÷ خروجی</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2.5 text-[0.68rem] text-muted-foreground">
                <span>قطعی: {formatRialCompact(status.cleared)}</span>
                <span>در انتظار تسویه: {formatRialCompact(status.pending)}</span>
                {status.voided > 0 && <span>ابطال‌شده: {formatRialCompact(status.voided)}</span>}
              </div>
            </section>

            <SectionCard title="روند روزانهٔ ورود و خروج" icon="mdi:chart-bar" color="#2563eb">
              {dayPoints.length === 0 ? (
                <EmptyBox icon="mdi:chart-bar" title="داده‌ای در این بازه نیست" />
              ) : (
                <div dir="rtl" className="h-[210px] sm:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayPoints} margin={{ top: 8, right: 6, left: 0, bottom: 0 }} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="label"
                        reversed
                        tick={CHART_TICK}
                        interval="preserveStartEnd"
                        minTickGap={18}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        orientation="right"
                        width={64}
                        tickFormatter={shortRialAxis}
                        tick={CHART_TICK}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<FinTooltip />} cursor={{ fill: 'rgba(100,116,139,0.08)' }} />
                      <Bar dataKey="income" name="ورودی" fill={IN_COLOR} radius={[4, 4, 0, 0]} maxBarSize={16} />
                      <Bar dataKey="expense" name="خروجی" fill={OUT_COLOR} radius={[4, 4, 0, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>

            <SectionCard title="به تفکیک روش پرداخت" icon="mdi:credit-card-outline" color="#7c3aed">
              {methods.length === 0 ? (
                <EmptyBox icon="mdi:credit-card-off-outline" title="تراکنشی در این بازه نیست" />
              ) : (
                <div className="space-y-3">
                  {methods.map((m) => {
                    const total = m.inflow + m.outflow
                    return (
                      <div key={m.method}>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[0.75rem] font-semibold text-foreground">
                            {labelOf(TX_METHOD_LABELS, m.method)}
                          </span>
                          <span className="text-[0.62rem] text-muted-foreground">{faNum(m.count)} تراکنش</span>
                        </div>
                        <div className="mt-1 flex h-2 w-full overflow-hidden rounded-full bg-muted">
                          {total > 0 && (
                            <>
                              <span
                                className="h-full"
                                style={{ width: `${(m.inflow / total) * 100}%`, backgroundColor: IN_COLOR }}
                                aria-hidden="true"
                              />
                              <span
                                className="h-full"
                                style={{ width: `${(m.outflow / total) * 100}%`, backgroundColor: OUT_COLOR }}
                                aria-hidden="true"
                              />
                            </>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap justify-between gap-x-3 text-[0.66rem] tabular-nums">
                          <span className="text-emerald-700 dark:text-emerald-400">ورودی {formatRial(m.inflow)}</span>
                          <span className="text-red-600 dark:text-red-400">خروجی {formatRial(m.outflow)}</span>
                          <span className="font-semibold text-foreground">خالص {formatRial(m.net)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {ledger.data?.truncated && (
                <p className="mt-3 text-[0.68rem] text-amber-700 dark:text-amber-500">
                  این بازه بیش از {faNum(ledger.data.items.length)} تراکنش دارد؛ تجمیع روی همان تعداد انجام شده است.
                </p>
              )}
            </SectionCard>
          </>
        )}
      </main>
    </div>
  )
}

export default CashFlow
