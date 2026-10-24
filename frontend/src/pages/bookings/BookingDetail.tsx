import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import ConfirmModal from '@/components/modals/ConfirmModal'
import BookingPaymentPanel from '@/components/bookings/BookingPaymentPanel'
import VenueThumb from '@/components/venue/VenueThumb'
import { bookingService } from '@/services/booking'
import { venueService } from '@/services/venue'
import { checkinService } from '@/services/checkin'
import type { PaymentItem } from '@/services/payment'
import {
  formatPrice,
  formatDateTime,
  formatDate,
  formatTimeFa,
  getSlotEndTime,
  getStatusLabel,
} from '@/lib/utils'
import { EmptyState } from '@/components/mobile'
import toast from 'react-hot-toast'
import PricingBreakdown, { normalizeBreakdown } from '@/components/deals/PricingBreakdown'
import { downloadIcsEvent } from '@/utils/calendar'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Badge } from '@/components/ui/shadcn/badge'
import { Button } from '@/components/ui/shadcn/button'
import { Separator } from '@/components/ui/shadcn/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog'

interface ApiBooking {
  id: number
  slot_id: number
  user_id: number
  booked_at: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_amount: number
  // اطلاعات تکمیلی (اختیاری؛ از بک‌اند ارسال می‌شود)
  venue_name?: string
  venue_images?: string[] | string
  slot_date?: string
  start_time?: string
  duration?: number
  // اجزای تخفیف سمت سرور — ریز قیمت پس از تأیید/ثبت
  discount_amount?: number
  coupon_code?: string | null
  loyalty_points_used?: number
  pricing_breakdown?: unknown
  // آخرین فاکتور پرداخت (از اندپوینت جزئیات رزرو)
  payment?: PaymentItem | null
  // روش پرداخت + فیلدهای کامل فیش واریزی
  payment_mode?: string | null
  needs_receipt?: boolean
  receipt_status?: string | null
  receipt_amount?: number | null
  receipt_reference?: string | null
  receipt_bank?: string | null
  receipt_image?: string | null
  receipt_submitted_at?: string | null
  receipt_reviewed_at?: string | null
  receipt_review_note?: string | null
}

type BadgeVariant = 'default' | 'primary' | 'success' | 'destructive' | 'outline' | 'muted'

const paymentStatusMeta: Record<string, { label: string; variant: BadgeVariant }> = {
  paid: { label: 'پرداخت شده', variant: 'success' },
  pending: { label: 'در انتظار پرداخت', variant: 'default' },
  failed: { label: 'ناموفق', variant: 'destructive' },
  refunded: { label: 'بازگشت وجه', variant: 'primary' },
}

/** رنگ آیکون فاکتور بر پایهٔ وضعیت پرداخت (جایگزین theme.palette.*.main) */
const PAYMENT_ICON_CLASS: Record<string, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  destructive: 'text-red-600 dark:text-red-400',
  primary: 'text-blue-600 dark:text-blue-400',
  default: 'text-amber-600 dark:text-amber-400',
}

/** نگاشت وضعیت رزرو → واریانت Badge (هم‌رنگ Chip قبلی) */
const statusBadgeVariant = (status: string): BadgeVariant => {
  if (status === 'confirmed') return 'success'
  if (status === 'completed') return 'primary'
  if (status === 'cancelled') return 'destructive'
  return 'default'
}

const BookingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [booking, setBooking] = useState<ApiBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [rebookBusy, setRebookBusy] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null)

  // باز کردن خودکار مودال لغو وقتی از یادآوری اومده
  useEffect(() => {
    if (searchParams.get('cancel') === 'true') {
      setCancelModalOpen(true)
      // پاک کردن query param برای جلوگیری از باز شدن مجدد در refresh
      navigate(`/bookings/${id}`, { replace: true })
    }
  }, [searchParams, id, navigate])

  // دریافت QR code بعد از لود رزرو
  useEffect(() => {
    if (booking && booking.status === 'confirmed' && !qrCodeData) {
      fetchQrCode()
    }
  }, [booking])

  const fetchQrCode = async () => {
    if (!booking || booking.status !== 'confirmed') return
    try {
      setCheckinLoading(true)
      const data = await checkinService.getQrCode(booking.id)
      setQrCodeData(data.check_in_code)
      if (data.checked_in_at) {
        setCheckedInAt(data.checked_in_at)
      }
    } catch (err) {
      // خطا را نادیده بگیر — ممکن است هنوز کد تولید نشده باشد
    } finally {
      setCheckinLoading(false)
    }
  }

  const fetchBooking = useCallback(async () => {
    setLoading(true)
    setNotFound(false)
    try {
      const data = await bookingService.getById(Number(id))
      if (data && data.id) {
        setBooking(data as ApiBooking)
      } else {
        setNotFound(true)
      }
    } catch (err) {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  const handleCancel = async () => {
    if (!booking) return
    setCancelling(true)
    try {
      await bookingService.cancel(booking.id)
      toast.success('رزرو با موفقیت لغو شد!')
      setCancelModalOpen(false)
      navigate('/bookings')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در لغو رزرو')
    } finally {
      setCancelling(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // افزودن به تقویم — .ics سمت کلاینت (بدون endpoint بک‌اند)
  const handleAddToCalendar = () => {
    if (!booking) return
    if (!booking.slot_date || !booking.start_time) {
      toast.error('اطلاعات زمانی این رزرو کامل نیست')
      return
    }
    downloadIcsEvent({
      bookingId: booking.id,
      venueName: booking.venue_name || `سالن #${booking.slot_id}`,
      date: booking.slot_date,
      time: String(booking.start_time).slice(0, 5),
      durationMinutes: booking.duration || 90,
      price: Number(booking.payment_amount) || undefined,
    })
    toast.success('فایل تقویم دانلود شد')
  }

  // رزرو دوباره — پاسخ بک‌اند venue_id ندارد؛ تطبیق با جست‌وجوی نام سالن و
  // ناوبری /venues/{id}?date=&time= (الگوی preselect لینک دیل در VenueDetail)
  const handleRebook = async () => {
    if (!booking) return
    if (!booking.slot_date || !booking.start_time || !booking.venue_name) {
      toast.error('اطلاعات سانس این رزرو کامل نیست')
      return
    }
    setRebookBusy(true)
    try {
      const results: any = await venueService.getAll({ search: booking.venue_name, limit: 50 })
      const list = Array.isArray(results) ? results : []
      const venue =
        list.find((v: any) => v.name === booking.venue_name) ??
        (list.length === 1 ? list[0] : null)
      if (!venue) {
        toast.error('سالن مورد نظر پیدا نشد — از فهرست سالن‌ها انتخاب کنید')
        navigate('/venues')
        return
      }
      const time = String(booking.start_time).slice(0, 5)
      navigate(`/venues/${venue.id}?date=${booking.slot_date}&time=${time}`)
    } catch {
      toast.error('خطا در آماده‌سازی رزرو دوباره')
    } finally {
      setRebookBusy(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('لینک در کلیپ‌بورد کپی شد!')
    } catch {
      toast.error('امکان کپی لینک وجود ندارد')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-6 md:py-8">
          <Skeleton aria-hidden="true" className="mb-4 h-12 rounded-lg" />
          <Skeleton aria-hidden="true" className="mb-4 h-[120px] rounded-lg" />
          <Skeleton aria-hidden="true" className="h-[260px] rounded-lg" />
        </div>
      </Layout>
    )
  }

  if (notFound || !booking) {
    return (
      <Layout>
        <EmptyState
          asPageHeading
          icon="mdi:calendar-search"
          title="رزرو یافت نشد"
          description="این رزرو حذف شده یا به حساب دیگری تعلق دارد."
          actionLabel="بازگشت به لیست رزروها"
          onAction={() => navigate('/bookings')}
        />
      </Layout>
    )
  }

  const timelineItems = [
    {
      label: 'رزرو ثبت شد',
      time: formatDateTime(booking.booked_at),
      status: 'completed',
    },
    {
      label: booking.status === 'confirmed' ? 'تایید شد' : 'در انتظار تایید',
      time: booking.status === 'confirmed' ? formatDateTime(booking.booked_at) : '—',
      status: booking.status === 'confirmed' ? 'completed' : 'pending',
    },
    {
      label: 'روز برگزاری',
      time: booking.slot_date
        ? `${formatDate(booking.slot_date)}، ${formatTimeFa(booking.start_time)}`
        : '—',
      status: 'pending',
    },
  ]

  return (
    <Layout>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-6 md:py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/bookings')}
          className="mb-4 min-h-9 font-semibold text-muted-foreground"
        >
          <Icon icon="mdi:arrow-right" className="h-5 w-5" />
          بازگشت به لیست رزروها
        </Button>

        {/* Header */}
        <div className="mb-4 rounded-lg border border-border bg-card p-4 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <VenueThumb
                images={booking.venue_images}
                name={booking.venue_name || `سالن #${booking.slot_id}`}
                size={44}
                radius={8}
              />
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {booking.venue_name || `سالن #${booking.slot_id}`}
                </h1>
                <p className="text-[0.68rem] text-muted-foreground">
                  رزرو #{booking.id}
                  {booking.slot_date &&
                    ` — ${formatDate(booking.slot_date)}، ${formatTimeFa(booking.start_time)} تا ${getSlotEndTime(booking.start_time || '', booking.duration || 90)}`}
                </p>
              </div>
            </div>
            <Badge
              variant={statusBadgeVariant(booking.status)}
              className="min-h-8 rounded-lg px-3 text-[0.68rem] font-semibold"
            >
              {getStatusLabel(booking.status)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Main Info */}
          <div className="md:col-span-8">
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-6">
              <h2 className="mb-4 text-sm font-bold text-foreground">جزئیات رزرو</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <span className="mb-1 block text-[0.68rem] text-muted-foreground">مبلغ پرداختی</span>
                  <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                    {formatPrice(booking.payment_amount)}
                  </p>
                </div>
                <div>
                  <span className="mb-1 block text-[0.68rem] text-muted-foreground">تاریخ ثبت</span>
                  <p className="text-[0.68rem] font-semibold text-foreground">
                    {formatDateTime(booking.booked_at)}
                  </p>
                </div>
                <div>
                  <span className="mb-1 block text-[0.68rem] text-muted-foreground">وضعیت</span>
                  <p className="text-[0.68rem] font-semibold text-foreground">
                    {getStatusLabel(booking.status)}
                  </p>
                </div>
              </div>

              {normalizeBreakdown(booking.pricing_breakdown) && (
                <div className="mt-4">
                  <PricingBreakdown
                    steps={normalizeBreakdown(booking.pricing_breakdown) ?? []}
                    payable={Number(booking.payment_amount) || null}
                  />
                </div>
              )}

              {/* اطلاعات فاکتور پرداخت */}
              {booking.payment && (() => {
                const meta = paymentStatusMeta[booking.payment.status] ?? { label: booking.payment.status, variant: 'default' as BadgeVariant }
                return (
                  <div className="mt-4 rounded-lg bg-foreground/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon={booking.payment.status === 'paid' ? 'mdi:check-decagram'
                            : booking.payment.status === 'refunded' ? 'mdi:restore'
                            : booking.payment.status === 'failed' ? 'mdi:alert-circle-outline'
                            : 'mdi:clock-outline'}
                          className={`h-5 w-5 ${PAYMENT_ICON_CLASS[meta.variant] ?? PAYMENT_ICON_CLASS.default}`}
                        />
                        <p className="text-[0.68rem] font-bold text-foreground">فاکتور پرداخت</p>
                      </div>
                      <Badge variant={meta.variant} className="rounded-lg px-2.5 py-1 text-[0.68rem] font-semibold">
                        {meta.label}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-6">
                      <div>
                        <span className="block text-[0.68rem] text-muted-foreground">مبلغ فاکتور</span>
                        <p className="text-[0.68rem] font-semibold text-foreground">{formatPrice(booking.payment.amount)}</p>
                      </div>
                      {booking.payment.paid_at && (
                        <div>
                          <span className="block text-[0.68rem] text-muted-foreground">زمان پرداخت</span>
                          <p className="text-[0.68rem] font-semibold text-foreground">{formatDateTime(booking.payment.paid_at)}</p>
                        </div>
                      )}
                      {booking.payment.card_pan && (
                        <div>
                          <span className="block text-[0.68rem] text-muted-foreground">کارت</span>
                          <p className="text-[0.68rem] font-semibold text-foreground" dir="ltr">**** {booking.payment.card_pan}</p>
                        </div>
                      )}
                      {booking.payment.transaction_id && (
                        <div>
                          <span className="block text-[0.68rem] text-muted-foreground">شناسه تراکنش</span>
                          <p className="text-[0.68rem] font-semibold text-foreground" dir="ltr">{booking.payment.transaction_id}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* QR Code Check-in */}
              {booking.status === 'confirmed' && (
                <>
                  <Separator className="my-6" />

                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-foreground">
                      کد ورود (Check-in)
                    </h2>
                    {checkedInAt && (
                      <Badge variant="success" className="gap-1.5 rounded-lg px-2.5 py-1 text-[0.68rem] font-semibold">
                        <Icon icon="mdi:check-circle" className="h-4 w-4" />
                        {`ورود ثبت شد: ${formatDateTime(checkedInAt)}`}
                      </Badge>
                    )}
                  </div>

                  {checkinLoading ? (
                    <Skeleton aria-hidden="true" className="h-20 rounded-lg" />
                  ) : qrCodeData ? (
                    <button
                      type="button"
                      aria-label="مشاهده کد حضور"
                      onClick={() => setQrDialogOpen(true)}
                      className="block w-full cursor-pointer appearance-none rounded-lg border-2 border-dashed border-blue-600 bg-indigo-500/5 p-6 text-center text-inherit transition-colors [font-family:inherit] hover:bg-indigo-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-blue-400 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/15"
                    >
                      <span className="block select-all font-mono text-3xl font-bold tracking-[0.2em] text-blue-600 dark:text-blue-400">
                        {qrCodeData}
                      </span>
                      <span className="mt-2 block text-[0.68rem] text-muted-foreground">
                        برای نمایش کد بزرگ کلیک کنید
                      </span>
                    </button>
                  ) : null}
                </>
              )}

              <Separator className="my-6" />

              <h2 className="mb-4 text-sm font-bold text-foreground">
                خط زمانی
              </h2>
              <div className="flex flex-col gap-3">
                {timelineItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span
                      className={
                        item.status === 'completed'
                          ? 'h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400'
                          : 'h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600'
                      }
                    />
                    <p className="flex-1 text-[0.68rem] font-semibold text-foreground">
                      {item.label}
                    </p>
                    <span className="text-[0.68rem] text-muted-foreground">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="md:col-span-4">
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-6">
              <h2 className="mb-4 text-sm font-bold text-foreground">
                عملیات
              </h2>
              <div className="flex flex-col gap-3">
                {(booking.payment_mode === 'bank_receipt' || booking.payment_mode === 'pay_in_place') && (
                  <BookingPaymentPanel booking={booking} onChanged={fetchBooking} />
                )}
                {(booking.status === 'confirmed' || booking.status === 'pending') && (
                  <Button
                    variant="outline"
                    onClick={() => setCancelModalOpen(true)}
                    className="min-h-9 justify-start border-red-500/40 font-semibold text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Icon icon="mdi:close-circle" className="h-5 w-5" />
                    لغو رزرو
                  </Button>
                )}
                <Button
                  onClick={handleRebook}
                  disabled={rebookBusy || !booking.slot_date}
                  className="min-h-9 font-extrabold"
                >
                  {rebookBusy ? (
                    <span
                      className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-current border-t-transparent"
                      role="status"
                      aria-label="در حال بارگذاری"
                    />
                  ) : (
                    <Icon icon="mdi:calendar-refresh" className="h-5 w-5" />
                  )}
                  رزرو دوباره
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  className="min-h-9 justify-start font-semibold"
                >
                  <Icon icon="mdi:printer" className="h-5 w-5" />
                  چاپ فاکتور
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddToCalendar}
                  disabled={!booking.slot_date || !booking.start_time}
                  className="min-h-9 justify-start font-semibold"
                >
                  <Icon icon="mdi:calendar-plus" className="h-5 w-5" />
                  افزودن به تقویم
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="min-h-9 justify-start font-semibold"
                >
                  <Icon icon="mdi:share" className="h-5 w-5" />
                  اشتراک‌گذاری
                </Button>
                <Button
                  variant="ghost"
                  onClick={fetchBooking}
                  className="min-h-9 justify-start font-semibold text-muted-foreground"
                >
                  <Icon icon="mdi:refresh" className="h-5 w-5" />
                  به‌روزرسانی
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        title="لغو رزرو"
        description="آیا از لغو این رزرو اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmText="بله، لغو شود"
        cancelText="خیر، بازگشت"
        variant="destructive"
        onConfirm={handleCancel}
        loading={cancelling}
      />

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent aria-label="کد ورود به سالن" aria-describedby={undefined} className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center font-bold">کد ورود به سالن</DialogTitle>
          </DialogHeader>
          {qrCodeData && (
            <div className="py-4 text-center">
              <p className="mb-4 select-all font-mono text-4xl font-extrabold tracking-[0.15em] text-blue-600 dark:text-blue-400">
                {qrCodeData}
              </p>
              <p className="mb-4 text-[0.68rem] text-muted-foreground">
                این کد را به مسئول سالن ارائه دهید
              </p>
              {checkedInAt ? (
                <Alert variant="success" className="text-start">
                  <AlertDescription>
                    ورود شما در تاریخ {formatDateTime(checkedInAt)} ثبت شده است
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="info" className="text-start">
                  <AlertDescription>
                    هنوز وارد نشده‌اید — کد را به مدیر سالن نشان دهید
                  </AlertDescription>
                </Alert>
              )}
              <Button
                onClick={() => setQrDialogOpen(false)}
                className="mt-6 min-h-9 rounded-xl font-semibold"
              >
                بستن
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

export default BookingDetail
