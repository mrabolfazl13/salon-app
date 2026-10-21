// frontend/src/components/pricing/CouponsTab.tsx
// کدهای تخفیف — CRUD با دامنه سالن/سراسری، نمایش شمارنده مصرف (uses_count)
// و بازکردنِ خودِ ردیف‌های مصرف («چه کسی این کد را مصرف کرده»).

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'

import ConfirmModal from '@/components/modals/ConfirmModal'
import { EmptyBox, ErrorBox, LoadingBox, SectionCard, extractError, formatRial } from '@/components/finance/shared'
import { formatJalaliDate, toPersianDigits } from '@/lib/jalali'
import { useAuthStore } from '@/store/authStore'
import { useCoupons, useCreateCoupon, useDisableCoupon, useUpdateCoupon } from '@/hooks/usePricing'
import type { Coupon, CouponCreatePayload, CouponUpdatePayload } from '@/services/coupons'
import CouponDialog from './CouponDialog'
import CouponRedemptionsDialog from './CouponRedemptionsDialog'
import type { FinanceVenue } from '@/hooks/useFinance'
import { Button } from '@/components/ui/shadcn/button'
import { Switch } from '@/components/ui/shadcn/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'

interface Props {
  venues: FinanceVenue[]
  venueId: number | null
}

const scopeLabel = (ven: FinanceVenue[], venueId: number | null) =>
  venueId == null ? 'همه سالن‌های من' : ven.find((v) => v.id === venueId)?.name ?? `سالن #${toPersianDigits(venueId)}`

const CouponValueLabel: React.FC<{ c: Coupon }> = ({ c }) => {
  if (c.discount_type === 'percent') {
    return (
      <span className="inline-flex items-center rounded-lg bg-pink-600/10 px-2 py-0.5 text-xs font-extrabold text-pink-700 dark:bg-pink-400/15 dark:text-pink-300">
        {toPersianDigits(Math.round(c.value / 100))}٪
      </span>
    )
  }
  return <span className="text-sm font-extrabold text-pink-700 tabular-nums dark:text-pink-300">{formatRial(c.value)}</span>
}

const CouponsTab: React.FC<Props> = ({ venues, venueId }) => {
  const user = useAuthStore((s) => s.user)
  const isSuper = user?.role === 'super_admin'

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [disableTarget, setDisableTarget] = useState<Coupon | null>(null)
  const [redemptionsFor, setRedemptionsFor] = useState<Coupon | null>(null)

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
          size="sm"
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
          className="bg-gradient-to-br from-pink-600 to-pink-400 font-bold text-white hover:from-pink-700 hover:to-pink-500"
        >
          <Icon icon="mdi:plus" className="h-4 w-4" aria-hidden="true" />
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
        <div className="overflow-hidden rounded-xl border border-border">
          <Table aria-label="کدهای تخفیف" className="min-w-[780px]">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead scope="col" className="font-bold">کد</TableHead>
                <TableHead scope="col" className="font-bold">تخفیف</TableHead>
                <TableHead scope="col" className="font-bold">دامنه</TableHead>
                <TableHead scope="col" className="font-bold">مصرف</TableHead>
                <TableHead scope="col" className="font-bold">اعتبار</TableHead>
                <TableHead scope="col" className="font-bold">فعال</TableHead>
                <TableHead scope="col" className="text-center font-bold">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => {
                const exhausted = c.max_uses != null && c.uses_count >= c.max_uses
                return (
                  <TableRow
                    key={c.id}
                    className={`hover:bg-pink-600/[0.03] ${!c.is_active || exhausted ? 'opacity-60' : ''}`}
                  >
                    <TableCell>
                      <span dir="auto" className="text-sm font-extrabold text-foreground [font-family:ui-monospace,monospace]">
                        {c.code}
                      </span>
                    </TableCell>
                    <TableCell><CouponValueLabel c={c} /></TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex max-w-[140px] items-center truncate rounded-lg px-2 py-0.5 text-xs font-semibold ${
                          c.venue_id == null
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {c.venue_id == null ? 'سراسری' : venueName(c.venue_id)}
                      </span>
                      {c.min_booking_amount ? (
                        <span className="mt-1 block text-xs text-muted-foreground tabular-nums">
                          از {formatRial(c.min_booking_amount)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`text-sm font-bold tabular-nums ${
                            exhausted ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {toPersianDigits(c.uses_count)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {c.max_uses != null ? `/ ${toPersianDigits(c.max_uses)}` : 'از سقف نامحدود'}
                        </span>
                      </div>
                      {c.per_user_limit != null ? (
                        <span className="block text-xs text-muted-foreground">هر کاربر {toPersianDigits(c.per_user_limit)}×</span>
                      ) : (
                        <span className="block text-xs text-muted-foreground">هر کاربر نامحدود</span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRedemptionsFor(c)}
                        className="-ms-3 h-11 px-3 text-pink-700 hover:bg-pink-600/10 hover:text-pink-800 dark:text-pink-300 dark:hover:text-pink-200"
                      >
                        <Icon icon="mdi:account-clock-outline" className="h-4 w-4" aria-hidden="true" />
                        مصرف‌ها
                      </Button>
                    </TableCell>
                    <TableCell>
                      {(c.valid_from || c.valid_until) ? (
                        <span className="whitespace-nowrap text-sm font-medium text-muted-foreground tabular-nums">
                          {c.valid_from ? formatJalaliDate(c.valid_from.slice(0, 10)) : 'از ابتدا'}
                          {' — '}
                          {c.valid_until ? formatJalaliDate(c.valid_until.slice(0, 10)) : 'بدون انقضا'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center whitespace-nowrap rounded-lg bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          بدون محدودیت زمانی
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={c.is_active}
                        disabled={updateCoupon.isPending}
                        aria-label={c.is_active ? 'غیرفعال کردن کد تخفیف' : 'فعال کردن کد تخفیف'}
                        onCheckedChange={(checked) => {
                          updateCoupon.mutate(
                            { couponId: c.id, data: { is_active: checked } },
                            {
                              onSuccess: () => toast.success(checked ? 'کد فعال شد' : 'کد غیرفعال شد'),
                              onError: (err) => toast.error(extractError(err, 'خطا در تغییر وضعیت')),
                            },
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditing(c); setDialogOpen(true) }}
                          className="font-semibold"
                        >
                          <Icon icon="mdi:pencil-outline" className="h-4 w-4" aria-hidden="true" />
                          ویرایش
                        </Button>
                        {c.is_active && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDisableTarget(c)}
                            className="text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Icon icon="mdi:cancel-variant" className="h-4 w-4" aria-hidden="true" />
                            غیرفعال‌سازی
                          </Button>
                        )}
                        {exhausted && (
                          <span className="inline-flex items-center rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                            سقف مصرف پر شده
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
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

      <CouponRedemptionsDialog
        open={redemptionsFor != null}
        coupon={redemptionsFor}
        onClose={() => setRedemptionsFor(null)}
      />

      <ConfirmModal
        open={disableTarget != null}
        onOpenChange={(o) => !o && setDisableTarget(null)}
        title="غیرفعال‌سازی کد تخفیف"
        description={disableTarget ? `کد «${disableTarget.code}» غیرفعال می‌شود؛ ردیف‌های مصرف‌شده برای ممیزی حفظ می‌مانند.` : ''}
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
