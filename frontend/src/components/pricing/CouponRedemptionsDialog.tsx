// frontend/src/components/pricing/CouponRedemptionsDialog.tsx
// «چه کسی این کد را مصرف کرده؟» — ردیف‌های مصرف تا راند ۲۵ نوشته می‌شدند ولی
// هیچ‌جا خوانده نمی‌شدند (گرهٔ C13.3.2): مدیر فقط شمارندۀ `uses_count` را می‌دید.
// سطح: مصرف‌های *جاری* — رزروِ پرداخت‌نشده‌ای که لغو شود ردیفش حذف می‌شود.

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
import type { Coupon } from '@/services/coupons'

interface Props {
  open: boolean
  coupon: Coupon | null
  onClose: () => void
}

const PAGE_LIMIT = 200

const CouponRedemptionsDialog: React.FC<Props> = ({ open, coupon, onClose }) => {
  const query = useCouponRedemptions(open ? coupon : null)
  const rows = query.data ?? []
  const totalDiscounted = rows.reduce((sum, r) => sum + r.amount_discounted, 0)

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
            مجموع تخفیفِ این فهرست: {formatRial(totalDiscounted)}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="بستن" sx={{ alignSelf: 'flex-start' }}>
          <Icon icon="mdi:close" className="h-5 w-5" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
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
              هنوز کسی این کد را مصرف نکرده است
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
                {rows.map((r) => (
                  <TableRow key={r.id} sx={{ '&:hover': { bgcolor: 'rgba(219,39,119,0.03)' } }}>
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
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#db2777' }}>
                        {formatRial(r.amount_discounted)}
                      </Typography>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {rows.length >= PAGE_LIMIT && (
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            تنها {toPersianDigits(PAGE_LIMIT)} مصرفِ اخیر نمایش داده می‌شود.
          </Typography>
        )}
        <Typography variant="caption" sx={{ display: 'block', mt: rows.length ? 1.5 : 0, color: 'text.secondary' }}>
          رزروی که پیش از پرداخت لغو شود آزاد می‌گردد و ردیفش از این فهرست می‌رود؛ مصرفِ
          پرداخت‌شده باقی می‌ماند.
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
