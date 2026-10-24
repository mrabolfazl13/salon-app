// frontend/src/components/pricing/CouponRedemptionsDialog.tsx
// «چه کسی این کد را مصرف کرده؟» — ردیف‌های مصرف تا راند ۲۵ نوشته می‌شدند ولی
// هیچ‌جا خوانده نمی‌شدند (گرهٔ C13.3.2): مدیر فقط شمارندۀ `uses_count` را می‌دید.
// راند ۲۷ (C22.1): لغوِ رزروِ پرداخت‌نشده ردیف را از بین نمی‌برد؛ ردیف با
// `status: 'RELEASED'` می‌ماند، پس این فهرست تاریخچۀ کامل است و «لغوشده» برچسب دارد.
// راند ۲۸ (C22.3/C24.1/C24.2): صفحۀ واقعی با «ادامه»، صافیِ وضعیت در سمتِ سرور،
// و سرجمعِ «زنده در برابرِ برگشتی» که کلِ کوپن را می‌پاید نه فقط این صفحه را.

import React from 'react'
import { Icon } from '@iconify/react'

import { ErrorBox, LoadingBox, extractError, formatRial } from '@/components/finance/shared'
import { formatJalaliDateTime, toPersianDigits } from '@/lib/jalali'
import { useCouponRedemptions } from '@/hooks/usePricing'
import type { Coupon, RedemptionStatus } from '@/services/coupons'
import { Button } from '@/components/ui/shadcn/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/shadcn/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'

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
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent aria-label="مصرف‌های کد تخفیف" aria-describedby={undefined} className="sm:max-w-[760px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-pink-400 text-white">
              <Icon icon="mdi:ticket-percent-outline" className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-extrabold text-foreground">
                مصرف‌های کد {coupon?.code ?? ''}
              </DialogTitle>
              <p className="mt-1 text-[0.68rem] text-muted-foreground tabular-nums">
                {coupon ? `سقف ${coupon.max_uses == null ? 'نامحدود' : toPersianDigits(coupon.max_uses)} مصرف · ` : ''}
                تخفیفِ زنده: {formatRial(stats?.active_discount ?? 0)}
                {(stats?.released_discount ?? 0) > 0 &&
                  ` · برگشتیِ لغو: ${formatRial(stats?.released_discount ?? 0)}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="صافیِ مصرف‌ها">
          {chips.map((c) => {
            const selected = filter === c.key
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={selected}
                onClick={() => pick(c.key)}
                className={`inline-flex h-11 min-w-11 items-center rounded-xl border px-3 text-[0.68rem] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selected
                    ? 'border-pink-600 bg-pink-600 text-white'
                    : 'border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                {`${c.label} ${toPersianDigits(c.count)}`}
              </button>
            )
          })}
        </div>

        {query.isPending ? (
          <LoadingBox text="در حال دریافت مصرف‌ها..." />
        ) : query.isError ? (
          <ErrorBox
            message={extractError(query.error, 'خطا در دریافت مصرف‌های کد')}
            onRetry={() => query.refetch()}
          />
        ) : rows.length === 0 ? (
          <div className="py-8 text-center">
            <Icon icon="mdi:account-clock-outline" className="h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="mt-2 text-[0.68rem] font-semibold text-foreground">
              {filter === 'ALL'
                ? 'هنوز کسی این کد را مصرف نکرده است'
                : filter === 'ACTIVE'
                  ? 'مصرفِ زنده‌ای ثبت نشده است'
                  : 'مصرفِ لغوشده‌ای ثبت نشده است'}
            </p>
            <p className="mt-1 text-[0.68rem] text-muted-foreground">
              هر رزروِ موفق با این کد، یک ردیف با نام کاربر و مبلغ تخفیف می‌سازد.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <Table aria-label="فهرست مصرف‌ها" className="min-w-[560px]">
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className="font-bold">کاربر</TableHead>
                  <TableHead scope="col" className="font-bold">زمان مصرف</TableHead>
                  <TableHead scope="col" className="font-bold">تخفیف</TableHead>
                  <TableHead scope="col" className="font-bold">رزرو</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const releasedRow = r.status === 'RELEASED'
                  return (
                    <TableRow
                      key={r.id}
                      className={`hover:bg-pink-600/[0.03] ${releasedRow ? 'bg-slate-500/[0.05]' : ''}`}
                    >
                      <TableCell>
                        <span className="block text-[0.68rem] font-bold text-foreground">
                          {r.user_full_name || '—'}
                        </span>
                        <span dir="ltr" className="block text-[0.68rem] text-muted-foreground [font-family:ui-monospace,monospace]">
                          {r.user_phone ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[0.68rem] text-muted-foreground tabular-nums">
                        {formatJalaliDateTime(r.created_at)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`whitespace-nowrap text-[0.68rem] font-extrabold tabular-nums ${
                            releasedRow ? 'text-muted-foreground line-through' : 'text-pink-700 dark:text-pink-300'
                          }`}
                        >
                          {formatRial(r.amount_discounted)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {r.booking_id == null ? (
                            <span className="inline-flex items-center rounded-lg bg-amber-500/15 px-2 py-0.5 text-[0.68rem] font-bold text-amber-800 dark:text-amber-300">
                              در انتظار تأیید
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-0.5 text-[0.68rem] font-semibold text-foreground">
                              <Icon icon="mdi:clipboard-check-outline" className="h-3.5 w-3.5" aria-hidden="true" />
                              {`رزرو ${toPersianDigits(r.booking_id)}`}
                            </span>
                          )}
                          {releasedRow && (
                            <span
                              title={r.released_at ? `لغو در ${formatJalaliDateTime(r.released_at)}` : undefined}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-500/15 px-2 py-0.5 text-[0.68rem] font-bold text-slate-700 dark:text-slate-300"
                            >
                              <Icon icon="mdi:bookmark-off-outline" className="h-3.5 w-3.5" aria-hidden="true" />
                              لغوشده
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

        {total > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.68rem] text-muted-foreground tabular-nums" aria-live="polite">
              {`${toPersianDigits(Math.min(offset + 1, total))}–${toPersianDigits(offset + shown)} از ${toPersianDigits(total)} ردیف`}
              {query.isPlaceholderData ? ' · در حال بارگذاری…' : ''}
            </p>
            {offset > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
                <Icon icon="mdi:chevron-right" className="h-4 w-4" aria-hidden="true" />
                قبلی
              </Button>
            )}
            {hasMore && (
              <Button size="sm" variant="outline" onClick={() => setOffset(offset + PAGE_SIZE)}>
                <Icon icon="mdi:chevron-left" className="h-4 w-4" aria-hidden="true" />
                ادامه
              </Button>
            )}
          </div>
        )}
        <p className={`text-[0.68rem] leading-relaxed text-muted-foreground ${rows.length ? 'mt-2' : ''}`}>
          رزروی که پیش از پرداخت لغو شود ظرفیت کد را برمی‌گرداند، اما ردیفش با برچسب
          «لغوشده» در همین تاریخچه می‌ماند و در «تخفیفِ زنده» شمرده نمی‌شود. سرجمع‌های
          بالای همین پنجره کلِ کد را می‌پایند، نه فقط صفحۀ جاری را.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <Icon icon="mdi:refresh" className="h-4 w-4" aria-hidden="true" />
            تازه‌سازی
          </Button>
          <Button
            onClick={onClose}
            className="bg-gradient-to-br from-pink-600 to-pink-400 font-bold text-white hover:from-pink-700 hover:to-pink-500"
          >
            بستن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CouponRedemptionsDialog
