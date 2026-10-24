// src/pages/finance/FinanceOverview.tsx
// «نمای کلی» مالی — هاب بدون تب: وضعیت پول، میان‌برهای دفتر کل/حساب‌ها/گزارش‌ها،
// روند کوتاه درآمد و هزینه، آخرین تراکنش‌ها و بدهکاران برتر.

import React, { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Icon } from '@iconify/react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  useAccounts,
  useFinanceDashboard,
  useRevenueSeries,
  useScopeLedger,
  useTransactions,
} from '@/hooks/useFinance'
import {
  DeltaChip,
  EmptyBox,
  ErrorBox,
  FinTooltip,
  KpiCard,
  LoadingBox,
  SectionCard,
  StatusChip,
  TX_METHOD_LABELS,
  TX_TYPE_LABELS,
  extractError,
  faNum,
  formatPct,
  formatRial,
  formatRialCompact,
  jalaliDayLabel,
  labelOf,
  shortRialAxis,
} from '@/components/finance/shared'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { Button } from '@/components/ui/shadcn/button'
import TransactionEntryDialog from '@/components/finance/TransactionEntryDialog'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'
import FinanceHeader from './FinanceHeader'
import FinanceScopeBar, { useFinanceScope } from './FinanceScopeBar'
import { pctChange, topCounterparties } from './analytics'
import type { FinanceOutletContext } from './context'

const SHORTCUTS = [
  { to: '/finance/transactions', label: 'دفتر کل', desc: 'دریافت‌ها و هزینه‌ها', icon: 'mdi:book-open-variant', color: '#2563eb' },
  { to: '/finance/accounts', label: 'حساب‌ها', desc: 'بدهکاران و صورت‌حساب', icon: 'mdi:account-group-outline', color: '#0891b2' },
  { to: '/finance/expenses', label: 'هزینه‌ها', desc: 'دسته‌بندی و کنترل', icon: 'mdi:receipt-text-outline', color: '#b45309' },
  { to: '/finance/profit-loss', label: 'سود و زیان', desc: 'درآمد منهای هزینه', icon: 'mdi:scale-balance', color: '#059669' },
  { to: '/finance/cash-flow', label: 'جریان نقدی', desc: 'ورود و خروج پول', icon: 'mdi:swap-horizontal', color: '#7c3aed' },
  { to: '/finance/reports', label: 'گزارش‌ها', desc: 'روند، اشغال و مقایسه', icon: 'mdi:chart-box-outline', color: '#1d4ed8' },
] as const

const CHART_TICK = { fontSize: 10.5, fill: '#64748b' }

const MiniStat: React.FC<{ label: string; value: string; tone?: 'default' | 'danger' }> = ({
  label,
  value,
  tone = 'default',
}) => (
  <div className="rounded-lg bg-muted/50 px-2.5 py-1.5">
    <p className="text-[0.62rem] text-muted-foreground">{label}</p>
    <p
      className={
        tone === 'danger'
          ? 'mt-0.5 text-[0.8rem] font-bold tabular-nums text-red-600 dark:text-red-400'
          : 'mt-0.5 text-[0.8rem] font-bold tabular-nums text-foreground'
      }
    >
      {value}
    </p>
  </div>
)

const FinanceOverview: React.FC = () => {
  const { venues } = useOutletContext<FinanceOutletContext>()
  const scopeState = useFinanceScope()
  const { scope } = scopeState
  const scopedVenueName = scope.venue_id
    ? venues.find((v) => v.id === scope.venue_id)?.name
    : undefined
  const [entryOpen, setEntryOpen] = useState(false)

  const dashboard = useFinanceDashboard(scope)
  const daySeries = useRevenueSeries({ ...scope, group_by: 'day' })
  const recent = useTransactions({ venue_id: scope.venue_id, limit: 5, offset: 0 })
  const debtors = useAccounts({ venue_id: scope.venue_id, kind: 'debtors', limit: 5 })
  const incomeLedger = useScopeLedger({ ...scope, direction: 'income' })
  const topCustomers = useMemo(
    () => topCounterparties(incomeLedger.data?.items ?? [], 'income', 5),
    [incomeLedger.data],
  )

  const d = dashboard.data
  const net = d?.gross_profit ?? 0
  const dayPoints = useMemo(
    () => (daySeries.data?.points ?? []).map((p) => ({ ...p, label: jalaliDayLabel(p.key) })),
    [daySeries.data],
  )

  const kpis: {
    label: string
    value: string
    sub?: string
    title?: string
    icon: string
    color: string
    end?: React.ReactNode
  }[] = d
    ? [
        {
          label: 'سود خالص این ماه',
          value: formatRialCompact(d.month_revenue),
          title: formatRial(d.month_revenue),
          icon: 'mdi:calendar-month',
          color: '#2563eb',
          end: <DeltaChip value={pctChange(d.month_revenue, d.prev_month_revenue)} suffix="ماه قبل" />,
        },
        { label: 'هزینهٔ بازه', value: formatRialCompact(d.expenses), title: formatRial(d.expenses), icon: 'mdi:cash-minus', color: '#d97706' },
        { label: 'اشغال امروز', value: formatPct(d.occupancy_today), sub: `${faNum(d.bookings_today)} رزرو امروز`, icon: 'mdi:gauge', color: '#0891b2' },
        { label: 'رزروهای امروز', value: toPersianDigits(d.bookings_today), sub: `لغوشده: ${toPersianDigits(d.cancelled_bookings)}`, icon: 'mdi:calendar-check', color: '#2563eb' },
        { label: 'در انتظار پرداخت', value: toPersianDigits(d.pending_payment_bookings), sub: 'رزروهای امروز', icon: 'mdi:clock-alert-outline', color: '#d97706' },
        { label: 'مشتریان فعال (بازه)', value: toPersianDigits(d.active_customers), icon: 'mdi:account-group', color: '#7c3aed' },
      ]
    : []

  return (
    <div className="min-h-screen bg-background pb-8">
      <FinanceHeader
        title={scopedVenueName ? `امور مالی — ${scopedVenueName}` : 'امور مالی'}
        subtitle={
          scopedVenueName
            ? 'همهٔ اعداد این صفحه فقط به همین سالن محدود است'
            : 'وضعیت پول، دفتر کل و حساب‌ها در یک نگاه'
        }
        backTo={scope.venue_id ? `/manager/venues/${scope.venue_id}` : '/manager-dashboard'}
        backLabel={scope.venue_id ? 'بازگشت به داشبورد سالن' : 'بازگشت به داشبورد مدیریت'}
        actions={
          <Button size="sm" onClick={() => setEntryOpen(true)} className="min-h-11 gap-1.5 px-2.5 text-[0.72rem]">
            <Icon icon="mdi:plus" className="h-3.5 w-3.5" aria-hidden="true" />
            ثبت تراکنش
          </Button>
        }
      />

      <main className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-4">
        {/* میان‌برها — جایگزین نوار تب */}
        <nav aria-label="بخش‌های مالی" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-2 py-2.5 text-center transition-colors hover:border-blue-600/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-3 sm:p-3 sm:text-start"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${s.color}14` }}
                aria-hidden="true"
              >
                <Icon icon={s.icon} className="h-[18px] w-[18px]" style={{ color: s.color }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.74rem] font-bold leading-tight text-foreground sm:text-sm">{s.label}</span>
                <span className="hidden truncate text-[0.68rem] text-muted-foreground sm:block">{s.desc}</span>
              </span>
              <Icon icon="mdi:chevron-left" className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
            </Link>
          ))}
        </nav>

        <div className="mt-3">
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

        {/* وضعیت پول */}
        <section className="mt-3 rounded-2xl border border-border bg-card p-3.5 sm:p-5">
          {dashboard.isError ? (
            <ErrorBox
              message={extractError(dashboard.error, 'خطا در دریافت وضعیت مالی')}
              onRetry={() => dashboard.refetch()}
            />
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold text-muted-foreground">خالص بازه (درآمد منهای هزینه)</p>
                {dashboard.isPending ? (
                  <Skeleton className="mt-1.5 h-8 w-40 rounded-lg" />
                ) : (
                  <p
                    className={
                      net >= 0
                        ? 'mt-1 text-[1.55rem] font-extrabold leading-tight tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-[1.8rem]'
                        : 'mt-1 text-[1.55rem] font-extrabold leading-tight tabular-nums text-red-600 dark:text-red-400 sm:text-[1.8rem]'
                    }
                  >
                    {formatRialCompact(net)}
                  </p>
                )}
                {d && (
                  <p className="mt-1 text-[0.68rem] text-muted-foreground">
                    هزینه بازه: {formatRialCompact(d.expenses)}
                  </p>
                )}
              </div>
              <div className="grid w-full grid-cols-3 gap-1.5 sm:w-auto">
                <MiniStat label="سود امروز" value={d ? formatRialCompact(d.today_revenue) : '—'} />
                <MiniStat label="دریافتی امروز" value={d ? formatRialCompact(d.today_received) : '—'} />
                <MiniStat
                  label="مطالبات باز"
                  value={d ? formatRialCompact(d.open_receivables) : '—'}
                  tone={d && d.open_receivables > 0 ? 'danger' : 'default'}
                />
              </div>
            </div>
          )}

          {d && (d.contracts_expiring_soon > 0 || d.pending_payment_bookings > 0) && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-2.5">
              {d.contracts_expiring_soon > 0 && (
                <StatusChip
                  label={`${toPersianDigits(d.contracts_expiring_soon)} قرارداد تا ۱۴ روز آینده منقضی می‌شود`}
                  color="#b45309"
                />
              )}
              {d.pending_payment_bookings > 0 && (
                <StatusChip
                  label={`${toPersianDigits(d.pending_payment_bookings)} رزرو در انتظار پرداخت`}
                  color="#d97706"
                />
              )}
            </div>
          )}
        </section>

        {/* شاخص‌های اصلی */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
          {(dashboard.isPending ? Array.from({ length: 6 }, () => null) : kpis).map((k, i) =>
            k === null ? (
              <KpiCard key={`sk-${i}`} label="" value="" icon="mdi:chart-line" loading />
            ) : (
              <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} title={k.title} icon={k.icon} color={k.color} end={k.end} />
            ),
          )}
        </div>

        {/* روند */}
        <div className="mt-3">
          <SectionCard
            title="روند درآمد و هزینه"
            icon="mdi:chart-area"
            color="#059669"
            action={
              daySeries.data ? (
                <span className="text-[0.68rem] text-muted-foreground">
                  خالص بازه: {formatRialCompact(daySeries.data.total_net)}
                </span>
              ) : undefined
            }
          >
            {daySeries.isPending ? (
              <LoadingBox text="در حال دریافت روند..." />
            ) : daySeries.isError ? (
              <ErrorBox
                message={extractError(daySeries.error, 'خطا در دریافت روند درآمد')}
                onRetry={() => daySeries.refetch()}
              />
            ) : dayPoints.length === 0 ? (
              <EmptyBox icon="mdi:chart-line-variant" title="داده‌ای در این بازه نیست" />
            ) : (
              <div dir="rtl" className="h-[200px] sm:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dayPoints} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="finOverviewIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="finOverviewExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
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
                    <Tooltip content={<FinTooltip />} cursor={{ stroke: '#64748b', strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="income" name="درآمد" stroke="#059669" strokeWidth={2} fill="url(#finOverviewIncome)" />
                    <Area type="monotone" dataKey="expense" name="هزینه" stroke="#ef4444" strokeWidth={2} fill="url(#finOverviewExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </div>

        {/* آخرین تراکنش‌ها + بدهکاران */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <SectionCard
            title="آخرین تراکنش‌ها"
            icon="mdi:book-ledger-outline"
            color="#2563eb"
            dense
            action={
              <Link
                to="/finance/transactions"
                className="inline-flex min-h-11 items-center gap-0.5 text-[0.68rem] font-semibold text-blue-700 hover:underline dark:text-blue-400"
              >
                همه تراکنش‌ها
                <Icon icon="mdi:chevron-left" className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          >
            {recent.isPending ? (
              <LoadingBox text="در حال دریافت تراکنش‌ها..." />
            ) : recent.isError ? (
              <ErrorBox
                message={extractError(recent.error, 'خطا در دریافت تراکنش‌ها')}
                onRetry={() => recent.refetch()}
              />
            ) : (recent.data?.items.length ?? 0) === 0 ? (
              <EmptyBox icon="mdi:book-open-page-variant-outline" title="هنوز تراکنشی ثبت نشده" />
            ) : (
              <div className="-mx-1">
                {recent.data!.items.map((tx) => {
                  const income = tx.direction === 'income'
                  const voided = tx.status === 'voided'
                  return (
                    <Link
                      key={tx.id}
                      to="/finance/transactions"
                      className="flex items-center gap-2 rounded-lg px-1 py-2 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span
                        className={
                          income
                            ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10'
                            : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10'
                        }
                        aria-hidden="true"
                      >
                        <Icon
                          icon={income ? 'mdi:cash-plus' : 'mdi:cash-minus'}
                          className="h-4 w-4"
                          style={{ color: income ? '#047857' : '#b45309' }}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.75rem] font-semibold text-foreground">
                          {toPersianDigits(tx.counterparty_name || tx.description || labelOf(TX_TYPE_LABELS, tx.type))}
                        </p>
                        <p className="truncate text-[0.62rem] text-muted-foreground">
                          {formatJalaliDateTime(tx.occurred_at, { format: 'numeric' })} • {labelOf(TX_METHOD_LABELS, tx.method)}
                        </p>
                      </div>
                      <p
                        dir="rtl"
                        className={
                          voided
                            ? 'whitespace-nowrap text-[0.72rem] font-bold tabular-nums text-gray-400 line-through'
                            : income
                              ? 'whitespace-nowrap text-[0.72rem] font-bold tabular-nums text-emerald-700 dark:text-emerald-400'
                              : 'whitespace-nowrap text-[0.72rem] font-bold tabular-nums text-red-600 dark:text-red-400'
                        }
                      >
                        {income ? '+' : '−'}
                        {formatRial(tx.amount, false)}
                      </p>
                    </Link>
                  )
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="مشتریان برتر" icon="mdi:crown-outline" color="#7c3aed" dense>
            {incomeLedger.isPending ? (
              <LoadingBox text="در حال محاسبهٔ مشتریان..." />
            ) : incomeLedger.isError ? (
              <ErrorBox
                message={extractError(incomeLedger.error, 'خطا در دریافت مشتریان')}
                onRetry={() => incomeLedger.refetch()}
              />
            ) : topCustomers.length === 0 ? (
              <EmptyBox icon="mdi:account-star-outline" title="پرداختی در این بازه نیست" />
            ) : (
              <div className="-mx-1">
                {topCustomers.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-lg px-1 py-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-[0.66rem] font-extrabold text-violet-700 dark:text-violet-300"
                      aria-hidden="true"
                    >
                      {toPersianDigits(i + 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.75rem] font-semibold text-foreground">{c.name}</p>
                      <p className="text-[0.62rem] text-muted-foreground">{faNum(c.count)} پرداخت</p>
                    </div>
                    <p className="whitespace-nowrap text-[0.72rem] font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatRial(c.amount, false)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="بدهکاران برتر"
            icon="mdi:account-minus-outline"
            color="#dc2626"
            dense
            action={
              <Link
                to="/finance/accounts"
                className="inline-flex min-h-11 items-center gap-0.5 text-[0.68rem] font-semibold text-blue-700 hover:underline dark:text-blue-400"
              >
                همه حساب‌ها
                <Icon icon="mdi:chevron-left" className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          >
            {debtors.isPending ? (
              <LoadingBox text="در حال دریافت بدهکاران..." />
            ) : debtors.isError ? (
              <ErrorBox
                message={extractError(debtors.error, 'خطا در دریافت بدهکاران')}
                onRetry={() => debtors.refetch()}
              />
            ) : (debtors.data?.items.length ?? 0) === 0 ? (
              <EmptyBox icon="mdi:shield-check-outline" title="بدهکار فعالی نیست" />
            ) : (
              <div className="-mx-1">
                {debtors.data!.items.map((acc) => (
                  <Link
                    key={acc.user_id}
                    to="/finance/accounts"
                    className="flex items-center gap-2 rounded-lg px-1 py-2 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10" aria-hidden="true">
                      <Icon icon="mdi:account-minus-outline" className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.75rem] font-semibold text-foreground">{acc.full_name || 'بدون نام'}</p>
                      <p className="text-[0.62rem] text-muted-foreground">کاربر #{toPersianDigits(acc.user_id)}</p>
                    </div>
                    <p dir="rtl" className="whitespace-nowrap text-[0.72rem] font-bold tabular-nums text-red-600 dark:text-red-400">
                      {formatRial(acc.balance)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </main>

      <TransactionEntryDialog open={entryOpen} onClose={() => setEntryOpen(false)} venues={venues} />
    </div>
  )
}

export default FinanceOverview
