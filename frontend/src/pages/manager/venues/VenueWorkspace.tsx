// src/pages/manager/venues/VenueWorkspace.tsx
// گام دوم جریان مدیریت: داشبورد یک سالن مشخص. همهٔ اعداد و همهٔ لینک‌ها به همین
// سالن محدودند تا مدیر بین سالن‌ها قاطی نشود.

import React, { useMemo } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
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

import Layout from '@/components/layout/Layout'
import { ForbiddenPanel } from '@/components/crm/shared'
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
  TX_STATUS_COLORS,
  TX_STATUS_LABELS,
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
import { useFinanceDashboard, useRevenueSeries, useTransactions } from '@/hooks/useFinance'
import { isForbiddenError, useManagedVenues, useStaffCodes, useStaffPermission } from '@/hooks/useStaffMe'
import { useAuthStore } from '@/store/authStore'
import { isoDaysAgo } from '@/pages/finance/FinanceScopeBar'
import { pctChange } from '@/pages/finance/analytics'
import { formatJalaliDateTime, getTodayISO, toPersianDigits } from '@/lib/jalali'
import VenuePhoto from './VenuePhoto'

const CHART_TICK = { fontSize: 10.5, fill: '#64748b' }

const MiniStat: React.FC<{ label: string; value: string; danger?: boolean }> = ({ label, value, danger }) => (
  <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 sm:block">
    <p className="shrink-0 text-[0.62rem] text-muted-foreground">{label}</p>
    <p
      className={
        danger
          ? 'mt-0.5 whitespace-nowrap text-[0.8rem] font-bold tabular-nums text-red-600 dark:text-red-400'
          : 'mt-0.5 whitespace-nowrap text-[0.8rem] font-bold tabular-nums text-foreground'
      }
    >
      {value}
    </p>
  </div>
)

const MODULE_LINK =
  'group flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-card px-2.5 py-2.5 transition-colors hover:border-blue-600/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const VenueWorkspace: React.FC = () => {
  const { venueId: venueIdParam } = useParams()
  const navigate = useNavigate()
  const venueId = Number(venueIdParam)

  const venuesQuery = useManagedVenues()
  const venues = useMemo(() => venuesQuery.data ?? [], [venuesQuery.data])
  const venue = useMemo(() => venues.find((v) => v.id === venueId), [venues, venueId])
  const financeAccess = useStaffPermission(['finance.view', 'reports.view'])
  // دامنهٔ لینک‌ها = همان کدهایی که بک‌اند گیت می‌کند. /manager-dashboard مالک‌محور است
  // (allowStaff ندارد) پس برای کارمند لینک عملیاتی به آن ساخته نمی‌شود (ممیزی F-01).
  const role = useAuthStore((s) => s.user?.role)
  const isOperator = role === 'venue_manager' || role === 'club_admin' || role === 'super_admin'
  const staffCodes = useStaffCodes()
  const hasCode = (...codes: string[]) => isOperator || codes.some((c) => staffCodes.includes(c))
  const canViewContracts = isOperator || staffCodes.includes('contract.view')

  const to = getTodayISO()
  const from = isoDaysAgo(30)
  const scope = useMemo(() => ({ venue_id: venueId, from, to }), [venueId, from, to])

  // تا سالن در دامنهٔ مدیریت نباشد بک‌اند هر سه درخواست مالی را ۴۰۳ می‌کند؛
  // پس پیش از تأیید دامنه درخواستی ارسال نمی‌شود (ممیزی درخواست‌های بی‌نتیجه).
  const financeLive = financeAccess.allowed && Number.isFinite(venueId) && !!venue

  const dashboard = useFinanceDashboard(scope, financeLive)
  const series = useRevenueSeries(
    { ...scope, group_by: 'day' },
    financeLive,
  )
  const recent = useTransactions(
    { venue_id: venueId, limit: 6, offset: 0 },
    financeLive,
  )

  const d = dashboard.data
  const net = d?.gross_profit ?? 0
  const income = d ? d.gross_profit + d.expenses : 0

  const dayPoints = useMemo(
    () => (series.data?.points ?? []).map((p) => ({ ...p, label: jalaliDayLabel(p.key) })),
    [series.data],
  )

  const bookingsTarget = isOperator
    ? `/manager-dashboard?tab=2&venue=${venueId}`
    : `/finance/transactions?venue_id=${venueId}`

  const attention = useMemo(() => {
    if (!d) return []
    const rows: { icon: string; color: string; label: string; value: string; to: string; cta: string }[] = []
    if (d.pending_payment_bookings > 0) {
      rows.push({
        icon: 'mdi:clock-alert-outline',
        color: '#b45309',
        label: 'رزرو در انتظار پرداخت',
        value: faNum(d.pending_payment_bookings),
        to: bookingsTarget,
        cta: 'بررسی',
      })
    }
    if (d.open_receivables > 0) {
      rows.push({
        icon: 'mdi:account-cash-outline',
        color: '#b91c1c',
        label: 'مطالبات باز',
        value: formatRialCompact(d.open_receivables),
        to: `/finance/accounts?venue_id=${venueId}`,
        cta: 'حساب‌ها',
      })
    }
    if (d.contracts_expiring_soon > 0 && canViewContracts) {
      rows.push({
        icon: 'mdi:file-clock-outline',
        color: '#7c3aed',
        label: 'قرارداد نزدیک انقضا',
        value: faNum(d.contracts_expiring_soon),
        to: '/manager/contracts',
        cta: 'قراردادها',
      })
    }
    if (d.cancelled_bookings > 0) {
      rows.push({
        icon: 'mdi:calendar-remove-outline',
        color: '#64748b',
        label: 'رزرو لغوشده در بازه',
        value: faNum(d.cancelled_bookings),
        to: bookingsTarget,
        cta: 'رزروها',
      })
    }
    return rows
  }, [d, venueId, bookingsTarget, canViewContracts])

  const modules = [
    { to: `/finance?venue_id=${venueId}`, label: 'امور مالی', desc: 'وضعیت پول', icon: 'mdi:finance', color: '#2563eb', ok: hasCode('finance.view', 'reports.view') },
    { to: `/finance/transactions?venue_id=${venueId}`, label: 'دفتر کل', desc: 'دریافت و هزینه', icon: 'mdi:book-open-variant', color: '#0891b2', ok: hasCode('finance.view') },
    { to: `/finance/accounts?venue_id=${venueId}`, label: 'حساب‌ها', desc: 'بدهکاران', icon: 'mdi:account-group-outline', color: '#7c3aed', ok: hasCode('finance.view') },
    { to: `/finance/expenses?venue_id=${venueId}`, label: 'هزینه‌ها', desc: 'دسته‌بندی', icon: 'mdi:receipt-text-outline', color: '#b45309', ok: hasCode('finance.view', 'expense.manage') },
    { to: `/finance/reports?venue_id=${venueId}`, label: 'گزارش‌ها', desc: 'روند و اشغال', icon: 'mdi:chart-box-outline', color: '#1d4ed8', ok: hasCode('reports.view') },
    { to: `/finance/profit-loss?venue_id=${venueId}`, label: 'سود و زیان', desc: 'درآمد منهای هزینه', icon: 'mdi:scale-balance', color: '#059669', ok: hasCode('reports.view') },
    { to: `/manager-dashboard?tab=1&venue=${venueId}`, label: 'سانس‌ها', desc: 'برنامهٔ روز', icon: 'mdi:calendar-clock', color: '#d97706', ok: isOperator },
    { to: `/manager-dashboard?tab=2&venue=${venueId}`, label: 'رزروها', desc: 'تأیید و پیگیری', icon: 'mdi:calendar-check', color: '#2563eb', ok: isOperator },
    { to: '/manager/pricing', label: 'قیمت‌گذاری', desc: 'تعرفه سانس‌ها', icon: 'mdi:tag-percent-outline', color: '#9333ea', ok: hasCode('pricing.manage') },
    { to: '/manager/crm', label: 'مشتریان', desc: 'پروفایل و سابقه', icon: 'mdi:account-heart-outline', color: '#0d9488', ok: hasCode('crm.view', 'customer.view_basic') },
    { to: '/manager/contracts', label: 'قراردادها', desc: 'تمدید و انقضا', icon: 'mdi:file-document-check-outline', color: '#7c3aed', ok: canViewContracts },
    { to: '/manager/shifts', label: 'شیفت پرسنل', desc: 'حضور و تیم', icon: 'mdi:account-clock-outline', color: '#475569', ok: hasCode('staff.manage') },
  ].filter((m) => m.ok)

  const quickAccess =
    modules.length === 0 ? null : (
      <div className="mt-3">
        <SectionCard title="دسترسی سریع" icon="mdi:view-grid-outline" color="#2563eb" dense>
          <nav aria-label="بخش‌های سالن" className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {modules.map((m) => (
              <Link key={m.to + m.label} to={m.to} className={MODULE_LINK}>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${m.color}14` }}
                  aria-hidden="true"
                >
                  <Icon icon={m.icon} className="h-[18px] w-[18px]" style={{ color: m.color }} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[0.74rem] font-bold leading-tight text-foreground">
                    {m.label}
                  </span>
                  <span className="block truncate text-[0.62rem] text-muted-foreground">{m.desc}</span>
                </span>
              </Link>
            ))}
          </nav>
        </SectionCard>
      </div>
    )

  if (!Number.isFinite(venueId) || venueId <= 0) {
    return <Navigate to="/manager/venues" replace />
  }

  if (venuesQuery.isPending) {
    return (
      <Layout userRole="venue_manager">
        <div className="min-h-screen bg-background">
          <LoadingBox text="در حال باز کردن داشبورد سالن..." />
        </div>
      </Layout>
    )
  }

  if (venuesQuery.isError) {
    return (
      <Layout userRole="venue_manager">
        <div className="mx-auto max-w-5xl p-4">
          {isForbiddenError(venuesQuery.error) ? (
            <ForbiddenPanel detail="شما به هیچ سالنی دسترسی ندارید." />
          ) : (
            <ErrorBox message="خطا در دریافت سالن‌ها" onRetry={() => venuesQuery.refetch()} />
          )}
        </div>
      </Layout>
    )
  }

  if (!venue) {
    return (
      <Layout userRole="venue_manager">
        <div className="mx-auto max-w-5xl p-4">
          <ForbiddenPanel asPageHeading detail="این سالن در دامنهٔ مدیریت شما نیست." />
          <div className="mt-3 text-center">
            <Link
              to="/manager/venues"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-card px-4 text-[0.72rem] font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Icon icon="mdi:arrow-right" aria-hidden="true" className="h-4 w-4" />
              بازگشت به فهرست سالن‌ها
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="venue_manager">
      <div className="min-h-screen bg-background pb-10">
        <header className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#2563eb] to-violet-600">
          <div className="mx-auto max-w-5xl px-3 pb-10 pt-3 sm:px-6 sm:pb-12 sm:pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                to="/manager/venues"
                aria-label="بازگشت به فهرست سالن‌ها"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 text-[0.72rem] font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Icon icon="mdi:arrow-right" aria-hidden="true" className="h-4 w-4" />
                سالن‌های من
              </Link>
              <div className="flex items-center gap-1.5">
                <Link
                  to={`/venues/${venue.id}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 text-[0.72rem] font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <Icon icon="mdi:open-in-new" aria-hidden="true" className="h-3.5 w-3.5" />
                  صفحهٔ عمومی
                </Link>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <VenuePhoto
                id={venue.id}
                name={venue.name}
                images={venue.images}
                category={venue.category}
                className="h-14 w-14 shrink-0 rounded-2xl border border-white/25 sm:h-16 sm:w-16"
              />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-extrabold text-white sm:text-2xl">{venue.name}</h1>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[0.7rem] text-white/75">
                  <Icon icon="mdi:map-marker-outline" aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  {venue.address || 'آدرس ثبت نشده'}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-1.5 py-0.5 text-[0.62rem] font-semibold text-white">
                    <Icon
                      icon={venue.category === 'gym' ? 'mdi:dumbbell' : 'mdi:soccer'}
                      aria-hidden="true"
                      className="h-3 w-3"
                    />
                    {venue.category === 'gym' ? 'بدنسازی' : 'فوتسال'}
                  </span>
                  {venue.is_verified !== undefined && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-1.5 py-0.5 text-[0.62rem] font-semibold text-white">
                      <Icon
                        icon={venue.is_verified ? 'mdi:check-decagram' : 'mdi:clock-outline'}
                        aria-hidden="true"
                        className="h-3 w-3"
                      />
                      {venue.is_verified ? 'تأیید شده' : 'در انتظار تأیید'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-[2] mx-auto -mt-6 max-w-5xl px-3 sm:px-6">
          {/* سوییچ سالن — جابه‌جایی سریع بدون بازگشت به فهرست */}
          {venues.length > 1 && (
            <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-border bg-card p-2 shadow-sm sm:flex-wrap">
              <label
                htmlFor="venue-switch"
                className="shrink-0 px-1 text-[0.68rem] font-semibold text-muted-foreground"
              >
                سالن فعال:
              </label>
              <select
                id="venue-switch"
                value={venue.id}
                onChange={(e) => navigate(`/manager/venues/${e.target.value}`)}
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-card px-2 text-[0.78rem] font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
              >
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
                {venues.map((v) => (
                  <Link
                    key={v.id}
                    to={`/manager/venues/${v.id}`}
                    aria-current={v.id === venue.id ? 'page' : undefined}
                    className={
                      v.id === venue.id
                        ? 'inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-2.5 text-[0.7rem] font-bold text-white'
                        : 'inline-flex min-h-11 items-center rounded-lg border border-border px-2.5 text-[0.7rem] font-semibold text-foreground transition-colors hover:bg-muted'
                    }
                  >
                    {v.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!financeAccess.allowed ? (
            quickAccess ?? (
              <div className="rounded-2xl border border-border bg-card">
                <ForbiddenPanel detail="این سالن به حساب شما اختصاص نیافته است یا دسترسی مالی و عملیاتی آن فعال نیست." />
              </div>
            )
          ) : dashboard.isError ? (
            <div className="rounded-2xl border border-border bg-card">
              <ErrorBox
                message={extractError(dashboard.error, 'خطا در دریافت وضعیت سالن')}
                onRetry={() => dashboard.refetch()}
              />
            </div>
          ) : (
            <>
              {/* وضعیت پول */}
              <section className="rounded-2xl border border-border bg-card p-3.5 shadow-sm sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.7rem] font-semibold text-muted-foreground">
                      سود خالص ۳۰ روز (درآمد منهای هزینه)
                    </p>
                    {dashboard.isPending ? (
                      <span className="mt-1.5 block h-8 w-40 animate-pulse rounded-lg bg-muted" />
                    ) : (
                      <p
                        className={
                          net >= 0
                            ? 'mt-1 text-[1.5rem] font-extrabold leading-tight tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-[1.75rem]'
                            : 'mt-1 text-[1.5rem] font-extrabold leading-tight tabular-nums text-red-600 dark:text-red-400 sm:text-[1.75rem]'
                        }
                        title={formatRial(net)}
                      >
                        {formatRialCompact(net)}
                      </p>
                    )}
                    {d && (
                      <p className="mt-1 text-[0.68rem] text-muted-foreground">
                        درآمد {formatRialCompact(income)} • هزینه {formatRialCompact(d.expenses)}
                      </p>
                    )}
                  </div>
                  <div className="grid w-full grid-cols-1 gap-1.5 sm:w-auto sm:grid-cols-3">
                    <MiniStat label="سود امروز" value={d ? formatRialCompact(d.today_revenue) : '—'} />
                    <MiniStat label="دریافتی امروز" value={d ? formatRialCompact(d.today_received) : '—'} />
                    <MiniStat
                      label="مطالبات باز"
                      value={d ? formatRialCompact(d.open_receivables) : '—'}
                      danger={Boolean(d && d.open_receivables > 0)}
                    />
                  </div>
                </div>
                {d && d.active_contracts > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border pt-2.5">
                    <StatusChip label={`${faNum(d.active_contracts)} قرارداد فعال`} color="#2563eb" />
                    <StatusChip label={`${faNum(d.active_customers)} مشتری فعال در بازه`} color="#7c3aed" />
                  </div>
                )}
              </section>

              {/* شاخص‌های اصلی */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                {dashboard.isPending
                  ? Array.from({ length: 4 }, (_, i) => (
                      <KpiCard key={`sk-${i}`} label="" value="" icon="mdi:chart-line" loading />
                    ))
                  : d && (
                      <>
                        <KpiCard
                          label="سود خالص این ماه"
                          value={formatRialCompact(d.month_revenue)}
                          title={formatRial(d.month_revenue)}
                          icon="mdi:calendar-month"
                          color="#2563eb"
                          end={<DeltaChip value={pctChange(d.month_revenue, d.prev_month_revenue)} suffix="ماه قبل" />}
                        />
                        <KpiCard
                          label="هزینهٔ ۳۰ روز"
                          value={formatRialCompact(d.expenses)}
                          title={formatRial(d.expenses)}
                          icon="mdi:cash-minus"
                          color="#d97706"
                        />
                        <KpiCard
                          label="اشغال امروز"
                          value={formatPct(d.occupancy_today)}
                          sub={`${faNum(d.bookings_today)} رزرو امروز`}
                          icon="mdi:gauge"
                          color="#0891b2"
                        />
                        <KpiCard
                          label="در انتظار پرداخت"
                          value={toPersianDigits(d.pending_payment_bookings)}
                          sub={`لغو در بازه: ${faNum(d.cancelled_bookings)}`}
                          icon="mdi:clock-alert-outline"
                          color="#b45309"
                        />
                      </>
                    )}
              </div>

              {/* نیاز به رسیدگی — فقط وقتی چیزی هست */}
              {attention.length > 0 && (
                <div className="mt-3">
                  <SectionCard title="نیازمند رسیدگی" icon="mdi:alert-decagram-outline" color="#b45309" dense>
                    <ul className="divide-y divide-border">
                      {attention.map((row) => (
                        <li key={row.label} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <Icon icon={row.icon} aria-hidden="true" className="h-4 w-4 shrink-0" style={{ color: row.color }} />
                            <span className="truncate text-[0.76rem] text-foreground">{row.label}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-[0.76rem] font-bold tabular-nums text-foreground">{row.value}</span>
                            <Link
                              to={row.to}
                              className="inline-flex min-h-11 items-center rounded-lg border border-border px-2 text-[0.68rem] font-semibold text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {row.cta}
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                </div>
              )}

              {/* میان‌برهای عملیاتی */}
              {quickAccess}

              {/* روند ۳۰ روز */}
              <div className="mt-3">
                <SectionCard
                  title="روند درآمد و هزینه (۳۰ روز)"
                  icon="mdi:chart-area"
                  color="#059669"
                  action={
                    series.data ? (
                      <span className="text-[0.68rem] text-muted-foreground">
                        خالص: {formatRialCompact(series.data.total_net)}
                      </span>
                    ) : undefined
                  }
                >
                  {series.isPending ? (
                    <LoadingBox text="در حال دریافت روند..." />
                  ) : series.isError ? (
                    <ErrorBox
                      message={extractError(series.error, 'خطا در دریافت روند درآمد')}
                      onRetry={() => series.refetch()}
                    />
                  ) : dayPoints.length === 0 ? (
                    <EmptyBox icon="mdi:chart-line-variant" title="داده‌ای در این بازه نیست" />
                  ) : (
                    <div dir="rtl" className="flex h-[216px] flex-col sm:h-[266px]">
                      <div className="mb-1 flex items-center justify-end gap-3 text-[0.64rem] font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-500" />
                          درآمد
                        </span>
                        <span className="flex items-center gap-1">
                          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-red-500" />
                          هزینه
                        </span>
                      </div>
                      <div className="min-h-0 flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dayPoints} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="venueWsIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                              </linearGradient>
                              <linearGradient id="venueWsExpense" x1="0" y1="0" x2="0" y2="1">
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
                            <Area type="monotone" dataKey="income" name="درآمد" stroke="#059669" strokeWidth={2} fill="url(#venueWsIncome)" />
                            <Area type="monotone" dataKey="expense" name="هزینه" stroke="#ef4444" strokeWidth={2} fill="url(#venueWsExpense)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* آخرین تراکنش‌ها */}
              <div className="mt-3">
                <SectionCard
                  title="آخرین تراکنش‌ها"
                  icon="mdi:book-ledger-outline"
                  color="#2563eb"
                  dense
                  action={
                    <Link
                      to={`/finance/transactions?venue_id=${venueId}`}
                      className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border px-2 text-[0.68rem] font-semibold text-primary transition-colors hover:bg-muted"
                    >
                      همهٔ تراکنش‌ها
                      <Icon icon="mdi:chevron-left" aria-hidden="true" className="h-3.5 w-3.5" />
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
                    <EmptyBox icon="mdi:book-open-page-variant-outline" title="تراکنشی برای این سالن ثبت نشده" />
                  ) : (
                    <ul className="divide-y divide-border">
                      {recent.data?.items.map((tx) => {
                        const isIncome = tx.direction === 'income'
                        return (
                          <li key={tx.id} className="flex items-start justify-between gap-2 py-2 first:pt-0 last:pb-0">
                            <div className="min-w-0">
                              <p className="truncate text-[0.76rem] font-semibold text-foreground">
                                {labelOf(TX_TYPE_LABELS, tx.type)}
                                {tx.counterparty_name ? ` — ${tx.counterparty_name}` : ''}
                              </p>
                              <p className="mt-0.5 truncate text-[0.64rem] text-muted-foreground">
                                {formatJalaliDateTime(tx.occurred_at)} • {labelOf(TX_METHOD_LABELS, tx.method)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {tx.status !== 'cleared' && (
                                <StatusChip
                                  label={labelOf(TX_STATUS_LABELS, tx.status)}
                                  color={TX_STATUS_COLORS[tx.status] ?? '#64748b'}
                                />
                              )}
                              <span
                                className={
                                  isIncome
                                    ? 'text-[0.76rem] font-bold tabular-nums text-emerald-700 dark:text-emerald-400'
                                    : 'text-[0.76rem] font-bold tabular-nums text-red-600 dark:text-red-400'
                                }
                              >
                                {isIncome ? '+' : '−'}
                                {formatRialCompact(tx.amount)}
                              </span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </SectionCard>
              </div>
            </>
          )}
        </main>
      </div>
    </Layout>
  )
}

export default VenueWorkspace
