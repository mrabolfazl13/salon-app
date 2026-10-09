// frontend/src/components/finance/FinanceDashboardTab.tsx
// «داشبورد مالی» — KPIها از /finance/dashboard، نمودارهای recharts (روند روزانه،
// ساعت/روز هفته، تفکیک منبع، اشغال سالن‌ها)، جدول سانس‌های کم‌تقاضا و برترین بدهکاران.

import React, { useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
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
  jalaliDayLabel,
  labelOf,
  shortRialAxis,
  useAboveSm,
} from './shared'
import StatementDialog from './StatementDialog'
import { getTodayISO, toPersianDigits } from '@/lib/jalali'
import PersianDatePicker from '@/components/ui/PersianDatePicker'
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

  interface Kpi { label: string; value: string; icon: string; color: string; sub?: string; end?: React.ReactNode }
  const kpis: Kpi[] = d
    ? [
        { label: 'درآمد امروز', value: formatRial(d.today_revenue), icon: 'mdi:cash-fast', color: '#059669' },
        {
          label: 'درآمد این ماه',
          value: formatRial(d.month_revenue),
          icon: 'mdi:calendar-month',
          color: '#2563eb',
          end: monthDelta ? (
            <StatusChip label={monthDelta.label} color={monthDelta.up ? '#059669' : '#dc2626'} />
          ) : undefined,
        },
        { label: 'دریافتی امروز', value: formatRial(d.today_received), icon: 'mdi:bank-plus', color: '#7c3aed' },
        { label: 'مطالبات باز', value: formatRial(d.open_receivables), icon: 'mdi:hand-back-right', color: '#dc2626' },
        { label: 'هزینه‌ها (بازه)', value: formatRial(d.expenses), icon: 'mdi:cash-minus', color: '#d97706' },
        { label: 'سود ناخالص (بازه)', value: formatRial(d.gross_profit), icon: 'mdi:trending-up', color: d.gross_profit >= 0 ? '#059669' : '#dc2626' },
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
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>خلاصه عملکرد</Typography>
        {dashboard.isError ? (
          <ErrorBox message={extractError(dashboard.error, 'خطا در دریافت داشبورد مالی')} onRetry={() => dashboard.refetch()} />
        ) : (
          <Grid container spacing={1.5}>
            {(dashboard.isPending ? Array.from({ length: 4 }, () => null) : kpis.slice(0, 4)).map((k, i) =>
              k === null ? (
                <Grid size={{ xs: 6, md: 3 }} key={`sk-${i}`}>
                  <KpiCard label="" value="" icon="mdi:chart-line" loading />
                </Grid>
              ) : (
                <Grid size={{ xs: 6, md: 3 }} key={k.label}>
                  <KpiCard label={k.label} value={k.value} sub={k.sub} icon={k.icon} color={k.color} end={k.end} />
                </Grid>
              ),
            )}
          </Grid>
        )}
      </Box>

      <SectionCard title="فیلتر گزارش‌ها" icon="mdi:filter-variant" color="#7c3aed" dense>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'stretch', md: 'center' } }}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
            <InputLabel>سالن</InputLabel>
            <Select
              value={venueSel}
              label="سالن"
              onChange={(e) => setVenueSel(e.target.value as number | 'all')}
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="all">همه سالن‌های من</MenuItem>
              {venues.map((v) => (
                <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'center' } }}>
            {[
              { label: '۷ روز', days: 6 },
              { label: '۳۰ روز', days: 30 },
              { label: '۹۰ روز', days: 90 },
            ].map((preset) => (
              <Chip
                key={preset.days}
                label={preset.label}
                size="small"
                onClick={() => {
                  setFrom(isoDaysAgo(preset.days))
                  setTo(getTodayISO())
                }}
                sx={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem' }}
                variant={from === isoDaysAgo(preset.days) ? 'filled' : 'outlined'}
                color="primary"
              />
            ))}
          </Box>
          <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 0 } }}>
            <RangeInputs from={from} to={to} onFrom={setFrom} onTo={setTo} />
          </Box>
        </Box>
      </SectionCard>

      {!dashboard.isError && !dashboard.isPending && kpis.length > 4 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, color: 'text.secondary' }}>سایر شاخص‌ها</Typography>
          <Grid container spacing={1.5}>
            {kpis.slice(4).map((k) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={k.label}>
                <KpiCard label={k.label} value={k.value} sub={k.sub} icon={k.icon} color={k.color} end={k.end} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* نمودارها — فقط >= sm */}
      {showCharts && (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <SectionCard
                title="روند درآمد و هزینه (روزانه)"
                icon="mdi:chart-area"
                action={
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {daySeries.isFetching ? 'به‌روزرسانی...' : `خالص بازه: ${formatRial(daySeries.data?.total_net ?? 0)}`}
                  </Typography>
                }
              >
                {daySeries.isPending ? (
                  <LoadingBox text="در حال دریافت روند..." />
                ) : daySeries.isError ? (
                  <ErrorBox message={extractError(daySeries.error, 'خطا در دریافت سری درآمد')} />
                ) : dayPoints.length === 0 ? (
                  <EmptyBox icon="mdi:chart-line-variant" title="داده‌ای در این بازه نیست" />
                ) : (
                  <Box dir="rtl" sx={{ height: 280 }}>
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
                        <XAxis dataKey="label" reversed tick={{ fontSize: 10.5, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={18} axisLine={false} tickLine={false} />
                        <YAxis orientation="right" width={64} tickFormatter={shortRialAxis} tick={{ fontSize: 10.5, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<FinTooltip />} cursor={{ stroke: '#64748b', strokeDasharray: '4 4' }} />
                        <Area type="monotone" dataKey="income" name="درآمد" stroke="#059669" strokeWidth={2} fill="url(#finIncome)" />
                        <Area type="monotone" dataKey="expense" name="هزینه" stroke="#ef4444" strokeWidth={2} fill="url(#finExpense)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                )}
                <ChartLegend items={[{ color: '#059669', label: 'درآمد' }, { color: '#ef4444', label: 'هزینه' }]} />
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard title="درآمد خالص به تفکیک روز هفته" icon="mdi:weekend">
                {weekdaySeries.isPending ? (
                  <LoadingBox />
                ) : weekdayPoints.length === 0 ? (
                  <EmptyBox icon="mdi:chart-bar" title="داده‌ای نیست" />
                ) : (
                  <Box dir="rtl" sx={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekdayPoints} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="label" reversed tick={{ fontSize: 10.5, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis orientation="right" width={64} tickFormatter={shortRialAxis} tick={{ fontSize: 10.5, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<FinTooltip />} cursor={{ fill: 'rgba(37,99,235,0.06)' }} />
                        <Bar dataKey="net" name="خالص" radius={[6, 6, 0, 0]}>
                          {weekdayPoints.map((p) => (
                            <Cell key={p.key} fill={p.net >= 0 ? '#2563eb' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard title="تمرکز درآمد در ساعات روز (اوج‌شناسی)" icon="mdi:clock-outline" color="#d97706">
                {hourSeries.isPending ? (
                  <LoadingBox />
                ) : hourPoints.length === 0 ? (
                  <EmptyBox icon="mdi:chart-bar" title="داده‌ای نیست" />
                ) : (
                  <Box dir="rtl" sx={{ height: 240 }}>
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
                        <YAxis orientation="right" width={64} tickFormatter={shortRialAxis} tick={{ fontSize: 10.5, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<FinTooltip />} cursor={{ fill: 'rgba(217,119,6,0.07)' }} />
                        <Bar dataKey="income" name="درآمد" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard title="درآمد به تفکیک منبع" icon="mdi:slice" color="#7c3aed">
                {bySource.isPending ? (
                  <LoadingBox />
                ) : sourcePoints.length === 0 ? (
                  <EmptyBox icon="mdi:chart-pie" title="درآمدی ثبت نشده" />
                ) : (
                  <>
                    <Box dir="rtl" sx={{ height: 220 }}>
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
                    </Box>
                    <PieSourceLegend points={sourcePoints} total={bySource.data?.total ?? 0} />
                  </>
                )}
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard
                title="اشغال سانس‌ها به تفکیک سالن"
                icon="mdi:store-check-outline"
                color="#0891b2"
                action={
                  occupancy.data ? (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      کل بازه: {formatPct(occupancy.data.occupancy_rate)}
                    </Typography>
                  ) : undefined
                }
              >
                {occupancy.isPending ? (
                  <LoadingBox />
                ) : occupancyPoints.length === 0 ? (
                  <EmptyBox icon="mdi:chart-timeline-variant" title="سانس فعالی در بازه نیست" />
                ) : (
                  <Box dir="rtl" sx={{ height: Math.max(160, occupancyPoints.length * 46) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={occupancyPoints}
                        margin={{ top: 4, right: 6, left: 8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${toPersianDigits(v)}٪`} tick={{ fontSize: 10.5, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" orientation="right" width={110} tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<FinTooltip unit="pct" />} cursor={{ fill: 'rgba(8,145,178,0.06)' }} />
                        <Bar dataKey="rate" name="اشغال" radius={[0, 8, 8, 0]} barSize={18}>
                          {occupancyPoints.map((v) => (
                            <Cell key={v.name} fill={v.rate >= 60 ? '#0891b2' : v.rate >= 30 ? '#f59e0b' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </SectionCard>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* کم‌تقاضا + بدهکاران */}
      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SectionCard
            title="سانس‌های کم‌تقاضا (اشغال ≤ ۴۰٪)"
            icon="mdi:alarm-light-outline"
            color="#d97706"
            action={
              lowDemand.data ? (
                <Chip size="small" label={toPersianDigits(lowDemand.data.length)} sx={{ borderRadius: '8px', fontWeight: 700 }} />
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
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>روز هفته</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>ساعت</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>سانس فعال</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>رزروشده</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>اشغال</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lowDemand.data!.map((slot) => (
                      <TableRow key={`${slot.weekday}-${slot.hour}`} hover>
                        <TableCell>{FIN_WEEKDAY_NAMES[slot.weekday] ?? `روز ${slot.weekday}`}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {`${toPersianDigits(String(slot.hour).padStart(2, '0'))}:${toPersianDigits('00')}`}
                          </Typography>
                        </TableCell>
                        <TableCell>{toPersianDigits(slot.total_slots)}</TableCell>
                        <TableCell>{toPersianDigits(slot.booked_slots)}</TableCell>
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
              </TableContainer>
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <SectionCard title="برترین بدهکاران" icon="mdi:account-minus-outline" color="#dc2626">
            {debtors.isPending ? (
              <LoadingBox />
            ) : debtors.isError ? (
              <ErrorBox message={extractError(debtors.error, 'خطا در دریافت بدهکاران')} />
            ) : (debtors.data?.items.length ?? 0) === 0 ? (
              <EmptyBox icon="mdi:shield-check-outline" title="بدهکار فعالی نیست" />
            ) : (
              <Box>
                {debtors.data!.items.map((acc, i) => (
                  <Box
                    key={acc.user_id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.25,
                      py: 1,
                      px: 0.5,
                      borderBottom: i < debtors.data!.items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    }}
                  >
                    <Avatar sx={{ width: 32, height: 32, borderRadius: '10px', bgcolor: 'rgba(239,68,68,0.1)', color: '#dc2626', fontSize: '0.8rem', fontWeight: 800 }}>
                      {toPersianDigits(i + 1)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {acc.full_name || 'بدون نام'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        کاربر #{toPersianDigits(acc.user_id)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" dir="rtl" sx={{ fontWeight: 800, color: '#dc2626', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {formatRial(acc.balance)}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setStatementUser({ id: acc.user_id, name: acc.full_name })}
                      sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', color: 'primary.main' }}
                    >
                      حساب
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>
        </Grid>
      </Grid>

      <StatementDialog
        open={statementUser !== null}
        onClose={() => setStatementUser(null)}
        userId={statementUser?.id ?? null}
        userName={statementUser?.name}
        venues={venues}
      />
    </Box>
  )
}

// ─────────────── اجزای کمکی داخل داشبورد ───────────────

const RangeInputs: React.FC<{
  from: string
  to: string
  onFrom: (iso: string) => void
  onTo: (iso: string) => void
}> = ({ from, to, onFrom, onTo }) => (
  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
    <Box sx={{ flex: 1 }}>
      <PersianDatePicker size="small" label="از" value={from} onChange={onFrom} max={to || undefined} />
    </Box>
    <Box sx={{ flex: 1 }}>
      <PersianDatePicker size="small" label="تا" value={to} onChange={onTo} min={from || undefined} />
    </Box>
  </Box>
)

const ChartLegend: React.FC<{ items: { color: string; label: string }[] }> = ({ items }) => (
  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 0.5, flexWrap: 'wrap' }}>
    {items.map((it) => (
      <Box key={it.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: it.color }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{it.label}</Typography>
      </Box>
    ))}
  </Box>
)

const PieSourceLegend: React.FC<{ points: { source: string; income: number; count: number }[]; total: number }> = ({
  points,
  total,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 }}>
    {points.map((s, i) => (
      <Box key={s.source} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: SOURCE_COLORS[i % SOURCE_COLORS.length], flexShrink: 0 }} />
        <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 90 }}>
          {labelOf(TX_SOURCE_LABELS, s.source)}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {formatRial(s.income)}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', mr: 'auto' }} dir="rtl">
          {total > 0 ? formatPct((s.income / total) * 100) : ''} • {toPersianDigits(s.count)} ردیف
        </Typography>
      </Box>
    ))}
  </Box>
)

export default FinanceDashboardTab
