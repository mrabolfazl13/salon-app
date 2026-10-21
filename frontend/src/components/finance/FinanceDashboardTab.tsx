// frontend/src/components/finance/FinanceDashboardTab.tsx
// «داشبورد مالی» — KPIها از /finance/dashboard، نمودارهای recharts (روند روزانه،
// ساعت/روز هفته، تفکیک منبع، اشغال سالن‌ها)، جدول سانس‌های کم‌تقاضا و برترین بدهکاران.

import React, { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  useAccounts,
  useFinanceDashboard,
  useLowDemandSlots,
  useOccupancy,
  useRevenueBySource,
  useRevenueSeries,
  type FinanceVenue,
} from '@/hooks/useFinance'
import {
  FIN_WEEKDAY_NAMES,
  KpiCard,
  EmptyBox,
  ErrorBox,
  FinTooltip,
  LoadingBox,
  SAT_FIRST_ORDER,
  SectionCard,
  StatusChip,
  TX_SOURCE_LABELS,
  extractError,
  faNum,
  formatPct,
  formatRial,
  formatRialCompact,
  jalaliDayLabel,
  labelOf,
  shortRialAxis,
  useAboveSm,
} from './shared'
import StatementDialog from './StatementDialog'
import VenueComparisonPanel from './VenueComparisonPanel'
import { getTodayISO, toPersianDigits } from '@/lib/jalali'
import PersianDatePicker from '@/components/ui/PersianDatePicker'
import { Button } from '@/components/ui/shadcn/button'
import { Label } from '@/components/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'
import type { SeriesPoint } from '@/services/finance'

const SOURCE_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#0891b2', '#db2777', '#64748b']

const isoDaysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** سری weekday را به ترتیب شنبه‌محورِ فارسی مرتب می‌کند */
function reorderWeekday(points: SeriesPoint[]): SeriesPoint[] {
  const byKey = new Map(points.map((p) => [Number(p.key) % 7, p]))
  return SAT_FIRST_ORDER.map((w) => byKey.get(w)).filter((p): p is SeriesPoint => Boolean(p))
}

const CHART_TICK = { fontSize: 10.5, fill: '#64748b' }

const FinanceDashboardTab: React.FC<{ venues: FinanceVenue[] }> = ({ venues }) => {
  const [venueSel, setVenueSel] = useState<number | 'all'>('all')
  const [from, setFrom] = useState(() => isoDaysAgo(30))
  const [to, setTo] = useState(() => getTodayISO())
  const [statementUser, setStatementUser] = useState<{ id: number; name: string | null } | null>(null)
  const showCharts = useAboveSm()

  const scope = useMemo(
    () => ({
      venue_id: venueSel === 'all' ? undefined : venueSel,
      from: from || undefined,
      to: to || undefined,
    }),
    [venueSel, from, to],
  )

  const dashboard = useFinanceDashboard(scope)
  const daySeries = useRevenueSeries({ ...scope, group_by: 'day' })
  const weekdaySeries = useRevenueSeries({ ...scope, group_by: 'weekday' })
  const hourSeries = useRevenueSeries({ ...scope, group_by: 'hour' })
  const bySource = useRevenueBySource(scope)
  const occupancy = useOccupancy(scope)
  const lowDemand = useLowDemandSlots({ ...scope, threshold: 40 })
  const debtors = useAccounts({ venue_id: scope.venue_id, kind: 'debtors', limit: 6 })

  const d = dashboard.data

  // دلتای «درآمد این ماه» نسبت به ماه قبل (prev_month_revenue = خالص ماه قبل)
  const monthDelta = (() => {
    if (!d) return null
    const prev = d.prev_month_revenue ?? null
    const now = d.month_revenue
    if (prev === null) return null
    if (prev === 0) return now > 0 ? { up: true, label: '▲ رشد جدید' } : null
    const pct = ((now - prev) / Math.abs(prev)) * 100
    return { up: pct >= 0, label: `${pct >= 0 ? '▲' : '▼'} ${toPersianDigits(Math.abs(Math.round(pct)))}٪` }
  })()

  interface Kpi { label: string; value: string; icon: string; color: string; sub?: string; title?: string; end?: React.ReactNode }
  const kpis: Kpi[] = d
    ? [
        { label: 'درآمد امروز', value: formatRialCompact(d.today_revenue), title: formatRial(d.today_revenue), icon: 'mdi:cash-fast', color: '#059669' },
        {
          label: 'درآمد این ماه',
          value: formatRialCompact(d.month_revenue), title: formatRial(d.month_revenue),
          icon: 'mdi:calendar-month',
          color: '#2563eb',
          end: monthDelta ? (
            <StatusChip label={monthDelta.label} color={monthDelta.up ? '#059669' : '#dc2626'} />
          ) : undefined,
        },
        { label: 'دریافتی امروز', value: formatRialCompact(d.today_received), title: formatRial(d.today_received), icon: 'mdi:bank-plus', color: '#7c3aed' },
        { label: 'مطالبات باز', value: formatRialCompact(d.open_receivables), title: formatRial(d.open_receivables), icon: 'mdi:hand-back-right', color: '#dc2626' },
        { label: 'هزینه‌ها (بازه)', value: formatRialCompact(d.expenses), title: formatRial(d.expenses), icon: 'mdi:cash-minus', color: '#d97706' },
        { label: 'سود ناخالص (بازه)', value: formatRialCompact(d.gross_profit), title: formatRial(d.gross_profit), icon: 'mdi:trending-up', color: d.gross_profit >= 0 ? '#059669' : '#dc2626' },
        { label: 'اشغال امروز', value: formatPct(d.occupancy_today), sub: `${faNum(d.bookings_today)} رزرو امروز`, icon: 'mdi:gauge', color: '#0891b2' },
        { label: 'انقضای قراردادها (۱۴ روز)', value: `${toPersianDigits(d.contracts_expiring_soon)} قرارداد`, sub: `قراردادهای فعال: ${toPersianDigits(d.active_contracts)}`, icon: 'mdi:file-clock-outline', color: '#db2777' },
        { label: 'رزروهای امروز', value: toPersianDigits(d.bookings_today), sub: `لغوشده: ${toPersianDigits(d.cancelled_bookings)}`, icon: 'mdi:calendar-check', color: '#2563eb' },
        { label: 'در انتظار پرداخت', value: toPersianDigits(d.pending_payment_bookings), icon: 'mdi:clock-alert-outline', color: '#d97706' },
        { label: 'مشتریان فعال (بازه)', value: toPersianDigits(d.active_customers), icon: 'mdi:account-group', color: '#7c3aed' },
        { label: 'تیم‌های فعال', value: toPersianDigits(d.active_teams ?? 0), sub: 'تیم‌های دارای فعالیت در دامنه', icon: 'mdi:handshake-outline', color: '#0891b2' },
        { label: 'قراردادهای فعال', value: toPersianDigits(d.active_contracts), icon: 'mdi:file-document-check-outline', color: '#059669' },
      ]
    : []

  const dayPoints = useMemo(
    () => (daySeries.data?.points ?? []).map((p) => ({ ...p, label: jalaliDayLabel(p.key) })),
    [daySeries.data],
  )
  const weekdayPoints = useMemo(() => reorderWeekday(weekdaySeries.data?.points ?? []), [weekdaySeries.data])
  const hourPoints = useMemo(
    () => (hourSeries.data?.points ?? []).slice().sort((a, b) => Number(a.key) - Number(b.key)),
    [hourSeries.data],
  )
  const sourcePoints = useMemo(
    () => (bySource.data?.by_source ?? []).filter((s) => s.income > 0),
    [bySource.data],
  )
  const occupancyPoints = useMemo(
    () =>
      (occupancy.data?.per_venue ?? []).map((v) => ({
        name: v.venue_name || `سالن #${v.venue_id}`,
        rate: v.occupancy_rate,
        occupied: v.occupied_slots,
        total: v.total_active_slots,
      })),
    [occupancy.data],
  )

  return (
    <div>
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-extrabold text-foreground">خلاصه عملکرد</h2>
        {dashboard.isError ? (
          <ErrorBox message={extractError(dashboard.error, 'خطا در دریافت داشبورد مالی')} onRetry={() => dashboard.refetch()} />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(dashboard.isPending ? Array.from({ length: 4 }, () => null) : kpis.slice(0, 4)).map((k, i) =>
              k === null ? (
                <div key={`sk-${i}`}>
                  <KpiCard label="" value="" icon="mdi:chart-line" loading />
                </div>
              ) : (
                <div key={k.label}>
                  <KpiCard label={k.label} value={k.value} sub={k.sub} title={k.title} icon={k.icon} color={k.color} end={k.end} />
                </div>
              ),
            )}
          </div>
        )}
      </div>

      <SectionCard title="فیلتر گزارش‌ها" icon="mdi:filter-variant" color="#7c3aed" dense>
        <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center">
          <div className="flex w-full flex-col gap-1.5 md:w-[180px]">
            {/* بدون labelId/inputId برچسب به select وصل نمی‌شود — ممیزی axe F-24 */}
            <Label id="finance-venue-label" htmlFor="finance-venue-select">سالن</Label>
            <Select
              value={venueSel === 'all' ? 'all' : String(venueSel)}
              onValueChange={(v) => setVenueSel(v === 'all' ? 'all' : Number(v))}
            >
              <SelectTrigger id="finance-venue-select" aria-labelledby="finance-venue-label" className="w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه سالن‌های من</SelectItem>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap justify-start gap-2 md:justify-center">
            {[
              { label: '۷ روز', days: 6 },
              { label: '۳۰ روز', days: 30 },
              { label: '۹۰ روز', days: 90 },
            ].map((preset) => {
              const active = from === isoDaysAgo(preset.days)
              return (
                <button
                  key={preset.days}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setFrom(isoDaysAgo(preset.days))
                    setTo(getTodayISO())
                  }}
                  className={
                    active
                      ? 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                      : 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  }
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
          <div className="w-full min-w-0 flex-1">
            <RangeInputs from={from} to={to} onFrom={setFrom} onTo={setTo} />
          </div>
        </div>
      </SectionCard>

      {!dashboard.isError && !dashboard.isPending && kpis.length > 4 && (
        <div className="mt-6">
          <h2 className="mb-3 text-base font-extrabold text-muted-foreground">سایر شاخص‌ها</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {kpis.slice(4).map((k) => (
              <div key={k.label}>
                <KpiCard label={k.label} value={k.value} sub={k.sub} title={k.title} icon={k.icon} color={k.color} end={k.end} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* نمودارها — فقط >= sm */}
      {showCharts && (
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <SectionCard
                title="روند درآمد و هزینه (روزانه)"
                icon="mdi:chart-area"
                action={
                  <span className="text-xs text-muted-foreground">
                    {daySeries.isFetching ? 'به‌روزرسانی...' : `خالص بازه: ${formatRial(daySeries.data?.total_net ?? 0)}`}
                  </span>
                }
              >
                {daySeries.isPending ? (
                  <LoadingBox text="در حال دریافت روند..." />
                ) : daySeries.isError ? (
                  <ErrorBox message={extractError(daySeries.error, 'خطا در دریافت سری درآمد')} />
                ) : dayPoints.length === 0 ? (
                  <EmptyBox icon="mdi:chart-line-variant" title="داده‌ای در این بازه نیست" />
                ) : (
                  <div dir="rtl" className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dayPoints} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="finIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="finExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="label" reversed tick={CHART_TICK} interval="preserveStartEnd" minTickGap={18} axisLine={false} tickLine={false} />
                        <YAxis orientation="right" width={64} tickFormatter={shortRialAxis} tick={CHART_TICK} axisLine={false} tickLine={false} />
                        <Tooltip content={<FinTooltip />} cursor={{ stroke: '#64748b', strokeDasharray: '4 4' }} />
                        <Area type="monotone" dataKey="income" name="درآمد" stroke="#059669" strokeWidth={2} fill="url(#finIncome)" />
                        <Area type="monotone" dataKey="expense" name="هزینه" stroke="#ef4444" strokeWidth={2} fill="url(#finExpense)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <ChartLegend items={[{ color: '#059669', label: 'درآمد' }, { color: '#ef4444', label: 'هزینه' }]} />
              </SectionCard>
            </div>

            <div>
              <SectionCard title="درآمد خالص به تفکیک روز هفته" icon="mdi:weekend">
                {weekdaySeries.isPending ? (
                  <LoadingBox />
                ) : weekdayPoints.length === 0 ? (
                  <EmptyBox icon="mdi:chart-bar" title="داده‌ای نیست" />
                ) : (
                  <div dir="rtl" className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekdayPoints} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="label" reversed tick={CHART_TICK} axisLine={false} tickLine={false} />
                        <YAxis orientation="right" width={64} tickFormatter={shortRialAxis} tick={CHART_TICK} axisLine={false} tickLine={false} />
                        <Tooltip content={<FinTooltip />} cursor={{ fill: 'rgba(37,99,235,0.06)' }} />
                        <Bar dataKey="net" name="خالص" radius={[6, 6, 0, 0]}>
                          {weekdayPoints.map((p) => (
                            <Cell key={p.key} fill={p.net >= 0 ? '#2563eb' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>
            </div>

            <div>
              <SectionCard title="تمرکز درآمد در ساعات روز (اوج‌شناسی)" icon="mdi:clock-outline" color="#d97706">
                {hourSeries.isPending ? (
                  <LoadingBox />
                ) : hourPoints.length === 0 ? (
                  <EmptyBox icon="mdi:chart-bar" title="داده‌ای نیست" />
                ) : (
                  <div dir="rtl" className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourPoints} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="key"
                          reversed
                          tickFormatter={(v: string) => `${toPersianDigits(v)}:۰۰`}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          interval={1}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis orientation="right" width={64} tickFormatter={shortRialAxis} tick={CHART_TICK} axisLine={false} tickLine={false} />
                        <Tooltip content={<FinTooltip />} cursor={{ fill: 'rgba(217,119,6,0.07)' }} />
                        <Bar dataKey="income" name="درآمد" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>
            </div>

            <div>
              <SectionCard title="درآمد به تفکیک منبع" icon="mdi:slice" color="#7c3aed">
                {bySource.isPending ? (
                  <LoadingBox />
                ) : sourcePoints.length === 0 ? (
                  <EmptyBox icon="mdi:chart-pie" title="درآمدی ثبت نشده" />
                ) : (
                  <>
                    <div dir="rtl" className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip content={<FinTooltip />} />
                          <Pie
                            data={sourcePoints}
                            dataKey="income"
                            nameKey="source"
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={80}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {sourcePoints.map((_, i) => (
                              <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <PieSourceLegend points={sourcePoints} total={bySource.data?.total ?? 0} />
                  </>
                )}
              </SectionCard>
            </div>

            <div>
              <SectionCard
                title="اشغال سانس‌ها به تفکیک سالن"
                icon="mdi:store-check-outline"
                color="#0891b2"
                action={
                  occupancy.data ? (
                    <span className="text-xs text-muted-foreground">
                      کل بازه: {formatPct(occupancy.data.occupancy_rate)}
                    </span>
                  ) : undefined
                }
              >
                {occupancy.isPending ? (
                  <LoadingBox />
                ) : occupancyPoints.length === 0 ? (
                  <EmptyBox icon="mdi:chart-timeline-variant" title="سانس فعالی در بازه نیست" />
                ) : (
                  <div dir="rtl" style={{ height: Math.max(160, occupancyPoints.length * 46) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={occupancyPoints}
                        margin={{ top: 4, right: 6, left: 8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${toPersianDigits(v)}٪`} tick={CHART_TICK} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" orientation="right" width={110} tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<FinTooltip unit="pct" />} cursor={{ fill: 'rgba(8,145,178,0.06)' }} />
                        <Bar dataKey="rate" name="اشغال" radius={[0, 8, 8, 0]} barSize={18}>
                          {occupancyPoints.map((v) => (
                            <Cell key={v.name} fill={v.rate >= 60 ? '#0891b2' : v.rate >= 30 ? '#f59e0b' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </div>
      )}

      {/* کم‌تقاضا + بدهکاران */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionCard
            title="سانس‌های کم‌تقاضا (اشغال ≤ ۴۰٪)"
            icon="mdi:alarm-light-outline"
            color="#d97706"
            action={
              lowDemand.data ? (
                <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-xs font-bold text-foreground">
                  {toPersianDigits(lowDemand.data.length)}
                </span>
              ) : undefined
            }
          >
            {lowDemand.isPending ? (
              <LoadingBox />
            ) : lowDemand.isError ? (
              <ErrorBox message={extractError(lowDemand.error, 'خطا در دریافت الگوی تقاضا')} />
            ) : (lowDemand.data?.length ?? 0) === 0 ? (
              <EmptyBox icon="mdi:emoticon-happy-outline" title="سانس کم‌تقاضایی یافت نشد" text="الگوی تقاضا در بازه انتخابی بالای حد آستانه است." />
            ) : (
              <div
                role="region"
                aria-label="سانس‌های کم‌تقاضا، قابل پیمایش با کیبورد"
                tabIndex={0}
                className="max-h-[300px] overflow-auto rounded-xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&>div]:overflow-visible"
              >
                <Table aria-label="سانس‌های کم‌تقاضا">
                  <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
                    <TableRow className="hover:bg-transparent">
                      {['روز هفته', 'ساعت', 'سانس فعال', 'رزروشده', 'اشغال'].map((h) => (
                        <TableHead key={h} scope="col" className="whitespace-nowrap text-[0.78rem] font-bold">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowDemand.data!.map((slot) => (
                      <TableRow key={`${slot.weekday}-${slot.hour}`} className="hover:bg-muted/50">
                        <TableCell className="text-foreground">{FIN_WEEKDAY_NAMES[slot.weekday] ?? `روز ${slot.weekday}`}</TableCell>
                        <TableCell>
                          <span className="text-sm font-bold tabular-nums text-foreground">
                            {`${toPersianDigits(String(slot.hour).padStart(2, '0'))}:${toPersianDigits('00')}`}
                          </span>
                        </TableCell>
                        <TableCell className="tabular-nums text-foreground">{toPersianDigits(slot.total_slots)}</TableCell>
                        <TableCell className="tabular-nums text-foreground">{toPersianDigits(slot.booked_slots)}</TableCell>
                        <TableCell>
                          <StatusChip
                            label={formatPct(slot.occupancy_rate)}
                            color={slot.occupancy_rate <= 20 ? '#dc2626' : '#d97706'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="lg:col-span-5">
          <SectionCard title="برترین بدهکاران" icon="mdi:account-minus-outline" color="#dc2626">
            {debtors.isPending ? (
              <LoadingBox />
            ) : debtors.isError ? (
              <ErrorBox message={extractError(debtors.error, 'خطا در دریافت بدهکاران')} />
            ) : (debtors.data?.items.length ?? 0) === 0 ? (
              <EmptyBox icon="mdi:shield-check-outline" title="بدهکار فعالی نیست" />
            ) : (
              <div>
                {debtors.data!.items.map((acc, i) => (
                  <div
                    key={acc.user_id}
                    className={
                      i < debtors.data!.items.length - 1
                        ? 'flex items-center gap-2.5 border-b border-border px-1 py-2'
                        : 'flex items-center gap-2.5 px-1 py-2'
                    }
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-red-500/10 text-[0.8rem] font-extrabold text-red-600 tabular-nums dark:text-red-400">
                      {toPersianDigits(i + 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">
                        {acc.full_name || 'بدون نام'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        کاربر #{toPersianDigits(acc.user_id)}
                      </p>
                    </div>
                    <p dir="rtl" className="whitespace-nowrap text-sm font-extrabold text-red-600 tabular-nums dark:text-red-400">
                      {formatRial(acc.balance)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatementUser({ id: acc.user_id, name: acc.full_name })}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      حساب
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <div className="mt-4">
        <VenueComparisonPanel scope={scope} />
      </div>

      <StatementDialog
        open={statementUser !== null}
        onClose={() => setStatementUser(null)}
        userId={statementUser?.id ?? null}
        userName={statementUser?.name}
        venues={venues}
      />
    </div>
  )
}

// ─────────────── اجزای کمکی داخل داشبورد ───────────────

const RangeInputs: React.FC<{
  from: string
  to: string
  onFrom: (iso: string) => void
  onTo: (iso: string) => void
}> = ({ from, to, onFrom, onTo }) => (
  <div className="flex w-full gap-2">
    <div className="flex-1">
      <PersianDatePicker size="small" label="از" value={from} onChange={onFrom} max={to || undefined} />
    </div>
    <div className="flex-1">
      <PersianDatePicker size="small" label="تا" value={to} onChange={onTo} min={from || undefined} />
    </div>
  </div>
)

const ChartLegend: React.FC<{ items: { color: string; label: string }[] }> = ({ items }) => (
  <div className="mt-1 flex flex-wrap justify-center gap-4">
    {items.map((it) => (
      <div key={it.label} className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: it.color }} aria-hidden="true" />
        <span className="text-xs font-semibold text-muted-foreground">{it.label}</span>
      </div>
    ))}
  </div>
)

const PieSourceLegend: React.FC<{ points: { source: string; income: number; count: number }[]; total: number }> = ({
  points,
  total,
}) => (
  <div className="mt-1 flex flex-col gap-1.5">
    {points.map((s, i) => (
      <div key={s.source} className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
          style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
          aria-hidden="true"
        />
        <span className="min-w-[90px] text-xs font-bold text-foreground">
          {labelOf(TX_SOURCE_LABELS, s.source)}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatRial(s.income)}
        </span>
        <span className="ms-auto text-xs text-muted-foreground tabular-nums" dir="rtl">
          {total > 0 ? formatPct((s.income / total) * 100) : ''} • {toPersianDigits(s.count)} ردیف
        </span>
      </div>
    ))}
  </div>
)

export default FinanceDashboardTab
