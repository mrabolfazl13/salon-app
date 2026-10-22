import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import ConfirmModal from '@/components/modals/ConfirmModal'
import BookingPaymentPanel from '@/components/bookings/BookingPaymentPanel'
import PaymentDialog from '@/components/bookings/PaymentDialog'
import VenueThumb from '@/components/venue/VenueThumb'
import { EmptyState } from '@/components/mobile'
import { bookingService } from '@/services/booking'
import { paymentService, type PaymentItem } from '@/services/payment'
import {
  formatPrice,
  formatDateTime,
  formatDate,
  formatTimeFa,
  getSlotEndTime,
  getStatusLabel,
} from '@/lib/utils'
import toast from 'react-hot-toast'
import { downloadIcsEvent } from '@/utils/calendar'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Badge } from '@/components/ui/shadcn/badge'
import { Button } from '@/components/ui/shadcn/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs'

// شکل رزرو از سمت بک‌اند (snake_case)
interface ApiBooking {
  id: number | string
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
  // روش پرداخت + وضعیت فیش واریزی
  payment_mode?: string | null
  needs_receipt?: boolean
  receipt_status?: string | null
  receipt_review_note?: string | null
  // رزرو معلق در Redis (در انتظار تایید مدیر سالن)
  isPendingRedis?: boolean
}

export type TabFilter = 'all' | 'confirmed' | 'pending' | 'cancelled' | 'completed'

/** نگاشت وضعیت رزرو → واریانت Badge (هم‌رنگ Chip قبلی: سبز/کهربایی/قرمز/آبی) */
const STATUS_BADGE_VARIANT: Record<string, 'success' | 'primary' | 'destructive' | 'default'> = {
  confirmed: 'success',
  pending: 'default',
  cancelled: 'destructive',
  completed: 'primary',
}

const FILTER_TABS: { value: TabFilter; label: string; ariaLabel: string }[] = [
  { value: 'all', label: 'همه', ariaLabel: 'تب همه رزروها' },
  { value: 'confirmed', label: 'تایید شده', ariaLabel: 'تب رزروهای تایید شده' },
  { value: 'pending', label: 'در انتظار', ariaLabel: 'تب رزروهای در انتظار' },
  { value: 'cancelled', label: 'لغو شده', ariaLabel: 'تب رزروهای لغو شده' },
  { value: 'completed', label: 'انجام شده', ariaLabel: 'تب رزروهای انجام شده' },
]

/** دانلود فایل .ics برای یک رزرو از فهرست — همان رویداد صفحهٔ جزئیات */
const addToCalendar = (booking: ApiBooking) => {
  if (!booking.slot_date || !booking.start_time) {
    toast.error('اطلاعات زمانی این رزرو کامل نیست')
    return
  }
  downloadIcsEvent({
    bookingId: Number(booking.id),
    venueName: booking.venue_name || `سالن #${booking.slot_id}`,
    date: booking.slot_date,
    time: String(booking.start_time).slice(0, 5),
    durationMinutes: booking.duration || 90,
    price: Number(booking.payment_amount) || undefined,
  })
  toast.success('فایل تقویم دانلود شد')
}

const Bookings: React.FC = () => {
  const [tab, setTab] = useState<TabFilter>('all')
  const [bookings, setBookings] = useState<ApiBooking[]>([])
  const [pendingBookings, setPendingBookings] = useState<ApiBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<ApiBooking | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [payTarget, setPayTarget] = useState<ApiBooking | null>(null)
  const navigate = useNavigate()

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [data, pending, pays] = await Promise.all([
        bookingService.getAll(),
        bookingService.getMyPending().catch(() => []),
        paymentService.getMy().catch(() => []),
      ])
      setBookings(Array.isArray(data) ? data : [])
      setPendingBookings(Array.isArray(pending) ? pending : [])
      setPayments(Array.isArray(pays) ? pays : [])
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      if (cancelTarget.isPendingRedis) {
        await bookingService.cancelPending(cancelTarget.id as string)
      } else {
        await bookingService.cancel(cancelTarget.id as number)
      }
      toast.success('رزرو با موفقیت لغو شد!')
      setCancelTarget(null)
      await fetchBookings()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در لغو رزرو')
    } finally {
      setCancelling(false)
    }
  }

  const merged: ApiBooking[] = [
    ...pendingBookings.map((p) => ({ ...p, isPendingRedis: true })),
    ...bookings,
  ]
  const filtered =
    tab === 'all'
      ? merged
      : tab === 'pending'
        ? merged.filter((b) => b.isPendingRedis)
        : bookings.filter((b) => b.status === tab)

  // شناسه رزروهایی که پرداخت موفق داشته‌اند
  const paidBookingIds = new Set(
    payments.filter((p) => p.status === 'paid').map((p) => p.booking_id),
  )
  // شناسه رزروهایی که وجه‌شان بازگردانده شده
  const refundedBookingIds = new Set(
    payments.filter((p) => p.status === 'refunded').map((p) => p.booking_id),
  )

  return (
    <Layout>
      <div className="py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-1 text-xl font-bold text-foreground">رزروهای من</h1>
          <p className="mb-4 text-[0.68rem] text-muted-foreground">لیست رزروهای شما</p>
        </motion.div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as TabFilter)} className="mb-4">
          <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTER_TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                aria-label={t.ariaLabel}
                className="h-9 shrink-0 rounded-[10px] px-3.5 text-[0.68rem] font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-400 data-[state=active]:via-amber-500 data-[state=active]:to-orange-500 data-[state=active]:font-extrabold data-[state=active]:text-stone-900"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {error ? (
          <Alert variant="destructive" className="rounded-lg">
            <AlertDescription className="flex w-full flex-wrap items-center justify-between gap-3">
              <span>در دریافت رزروها خطایی رخ داد. لطفاً دوباره تلاش کنید.</span>
              <Button variant="destructive" size="sm" onClick={fetchBookings} className="min-h-9 px-4">
                تلاش دوباره
              </Button>
            </AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} aria-hidden="true" className="h-[80px] rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="mdi:calendar-blank-outline"
            title="رزرویی یافت نشد"
            description="هنوز رزروی در این بخش ندارید. یک سالن پیدا کنید و بازی بعدی‌تان را رزرو کنید."
            actionLabel="پیدا کردن سالن"
            onAction={() => navigate('/venues')}
          />
        ) : (
          <div className="flex flex-col gap-6">
            {filtered.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:border-amber-500/45 hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:hover:border-amber-400/35 dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <VenueThumb images={booking.venue_images} name={booking.venue_name || `سالن #${booking.slot_id}`} size={48} />
                      <div>
                        <h2 className="text-sm font-semibold leading-snug text-foreground">
                          {booking.venue_name || `سالن #${booking.slot_id}`}
                        </h2>
                        {booking.slot_date ? (
                          <p className="text-[0.68rem] text-muted-foreground">
                            {formatDate(booking.slot_date)} —{' '}
                            {formatTimeFa(booking.start_time)} تا{' '}
                            {getSlotEndTime(booking.start_time || '', booking.duration || 90)}
                          </p>
                        ) : (
                          <p className="text-[0.68rem] text-muted-foreground">
                            {formatDateTime(booking.booked_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-start gap-3 sm:justify-end">
                      <span className="text-[0.68rem] font-bold text-foreground">
                        {formatPrice(booking.payment_amount)}
                      </span>
                      <Badge
                        variant={STATUS_BADGE_VARIANT[booking.status] ?? 'default'}
                        className="min-h-9 rounded-[10px] px-3 text-[0.68rem]"
                      >
                        {getStatusLabel(booking.status)}
                      </Badge>
                      {booking.status === 'cancelled' &&
                        refundedBookingIds.has(Number(booking.id)) && (
                          <Badge variant="primary" className="min-h-9 gap-1.5 rounded-[10px] px-3 text-[0.68rem] font-semibold">
                            <Icon icon="mdi:restore" className="h-4 w-4" />
                            بازگشت وجه
                          </Badge>
                        )}
                      {booking.status === 'confirmed' &&
                        !booking.isPendingRedis &&
                        (booking.payment_mode ?? 'gateway') === 'gateway' &&
                        (paidBookingIds.has(Number(booking.id)) ? (
                          <Badge variant="success" className="min-h-9 gap-1.5 rounded-[10px] px-3 text-[0.68rem] font-semibold">
                            <Icon icon="mdi:check-circle-outline" className="h-4 w-4" />
                            پرداخت شده
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setPayTarget(booking)}
                            className="min-h-9 rounded-xl bg-gradient-to-br from-green-600 to-green-700 px-4 text-[0.68rem] text-white shadow-sm hover:from-green-700 hover:to-green-800"
                          >
                            <Icon icon="mdi:credit-card-plus-outline" className="h-4 w-4" />
                            پرداخت
                          </Button>
                        ))}
                      {!booking.isPendingRedis && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/bookings/${booking.id}`)}
                          className="min-h-9 rounded-xl px-4 text-[0.68rem]"
                        >
                          جزئیات
                        </Button>
                      )}
                      {!booking.isPendingRedis && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => addToCalendar(booking)}
                          disabled={!booking.slot_date || !booking.start_time}
                          aria-label={`افزودن رزرو ${booking.venue_name || ''} به تقویم`}
                          className="min-h-9 min-w-11 rounded-xl"
                        >
                          <Icon icon="mdi:calendar-plus" className="h-5 w-5" />
                        </Button>
                      )}
                      {(booking.status === 'confirmed' || booking.status === 'pending') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCancelTarget(booking)}
                          className="min-h-9 rounded-xl px-4 text-[0.68rem]"
                        >
                          لغو
                        </Button>
                      )}
                    </div>
                  </div>
                  {!booking.isPendingRedis && (booking.payment_mode === 'bank_receipt' || booking.payment_mode === 'pay_in_place') && (
                    <div className="mt-4">
                      <BookingPaymentPanel booking={booking} compact onChanged={fetchBookings} />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="لغو رزرو"
        description="آیا از لغو این رزرو اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmText="بله، لغو شود"
        cancelText="خیر، بازگشت"
        variant="destructive"
        onConfirm={handleConfirmCancel}
        loading={cancelling}
      />

      <PaymentDialog
        open={Boolean(payTarget)}
        onClose={() => {
          setPayTarget(null)
          fetchBookings()
        }}
        bookingId={Number(payTarget?.id ?? 0)}
        amount={payTarget?.payment_amount ?? 0}
        venueName={payTarget?.venue_name}
        slotDate={payTarget?.slot_date}
        startTime={payTarget?.start_time}
      />
    </Layout>
  )
}

export default Bookings
