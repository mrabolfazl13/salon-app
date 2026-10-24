// src/pages/manager/venues/VenuePicker.tsx
// گام اول جریان مدیریت: مدیر (یا کارمند) ابتدا سالن را انتخاب می‌کند، بعد وارد
// داشبورد همان سالن می‌شود. هر کارت یک «عکس فوری» ۳۰ روزه دارد تا انتخاب آگاهانه باشد.

import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'

import Layout from '@/components/layout/Layout'
import { ForbiddenPanel } from '@/components/crm/shared'
import { ErrorBox, LoadingBox, faNum, formatPct, formatRialCompact } from '@/components/finance/shared'
import { useVenueComparison } from '@/hooks/useFinance'
import { isForbiddenError, useManagedVenues, useStaffPermission } from '@/hooks/useStaffMe'
import { useAuthStore } from '@/store/authStore'
import { isoDaysAgo } from '@/pages/finance/FinanceScopeBar'
import { getTodayISO, toPersianDigits } from '@/lib/jalali'
import VenuePhoto from './VenuePhoto'

const RANK_STYLE: Record<number, { bg: string; color: string }> = {
  1: { bg: 'rgba(217,119,6,0.12)', color: '#92400e' },
  2: { bg: 'rgba(100,116,139,0.14)', color: '#475569' },
  3: { bg: 'rgba(180,83,9,0.12)', color: '#92400e' },
}

const StatBox: React.FC<{ label: string; value: string; tone?: 'default' | 'success' | 'danger' }> = ({
  label,
  value,
  tone = 'default',
}) => (
  <div className="min-w-0 rounded-lg bg-muted/50 px-1.5 py-1.5 sm:px-2">
    <p className="truncate text-[0.6rem] text-muted-foreground sm:text-[0.62rem]">{label}</p>
    <p
      className={
        tone === 'success'
          ? 'mt-0.5 whitespace-nowrap text-[0.7rem] font-bold tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-[0.78rem]'
          : tone === 'danger'
            ? 'mt-0.5 whitespace-nowrap text-[0.7rem] font-bold tabular-nums text-red-600 dark:text-red-400 sm:text-[0.78rem]'
            : 'mt-0.5 whitespace-nowrap text-[0.7rem] font-bold tabular-nums text-foreground sm:text-[0.78rem]'
      }
    >
      {value}
    </p>
  </div>
)

const VenuePicker: React.FC = () => {
  const venuesQuery = useManagedVenues()
  const venues = venuesQuery.data ?? []
  const financeAccess = useStaffPermission(['finance.view', 'reports.view'])
  // عملیات سانس/رزرو فقط در /manager-dashboard و فقط برای مالک است (بدون allowStaff)،
  // پس برای کارمند این لینک‌ها به /venues برمی‌گردند — نمایششان داده نمی‌شود (ممیزی F-01).
  const role = useAuthStore((s) => s.user?.role)
  const isOperator = role === 'venue_manager' || role === 'club_admin' || role === 'super_admin'

  const cardLinkCount = (financeAccess.allowed ? 1 : 0) + (isOperator ? 2 : 0)
  const cardLinkCols = cardLinkCount >= 3 ? 'grid-cols-3' : cardLinkCount === 2 ? 'grid-cols-2' : 'grid-cols-1'

  const to = getTodayISO()
  const from = isoDaysAgo(30)
  const comparison = useVenueComparison(
    { from, to },
    financeAccess.allowed && venues.length > 0,
  )
  const rowById = useMemo(
    () => new Map((comparison.data?.rows ?? []).map((row) => [row.venue_id, row])),
    [comparison.data],
  )
  const totals = comparison.data?.totals

  return (
    <Layout userRole="venue_manager">
      <div className="min-h-screen bg-gradient-to-b from-blue-50/70 to-background pb-10 dark:from-slate-950">
        <header className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#2563eb] to-violet-600 px-4 pb-12 pt-7 sm:px-6 md:px-8 md:pb-14">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 text-[0.68rem] font-semibold text-white">مرکز عملیات</p>
                <h1 className="text-xl font-extrabold text-white md:text-[1.7rem]">سالن‌های من</h1>
                <p className="mt-1 max-w-xl text-[0.72rem] leading-6 text-white">
                  سالنی را که می‌خواهید مدیریت کنید انتخاب کنید؛ داشبورد، رزروها، سانس‌ها و امور مالی
                  همان سالن یک‌جا باز می‌شود.
                </p>
              </div>
              {isOperator && (
                <Link
                  to="/manager-dashboard"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-white/30 bg-slate-950/25 px-3 py-1.5 text-[0.78rem] font-bold text-white transition-colors hover:bg-slate-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <Icon icon="mdi:view-dashboard-outline" aria-hidden="true" className="h-4 w-4" />
                  نمای کلی همه سالن‌ها
                </Link>
              )}
            </div>

            {financeAccess.allowed && totals && (
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/30 bg-slate-950/25 p-2.5 backdrop-blur">
                <div>
                  <p className="text-[0.6rem] text-white">سود خالص ۳۰ روز</p>
                  <p className="mt-0.5 truncate text-[0.9rem] font-extrabold tabular-nums text-white">
                    {formatRialCompact(totals.net)}
                  </p>
                </div>
                <div>
                  <p className="text-[0.6rem] text-white">رزروهای ۳۰ روز</p>
                  <p className="mt-0.5 text-[0.9rem] font-extrabold tabular-nums text-white">
                    {faNum(totals.bookings)}
                  </p>
                </div>
                <div>
                  <p className="text-[0.6rem] text-white">اشغال کل</p>
                  <p className="mt-0.5 text-[0.9rem] font-extrabold tabular-nums text-white">
                    {formatPct(totals.occupancy_rate)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="relative z-[2] mx-auto -mt-7 max-w-5xl px-3 sm:px-6">
          {venuesQuery.isPending ? (
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <LoadingBox text="در حال دریافت سالن‌ها..." />
            </div>
          ) : venuesQuery.isError ? (
            isForbiddenError(venuesQuery.error) ? (
              <ForbiddenPanel detail="شما به هیچ سالنی دسترسی ندارید." />
            ) : (
              <div className="rounded-2xl border border-border bg-card shadow-sm">
                <ErrorBox message="خطا در دریافت سالن‌ها" onRetry={() => venuesQuery.refetch()} />
              </div>
            )
          ) : venues.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10">
                <Icon icon="mdi:store-plus-outline" className="h-7 w-7" style={{ color: '#2563eb' }} />
              </div>
              <h2 className="text-base font-bold text-foreground">
                {isOperator ? 'هنوز سالنی ثبت نکرده‌اید' : 'هنوز سالنی به شما اختصاص نیافته است'}
              </h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                {isOperator
                  ? 'برای شروع، از پنل مدیریت سالن جدید اضافه کنید.'
                  : 'برای دریافت دسترسی به سانس‌ها و رزروها با مدیر سالن خود هماهنگ کنید.'}
              </p>
              {isOperator && (
                <Link
                  to="/manager-dashboard"
                  className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 px-4 text-sm font-bold text-white"
                >
                  <Icon icon="mdi:plus" aria-hidden="true" className="h-4 w-4" />
                  رفتن به پنل مدیریت
                </Link>
              )}
            </div>
          ) : (
            <>
              {comparison.isError && financeAccess.allowed && (
                <div className="mb-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2 text-[0.7rem] text-amber-800 dark:text-amber-300">
                  آمار زندهٔ سالن‌ها در دسترس نیست؛ کارت‌ها بدون عدد نمایش داده می‌شوند.
                </div>
              )}

              <div
                className={
                  venues.length === 1
                    ? 'mx-auto grid max-w-2xl grid-cols-1 gap-3'
                    : 'grid grid-cols-1 gap-3 lg:grid-cols-2'
                }
              >
                {venues.map((venue) => {
                  const row = rowById.get(venue.id)
                  const rankStyle = row ? RANK_STYLE[row.rank] : undefined
                  return (
                    <article
                      key={venue.id}
                      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex gap-3 p-3 sm:p-4">
                        <VenuePhoto
                          id={venue.id}
                          name={venue.name}
                          images={venue.images}
                          category={venue.category}
                          className="h-16 w-16 shrink-0 rounded-xl sm:h-[72px] sm:w-[72px]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h2 className="line-clamp-2 min-w-0 text-[0.92rem] font-extrabold leading-6 text-foreground sm:line-clamp-1">
                              {venue.name}
                            </h2>
                            {row && (
                              <span
                                className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.62rem] font-bold"
                                style={{ backgroundColor: rankStyle?.bg ?? 'rgba(37,99,235,0.1)', color: rankStyle?.color ?? '#2563eb' }}
                                title="رتبهٔ سود خالص میان سالن‌های شما"
                              >
                                <Icon icon="mdi:podium" aria-hidden="true" className="h-3 w-3" />
                                رتبهٔ {toPersianDigits(row.rank)}
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 flex items-center gap-1 truncate text-[0.68rem] text-muted-foreground">
                            <Icon icon="mdi:map-marker-outline" aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                            {venue.address || 'آدرس ثبت نشده'}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {venue.category && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[0.62rem] font-semibold text-muted-foreground">
                                <Icon
                                  icon={venue.category === 'gym' ? 'mdi:dumbbell' : 'mdi:soccer'}
                                  aria-hidden="true"
                                  className="h-3 w-3"
                                />
                                {venue.category === 'gym' ? 'بدنسازی' : 'فوتسال'}
                              </span>
                            )}
                            {venue.is_verified !== undefined && (
                              <span
                                className={
                                  venue.is_verified
                                    ? 'inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[0.62rem] font-semibold text-emerald-700 dark:text-emerald-400'
                                    : 'inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[0.62rem] font-semibold text-amber-800 dark:text-amber-400'
                                }
                              >
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

                      {financeAccess.allowed && (
                        <div className="grid grid-cols-3 gap-1.5 px-3 pb-3 sm:px-4">
                          <StatBox
                            label="سود ۳۰ روز"
                            value={row ? formatRialCompact(row.net) : '—'}
                            tone={row ? (row.net >= 0 ? 'success' : 'danger') : 'default'}
                          />
                          <StatBox label="اشغال" value={row ? formatPct(row.occupancy_rate) : '—'} />
                          <StatBox
                            label="رزرو / لغو"
                            value={row ? `${faNum(row.bookings)} / ${faNum(row.cancelled)}` : '—'}
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5 border-t border-border p-3 sm:flex-row sm:flex-wrap sm:items-center sm:px-4">
                        <Link
                          to={`/manager/venues/${venue.id}`}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 px-3 text-[0.78rem] font-bold text-white shadow-sm shadow-blue-600/20 transition-colors hover:from-blue-700 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Icon icon="mdi:view-dashboard" aria-hidden="true" className="h-4 w-4" />
                          ورود به داشبورد سالن
                        </Link>
                        {cardLinkCount > 0 && (
                          <div className={`grid ${cardLinkCols} gap-1.5 sm:contents`}>
                            {financeAccess.allowed && (
                              <Link
                                to={`/finance?venue_id=${venue.id}`}
                                className="inline-flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-border px-2 text-[0.72rem] font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <Icon icon="mdi:cash-multiple" aria-hidden="true" className="h-3.5 w-3.5" />
                                امور مالی
                              </Link>
                            )}
                            {isOperator && (
                              <>
                                <Link
                                  to={`/manager-dashboard?tab=1&venue=${venue.id}`}
                                  className="inline-flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-border px-2 text-[0.72rem] font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  <Icon icon="mdi:calendar-clock" aria-hidden="true" className="h-3.5 w-3.5" />
                                  سانس‌ها
                                </Link>
                                <Link
                                  to={`/manager-dashboard?tab=2&venue=${venue.id}`}
                                  className="inline-flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-border px-2 text-[0.72rem] font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  <Icon icon="mdi:calendar-check" aria-hidden="true" className="h-3.5 w-3.5" />
                                  رزروها
                                </Link>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>

              <p className="mt-4 text-center text-[0.66rem] text-muted-foreground">
                اعداد بر پایهٔ ۳۰ روز گذشته است؛ جزئیات هر سالن پس از ورود به داشبورد آن نمایش داده می‌شود.
              </p>
            </>
          )}
        </main>
      </div>
    </Layout>
  )
}

export default VenuePicker
