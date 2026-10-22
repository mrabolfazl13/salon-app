// src/pages/venues/VenueDetail.tsx — جزئیات سالن: موبایل‌فرست (گالری/تاریخ/سانس/CTA) + دسکتاپ تب‌دار
import React, { useId, useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import TimeSlotPicker from '@/components/booking/TimeSlotPicker'
import ReviewSection from '@/components/venue/ReviewSection'
import PlanCards from '@/components/membership/PlanCards'
import MembershipPurchaseDialog from '@/components/membership/MembershipPurchaseDialog'
import CompetitionBidDialog, { type BidTargetSlot } from '@/components/competition/CompetitionBidDialog'
import { membershipService } from '@/services/membership'
import type { MembershipPlan } from '@/types/membership'
import { useAuthStore } from '@/store/authStore'
import {
  DateSelector,
  buildDateOptions,
  TimeSlot,
  BookingSummary,
  FavoriteButton,
  Rating as MobileRating,
  SectionHeader,
  EmptyState,
  VenueDetailSkeleton,
} from '@/components/mobile'
import { bookingService } from '@/services/booking'
import { loyaltyService, type LoyaltyHistory } from '@/services/loyalty'
import { waitlistService } from '@/services/waitlist'
import PricingBreakdown, { normalizeBreakdown } from '@/components/deals/PricingBreakdown'
import { formatRial } from '@/components/finance/shared'
import { toPersianDigits } from '@/lib/jalali'
import { venueService } from '@/services/venue'
import { slotService } from '@/services/slot'
import { cn, formatPrice, formatTimeFa, getSlotEndTime } from '@/lib/utils'
import { parseList, toFullUrl } from '@/utils/venueMedia'
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/shadcn/button'
import { Checkbox } from '@/components/ui/shadcn/checkbox'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Separator } from '@/components/ui/shadcn/separator'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/shadcn/dialog'

// پارس ایمن آرایه/JSON برای فیلدهای ممکن است خراب باشند
function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (Array.isArray(value)) return value as T
  if (typeof value === 'string' && value.trim()) {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return fallback
}

/** گرادیان اصلی برند (navy → blue) روی Tailwind */
const PRIMARY_GRADIENT = 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700'

/** آیکون ۴۴px دکمه‌ای روی گالری */
const glassIconButton =
  'flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-slate-900 shadow-md backdrop-blur-md transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** کارت شیشه‌ای نشستن روی تصویر */
const chipOnImage = 'inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1 text-xs font-bold text-white'

/** ستاره‌های فقط‌خواندنی — جایگزین Rating خواندنی MUI (همان نام قابل‌دسترس) */
const RatingStars: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <span role="img" aria-label={label} className="flex items-center gap-0.5">
    {[0, 1, 2, 3, 4].map((i) => {
      const diff = value - i
      const icon = diff >= 0.75 ? 'mdi:star' : diff >= 0.25 ? 'mdi:star-half-full' : 'mdi:star-outline'
      return <Icon key={i} icon={icon} className="h-4 w-4 text-amber-400" />
    })}
  </span>
)

// تصویر با fallback گرادیانی — فایل غایب/آدرس شکسته دیگر آیکون شکسته نشان نمی‌دهد
const LoadSafeImage: React.FC<{ src: string; alt: string; className?: string }> = ({
  src,
  alt,
  className,
}) => {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center', PRIMARY_GRADIENT, className)}>
        <Icon icon="mdi:stadium-variant" className="h-16 w-16 text-white/35" />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  )
}

const VenueDetail: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [venue, setVenue] = useState<any>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0],
  )
  const track = useRecentlyViewedStore((s) => s.track)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [bidSlot, setBidSlot] = useState<BidTargetSlot | null>(null)
  const loyaltyCheckboxId = useId()

  const joinWaitlist = async () => {
    if (!selectedSlot || !isAuthenticated) {
      toast.error('برای ورود به صف انتظار باید وارد شوید')
      return
    }
    setWaitlistLoading(true)
    try {
      const result = await waitlistService.join(selectedSlot.id)
      toast.success(result.message)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در ورود به صف انتظار')
    } finally {
      setWaitlistLoading(false)
    }
  }

  // ارتقای تسویه — کوپن، امتیاز وفاداری و ریز قیمت (اعتبارسنجی/اعمال سمت سرور)
  const [discountCode, setDiscountCode] = useState('')
  const [useLoyalty, setUseLoyalty] = useState(false)
  const [loyalty, setLoyalty] = useState<LoyaltyHistory | null>(null)
  const [bookingResult, setBookingResult] = useState<any | null>(null)

  const dates = useMemo(() => buildDateOptions(14), [])
  const isGym = venue?.category === 'gym'
  const minPlanPrice = plans.length > 0 ? Math.min(...plans.map((p) => p.price)) : null

  useEffect(() => {
    fetchVenueData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // موجودی وفاداری — هنگام باز شدن دیالوگ رزرو (برای چک‌باکس «استفاده از امتیازها»)
  useEffect(() => {
    if (confirmOpen && isAuthenticated) {
      loyaltyService
        .me()
        .then(setLoyalty)
        .catch(() => setLoyalty(null))
    }
  }, [confirmOpen, isAuthenticated])

  const fetchVenueData = async () => {
    setLoading(true)
    try {
      const venueData = await venueService.getById(Number(id))
      setVenue(venueData)
      if (venueData?.id && venueData?.name) {
        track({ id: venueData.id, name: venueData.name })
      }
      if (venueData?.category === 'gym') {
        // باشگاه بدنسازی: سانس وجود ندارد — پلن‌های اشتراک نمایش داده می‌شود
        try {
          const plansData = await membershipService.getPlans(Number(id))
          setPlans(plansData || [])
        } catch {
          setPlans([])
        }
      } else {
        const today = new Date()
        const nextTwoWeeks = new Date(today)
        nextTwoWeeks.setDate(nextTwoWeeks.getDate() + 13)
        const startDate = today.toISOString().split('T')[0]
        const endDate = nextTwoWeeks.toISOString().split('T')[0]
        const slotsData = (await slotService.getByVenueAndDateRange(Number(id), startDate, endDate)) || []
        setSlots(slotsData)

        // پیش‌انتخاب سانس از لینک دیل (/venues/:id?slot=…&date=…) — قیمت نهایی سمت سرور
        const preId = Number(searchParams.get('slot'))
        if (preId) {
          const pre = slotsData.find((s: any) => Number(s.id) === preId && s.status === 'available')
          if (pre) {
            const st = String(pre.start_time).slice(0, 5)
            setSelectedDate(String(pre.slot_date))
            setSelectedSlot({
              id: pre.id,
              date: String(pre.slot_date),
              duration: Number(pre.duration) || 90,
              startTime: formatTimeFa(st),
              endTime: getSlotEndTime(st, Number(pre.duration) || 90),
              price: pre.current_price || 0,
              status: 'available',
              available: true,
            })
            setTab(1)
            toast('سانس تخفیف‌دار از بازار لحظه آخری انتخاب شد — قیمت نهایی هنگام ثبت توسط سرور اعمال می‌شود', { duration: 6000 })
          }
        } else {
          // رزرو دوباره (/venues/:id?date=YYYY-MM-DD&time=HH:MM): slot_id بین تاریخ‌ها پایدار
          // نیست — تطبیق با تاریخ+ساعت شروع با همان سازوکار پیش‌انتخاب لینک دیل
          const preDate = (searchParams.get('date') || '').trim()
          const preTime = (searchParams.get('time') || '').trim()
          if (preDate && preTime) {
            const want = preTime.slice(0, 5)
            const match = slotsData.find(
              (s: any) => String(s.slot_date) === preDate && String(s.start_time).slice(0, 5) === want,
            )
            setTab(1)
            setSelectedDate(preDate)
            if (match && match.status === 'available') {
              const st = String(match.start_time).slice(0, 5)
              setSelectedSlot({
                id: match.id,
                date: String(match.slot_date),
                duration: Number(match.duration) || 90,
                startTime: formatTimeFa(st),
                endTime: getSlotEndTime(st, Number(match.duration) || 90),
                price: match.current_price || 0,
                status: 'available',
                available: true,
              })
              toast('سانس قبلی پیش‌انتخاب شد — برای ثبت «ادامه رزرو» را بزنید')
            } else if (match) {
              toast.error('این سانس دیگر آزاد نیست — سانسِ همان ساعت/روز دیگر را انتخاب کنید')
            } else {
              toast('سانسی با این تاریخ و ساعت پیدا نشد')
            }
          }
        }
      }
    } catch (error) {
      toast.error('خطا در دریافت اطلاعات سالن')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyPlan = (plan: MembershipPlan) => {
    if (!isAuthenticated) {
      toast('ابتدا وارد حساب خود شوید')
      navigate('/login')
      return
    }
    setSelectedPlan(plan)
    setPurchaseOpen(true)
  }

  const handleBooking = async () => {
    if (!selectedSlot) {
      toast.error('لطفاً یک سانس را انتخاب کنید')
      return
    }
    if (!isAuthenticated) {
      toast('برای رزرو ابتدا وارد حساب خود شوید')
      navigate('/login')
      return
    }
    setBookingLoading(true)
    try {
      const result = await bookingService.create({
        slotId: selectedSlot.id,
        discountCode: discountCode.trim() || null,
        useLoyaltyPoints: useLoyalty,
      })
      // ریز قیمت و مبلغ قابل پرداخت از پاسخ سرور — هیچ مبلغی اینجا محاسبه نمی‌شود
      setBookingResult(result)
      toast.success('رزرو شما ثبت شد و در انتظار تایید مدیر سالن است', { duration: 5000 })
      await fetchVenueData()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در رزرو')
    } finally {
      setBookingLoading(false)
    }
  }

  const closeConfirm = () => {
    setConfirmOpen(false)
    setBookingResult(null)
    setDiscountCode('')
    setUseLoyalty(false)
    setSelectedSlot(null)
  }

  // محاسبهٔ صحیح ساعت پایان بر اساس مدت واقعی هر سانس
  const slotList = slots.map((slot: any) => {
    const start = slot.start_time?.slice(0, 5) || '00:00'
    const duration = Number(slot.duration) || 90
    return {
      id: slot.id,
      date: slot.slot_date,
      duration,
      startTime: formatTimeFa(start),
      endTime: getSlotEndTime(start, duration),
      price: slot.current_price || slot.price || 0,
      status: (slot.status as string) || 'available',
      available: slot.status === 'available',
    }
  })

  const daySlots = useMemo(
    () => slotList.filter((s) => s.date === selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slotList, selectedDate],
  )

  const selectedDateOption = dates.find((d) => d.iso === selectedDate)
  const dateLabel = selectedDateOption
    ? selectedDateOption.isToday
      ? 'امروز'
      : `${selectedDateOption.weekday} ${selectedDateOption.day} ${selectedDateOption.month}`
    : ''

  // اقدام رقابت قیمت — گیت لاگین مطابق سایر اقدامات محافظت‌شدهٔ همین صفحه
  const handleBid = (slot: any) => {
    if (!isAuthenticated) {
      toast('ابتدا وارد حساب خود شوید')
      navigate('/login')
      return
    }
    setBidSlot({
      id: Number(slot.id),
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      price: slot.price,
    })
  }

  const handleCta = () => {
    if (!selectedSlot) {
      toast('ابتدا یک سانس را انتخاب کنید')
      return
    }
    setConfirmOpen(true)
  }

  if (loading) {
    return (
      <Layout>
        <div className="mx-auto max-w-[600px]">
          <VenueDetailSkeleton />
        </div>
      </Layout>
    )
  }

  if (!venue) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-night dark:to-night">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6">
            <Button
              variant="primary"
              onClick={() => navigate('/venues')}
              className="mb-6 min-h-12 rounded-xl px-8 font-semibold"
            >
              <Icon icon="mdi:arrow-right" className="h-5 w-5" />
              بازگشت به لیست سالن‌ها
            </Button>
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>
                سالن مورد نظر یافت نشد یا حذف شده است.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </Layout>
    )
  }

  const amenities: string[] = safeJsonParse(venue.amenities, [])
  const images: string[] = parseList(venue.images)
  const mainImage = images[0] ? toFullUrl(images[0]) : ''

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-night dark:to-night">
        {/* ==================== موبایل: گالری هیرو ==================== */}
        <div className="block md:hidden">
          <div className={cn('relative h-[200px] overflow-hidden', PRIMARY_GRADIENT)}>
            {images.length > 0 && (
              <div aria-hidden className="absolute inset-0 flex items-center justify-center">
                <Icon icon="mdi:stadium-variant" className="h-12 w-12 text-white/30" />
              </div>
            )}
            {images.length > 0 ? (
              <div
                role="region"
                aria-label="گالری تصاویر سالن، قابل پیمایش با کیبورد"
                tabIndex={0}
                className="relative z-[1] flex h-full snap-x snap-mandatory overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {images.map((img, i) => (
                  <LoadSafeImage
                    key={i}
                    src={toFullUrl(img)}
                    alt={`${venue.name} ${i + 1}`}
                    className="h-full w-full shrink-0 snap-start object-cover"
                  />
                ))}
              </div>
            ) : (
              <div className={cn('flex h-full w-full items-center justify-center', PRIMARY_GRADIENT)}>
                <Icon icon="mdi:stadium-variant" className="h-12 w-12 text-white/35" />
              </div>
            )}
            {/* هدر شیشه‌ای روی گالری: بازگشت + قلب */}
            <div className="absolute inset-x-3 top-[calc(12px+env(safe-area-inset-top))] z-[2] flex items-center justify-between">
              <button type="button" onClick={() => navigate(-1)} aria-label="بازگشت" className={glassIconButton}>
                <Icon icon="mdi:arrow-right" className="h-6 w-6" />
              </button>
              <FavoriteButton venue={{ id: venue.id, name: venue.name }} size="md" />
            </div>
            {venue.is_verified && (
              <span className={cn(chipOnImage, 'absolute bottom-3 start-3 z-[2] bg-emerald-700/90')}>
                <Icon icon="mdi:shield-check" className="h-4 w-4" />
                تأیید شده
              </span>
            )}
          </div>

          {/* ==================== موبایل: اطلاعات اصلی ==================== */}
          <div className="mx-auto max-w-[640px] px-4 pb-48 pt-4">
            {/* روی موبایل هیرو دسکتاپ display:none است؛ بدون این h1 صفحه سرتیتر سطح یک نداشت — axe F-25 */}
            <h1 className="text-[1.1rem] font-extrabold leading-normal text-foreground">
              {venue.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <MobileRating value={venue.average_rating || 0} count={venue.total_reviews || 0} size="md" />
              <div className="flex min-w-0 items-center gap-2">
                <Icon icon="mdi:map-marker-outline" className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                <p className="min-w-0 text-xs text-muted-foreground">
                  {venue.address}
                </p>
              </div>
            </div>

            {amenities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {amenities.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 rounded-[10px] bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
                  >
                    <Icon icon="mdi:check-circle-outline" className="h-[15px] w-[15px]" />
                    {a}
                  </span>
                ))}
              </div>
            )}

            {venue.description && (
              <section className="mt-4 rounded-lg border border-border bg-card p-3 shadow-sm">
                <h2 className="mb-1 text-xs font-extrabold text-foreground">درباره سالن</h2>
                <p className="text-xs leading-[1.9] text-muted-foreground">
                  {venue.description}
                </p>
              </section>
            )}

            {isGym ? (
              /* باشگاه: پلن‌های اشتراک (جلسه‌ای / پک / ماهانه) به‌جای سانس */
              <div className="mt-4">
                <SectionHeader title="خرید اشتراک" subtitle="بدون نیاز به رزرو سانس" />
                {plans.length === 0 ? (
                  <EmptyState
                    icon="mdi:dumbbell"
                    title="پلن اشتراکی تعریف نشده"
                    description="هنوز مدیر این باشگاه پلن اشتراکی ثبت نکرده است. برای اطلاع از قیمت‌ها تماس بگیرید."
                  />
                ) : (
                  <PlanCards plans={plans} onBuy={handleBuyPlan} compact />
                )}
              </div>
            ) : (
              <>
                {/* انتخاب تاریخ — اسکرول افقی */}
                <div className="mt-4">
                  <SectionHeader title="انتخاب تاریخ" subtitle="۱۴ روز آینده" />
                  <DateSelector dates={dates} value={selectedDate} onChange={setSelectedDate} />
                </div>

                {/* سانس‌های روز انتخابی */}
                <div className="mt-4">
                  <SectionHeader
                    title="سانس‌ها"
                    subtitle={daySlots.length > 0 ? `${daySlots.length} سانس در ${dateLabel}` : dateLabel}
                  />
                  {daySlots.length === 0 ? (
                    <EmptyState
                      icon="mdi:power-sleep"
                      title="در این روز سانسی موجود نیست"
                      description="تاریخ دیگری را انتخاب کنید یا به روزهای بعد سر بزنید."
                    />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {daySlots.map((s) => (
                        <TimeSlot
                          key={s.id}
                          slot={s}
                          selected={selectedSlot?.id === s.id}
                          onSelect={(slot) => setSelectedSlot(slot)}
                          onBid={handleBid}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* تماس و موقعیت — اطلاعات ثانویه */}
            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div>
                {venue.phone && (
                  <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-blue-500/10">
                        <Icon icon="mdi:phone-outline" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-foreground">{venue.phone}</p>
                        <span className="text-xs text-muted-foreground">شماره تماس سالن</span>
                      </div>
                    </div>
                    <a
                      href={`tel:${venue.phone}`}
                      className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-bold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      تماس
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-blue-500/10">
                    <Icon icon="mdi:map-marker-outline" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{venue.address}</p>
                    <span className="text-xs text-muted-foreground">آدرس سالن</span>
                  </div>
                </div>
              </div>
            </div>

            {/* نظرات */}
            <div className="mt-4">
              <SectionHeader title="نظرات کاربران" />
              <ReviewSection
                venueId={venue.id}
                averageRating={venue.average_rating}
                totalReviews={venue.total_reviews}
                onRatingChange={(avg, total) => {
                  setVenue((prev: any) => (prev ? { ...prev, average_rating: avg, total_reviews: total } : prev))
                }}
              />
            </div>
          </div>

          {/* CTA چسبان پایین — بالای BottomNavigation */}
          {isGym ? (
            <BookingSummary
              price={minPlanPrice ?? venue.price}
              subtitle={plans.length > 0 ? `${plans.length} پلن اشتراک موجود` : 'پلن اشتراکی تعریف نشده'}
              ctaLabel={plans.length > 0 ? 'خرید اشتراک' : 'پلنی موجود نیست'}
              disabled={plans.length === 0}
              loading={false}
              onAction={() => handleBuyPlan(plans[0])}
            />
          ) : (
            <BookingSummary
              price={selectedSlot?.price ?? venue.price}
              subtitle={
                selectedSlot
                  ? `${dateLabel} • ${selectedSlot.startTime} - ${selectedSlot.endTime}`
                  : 'هنوز سانسی انتخاب نشده است'
              }
              ctaLabel={selectedSlot ? 'رزرو سانس' : 'سانس را انتخاب کنید'}
              disabled={!selectedSlot}
              loading={bookingLoading}
              onAction={handleCta}
            />
          )}
        </div>

        {/* ==================== دسکتاپ: هیرو + تب‌ها ==================== */}
        <div className="hidden md:block">
          <div className={cn('relative h-[400px] overflow-hidden', PRIMARY_GRADIENT)}>
            {mainImage ? (
              <LoadSafeImage
                key={mainImage}
                src={mainImage}
                alt={venue.name}
                // در جریان عادی بماند، عنوان را به زیر جعبه و پشت overflow:hidden پرت می‌کند
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className={cn('absolute inset-0 flex h-full w-full items-center justify-center', PRIMARY_GRADIENT)}>
                <Icon icon="mdi:stadium-variant" className="h-24 w-24 text-white/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />
            <div className="relative z-[1] mx-auto h-full w-full max-w-[1200px] px-4 sm:px-6">
              <div className="flex h-full flex-col justify-end pb-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/venues')}
                    className="mb-4 min-h-11 text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    <Icon icon="mdi:arrow-right" className="h-5 w-5" />
                    بازگشت به لیست سالن‌ها
                  </Button>
                  <h1 className="mb-2 text-3xl font-extrabold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.3)]">
                    {venue.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:map-marker" className="h-5 w-5 text-white/70" />
                      <p className="text-xs text-white/80">{venue.address}</p>
                    </div>
                    {venue.average_rating > 0 && (
                      <div className="flex items-center gap-1 rounded-lg bg-white/15 px-3 py-0.5">
                        <RatingStars
                          value={venue.average_rating}
                          label={`امتیاز کاربران ${toPersianDigits(venue.average_rating.toFixed(1))} از ۵`}
                        />
                        <span className="text-xs font-bold text-white">
                          {toPersianDigits(venue.average_rating.toFixed(1)).replace('.', '٫')}
                        </span>
                        <span className="text-xs text-white/70">
                          ({toPersianDigits(venue.total_reviews)})
                        </span>
                      </div>
                    )}
                    <span
                      className={cn(
                        chipOnImage,
                        'rounded-lg',
                        venue.is_verified ? 'bg-emerald-700/90' : 'bg-amber-700/90',
                      )}
                    >
                      <Icon icon={venue.is_verified ? 'mdi:shield-check' : 'mdi:shield-alert-outline'} className="h-4 w-4" />
                      {venue.is_verified ? 'تایید شده' : 'در انتظار تایید'}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="relative z-[2] mx-auto -mt-2 w-full max-w-[1200px] px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Main Content */}
                <div className="lg:col-span-8">
                  <div className="overflow-hidden rounded-[20px] border border-border bg-card shadow-sm">
                    <div className="p-6">
                      <Tabs value={String(tab)} onValueChange={(value) => setTab(Number(value))}>
                        <TabsList className="mb-6 grid h-auto min-h-12 w-full grid-cols-3 gap-1 p-1">
                          <TabsTrigger
                            value="0"
                            className="h-12 gap-1 rounded-[10px] text-xs font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-900 data-[state=active]:via-blue-900 data-[state=active]:to-blue-700 data-[state=active]:text-white"
                          >
                            <Icon icon="mdi:information" className="h-4 w-4" />
                            اطلاعات
                          </TabsTrigger>
                          <TabsTrigger
                            value="1"
                            className="h-12 gap-1 rounded-[10px] text-xs font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-900 data-[state=active]:via-blue-900 data-[state=active]:to-blue-700 data-[state=active]:text-white"
                          >
                            <Icon icon={isGym ? 'mdi:card-account-details-star' : 'mdi:calendar-clock'} className="h-4 w-4" />
                            {isGym ? 'اشتراک‌ها' : 'سانس‌ها'}
                          </TabsTrigger>
                          <TabsTrigger
                            value="2"
                            className="h-12 gap-1 rounded-[10px] text-xs font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-900 data-[state=active]:via-blue-900 data-[state=active]:to-blue-700 data-[state=active]:text-white"
                          >
                            <Icon icon="mdi:star" className="h-4 w-4" />
                            نظرات
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>

                      {tab === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                          {/* Description */}
                          <p className="mb-8 text-base leading-[1.8] text-muted-foreground">
                            {venue.description}
                          </p>

                          {/* Amenities */}
                          <h2 className="mb-4 flex items-center text-base font-bold text-foreground">
                            <Icon icon="mdi:star-outline" className="me-1 h-5 w-5 align-middle" />
                            امکانات
                          </h2>
                          <div className="mb-8 flex flex-wrap gap-2">
                            {amenities.map((amenity: string) => (
                              <span
                                key={amenity}
                                className="inline-flex min-h-11 items-center gap-1 rounded-[10px] bg-blue-500/10 px-4 text-xs font-medium text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"
                              >
                                <Icon icon="mdi:check-circle" className="h-4 w-4" />
                                {amenity}
                              </span>
                            ))}
                          </div>

                          <Separator className="my-6" />

                          {/* Price & Manager Info */}
                          <div className="flex flex-wrap gap-8">
                            <div className="min-w-[150px] flex-1 rounded-lg bg-amber-500/10 p-5 dark:bg-amber-400/10">
                              <span className="mb-1 block text-xs text-muted-foreground">قیمت هر جلسه</span>
                              <p className="text-xl font-extrabold text-amber-700 dark:text-amber-400">{formatPrice(venue.price)}</p>
                            </div>
                            <div className="min-w-[150px] flex-1 rounded-lg bg-blue-500/5 p-5 dark:bg-white/5">
                              <span className="mb-1 block text-xs text-muted-foreground">مدیر سالن</span>
                              <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white dark:bg-blue-500">
                                  {(venue.manager_name || 'ن')[0]}
                                </span>
                                <p className="text-xs font-semibold text-foreground">{venue.manager_name || 'نامشخص'}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {tab === 1 && isGym && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                          <div className="mb-6">
                            <h2 className="mb-1 text-base font-bold text-foreground">خرید اشتراک</h2>
                            <p className="text-xs text-muted-foreground">
                              در باشگاه‌ها رزرو سانس وجود ندارد — پلن مورد نظر (جلسه‌ای، پک یا ماهانه) را بخرید و با نشان دادن کد اشتراک در باشگاه استفاده کنید.
                            </p>
                          </div>
                          {plans.length === 0 ? (
                            <div className="py-10 text-center">
                              <p className="text-xs text-muted-foreground">
                                هنوز پلن اشتراکی برای این باشگاه تعریف نشده است.
                              </p>
                            </div>
                          ) : (
                            <PlanCards plans={plans} onBuy={handleBuyPlan} />
                          )}
                        </motion.div>
                      )}

                      {tab === 1 && !isGym && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                          <div className="mb-6">
                            <h2 className="mb-1 text-base font-bold text-foreground">انتخاب سانس</h2>
                            <p className="text-xs text-muted-foreground">
                              سانس مورد نظر خود را انتخاب کنید و با کلیک روی دکمه رزرو، آن را برای خود رزرو کنید
                            </p>
                          </div>
                          <TimeSlotPicker
                            slots={slotList}
                            onSelect={(slot) => setSelectedSlot(slot)}
                            onBid={handleBid}
                          />

                          {selectedSlot && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="mt-4 rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-6 dark:border-amber-400/30">
                                <div className="mb-4 flex items-center gap-3">
                                  <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl', PRIMARY_GRADIENT)}>
                                    <Icon icon="mdi:calendar-check" className="h-6 w-6 text-white" />
                                  </span>
                                  <div>
                                    <p className="text-xs font-bold text-foreground">سانس انتخاب شده</p>
                                    <p className="text-xs text-muted-foreground">
                                      {selectedSlot.startTime} - {selectedSlot.endTime}
                                    </p>
                                  </div>
                                </div>
                                <Separator className="my-4" />
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-muted-foreground">قیمت:</p>
                                  <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{formatPrice(selectedSlot.price)}</p>
                                </div>

                                {/* اگر سانس پر است، دکمه ورود به صف انتظار نشان بده */}
                                {selectedSlot.status === 'booked' ? (
                                  <Button
                                    variant="outline"
                                    onClick={joinWaitlist}
                                    disabled={waitlistLoading || !isAuthenticated}
                                    className="mt-5 min-h-12 w-full rounded-xl border-amber-500/60 text-base font-bold text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                                  >
                                    <Icon icon="mdi:clock-outline" className="h-5 w-5" />
                                    {waitlistLoading ? (
                                      <span
                                        className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
                                        role="status"
                                        aria-label="در حال بارگذاری"
                                      />
                                    ) : !isAuthenticated ? (
                                      'ورود به صف انتظار (نیاز به ورود)'
                                    ) : (
                                      'ورود به صف انتظار'
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => setConfirmOpen(true)}
                                    disabled={bookingLoading}
                                    className="mt-5 min-h-12 w-full rounded-xl text-base font-extrabold"
                                  >
                                    {bookingLoading ? (
                                      <span
                                        className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
                                        role="status"
                                        aria-label="در حال بارگذاری"
                                      />
                                    ) : (
                                      <>
                                        <Icon icon="mdi:check-circle" className="h-5 w-5" />
                                        تایید و رزرو
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}

                      {tab === 2 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                          <ReviewSection
                            venueId={venue.id}
                            averageRating={venue.average_rating}
                            totalReviews={venue.total_reviews}
                            onRatingChange={(avg, total) => {
                              setVenue((prev: any) => (prev ? { ...prev, average_rating: avg, total_reviews: total } : prev))
                            }}
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4">
                  <div className="sticky top-6">
                    <div className="mb-6 overflow-hidden rounded-[20px] border border-border bg-card shadow-sm">
                      <div className="p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
                          <Icon icon="mdi:phone-in-talk" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          اطلاعات تماس
                        </h3>
                        <div>
                          {venue.phone && (
                            <div className="flex items-center gap-2.5 py-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-blue-500/10">
                                <Icon icon="mdi:phone" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </span>
                              <p className="text-xs font-semibold text-foreground">{venue.phone}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2.5 py-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-blue-500/10">
                              <Icon icon="mdi:map-marker" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </span>
                            <p className="text-xs font-semibold text-foreground">{venue.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[20px] border border-border bg-card shadow-sm">
                      <div className="p-6 text-center">
                        <div className="mb-4">
                          <span className="block text-xs text-muted-foreground">
                            {isGym ? 'از قیمت' : 'قیمت هر جلسه'}
                          </span>
                          <p className="mt-1 text-2xl font-extrabold text-amber-700 dark:text-amber-400">
                            {formatPrice(isGym ? (minPlanPrice ?? venue.price) : venue.price)}
                          </p>
                        </div>
                        <Button
                          disabled={isGym && plans.length === 0}
                          onClick={() => {
                            if (isGym && plans.length > 0) {
                              handleBuyPlan(plans[0])
                            } else {
                              setTab(1)
                            }
                          }}
                          className="min-h-12 w-full rounded-xl text-base font-extrabold"
                        >
                          <Icon icon={isGym ? 'mdi:card-account-details-star' : 'mdi:calendar-plus'} className="h-5 w-5" />
                          {isGym ? (plans.length > 0 ? 'خرید اشتراک' : 'پلنی موجود نیست') : 'مشاهده سانس‌ها'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* نوار شناور تایید دسکتاپ — بدون نیاز به اسکرول بعد از انتخاب سانس */}
      {!isGym && selectedSlot && tab === 1 && (
        <div className="fixed bottom-7 left-1/2 z-[60] hidden w-full max-w-[560px] -translate-x-1/2 px-6 md:block">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-white/95 px-5 py-3.5 shadow-[0_8px_30px_rgba(2,8,23,0.14)] backdrop-blur-md dark:bg-slate-900/95">
            <div className="flex min-w-0 items-center gap-2">
              <Icon icon="mdi:clock-outline" className="h-5 w-5 shrink-0 text-amber-500" />
              <p className="truncate text-xs font-bold text-foreground">
                {selectedSlot.startTime} - {selectedSlot.endTime}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold text-foreground">
                {formatPrice(selectedSlot.price)}
              </p>
            </div>
            <Button
              onClick={() => setConfirmOpen(true)}
              className="min-h-11 shrink-0 rounded-xl px-6 font-bold"
            >
              <Icon icon="mdi:check-circle" className="h-5 w-5" />
              تایید و رزرو
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog — مشترک موبایل و دسکتاپ */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open && !bookingLoading) closeConfirm()
        }}
      >
        <DialogContent
          aria-label="تایید رزرو"
          aria-describedby={undefined}
          className="max-w-[400px] rounded-[20px] p-5 sm:max-w-[400px]"
        >
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/10">
              <Icon icon="mdi:calendar-check" className="h-8 w-8 text-amber-600" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">تایید رزرو</DialogTitle>
          </div>

          {bookingResult ? (
            <div>
              <div className="mb-4 text-center">
                <p className="mb-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                  رزرو ثبت شد — در انتظار تأیید مدیر سالن
                </p>
                <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                  قابل پرداخت: {formatRial(Number(bookingResult.payment_amount) || 0)}
                </p>
                {bookingResult.coupon_code && (
                  <span className="text-xs font-bold text-pink-600 dark:text-pink-400">
                    کد «{bookingResult.coupon_code}» اعمال شد
                  </span>
                )}
              </div>
              <PricingBreakdown
                steps={normalizeBreakdown(bookingResult.pricing_breakdown) ?? []}
                payable={Number(bookingResult.payment_amount) || null}
              />
            </div>
          ) : (
            <>
              <div className="mb-4 text-center">
                <p className="mb-2 text-xs text-muted-foreground">سالن: {venue.name}</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  سانس: {selectedSlot?.startTime} - {selectedSlot?.endTime}
                </p>
                <p className="mt-2 text-lg font-extrabold text-blue-600 dark:text-blue-400">
                  {formatPrice(selectedSlot?.price)}
                </p>
                <span className="mt-1 block text-xs text-muted-foreground">
                  قیمت نهایی سمت سرور محاسبه می‌شود (قوانین + تخفیف‌ها)
                </span>
              </div>
              {isAuthenticated && (
                <div className="flex flex-col gap-2">
                  <div>
                    <Label htmlFor={`${loyaltyCheckboxId}-discount`} className="mb-1 block text-xs">
                      کد تخفیف (اختیاری)
                    </Label>
                    <Input
                      id={`${loyaltyCheckboxId}-discount`}
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      placeholder="مثلاً: نوروز۱۴۰۵"
                      className="rounded-[10px]"
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id={loyaltyCheckboxId}
                      checked={useLoyalty}
                      disabled={!loyalty || loyalty.balance <= 0}
                      onCheckedChange={(checked) => setUseLoyalty(checked === true)}
                      className="mt-0.5"
                    />
                    <div>
                      <Label htmlFor={loyaltyCheckboxId} className="text-xs font-semibold">
                        استفاده از امتیازها (تا ۵۰٪)
                      </Label>
                      {loyalty ? (
                        <span className="block text-xs text-muted-foreground">
                          موجودی: {toPersianDigits(loyalty.balance)} امتیاز ≈ {formatRial(loyalty.balance * loyalty.point_value_rial)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <DialogFooter
            className={
              bookingResult
                ? 'flex-row flex-wrap items-center justify-center gap-2 pb-2 sm:justify-center'
                : 'flex-row flex-wrap items-center justify-between gap-2 pb-2 sm:justify-between'
            }
          >
            {!bookingResult && (
              <Button
                variant="outline"
                onClick={closeConfirm}
                disabled={bookingLoading}
                className="min-h-11 rounded-[10px] px-6"
              >
                انصراف
              </Button>
            )}
            {bookingResult ? (
              <>
                <Button
                  variant="outline"
                  onClick={closeConfirm}
                  className="min-h-11 rounded-[10px] px-6"
                >
                  بعداً
                </Button>
                <Button
                  onClick={() => {
                    const id = bookingResult.id
                    closeConfirm()
                    if (id) navigate(`/bookings/${id}`)
                  }}
                  className="min-h-11 rounded-[10px] bg-gradient-to-br from-emerald-600 to-emerald-500 px-6 text-white hover:from-emerald-700 hover:to-emerald-600"
                >
                  پرداخت و تکمیل رزرو
                </Button>
              </>
            ) : (
              <Button
                onClick={handleBooking}
                disabled={bookingLoading}
                className="min-h-11 rounded-[10px] px-6 font-extrabold"
              >
                {bookingLoading ? (
                  <span
                    className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                    role="status"
                    aria-label="در حال بارگذاری"
                  />
                ) : (
                  'تایید رزرو'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Membership Purchase Dialog — مخصوص سالن‌های بدنسازی */}
      <MembershipPurchaseDialog
        plan={purchaseOpen ? selectedPlan : null}
        venueName={venue?.name}
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        onSuccess={() => {
          setPurchaseOpen(false)
          toast.success('اشتراک شما با موفقیت فعال شد')
        }}
      />

      {/* دیالوگ پیشنهاد قیمت در رقابت (سانس‌های in_competition) */}
      <CompetitionBidDialog
        slot={bidSlot}
        open={Boolean(bidSlot)}
        venueName={venue?.name}
        onClose={() => setBidSlot(null)}
        onBidSuccess={() => {
          setBidSlot(null)
          fetchVenueData()
        }}
      />
    </Layout>
  )
}

export default VenueDetail
