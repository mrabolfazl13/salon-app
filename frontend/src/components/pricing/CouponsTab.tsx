// frontend/src/components/pricing/CouponsTab.tsx
// کدهای تخفیف — CRUD با دامنه سالن/سراسری و نمایش شمارنده مصرف (uses_count).

import React, { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import ConfirmModal from '@/components/modals/ConfirmModal'
import { EmptyBox, ErrorBox, LoadingBox, SectionCard, extractError, formatRial } from '@/components/finance/shared'
import { formatJalaliDate, toPersianDigits } from '@/lib/jalali'
import { useAuthStore } from '@/store/authStore'
import { useCoupons, useCreateCoupon, useDisableCoupon, useUpdateCoupon } from '@/hooks/usePricing'
import type { Coupon, CouponCreatePayload, CouponUpdatePayload } from '@/services/coupons'
import CouponDialog from './CouponDialog'
import type { FinanceVenue } from '@/hooks/useFinance'

interface Props {
  venues: FinanceVenue[]
  venueId: number | null
}

const scopeLabel = (ven: FinanceVenue[], venueId: number | null) =>
  venueId == null ? 'همه سالن‌های من' : ven.find((v) => v.id === venueId)?.name ?? `سالن #${toPersianDigits(venueId)}`

const CouponValueLabel: React.FC<{ c: Coupon }> = ({ c }) => {
  if (c.discount_type === 'percent') {
    return (
      <Chip
        size="small"
        label={`${toPersianDigits(Math.round(c.value / 100))}٪`}
        sx={{ borderRadius: '8px', fontWeight: 800, bgcolor: 'rgba(219,39,119,0.1)', color: '#db2777' }}
      />
    )
  }
  return <Typography variant="body2" sx={{ fontWeight: 800, color: '#db2777' }}>{formatRial(c.value)}</Typography>
}

const CouponsTab: React.FC<Props> = ({ venues, venueId }) => {
  const user = useAuthStore((s) => s.user)
  const isSuper = user?.role === 'super_admin'

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [disableTarget, setDisableTarget] = useState<Coupon | null>(null)

  const couponsQuery = useCoupons(venueId)
  const createCoupon = useCreateCoupon()
  const updateCoupon = useUpdateCoupon()
  const disableCoupon = useDisableCoupon()

  const rows = couponsQuery.data ?? []

  const venueName = (id: number | null) => (id == null ? 'سراسری' : venues.find((v) => v.id === id)?.name ?? '—')

  const submit = (couponId: number | null, payloadCreate: CouponCreatePayload | null, payloadUpdate: CouponUpdatePayload | null) => {
    const close = () => {
      toast.success('کد تخفیف ذخیره شد ✅')
      setDialogOpen(false)
      setEditing(null)
    }
    const fail = (err: unknown) => toast.error(extractError(err, 'خطا در ذخیره کد تخفیف'))
    if (couponId != null && payloadUpdate) {
      updateCoupon.mutate({ couponId, data: payloadUpdate }, { onSuccess: close, onError: fail })
    } else if (payloadCreate) {
      createCoupon.mutate(payloadCreate, { onSuccess: close, onError: fail })
    }
  }

  return (
    <SectionCard
      title={`کدهای تخفیف — ${scopeLabel(venues, venueId)}`}
      icon="mdi:ticket-percent-outline"
      color="#db2777"
      action={
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #db2777, #f472b6)' }}
          startIcon={<Icon icon="mdi:plus" className="h-4 w-4" />}
        >
          کد جدید
        </Button>
      }
    >
      {couponsQuery.isPending ? (
        <LoadingBox text="در حال بارگذاری کدها..." />
      ) : couponsQuery.isError ? (
        <ErrorBox message="خطا در دریافت کدهای تخفیف" onRetry={() => couponsQuery.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyBox
          icon="mdi:ticket-percent-outline"
          title="هنوز کد تخفیفی نساخته‌اید"
          text="کدها در لحظه رزرو سمت سرور اعتبارسنجی می‌شوند؛ می‌توانید سقف استفاده و بازه اعتبار بگذارید."
        />
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 700 }}>کد</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>تخفیف</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>دامنه</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>مصرف</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>اعتبار</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>فعال</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((c) => {
                const exhausted = c.max_uses != null && c.uses_count >= c.max_uses
                return (
                  <TableRow key={c.id} sx={{ opacity: !c.is_active || exhausted ? 0.6 : 1, '&:hover': { bgcolor: 'rgba(219,39,119,0.03)' } }}>
                    <TableCell>
                      <Typography dir="auto" variant="body2" sx={{ fontWeight: 800, fontFamily: 'ui-monospace, monospace' }}>
                        {c.code}
                      </Typography>
                    </TableCell>
                    <TableCell><CouponValueLabel c={c} /></TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={c.venue_id == null ? 'سراسری' : venueName(c.venue_id)}
                        color={c.venue_id == null ? 'info' : 'default'}
                        sx={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, maxWidth: 140 }}
                      />
                      {c.min_booking_amount ? (
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}>
                          از {formatRial(c.min_booking_amount)}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell dir="rtl">
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'baseline' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: exhausted ? '#dc2626' : '#059669' }}>
                          {toPersianDigits(c.uses_count)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {c.max_uses != null ? `/ ${toPersianDigits(c.max_uses)}` : 'از سقف نامحدود'}
                        </Typography>
                      </Box>
                      {c.per_user_limit != null ? (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>هر کاربر {toPersianDigits(c.per_user_limit)}×</Typography>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>هر کاربر نامحدود</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {(c.valid_from || c.valid_until) ? (
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                          {c.valid_from ? formatJalaliDate(c.valid_from.slice(0, 10)) : 'از ابتدا'}
                          {' — '}
                          {c.valid_until ? formatJalaliDate(c.valid_until.slice(0, 10)) : 'بدون انقضا'}
                        </Typography>
                      ) : (
                        <Chip size="small" label="بدون محدودیت زمانی" sx={{ borderRadius: '8px', fontSize: '0.75rem' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        size="small"
                        checked={c.is_active}
                        disabled={updateCoupon.isPending}
                        onChange={(e) => {
                          updateCoupon.mutate(
                            { couponId: c.id, data: { is_active: e.target.checked } },
                            {
                              onSuccess: () => toast.success(e.target.checked ? 'کد فعال شد' : 'کد غیرفعال شد'),
                              onError: (err) => toast.error(extractError(err, 'خطا در تغییر وضعیت')),
                            },
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button size="small" onClick={() => { setEditing(c); setDialogOpen(true) }} sx={{ textTransform: 'none', fontWeight: 600 }} startIcon={<Icon icon="mdi:pencil-outline" className="h-4 w-4" />}>ویرایش</Button>
                      {c.is_active && (
                        <Button size="small" color="error" onClick={() => setDisableTarget(c)} sx={{ textTransform: 'none' }} startIcon={<Icon icon="mdi:cancel-variant" className="h-4 w-4" />}>غیرفعال‌سازی</Button>
                      )}
                      {exhausted && (
                        <Chip size="small" color="warning" label="سقف مصرف پر شده" sx={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }} />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CouponDialog
        open={dialogOpen}
        venueId={venueId}
        venues={venues}
        isSuper={isSuper}
        coupon={editing}
        saving={createCoupon.isPending || updateCoupon.isPending}
        onClose={() => {
          setDialogOpen(false)
          setEditing(null)
        }}
        onCreate={(p) => submit(null, p, null)}
        onUpdate={(couponId, p) => submit(couponId, null, p)}
      />

      <ConfirmModal
        open={disableTarget != null}
        onOpenChange={(o) => !o && setDisableTarget(null)}
        title="غیرفعال‌سازی کد تخفیف"
        description={disableTarget ? `کد «${disableTarget.code}» غیرفعال می‌شود؛ ردیف\u200cهای مصرف‌شده برای ممیزی حفظ می\u200cمانند.` : ''}
        confirmText="غیرفعال کن"
        variant="destructive"
        loading={disableCoupon.isPending}
        onConfirm={() => {
          if (!disableTarget) return
          disableCoupon.mutate(disableTarget.id, {
            onSuccess: () => {
              toast.success('کد غیرفعال شد')
              setDisableTarget(null)
            },
            onError: (err) => toast.error(extractError(err, 'خطا در غیرفعال‌سازی')),
          })
        }}
      />
    </SectionCard>
  )
}

export default CouponsTab