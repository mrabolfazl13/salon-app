// frontend/src/components/pricing/CouponRedemptionsDialog.tsx
// «چه کسی این کد را مصرف کرده؟» — ردیف‌های مصرف تا راند ۲۵ نوشته می‌شدند ولی
// هیچ‌جا خوانده نمی‌شدند (گرهٔ C13.3.2): مدیر فقط شمارندۀ `uses_count` را می‌دید.
// راند ۲۷ (C22.1): لغوِ رزروِ پرداخت‌نشده ردیف را از بین نمی‌برد؛ ردیف با
// `status: 'RELEASED'` می‌ماند، پس این فهرست تاریخچۀ کامل است و «لغوشده» برچسب دارد.
// راند ۲۸ (C22.3/C24.1/C24.2): صفحۀ واقعی با «ادامه»، صافیِ وضعیت در سمتِ سرور،
// و سرجمعِ «زنده در برابرِ برگشتی» که کلِ کوپن را می‌پاید نه فقط این صفحه را.

import React from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'

import { ErrorBox, LoadingBox, extractError, formatRial } from '@/components/finance/shared'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'
import { useCouponRedemptions } from '@/hooks/usePricing'
import type { Coupon, RedemptionStatus } from '@/services/coupons'

interface Props {
  open: boolean
  coupon: Coupon | null
  onClose: () => void
}

const PAGE_SIZE = 25

type Filter = 'ALL' | RedemptionStatus

const CouponRedemptionsDialog: React.FC<Props> = ({ open, coupon, onClose }) => {
  const [filter, setFilter] = React.useState<Filter>('ALL')
  const [offset, setOffset] = React.useState(0)

  // کوپنِ دیگر یا بازِ شدنِ دوباره: از صفحۀ اول و «همه» شروع کن
  React.useEffect(() => {
    setFilter('ALL')
    setOffset(0)
  }, [coupon?.id, open])

  const params = React.useMemo(
    () => ({ limit: PAGE_SIZE, offset, ...(filter === 'ALL' ? {} : { status: filter }) }),
    [offset, filter],
  )
  const query = useCouponRedemptions(open ? coupon : null, params)
  const page = query.data
  const rows = page?.items ?? []
  const stats = page?.stats
  const shown = rows.length
  const total = page?.total ?? 0
  const hasMore = offset + shown < total

  const pick = (next: Filter) => {
    setFilter(next)
    setOffset(0)
  }

  const chips: Array<{ key: Filter; label: string; count: number }> = [
    { key: 'ALL', label: 'همه', count: stats?.total_count ?? 0 },
    { key: 'ACTIVE', label: 'زنده', count: stats?.active_count ?? 0 },
    { key: 'RELEASED', label: 'لغوشده', count: stats?.released_count ?? 0 },
  ]

  return (
    <Dialog
      aria-label="مصرف‌های کد تخفیف"
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: '20px', overflow: 'hidden' } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Icon icon="mdi:ticket-percent-outline" className="h-5 w-5" style={{ color: '#db2777' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            مصرف‌های کد {coupon?.code ?? ''}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {coupon ? `سقف ${coupon.max_uses == null ? 'نامحدود' : toPersianDigits(coupon.max_uses)} مصرف · ` : ''}
            تخفیفِ زنده: {formatRial(stats?.active_discount ?? 0)}
            {(stats?.released_discount ?? 0) > 0 &&
              ` · برگشتیِ لغو: ${formatRial(stats?.released_discount ?? 0)}`}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="بستن" sx={{ alignSelf: 'flex-start' }}>
          <Icon icon="mdi:close" className="h-5 w-5" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }} role="group" aria-label="صافیِ مصرف‌ها">
          {chips.map((c) => (
            <Chip
              key={c.key}
              size="small"
              label={`${c.label} ${toPersianDigits(c.count)}`}
              color={filter === c.key ? 'primary' : 'default'}
              variant={filter === c.key ? 'filled' : 'outlined'}
              onClick={() => pick(c.key)}
              sx={{ borderRadius: '10px', fontWeight: 700, minHeight: 32 }}
            />
          ))}
        </Box>

        {query.isPending ? (
          <LoadingBox text="در حال دریافت مصرف‌ها..." />
        ) : query.isError ? (
          <ErrorBox
            message={extractError(query.error, 'خطا در دریافت مصرف‌های کد')}
            onRetry={() => query.refetch()}
          />
        ) : rows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Icon icon="mdi:account-clock-outline" className="h-8 w-8" style={{ color: '#94a3b8' }} />
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
              {filter === 'ALL'
                ? 'هنوز کسی این کد را مصرف نکرده است'
                : filter === 'ACTIVE'
                  ? 'مصرفِ زنده‌ای ثبت نشده است'
                  : 'مصرفِ لغوشده‌ای ثبت نشده است'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              هر رزروِ موفق با این کد، یک ردیف با نام کاربر و مبلغ تخفیف می‌سازد.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" aria-label="فهرست مصرف‌ها">
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableCell scope="col" sx={{ fontWeight: 700 }}>کاربر</TableCell>
                  <TableCell scope="col" sx={{ fontWeight: 700 }}>زمان مصرف</TableCell>
                  <TableCell scope="col" sx={{ fontWeight: 700 }}>تخفیف</TableCell>
                  <TableCell scope="col" sx={{ fontWeight: 700 }}>رزرو</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const releasedRow = r.status === 'RELEASED'
                  return (
                  <TableRow
                    key={r.id}
                    sx={{
                      bgcolor: releasedRow ? 'rgba(100,116,139,0.05)' : undefined,
                      '&:hover': { bgcolor: 'rgba(219,39,119,0.03)' },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {r.user_full_name || '—'}
                      </Typography>
                      <Typography
                        variant="caption"
                        dir="ltr"
                        sx={{ display: 'block', color: 'text.secondary', fontFamily: 'ui-monospace, monospace' }}
                      >
                        {r.user_phone ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatJalaliDateTime(r.created_at)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          color: releasedRow ? 'text.secondary' : '#db2777',
                          textDecoration: releasedRow ? 'line-through' : undefined,
                        }}
                      >
                        {formatRial(r.amount_discounted)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {r.booking_id == null ? (
                          <Chip
                            size="small"
                            label="در انتظار تأیید"
                            sx={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, bgcolor: 'rgba(245,158,11,0.12)', color: '#b45309' }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            icon={<Icon icon="mdi:clipboard-check-outline" />}
                            label={`رزرو ${toPersianDigits(r.booking_id)}`}
                            sx={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 }}
                          />
                        )}
                        {releasedRow && (
                          <Chip
                            size="small"
                            icon={<Icon icon="mdi:bookmark-off-outline" />}
                            label="لغوشده"
                            title={r.released_at ? `لغو در ${formatJalaliDateTime(r.released_at)}` : undefined}
                            sx={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, bgcolor: 'rgba(100,116,139,0.14)', color: '#475569' }}
                          />
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {total > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }} aria-live="polite">
              {toPersianDigits(Math.min(offset + 1, total))}–{toPersianDigits(offset + shown)}
              {' '}از {toPersianDigits(total)} ردیف
              {query.isPlaceholderData ? ' · در حال بارگذاری…' : ''}
            </Typography>
            {offset > 0 && (
              <Button
                size="small"
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                startIcon={<Icon icon="mdi:chevron-right" className="h-4 w-4" />}
              >
                قبلی
              </Button>
            )}
            {hasMore && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => setOffset(offset + PAGE_SIZE)}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                startIcon={<Icon icon="mdi:chevron-left" className="h-4 w-4" />}
              >
                ادامه
              </Button>
            )}
          </Box>
        )}
        <Typography variant="caption" sx={{ display: 'block', mt: rows.length ? 1.5 : 0, color: 'text.secondary' }}>
          رزروی که پیش از پرداخت لغو شود ظرفیت کد را برمی‌گرداند، اما ردیفش با برچسب
          «لغوشده» در همین تاریخچه می‌ماند و در «تخفیفِ زنده» شمرده نمی‌شود. سرجمع‌های
          بالای همین پنجره کلِ کد را می‌پایند، نه فقط صفحۀ جاری را.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          variant="outlined"
          sx={{ borderRadius: '10px', textTransform: 'none', mr: 'auto' }}
          startIcon={<Icon icon="mdi:refresh" className="h-4 w-4" />}
        >
          تازه‌سازی
        </Button>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', px: 3, fontWeight: 700, background: 'linear-gradient(135deg, #db2777, #f472b6)' }}>
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CouponRedemptionsDialog
