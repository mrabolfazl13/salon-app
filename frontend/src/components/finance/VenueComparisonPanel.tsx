// frontend/src/components/finance/VenueComparisonPanel.tsx
// C6/P007 — «مقایسهٔ سالن‌ها»: یک ردیف به ازای هر سالنِ دامنه، با خالص، تغییر نسبت به
// بازهٔ قبلیِ هم‌طول، سهم از درآمد، اشغال و نرخ لغو.
// دو قانونی که این کامپوننت باید بشکند اگر اشتباه شود:
// ۱) هیچ عددی اینجا محلی ساخته نمی‌شود — rank/share/net_change همه از سرور می‌آیند.
// ۲) فقدان داده «—» است نه صفر؛ سالنی که رزروی ندارد میانگینِ ۰ ریال ندارد.

import React from 'react'
import { useVenueComparison } from '@/hooks/useFinance'
import type { VenueComparisonRow } from '@/services/finance'
import {
  EmptyBox,
  ErrorBox,
  LoadingBox,
  StatusChip,
  SectionCard,
  extractError,
  formatPct,
  formatRial,
  useAboveSm,
} from './shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/shadcn/table'
import { toJalaliDisplay, toPersianDigits } from '@/lib/jalali'

interface Props {
  scope: { venue_id?: number; from?: string; to?: string }
}

const DeltaChip: React.FC<{ value: number }> = ({ value }) => (
  <StatusChip
    label={`${value >= 0 ? '▲' : '▼'} ${formatRial(Math.abs(value))}`}
    color={value >= 0 ? '#059669' : '#dc2626'}
  />
)

const ShareBar: React.FC<{ pct: number }> = ({ pct }) => (
  <div dir="rtl" data-testid="share-bar" className="flex items-center gap-2">
    <div className="h-1.5 max-w-[90px] flex-1 rounded-full bg-blue-600/[0.12]">
      <div
        className="h-full rounded-full bg-blue-600"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
    <span className="text-xs font-bold tabular-nums text-muted-foreground">
      {formatPct(pct)}
    </span>
  </div>
)

const VenueName: React.FC<{ row: VenueComparisonRow }> = ({ row }) => (
  <div className="flex min-w-0 items-center gap-2">
    <span
      data-testid={`rank-${row.venue_id}`}
      className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-lg px-1.5 text-[0.72rem] font-extrabold tabular-nums"
      style={
        row.rank === 1
          ? { backgroundColor: 'rgba(217,119,6,0.14)', color: '#b45309' }
          : { backgroundColor: 'rgba(100,116,139,0.12)', color: '#475569' }
      }
    >
      {toPersianDigits(row.rank)}
    </span>
    <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-foreground">
      {row.venue_name || `سالن #${toPersianDigits(row.venue_id)}`}
    </p>
  </div>
)

const VenueComparisonPanel: React.FC<Props> = ({ scope }) => {
  const query = useVenueComparison(scope)
  const isDesktop = useAboveSm()
  const data = query.data

  const headline = data
    ? `برترین: ${(data.rows[0]?.venue_name || '—')} • ${formatRial(data.rows[0]?.net ?? 0)}`
    : undefined

  return (
    <SectionCard
      title="مقایسهٔ سالن‌ها"
      icon="mdi:compare-horizontal"
      color="#2563eb"
      action={
        data ? (
          <span
            data-testid="comparison-venues"
            className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-xs font-bold text-foreground"
          >
            {`${toPersianDigits(data.totals.venues)} سالن`}
          </span>
        ) : undefined
      }
    >
      {query.isPending ? (
        <LoadingBox text="در حال دریافت مقایسه..." />
      ) : query.isError ? (
        <ErrorBox message={extractError(query.error, 'خطا در دریافت مقایسهٔ سالن‌ها')} onRetry={() => query.refetch()} />
      ) : (data?.rows.length ?? 0) === 0 ? (
        <EmptyBox icon="mdi:store-off-outline" title="سالنی در این دامنه نیست" text="پس از افزودن سالن یا تغییر بازه، مقایسه ساخته می‌شود." />
      ) : (
        <div>
          <div dir="rtl" className="mb-3 flex flex-wrap gap-2">
            <StatusChip label={`خالص دامنه: ${formatRial(data!.totals.net)}`} color={data!.totals.net >= 0 ? '#059669' : '#dc2626'} />
            <StatusChip label={`درآمد: ${formatRial(data!.totals.income)}`} color="#2563eb" />
            <StatusChip label={`هزینه: ${formatRial(data!.totals.expense)}`} color="#d97706" />
            <StatusChip label={`اشغال: ${formatPct(data!.totals.occupancy_rate)}`} color="#0891b2" />
            <StatusChip label={`رزرو: ${toPersianDigits(data!.totals.bookings)}`} color="#7c3aed" />
            {headline ? <StatusChip label={headline} color="#b45309" /> : null}
          </div>

          {isDesktop ? (
            <div
              role="region"
              aria-label="مقایسهٔ سالن‌ها، قابل پیمایش با کیبورد"
              tabIndex={0}
              className="max-h-[360px] overflow-auto rounded-xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Table aria-label="مقایسهٔ سالن‌ها">
                <TableHeader>
                  <TableRow>
                    {[
                      'سالن',
                      'خالص بازه',
                      'تغییر نسبت به بازهٔ قبل',
                      'سهم از درآمد',
                      'اشغال',
                      'رزرو / لغو',
                      'میانگین هر رزرو',
                      'مشتریان',
                    ].map((h) => (
                      <TableHead key={h} scope="col" className="whitespace-nowrap text-[0.78rem]">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.rows.map((r) => (
                    <TableRow key={r.venue_id}>
                      <TableCell><VenueName row={r} /></TableCell>
                      <TableCell>
                        <div
                          data-testid={`net-${r.venue_id}`}
                          dir="rtl"
                          className={`font-extrabold tabular-nums ${r.net >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}
                        >
                          {formatRial(r.net)}
                        </div>
                      </TableCell>
                      <TableCell><DeltaChip value={r.net_change} /></TableCell>
                      <TableCell><ShareBar pct={r.share_pct} /></TableCell>
                      <TableCell>
                        <p className="text-sm tabular-nums text-foreground">
                          {formatPct(r.occupancy_rate)}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {toPersianDigits(r.occupied_slots)}/{toPersianDigits(r.total_active_slots)} سانس
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm tabular-nums text-foreground">
                          {toPersianDigits(r.bookings)} / {toPersianDigits(r.cancelled)}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          لغو {formatPct(r.cancel_rate)}
                        </span>
                      </TableCell>
                      <TableCell data-testid={`avg-${r.venue_id}`} className="tabular-nums">
                        {formatRial(r.avg_per_booking)}
                      </TableCell>
                      <TableCell className="tabular-nums">{toPersianDigits(r.customers)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {data!.rows.map((r) => (
                <div
                  key={r.venue_id}
                  data-testid={`venue-card-${r.venue_id}`}
                  dir="rtl"
                  className="flex flex-col gap-1.5 rounded-xl border border-border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <VenueName row={r} />
                    <div
                      data-testid={`net-${r.venue_id}`}
                      className={`font-extrabold tabular-nums ${r.net >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}
                    >
                      {formatRial(r.net)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <DeltaChip value={r.net_change} />
                    <ShareBar pct={r.share_pct} />
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <span className="text-xs text-muted-foreground">
                      اشغال {formatPct(r.occupancy_rate)} ({toPersianDigits(r.occupied_slots)}/{toPersianDigits(r.total_active_slots)})
                    </span>
                    <span className="text-xs text-muted-foreground">
                      رزرو {toPersianDigits(r.bookings)} • لغو {formatPct(r.cancel_rate)}
                    </span>
                    <span className="text-xs text-muted-foreground" data-testid={`avg-${r.venue_id}`}>
                      میانگین هر رزرو: {formatRial(r.avg_per_booking)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-2 block text-xs text-muted-foreground" dir="rtl">
            بازهٔ مقایسه: {toJalaliDisplay(data!.prev_from_date)} تا {toJalaliDisplay(data!.prev_to_date)} •
            ردیف‌های باطل‌شده و بدون سالن در هیچ رقمی شمارش نمی‌شوند.
          </p>
        </div>
      )}
    </SectionCard>
  )
}

export default VenueComparisonPanel
