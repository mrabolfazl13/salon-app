// src/pages/finance/ProfitLoss.tsx
// صورت سود و زیان دوره‌ای: درآمد به تفکیک منبع، هزینه به تفکیک دسته،
// حاشیهٔ سود و مقایسه با بازهٔ قبلیِ هم‌طول. همهٔ ارقام از API واقعی.

import React, { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useRevenueBySource, useScopeLedger } from '@/hooks/useFinance'
import { Button } from '@/components/ui/shadcn/button'
import { formatJalaliDate } from '@/lib/jalali'
import {
  DeltaChip,
  EmptyBox,
  ErrorBox,
  LoadingBox,
  SectionCard,
  ShareBar,
  TX_SOURCE_LABELS,
  extractError,
  faNum,
  formatPct,
  formatRial,
  formatRialCompact,
  labelOf,
} from '@/components/finance/shared'
import FinanceHeader from './FinanceHeader'
import FinanceScopeBar, { useFinanceScope } from './FinanceScopeBar'
import { expenseBreakdown, isLive, pctChange, previousPeriod } from './analytics'
import type { FinanceOutletContext } from './context'

const INCOME_COLOR = '#059669'
const EXPENSE_COLOR = '#b45309'

const ProfitLoss: React.FC = () => {
  const { venues } = useOutletContext<FinanceOutletContext>()
  const scopeState = useFinanceScope()
  const { scope } = scopeState
  const prevScope = useMemo(() => previousPeriod(scope), [scope])

  const revenue = useRevenueBySource(scope)
  const prevRevenue = useRevenueBySource(prevScope)
  const expenses = useScopeLedger({ ...scope, direction: 'expense' })
  const prevExpenses = useScopeLedger({ ...prevScope, direction: 'expense' })

  const incomeRows = revenue.data?.by_source ?? []
  const expenseRows = useMemo(
    () => expenseBreakdown(expenses.data?.items ?? []),
    [expenses.data],
  )

  const incomeTotal = revenue.data?.total ?? 0
  const expenseTotal = useMemo(
    () => (expenses.data?.items ?? []).filter(isLive).reduce((s, t) => s + t.amount, 0),
    [expenses.data],
  )
  const prevIncomeTotal = prevRevenue.data?.total ?? 0
  const prevExpenseTotal = useMemo(
    () => (prevExpenses.data?.items ?? []).filter(isLive).reduce((s, t) => s + t.amount, 0),
    [prevExpenses.data],
  )

  const net = incomeTotal - expenseTotal
  const margin = incomeTotal > 0 ? (net / incomeTotal) * 100 : null
  const expRatio = incomeTotal > 0 ? (expenseTotal / incomeTotal) * 100 : null
  const loading = revenue.isPending || expenses.isPending
  const hasError = revenue.isError || expenses.isError

  return (
    <div className="min-h-screen bg-background pb-8">
      <FinanceHeader
        title="سود و زیان"
        subtitle="درآمد، هزینه و حاشیهٔ سود در بازهٔ انتخابی"
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
              message={extractError(revenue.error ?? expenses.error, 'خطا در دریافت گزارش سود و زیان')}
              onRetry={() => {
                void revenue.refetch()
                void expenses.refetch()
              }}
            />
          </SectionCard>
        ) : loading ? (
          <SectionCard title="صورت سود و زیان" icon="mdi:scale-balance">
            <LoadingBox text="در حال محاسبهٔ سود و زیان..." />
          </SectionCard>
        ) : (
          <>
            {/* خلاصهٔ صورت */}
            <section className="rounded-2xl border border-border bg-card p-3.5 shadow-sm sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[0.7rem] font-semibold text-muted-foreground">درآمد دوره</p>
                  <p className="mt-1 text-[1.15rem] font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatRialCompact(incomeTotal)}
                  </p>
                  <div className="mt-1">
                    <DeltaChip value={pctChange(incomeTotal, prevIncomeTotal)} />
                  </div>
                </div>
                <div>
                  <p className="text-[0.7rem] font-semibold text-muted-foreground">هزینه دوره</p>
                  <p className="mt-1 text-[1.15rem] font-extrabold tabular-nums text-amber-700 dark:text-amber-500">
                    {formatRialCompact(expenseTotal)}
                  </p>
                  <div className="mt-1">
                    <DeltaChip value={pctChange(expenseTotal, prevExpenseTotal)} invert />
                  </div>
                </div>
                <div className="sm:border-s sm:border-border sm:ps-4">
                  <p className="text-[0.7rem] font-semibold text-muted-foreground">سود / زیان خالص</p>
                  <p
                    className={
                      net >= 0
                        ? 'mt-1 text-[1.3rem] font-extrabold tabular-nums leading-tight text-emerald-700 dark:text-emerald-400'
                        : 'mt-1 text-[1.3rem] font-extrabold tabular-nums leading-tight text-red-600 dark:text-red-400'
                    }
                  >
                    {formatRialCompact(net)}
                  </p>
                  <p className="mt-1 text-[0.68rem] text-muted-foreground">
                    حاشیهٔ سود: {margin === null ? '—' : formatPct(margin)}
                    {expRatio !== null && ` • هزینه/درآمد: ${formatPct(expRatio)}`}
                  </p>
                </div>
              </div>
              <div className="mt-3 border-t border-border pt-2.5 text-[0.68rem] text-muted-foreground">
                {formatJalaliRange(scope.from, scope.to)} • مقایسه با{' '}
                {formatJalaliRange(prevScope.from, prevScope.to)}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {/* درآمد */}
              <SectionCard
                title="درآمد به تفکیک منبع"
                icon="mdi:cash-multiple"
                color={INCOME_COLOR}
                action={<span className="text-[0.68rem] font-semibold text-muted-foreground">{formatRialCompact(incomeTotal)}</span>}
              >
                {incomeRows.length === 0 ? (
                  <EmptyBox icon="mdi:cash-remove" title="درآمدی در این بازه ثبت نشده" />
                ) : (
                  <ul className="space-y-2.5">
                    {incomeRows.map((row) => {
                      const share = incomeTotal > 0 ? (row.income / incomeTotal) * 100 : 0
                      return (
                        <li key={row.source}>
                          <div className="mb-1 flex items-baseline justify-between gap-2">
                            <span className="truncate text-[0.75rem] font-semibold text-foreground">
                              {labelOf(TX_SOURCE_LABELS, row.source, 'سایر منابع')}
                            </span>
                            <span className="shrink-0 text-[0.72rem] font-bold tabular-nums text-foreground">
                              {formatRial(row.income)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShareBar pct={share} color={INCOME_COLOR} />
                            <span className="w-12 shrink-0 text-end text-[0.62rem] tabular-nums text-muted-foreground">
                              {formatPct(share)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[0.62rem] text-muted-foreground">{faNum(row.count)} تراکنش</p>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </SectionCard>

              {/* هزینه */}
              <SectionCard
                title="هزینه به تفکیک دسته"
                icon="mdi:receipt-text-outline"
                color={EXPENSE_COLOR}
                action={<span className="text-[0.68rem] font-semibold text-muted-foreground">{formatRialCompact(expenseTotal)}</span>}
              >
                {expenseRows.length === 0 ? (
                  <EmptyBox icon="mdi:receipt-text-remove" title="هزینه‌ای در این بازه ثبت نشده" />
                ) : (
                  <ul className="space-y-2.5">
                    {expenseRows.map((row) => (
                      <li key={row.key}>
                        <div className="mb-1 flex items-baseline justify-between gap-2">
                          <span className="truncate text-[0.75rem] font-semibold text-foreground">{row.label}</span>
                          <span className="shrink-0 text-[0.72rem] font-bold tabular-nums text-foreground">
                            {formatRial(row.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShareBar pct={row.share} color={EXPENSE_COLOR} />
                          <span className="w-12 shrink-0 text-end text-[0.62rem] tabular-nums text-muted-foreground">
                            {formatPct(row.share)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[0.62rem] text-muted-foreground">{faNum(row.count)} تراکنش</p>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>

            {/* جدول صورت — قابل چاپ */}
            <SectionCard title="صورت سود و زیان" icon="mdi:file-document-outline" color="#2563eb">
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-[0.75rem]">
                  <caption className="sr-only">صورت سود و زیان بازهٔ انتخابی</caption>
                  <thead className="bg-muted/60 text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-start font-semibold">شرح</th>
                      <th scope="col" className="px-3 py-2 text-end font-semibold">مبلغ (ریال)</th>
                      <th scope="col" className="hidden px-3 py-2 text-end font-semibold sm:table-cell">نسبت به درآمد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeRows.map((row) => (
                      <tr key={`i-${row.source}`} className="border-t border-border">
                        <td className="px-3 py-2 text-foreground">
                          درآمد — {labelOf(TX_SOURCE_LABELS, row.source, 'سایر منابع')}
                        </td>
                        <td className="px-3 py-2 text-end tabular-nums text-foreground">{faNum(row.income)}</td>
                        <td className="hidden px-3 py-2 text-end tabular-nums text-muted-foreground sm:table-cell">
                          {incomeTotal > 0 ? formatPct((row.income / incomeTotal) * 100) : '—'}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border bg-emerald-500/[0.06]">
                      <th scope="row" className="px-3 py-2 text-start font-bold text-foreground">جمع درآمد</th>
                      <td className="px-3 py-2 text-end font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {faNum(incomeTotal)}
                      </td>
                      <td className="hidden px-3 py-2 text-end font-bold text-muted-foreground sm:table-cell">۱۰۰٪</td>
                    </tr>
                    {expenseRows.map((row) => (
                      <tr key={`e-${row.key}`} className="border-t border-border">
                        <td className="px-3 py-2 text-foreground">هزینه — {row.label}</td>
                        <td className="px-3 py-2 text-end tabular-nums text-foreground">{faNum(row.amount)}</td>
                        <td className="hidden px-3 py-2 text-end tabular-nums text-muted-foreground sm:table-cell">
                          {incomeTotal > 0 ? formatPct((row.amount / incomeTotal) * 100) : '—'}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border bg-amber-500/[0.06]">
                      <th scope="row" className="px-3 py-2 text-start font-bold text-foreground">جمع هزینه</th>
                      <td className="px-3 py-2 text-end font-bold tabular-nums text-amber-700 dark:text-amber-500">
                        {faNum(expenseTotal)}
                      </td>
                      <td className="hidden px-3 py-2 text-end font-bold text-muted-foreground sm:table-cell">
                        {expRatio === null ? '—' : formatPct(expRatio)}
                      </td>
                    </tr>
                    <tr className="border-t-2 border-border bg-primary/[0.06]">
                      <th scope="row" className="px-3 py-2.5 text-start text-[0.8rem] font-extrabold text-foreground">
                        سود / زیان خالص
                      </th>
                      <td
                        className={
                          net >= 0
                            ? 'px-3 py-2.5 text-end text-[0.8rem] font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400'
                            : 'px-3 py-2.5 text-end text-[0.8rem] font-extrabold tabular-nums text-red-600 dark:text-red-400'
                        }
                      >
                        {faNum(net)}
                      </td>
                      <td className="hidden px-3 py-2.5 text-end text-[0.8rem] font-extrabold text-muted-foreground sm:table-cell">
                        {margin === null ? '—' : formatPct(margin)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {expenses.data?.truncated && (
                <p className="mt-2 text-[0.68rem] text-amber-700 dark:text-amber-500">
                  حجم تراکنش‌های این بازه از سقف خواندن بیشتر است؛ هزینه‌ها بر پایهٔ {faNum(expenses.data.items.length)} ردیف اول محاسبه شده‌اند.
                </p>
              )}
            </SectionCard>
          </>
        )}
      </main>
    </div>
  )
}

function formatJalaliRange(from?: string | null, to?: string | null): string {
  if (!from || !to) return 'کل دوره'
  const fmt = (iso: string) => formatJalaliDate(iso, { format: 'numeric' })
  return `${fmt(from)} تا ${fmt(to)}`
}

export default ProfitLoss
