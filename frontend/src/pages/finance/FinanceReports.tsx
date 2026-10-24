// src/pages/finance/FinanceReports.tsx
// «گزارش‌های تحلیلی» — روند روزانه، الگوی هفته/ساعت، تفکیک منبع، اشغال سالن‌ها،
// سانس‌های کم‌تقاضا و مقایسهٔ بین‌سالنه. یک اسکرول پیوسته؛ بدون تب داخلی.

import React, { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
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
  useLowDemandSlots,
  useOccupancy,
  useRevenueBySource,
  useRevenueSeries,
} from '@/hooks/useFinance'
import {
  EmptyBox,
  ErrorBox,
  FIN_WEEKDAY_NAMES,
  FinTooltip,
  LoadingBox,
  SAT_FIRST_ORDER,
  SectionCard,
  StatusChip,
  TX_SOURCE_LABELS,
  extractError,
  formatPct,
  formatRial,
  jalaliDayLabel,
  labelOf,
  shortRialAxis,
} from '@/components/finance/shared'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'
import VenueComparisonPanel from '@/components/finance/VenueComparisonPanel'
import { toPersianDigits } from '@/lib/jalali'
import type { SeriesPoint } from '@/services/finance'
import FinanceHeader from './FinanceHeader'
import FinanceScopeBar, { useFinanceScope } from './FinanceScopeBar'
import type { FinanceOutletContext } from './context'

const SOURCE_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#0891b2', '#db2777', '#64748b']
const CHART_TICK = { fontSize: 10.5, fill: '#64748b' }

/** سری weekday را به ترتیب شنبه‌محورِ فارسی مرتب می‌کند */
function reorderWeekday(points: SeriesPoint[]): SeriesPoint[] {
  const byKey = new Map(points.map((p) => [Number(p.key) % 7, p]))
  return SAT_FIRST_ORDER.map((w) => byKey.get(w)).filter((p): p is SeriesPoint => Boolean(p))
}

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

const FinanceReports: React.FC = () => {
  const { venues } = useOutletContext<FinanceOutletContext>()
  const scopeState = useFinanceScope()
  const { scope } = scopeState

  const daySeries = useRevenueSeries({ ...scope, group_by: 'day' })
  const weekdaySeries = useRevenueSeries({ ...scope, group_by: 'weekday' })
  const hourSeries = useRevenueSeries({ ...scope, group_by: 'hour' })
  const bySource = useRevenueBySource(scope)
  const occupancy = useOccupancy(scope)
  const lowDemand = useLowDemandSlots({ ...scope, threshold: 40 })

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
    <div className="min-h-screen bg-background pb-8">
      <FinanceHeader
        title="گزارش‌های تحلیلی"
        subtitle="روند درآمد، الگوی تقاضا، اشغال و مقایسهٔ سالن‌ها"
        backTo="/finance"
        backLabel="بازگشت به امور مالی"
      />

      <main className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-4">
        <FinanceScopeBar
          venues={venues}
          venueSel={scopeState.venueSel}
          onVenueChange={scopeState.setVenueSel}
          from={scopeState.from}
          to={scopeState.to}
          onFromChange={scopeState.setFrom}
          onToChange={scopeState.setTo}
        />

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <SectionCard
              title="روند درآمد و هزینه (روزانه)"
              icon="mdi:chart-area"
              color="#059669"
              action={
                daySeries.data ? (
                  <span className="text-[0.68rem] text-muted-foreground">
                    خالص بازه: {formatRial(daySeries.data.total_net)}
                  </span>
                ) : undefined
              }
            >
              {daySeries.isPending ? (
                <LoadingBox text="در حال دریافت روند..." />
              ) : daySeries.isError ? (
                <ErrorBox
                  message={extractError(daySeries.error, 'خطا در دریافت سری درآمد')}
                  onRetry={() => daySeries.refetch()}
                />
              ) : dayPoints.length === 0 ? (
                <EmptyBox icon="mdi:chart-line-variant" title="داده‌ای در این بازه نیست" />
              ) : (
                <div dir="rtl" className="h-[220px] sm:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dayPoints} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="finReportIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="finReportExpense" x1="0" y1="0" x2="0" y2="1">
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
                      <Area type="monotone" dataKey="income" name="درآمد" stroke="#059669" strokeWidth={2} fill="url(#finReportIncome)" />
                      <Area type="monotone" dataKey="expense" name="هزینه" stroke="#ef4444" strokeWidth={2} fill="url(#finReportExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
              <ChartLegend items={[{ color: '#059669', label: 'درآمد' }, { color: '#ef4444', label: 'هزینه' }]} />
            </SectionCard>
          </div>

          <SectionCard title="درآمد خالص به تفکیک روز هفته" icon="mdi:weekend" color="#2563eb">
            {weekdaySeries.isPending ? (
              <LoadingBox />
            ) : weekdaySeries.isError ? (
              <ErrorBox
                message={extractError(weekdaySeries.error, 'خطا در دریافت الگوی هفته')}
                onRetry={() => weekdaySeries.refetch()}
              />
            ) : weekdayPoints.length === 0 ? (
              <EmptyBox icon="mdi:chart-bar" title="داده‌ای نیست" />
            ) : (
              <div dir="rtl" className="h-[220px] sm:h-[240px]">
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

          <SectionCard title="تمرکز درآمد در ساعات روز" icon="mdi:clock-outline" color="#d97706">
            {hourSeries.isPending ? (
              <LoadingBox />
            ) : hourSeries.isError ? (
              <ErrorBox
                message={extractError(hourSeries.error, 'خطا در دریافت الگوی ساعتی')}
                onRetry={() => hourSeries.refetch()}
              />
            ) : hourPoints.length === 0 ? (
              <EmptyBox icon="mdi:chart-bar" title="داده‌ای نیست" />
            ) : (
              <div dir="rtl" className="h-[220px] sm:h-[240px]">
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

          <SectionCard title="درآمد به تفکیک منبع" icon="mdi:slice" color="#7c3aed">
            {bySource.isPending ? (
              <LoadingBox />
            ) : bySource.isError ? (
              <ErrorBox
                message={extractError(bySource.error, 'خطا در دریافت تفکیک منبع')}
                onRetry={() => bySource.refetch()}
              />
            ) : sourcePoints.length === 0 ? (
              <EmptyBox icon="mdi:chart-pie" title="درآمدی ثبت نشده" />
            ) : (
              <>
                <div dir="rtl" className="h-[190px] sm:h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<FinTooltip />} />
                      <Pie
                        data={sourcePoints}
                        dataKey="income"
                        nameKey="source"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={78}
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
                <div className="mt-1 flex flex-col gap-1.5">
                  {sourcePoints.map((s, i) => (
                    <div key={s.source} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                        style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
                        aria-hidden="true"
                      />
                      <span className="min-w-[80px] text-[0.7rem] font-bold text-foreground">
                        {labelOf(TX_SOURCE_LABELS, s.source)}
                      </span>
                      <span className="text-[0.7rem] text-muted-foreground tabular-nums">{formatRial(s.income)}</span>
                      <span className="ms-auto text-[0.7rem] text-muted-foreground tabular-nums" dir="rtl">
                        {bySource.data && bySource.data.total > 0
                          ? formatPct((s.income / bySource.data.total) * 100)
                          : ''}{' '}
                        • {toPersianDigits(s.count)} ردیف
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>

          <div className="md:col-span-2">
            <SectionCard
              title="اشغال سانس‌ها به تفکیک سالن"
              icon="mdi:store-check-outline"
              color="#0891b2"
              action={
                occupancy.data ? (
                  <span className="text-[0.68rem] text-muted-foreground">
                    کل بازه: {formatPct(occupancy.data.occupancy_rate)}
                  </span>
                ) : undefined
              }
            >
              {occupancy.isPending ? (
                <LoadingBox />
              ) : occupancy.isError ? (
                <ErrorBox
                  message={extractError(occupancy.error, 'خطا در دریافت اشغال سالن‌ها')}
                  onRetry={() => occupancy.refetch()}
                />
              ) : occupancyPoints.length === 0 ? (
                <EmptyBox icon="mdi:chart-timeline-variant" title="سانس فعالی در بازه نیست" />
              ) : (
                <div dir="rtl" style={{ height: Math.max(160, occupancyPoints.length * 46) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={occupancyPoints} margin={{ top: 4, right: 6, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(v: number) => `${toPersianDigits(v)}٪`}
                        tick={CHART_TICK}
                        axisLine={false}
                        tickLine={false}
                      />
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

        <div className="mt-3">
          <SectionCard
            title="سانس‌های کم‌تقاضا (اشغال ≤ ۴۰٪)"
            icon="mdi:alarm-light-outline"
            color="#d97706"
            action={
              lowDemand.data ? (
                <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-[0.68rem] font-bold text-foreground">
                  {toPersianDigits(lowDemand.data.length)}
                </span>
              ) : undefined
            }
          >
            {lowDemand.isPending ? (
              <LoadingBox />
            ) : lowDemand.isError ? (
              <ErrorBox
                message={extractError(lowDemand.error, 'خطا در دریافت الگوی تقاضا')}
                onRetry={() => lowDemand.refetch()}
              />
            ) : (lowDemand.data?.length ?? 0) === 0 ? (
              <EmptyBox
                icon="mdi:emoticon-happy-outline"
                title="سانس کم‌تقاضایی یافت نشد"
                text="الگوی تقاضا در بازه انتخابی بالای حد آستانه است."
              />
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
                        <TableHead key={h} scope="col" className="whitespace-nowrap text-[0.75rem] font-bold">
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
                          <span className="text-[0.78rem] font-bold tabular-nums text-foreground">
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

        <div className="mt-3">
          <VenueComparisonPanel scope={scope} />
        </div>
      </main>
    </div>
  )
}

export default FinanceReports
