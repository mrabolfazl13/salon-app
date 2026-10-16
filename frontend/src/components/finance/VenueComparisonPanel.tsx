// frontend/src/components/finance/VenueComparisonPanel.tsx
// C6/P007 — «مقایسهٔ سالن‌ها»: یک ردیف به ازای هر سالنِ دامنه، با خالص، تغییر نسبت به
// بازهٔ قبلیِ هم‌طول، سهم از درآمد، اشغال و نرخ لغو.
// دو قانونی که این کامپوننت باید بشکند اگر اشتباه شود:
// ۱) هیچ عددی اینجا محلی ساخته نمی‌شود — rank/share/net_change همه از سرور می‌آیند.
// ۲) فقدان داده «—» است نه صفر؛ سالنی که رزروی ندارد میانگینِ ۰ ریال ندارد.

import React from 'react'
import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
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
  <Box dir="rtl" data-testid="share-bar" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(37,99,235,0.12)', maxWidth: 90 }}>
      <Box
        sx={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          height: '100%',
          borderRadius: 3,
          bgcolor: '#2563eb',
        }}
      />
    </Box>
    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
      {formatPct(pct)}
    </Typography>
  </Box>
)

const VenueName: React.FC<{ row: VenueComparisonRow }> = ({ row }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
    <Chip
      size="small"
      label={toPersianDigits(row.rank)}
      data-testid={`rank-${row.venue_id}`}
      sx={{
        borderRadius: '8px',
        fontWeight: 800,
        fontSize: '0.72rem',
        bgcolor: row.rank === 1 ? 'rgba(217,119,6,0.14)' : 'rgba(100,116,139,0.12)',
        color: row.rank === 1 ? '#b45309' : 'text.secondary',
      }}
    />
    <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {row.venue_name || `سالن #${toPersianDigits(row.venue_id)}`}
    </Typography>
  </Box>
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
          <Chip
            size="small"
            data-testid="comparison-venues"
            label={`${toPersianDigits(data.totals.venues)} سالن`}
            sx={{ borderRadius: '8px', fontWeight: 700 }}
          />
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
        <Box>
          <Box dir="rtl" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            <StatusChip label={`خالص دامنه: ${formatRial(data!.totals.net)}`} color={data!.totals.net >= 0 ? '#059669' : '#dc2626'} />
            <StatusChip label={`درآمد: ${formatRial(data!.totals.income)}`} color="#2563eb" />
            <StatusChip label={`هزینه: ${formatRial(data!.totals.expense)}`} color="#d97706" />
            <StatusChip label={`اشغال: ${formatPct(data!.totals.occupancy_rate)}`} color="#0891b2" />
            <StatusChip label={`رزرو: ${toPersianDigits(data!.totals.bookings)}`} color="#7c3aed" />
            {headline ? <StatusChip label={headline} color="#b45309" /> : null}
          </Box>

          {isDesktop ? (
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table aria-label="مقایسهٔ سالن‌ها" size="small" stickyHeader>
                <TableHead>
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
                      <TableCell key={h} scope="col" sx={{ fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data!.rows.map((r) => (
                    <TableRow key={r.venue_id} hover>
                      <TableCell><VenueName row={r} /></TableCell>
                      <TableCell>
                        <Box data-testid={`net-${r.venue_id}`} dir="rtl" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: r.net >= 0 ? 'success.dark' : 'error.dark' }}>
                          {formatRial(r.net)}
                        </Box>
                      </TableCell>
                      <TableCell><DeltaChip value={r.net_change} /></TableCell>
                      <TableCell><ShareBar pct={r.share_pct} /></TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatPct(r.occupancy_rate)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {toPersianDigits(r.occupied_slots)}/{toPersianDigits(r.total_active_slots)} سانس
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {toPersianDigits(r.bookings)} / {toPersianDigits(r.cancelled)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          لغو {formatPct(r.cancel_rate)}
                        </Typography>
                      </TableCell>
                      <TableCell data-testid={`avg-${r.venue_id}`}>
                        {formatRial(r.avg_per_booking)}
                      </TableCell>
                      <TableCell>{toPersianDigits(r.customers)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {data!.rows.map((r) => (
                <Box
                  key={r.venue_id}
                  data-testid={`venue-card-${r.venue_id}`}
                  dir="rtl"
                  sx={{ p: 1.25, borderRadius: '12px', border: '1px solid rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: 0.75 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <VenueName row={r} />
                    <Box data-testid={`net-${r.venue_id}`} sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: r.net >= 0 ? 'success.dark' : 'error.dark' }}>
                      {formatRial(r.net)}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                    <DeltaChip value={r.net_change} />
                    <ShareBar pct={r.share_pct} />
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      اشغال {formatPct(r.occupancy_rate)} ({toPersianDigits(r.occupied_slots)}/{toPersianDigits(r.total_active_slots)})
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      رزرو {toPersianDigits(r.bookings)} • لغو {formatPct(r.cancel_rate)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }} data-testid={`avg-${r.venue_id}`}>
                      میانگین هر رزرو: {formatRial(r.avg_per_booking)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }} dir="rtl">
            بازهٔ مقایسه: {toJalaliDisplay(data!.prev_from_date)} تا {toJalaliDisplay(data!.prev_to_date)} •
            ردیف‌های باطل‌شده و بدون سالن در هیچ رقمی شمارش نمی‌شوند.
          </Typography>
        </Box>
      )}
    </SectionCard>
  )
}

export default VenueComparisonPanel
