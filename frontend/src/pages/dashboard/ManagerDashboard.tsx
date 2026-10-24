// frontend/src/pages/dashboard/ManagerDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import { useQuery } from '@tanstack/react-query'
import { venueService } from '@/services/venue'
import { slotService } from '@/services/slot'
import { bookingService } from '@/services/booking'
import { contractService } from '@/services/contract'
import { financeService, type SeriesPoint } from '@/services/finance'
import { dealService, type DealAvailableItem } from '@/services/deals'
import DealPublishDialog, { type PublishSlot } from '@/components/deals/DealPublishDialog'
import ConfirmModal from '@/components/modals/ConfirmModal'
import { ReceiptReviewDialog, InPersonCollectDialog } from '@/components/bookings/ManagerReceiptDialogs'
import SlotWeekGrid from '@/components/manager/SlotWeekGrid'
import { ErrorBox, extractError } from '@/components/finance/shared'
import { isForbidden } from '@/components/crm/shared'
import { uploadService } from '@/services/upload'
import { membershipService } from '@/services/membership'
import { PLAN_TYPE_LABEL, type MembershipPlan, type MembershipPurchase, type MembershipSessionEvent, type PlanType } from '@/types/membership'
import {
  formatPrice,
  getPaymentModeLabel,
  getPaymentModeIcon,
  getReceiptStatusLabel,
  getReceiptStatusTone,
  getBookingStatusLabel,
  getBookingStatusClass,
  PAYMENT_MODE_CHIP_CLASS,
  PAYMENT_MODE_CHIP_DEFAULT,
  cn,
} from '@/lib/utils'
import PersianDatePicker, { PersianDateRangePicker } from '@/components/ui/PersianDatePicker'
import { toPersianDigits } from '@/lib/jalali'
import toast from 'react-hot-toast'
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/shadcn/dialog'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table'

interface Venue {
  id: number
  name: string
  address: string
  phone: string | null
  is_verified: boolean
  price: number
  amenities: string[]
  category?: 'futsal' | 'gym'
  description?: string | null
  images?: string[]
  latitude?: number
  longitude?: number
  payment_mode?: string | null
  default_slot_price?: number | null
}

interface Slot {
  id: number
  venue_id: number
  slot_date: string
  start_time: string
  duration: number
  base_price: number
  current_price: number
  status: 'available' | 'booked' | 'blocked' | 'in_competition' | 'reserved' | (string & {})
  is_competition_enabled: boolean
  is_contract_slot?: boolean
}

interface Booking {
  id: number
  slot_id: number
  user_id: number
  booked_at: string
  slot_date?: string
  status: string
  payment_amount: number
  venue_id?: number
  payment_mode?: string | null
  needs_receipt?: boolean
  receipt_status?: string | null
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

const statCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  }),
}

const statusColors: Record<string, string> = {
  available: '#10b981',
  booked: '#2563eb',
  blocked: '#ef4444',
  in_competition: '#f59e0b',
  reserved: '#8b5cf6',
}

const statusLabels: Record<string, string> = {
  available: 'آزاد',
  booked: 'رزرو شده',
  blocked: 'مسدود',
  in_competition: 'مسابقه',
  reserved: 'رزرو قرارداد',
}

// تب‌های داشبورد — همان پنج تب قبلی با همان ترتیب
const TAB_ITEMS: Array<{ icon: string; text: string }> = [
  { icon: 'mdi:store', text: 'سالن‌های من' },
  { icon: 'mdi:calendar-clock', text: 'سانس‌ها' },
  { icon: 'mdi:calendar-check', text: 'رزروها' },
  { icon: 'mdi:card-account-details-star', text: 'اشتراک‌ها' },
  { icon: 'mdi:view-grid-outline', text: 'تقویم هفتگی' },
]

// پیام خطای فهرست — ۴۰۳ باید «دسترسی ندارید» بخواند، نه «داده‌ای نیست»
const listErrorText = (err: unknown, fallback: string): string =>
  isForbidden(err) ? 'شما اجازه دسترسی به این بخش را ندارید (۴۰۳).' : extractError(err, fallback)

// رنگ چیپ وضعیت رسید — نگاشتِ رنگ‌های MUI به توکن‌های Tailwind
const RECEIPT_TONE_CLASS: Record<string, string> = {
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  default: 'bg-muted text-muted-foreground',
}

const ManagerDashboard: React.FC = () => {
  // ورود از داشبورد سالن (?tab=&venue=) باید همان تب و همان سالن را باز کند
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState(() => {
    const raw = Number(searchParams.get('tab'))
    return Number.isInteger(raw) && raw >= 0 && raw < TAB_ITEMS.length ? raw : 0
  })
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  // درخواست‌های قرارداد معوق — بج روی کارت آمار، لینک به صفحه بررسی
  const [pendingContractCount, setPendingContractCount] = useState(0)
  const [openCreateVenue, setOpenCreateVenue] = useState(false)
  const [openGenerateSlots, setOpenGenerateSlots] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [slotDate, setSlotDate] = useState('')
  const [newVenue, setNewVenue] = useState({
    name: '',
    address: '',
    phone: '',
    latitude: 34.6482,
    longitude: 50.8799,
    description: '',
    amenities: [] as string[],
    images: [] as string[],
    category: 'futsal',
    payment_mode: 'bank_receipt',
  })
  const [newAmenity, setNewAmenity] = useState('')
  const [uploadingImages, setUploadingImages] = useState(false)
  const [editingVenueId, setEditingVenueId] = useState<number | null>(null)
  const [savingVenue, setSavingVenue] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null)
  const [inPersonTarget, setInPersonTarget] = useState<Booking | null>(null)

  // Slots state
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [selectedVenueForSlots, setSelectedVenueForSlots] = useState<number | 'all'>(() => {
    const raw = Number(searchParams.get('venue'))
    return Number.isFinite(raw) && raw > 0 ? raw : 'all'
  })
  const [slotFilterDate, setSlotFilterDate] = useState(() => new Date().toISOString().split('T')[0])

  // ورود به داشبورد اختصاصی سالن (جریان سالن‌محور)
  const handleOpenWorkspace = (venue: Venue) => navigate(`/manager/venues/${venue.id}`)

  // تغییر تب + همگام‌سازی URL تا رفرش/لینک، همان تب را باز کند
  const changeTab = (value: number) => {
    setTab(value)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === 0) next.delete('tab')
        else next.set('tab', String(value))
        return next
      },
      { replace: true },
    )
  }

  // Deals — انتشار سانس لحظه آخری روی تب سانس‌ها
  const [dealsMap, setDealsMap] = useState<Record<number, DealAvailableItem>>({})
  const [dealsError, setDealsError] = useState<string | null>(null)
  const [dealSelection, setDealSelection] = useState<number[]>([])
  const [publishOpen, setPublishOpen] = useState(false)
  const [unpublishBusy, setUnpublishBusy] = useState<number | null>(null)

  // مسدود/آزاد کردن سانس (slot.block سمت بک‌اند) + اقدام گروهی رزروهای در انتظار
  const [slotActionBusy, setSlotActionBusy] = useState<number | null>(null)
  const [blockConfirmSlot, setBlockConfirmSlot] = useState<Slot | null>(null)
  const [pendingSelection, setPendingSelection] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<'confirm' | 'reject' | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsError, setBookingsError] = useState<string | null>(null)
  const [selectedVenueForBookings, setSelectedVenueForBookings] = useState<number | 'all'>(() => {
    const raw = Number(searchParams.get('venue'))
    return Number.isFinite(raw) && raw > 0 ? raw : 'all'
  })
  // رزروهای در انتظار تأیید (Redis)
  const [pendingList, setPendingList] = useState<any[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [pendingError, setPendingError] = useState<string | null>(null)
  const [pendingActionPid, setPendingActionPid] = useState<string | null>(null)

  // اشتراک‌های بدنسازی (پلن‌ها + خریدها)
  const [planVenues, setPlanVenues] = useState<Venue[]>([])
  const [planVenueId, setPlanVenueId] = useState<number | ''>('')
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [openCreatePlan, setOpenCreatePlan] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [newPlan, setNewPlan] = useState({
    title: '',
    plan_type: 'session' as PlanType,
    price: '',
    sessions_count: '',
    duration_days: '30',
    description: '',
  })
  const [venuePurchases, setVenuePurchases] = useState<MembershipPurchase[]>([])
  const [purchasesLoading, setPurchasesLoading] = useState(false)
  const [purchasesError, setPurchasesError] = useState<string | null>(null)
  const [consumeId, setConsumeId] = useState<number | null>(null)
  const [refundConfirm, setRefundConfirm] = useState<MembershipPurchase | null>(null)
  const [refundId, setRefundId] = useState<number | null>(null)
  const [eventsFor, setEventsFor] = useState<MembershipPurchase | null>(null)
  const [purchaseEvents, setPurchaseEvents] = useState<MembershipSessionEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [bookingDateRange, setBookingDateRange] = useState(() => {
    const today = new Date()
    const weekLater = new Date(today)
    weekLater.setDate(weekLater.getDate() + 7)
    return {
      start: today.toISOString().split('T')[0],
      end: weekLater.toISOString().split('T')[0],
    }
  })

  useEffect(() => {
    fetchVenues()
  }, [])

  // شمارش درخواست‌های قرارداد معوق برای بج کارت آمار
  useEffect(() => {
    contractService.managerPending()
      .then((rows) => setPendingContractCount(rows.length))
      .catch(() => setPendingContractCount(0))
  }, [])

  // گزارش هفتگی سانس‌های محبوب — ۷ روز گذشته (جمع‌بندی روز/ساعت از دفتر مالی)
  const weeklyPopQ = useQuery({
    queryKey: ['manager', 'weekly-popularity'],
    enabled: tab === 0,
    staleTime: 5 * 60_000,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: 0,
    queryFn: async () => {
      const to = new Date().toISOString().split('T')[0]
      const fromD = new Date()
      fromD.setDate(fromD.getDate() - 6)
      const from = fromD.toISOString().split('T')[0]
      const [weekday, hour] = await Promise.all([
        financeService.getRevenueSeries({ group_by: 'weekday', from, to }),
        financeService.getRevenueSeries({ group_by: 'hour', from, to }),
      ])
      return { weekday: weekday.points, hour: hour.points, from, to }
    },
  })
  const popularDays = useMemo(
    () => [...(weeklyPopQ.data?.weekday ?? [])].sort((a, b) => b.count - a.count).slice(0, 3),
    [weeklyPopQ.data],
  )
  const popularHours = useMemo(
    () => [...(weeklyPopQ.data?.hour ?? [])].sort((a, b) => b.count - a.count).slice(0, 3),
    [weeklyPopQ.data],
  )
  const weeklyTotalBookings = useMemo(
    () => (weeklyPopQ.data?.weekday ?? []).reduce((s, p) => s + p.count, 0),
    [weeklyPopQ.data],
  )

  // Fetch slots when tab changes to Slots
  useEffect(() => {
    if (tab === 1 && venues.length > 0) {
      fetchSlots()
      fetchDeals()
    }
  }, [tab, venues])

  // Fetch bookings when tab changes to Bookings (and on first load for dashboard KPIs)
  useEffect(() => {
    if ((tab === 2 || tab === 0) && venues.length > 0) {
      fetchBookings()
      fetchPending()
    }
  }, [tab, venues])

  // Fetch membership plans/purchases when tab changes to Memberships
  useEffect(() => {
    if (tab === 3 && venues.length > 0) {
      const gyms = venues.filter((v) => v.category === 'gym')
      setPlanVenues(gyms)
      if (gyms.length > 0) {
        const id = gyms[0].id
        setPlanVenueId(id)
        fetchPlans(id)
        fetchVenuePurchases(id)
      } else {
        setPlanVenueId('')
        setPlans([])
        setVenuePurchases([])
      }
    }
  }, [tab, venues])

  const fetchVenues = async () => {
    setLoading(true)
    try {
      const data = await venueService.getMyVenues()
      setVenues(data)
    } catch (error) {
      toast.error('خطا در دریافت سالن‌ها')
    } finally {
      setLoading(false)
    }
  }

  const fetchSlots = async () => {
    setSlotsLoading(true)
    setSlots([])
    setDealSelection([])
    setSlotsError(null)
    try {
      const venuesToFetch = selectedVenueForSlots === 'all'
        ? venues
        : venues.filter(v => v.id === selectedVenueForSlots)

      const allSlots: Slot[] = []
      const results = await Promise.allSettled(
        venuesToFetch.map(async (venue) => {
          const venueSlots = await slotService.getByVenueAndDate(venue.id, slotFilterDate)
          return venueSlots.map((s) => ({ ...s, venue_id: venue.id }))
        }),
      )
      let failedVenues = 0
      for (const r of results) {
        if (r.status === 'fulfilled') allSlots.push(...r.value)
        else failedVenues += 1
      }
      setSlots(allSlots)
      if (failedVenues > 0) {
        setSlotsError(`دریافت سانس‌های ${toPersianDigits(failedVenues)} سالن ناموفق بود؛ فهرست کامل نیست.`)
      }
    } catch (error) {
      setSlots([])
      setSlotsError(listErrorText(error, 'دریافت سانس‌ها ممکن نشد.'))
    } finally {
      setSlotsLoading(false)
    }
  }

  // فعال بودن دیل از SlotResponse خوانده نمی‌شود ← GET /deals/available (فقط آینده/فعال)
  const fetchDeals = async () => {
    try {
      const items = await dealService.available({ limit: 200 })
      const map: Record<number, DealAvailableItem> = {}
      for (const it of items) map[it.slot_id] = it
      setDealsMap(map)
      setDealsError(null)
    } catch (error) {
      setDealsMap({})
      setDealsError(listErrorText(error, 'دریافت تخفیف‌های فعال ممکن نشد؛ وضعیت تخفیف سانس‌ها نامشخص است.'))
    }
  }

  const isFutureSlot = (slot: Slot): boolean => {
    const today = new Date().toISOString().split('T')[0]
    if (slot.slot_date > today) return true
    if (slot.slot_date < today) return false
    const now = new Date()
    const hm = (slot.start_time || '00:00').slice(0, 5)
    const [h, m] = hm.split(':').map(Number)
    return h > now.getHours() || (h === now.getHours() && m > now.getMinutes())
  }

  const publishableSlots = useMemo(
    () => slots.filter((s) => s.status === 'available' && isFutureSlot(s) && !dealsMap[s.id]),
    [slots, dealsMap],
  )

  const selectedDealSlots: PublishSlot[] = slots
    .filter((s) => dealSelection.includes(s.id))
    .map((s) => ({ id: s.id, venue_id: s.venue_id, slot_date: s.slot_date, start_time: s.start_time }))

  const toggleDealSelection = (slotId: number) => {
    setDealSelection((prev) => (prev.includes(slotId) ? prev.filter((x) => x !== slotId) : [...prev, slotId]))
  }

  const handleUnpublish = async (slotId: number) => {
    setUnpublishBusy(slotId)
    try {
      await dealService.unpublish(slotId)
      toast.success('تخفیف سانس برداشته شد')
      await Promise.all([fetchDeals(), fetchSlots()])
      setDealSelection((prev) => prev.filter((x) => x !== slotId))
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'خطا در لغو تخفیف')
    } finally {
      setUnpublishBusy(null)
    }
  }

  const fetchBookings = async () => {
    setBookingsLoading(true)
    setBookings([])
    setBookingsError(null)
    try {
      const venuesToFetch = selectedVenueForBookings === 'all'
        ? venues
        : venues.filter(v => v.id === selectedVenueForBookings)

      const allBookings: Booking[] = []
      const results = await Promise.allSettled(
        venuesToFetch.map(async (venue) => {
          const venueBookings = await bookingService.getVenueBookings(
            venue.id,
            bookingDateRange.start,
            bookingDateRange.end
          )
          return venueBookings.map((b: Booking) => ({ ...b, venue_id: venue.id }))
        }),
      )
      let failedVenues = 0
      for (const r of results) {
        if (r.status === 'fulfilled') allBookings.push(...r.value)
        else failedVenues += 1
      }
      setBookings(allBookings)
      if (failedVenues > 0) {
        setBookingsError(`دریافت رزروهای ${toPersianDigits(failedVenues)} سالن ناموفق بود؛ فهرست کامل نیست.`)
      }
    } catch (error) {
      setBookings([])
      setBookingsError(listErrorText(error, 'دریافت رزروها ممکن نشد.'))
    } finally {
      setBookingsLoading(false)
    }
  }

  const fetchPending = async () => {
    setPendingLoading(true)
    setPendingError(null)
    try {
      const venuesToFetch = selectedVenueForBookings === 'all'
        ? venues
        : venues.filter(v => v.id === selectedVenueForBookings)
      setPendingSelection([])
      const allPending: any[] = []
      const results = await Promise.allSettled(
        venuesToFetch.map((venue) => bookingService.getVenuePending(venue.id)),
      )
      let failedVenues = 0
      for (const r of results) {
        if (r.status === 'fulfilled' && Array.isArray(r.value)) allPending.push(...r.value)
        else failedVenues += 1
      }
      setPendingList(allPending)
      if (failedVenues > 0) {
        setPendingError(`دریافت رزروهای در انتظارِ ${toPersianDigits(failedVenues)} سالن ناموفق بود؛ فهرست کامل نیست.`)
      }
    } catch (error) {
      setPendingList([])
      setPendingError(listErrorText(error, 'دریافت رزروهای در انتظار ممکن نشد.'))
    } finally {
      setPendingLoading(false)
    }
  }

  const fetchPlans = async (venueId: number) => {
    setPlansLoading(true)
    try {
      const data = await membershipService.getPlans(venueId, true)
      setPlans(Array.isArray(data) ? data : [])
    } catch {
      toast.error('خطا در دریافت پلن‌ها')
    } finally {
      setPlansLoading(false)
    }
  }

  const fetchVenuePurchases = async (venueId: number) => {
    setPurchasesLoading(true)
    setPurchasesError(null)
    try {
      const data = await membershipService.getVenuePurchases(venueId)
      setVenuePurchases(Array.isArray(data) ? data : [])
    } catch (error) {
      setVenuePurchases([])
      setPurchasesError(listErrorText(error, 'دریافت خریدهای اشتراک ممکن نشد.'))
    } finally {
      setPurchasesLoading(false)
    }
  }

  const handleCreatePlan = async () => {
    if (!planVenueId) {
      toast.error('ابتدا یک سالن بدنسازی انتخاب کنید')
      return
    }
    if (!newPlan.title.trim()) {
      toast.error('عنوان پلن را وارد کنید')
      return
    }
    const price = Number(newPlan.price)
    if (!price || price <= 0) {
      toast.error('قیمت را به درستی وارد کنید')
      return
    }
    if (newPlan.plan_type === 'sessions_pack' && !Number(newPlan.sessions_count)) {
      toast.error('تعداد جلسات پک را وارد کنید')
      return
    }
    if (newPlan.plan_type === 'monthly' && !Number(newPlan.duration_days)) {
      toast.error('مدت اعتبار (روز) را وارد کنید')
      return
    }
    setSavingPlan(true)
    try {
      await membershipService.createPlan({
        venue_id: planVenueId,
        title: newPlan.title.trim(),
        plan_type: newPlan.plan_type,
        price,
        sessions_count: newPlan.plan_type === 'sessions_pack' ? Number(newPlan.sessions_count) : null,
        duration_days: newPlan.plan_type === 'monthly' ? Number(newPlan.duration_days) : null,
        description: newPlan.description.trim() || null,
      })
      toast.success('پلن ایجاد شد ✅')
      setOpenCreatePlan(false)
      setNewPlan({ title: '', plan_type: 'session', price: '', sessions_count: '', duration_days: '30', description: '' })
      await fetchPlans(planVenueId)
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'خطا در ایجاد پلن')
    } finally {
      setSavingPlan(false)
    }
  }

  const handleDeactivatePlan = async (planId: number) => {
    try {
      await membershipService.deactivatePlan(planId)
      toast.success('پلن غیرفعال شد')
      if (planVenueId) await fetchPlans(planVenueId)
    } catch {
      toast.error('خطا در غیرفعال‌سازی پلن')
    }
  }

  const handleConsume = async (purchaseId: number) => {
    setConsumeId(purchaseId)
    try {
      const updated = await membershipService.consumeSession(purchaseId)
      toast.success(`جلسه کسر شد — باقی‌مانده: ${updated.sessions_remaining ?? 0}`)
      setVenuePurchases((prev) => prev.map((p) => (p.id === purchaseId ? updated : p)))
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'خطا در کسر جلسه')
    } finally {
      setConsumeId(null)
    }
  }

  const handleRefundPurchase = async (purchase: MembershipPurchase) => {
    setRefundId(purchase.id)
    try {
      const updated = await membershipService.refundPurchase(purchase.id)
      toast.success('بازگشت وجه ثبت شد — ردیفِ برگشت در دفتر کل مالی دیده می‌شود')
      setVenuePurchases((prev) => prev.map((p) => (p.id === purchase.id ? updated : p)))
      setRefundConfirm(null)
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'خطا در بازگشت وجه')
    } finally {
      setRefundId(null)
    }
  }

  const openPurchaseEvents = async (purchase: MembershipPurchase) => {
    setEventsFor(purchase)
    setPurchaseEvents([])
    setEventsLoading(true)
    try {
      setPurchaseEvents(await membershipService.getPurchaseEvents(purchase.id))
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'خطا در بارگذاری تاریخچه')
      setEventsFor(null)
    } finally {
      setEventsLoading(false)
    }
  }

  const handleConfirmPending = async (pid: string) => {
    setPendingActionPid(pid)
    try {
      await bookingService.confirmPending(pid)
      toast.success('رزرو تایید شد و در دیتابیس ثبت شد ✅')
      await Promise.all([fetchBookings(), fetchPending()])
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در تایید رزرو')
    } finally {
      setPendingActionPid(null)
    }
  }

  const handleRejectPending = async (pid: string) => {
    setPendingActionPid(pid)
    try {
      await bookingService.rejectPending(pid)
      toast.success('رزرو رد شد و سانس آزاد گردید')
      await Promise.all([fetchBookings(), fetchPending()])
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در رد رزرو')
    } finally {
      setPendingActionPid(null)
    }
  }

  const faDigits = (n: number): string => new Intl.NumberFormat('fa-IR').format(n)

  const handleBlockSlot = async (slot: Slot) => {
    setSlotActionBusy(slot.id)
    try {
      await slotService.block(slot.id)
      toast.success('سانس مسدود شد')
      await fetchSlots()
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'خطا در مسدود کردن سانس')
    } finally {
      setSlotActionBusy(null)
      setBlockConfirmSlot(null)
    }
  }

  const handleUnblockSlot = async (slot: Slot) => {
    setSlotActionBusy(slot.id)
    try {
      await slotService.unblock(slot.id)
      toast.success('سانس آزاد شد')
      await fetchSlots()
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'خطا در آزاد کردن سانس')
    } finally {
      setSlotActionBusy(null)
    }
  }

  const togglePendingSelection = (pid: string) => {
    setPendingSelection((prev) => (prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]))
  }

  const bulkApply = async () => {
    if (!bulkAction || pendingSelection.length === 0) return
    setBulkBusy(true)
    const targets = [...pendingSelection]
    const results = await Promise.allSettled(
      targets.map((pid) => (bulkAction === 'confirm' ? bookingService.confirmPending(pid) : bookingService.rejectPending(pid))),
    )
    const ok = results.filter((r) => r.status === 'fulfilled').length
    const failed = targets.length - ok
    setBulkAction(null)
    setPendingSelection([])
    toast.success(`${faDigits(ok)} رزرو ${bulkAction === 'confirm' ? 'تأیید' : 'رد'} شد${failed > 0 ? ` — ${faDigits(failed)} ناموفق` : ''}`)
    if (failed > 0) {
      const first = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined
      const detail = (first?.reason as any)?.response?.data?.detail
      if (detail) toast.error(String(detail))
    }
    await Promise.all([fetchBookings(), fetchPending()])
    setBulkBusy(false)
  }

  const resetVenueForm = () => {
    setNewVenue({
      name: '',
      address: '',
      phone: '',
      latitude: 34.6482,
      longitude: 50.8799,
      description: '',
      amenities: [],
      images: [],
      category: 'futsal',
      payment_mode: 'bank_receipt',
    })
    setNewAmenity('')
  }

  const openCreateVenueDialog = () => {
    setEditingVenueId(null)
    resetVenueForm()
    setOpenCreateVenue(true)
  }

  const openEditVenueDialog = (venue: Venue) => {
    setEditingVenueId(venue.id)
    setNewVenue({
      name: venue.name ?? '',
      address: venue.address ?? '',
      phone: venue.phone ?? '',
      latitude: venue.latitude ?? 34.6482,
      longitude: venue.longitude ?? 50.8799,
      description: (venue.description as string) ?? '',
      amenities: Array.isArray(venue.amenities) ? venue.amenities : [],
      images: Array.isArray(venue.images) ? venue.images : [],
      category: venue.category ?? 'futsal',
      payment_mode: venue.payment_mode ?? 'bank_receipt',
    })
    setNewAmenity('')
    setOpenCreateVenue(true)
  }

  const handleSaveVenue = async () => {
    const name = newVenue.name.trim()
    if (name.length < 3) {
      toast.error('نام سالن باید حداقل ۳ حرف باشد')
      return
    }
    if (!newVenue.address.trim()) {
      toast.error('آدرس سالن را وارد کنید')
      return
    }
    setSavingVenue(true)
    const payload = {
      ...newVenue,
      name,
      address: newVenue.address.trim(),
      amenities: newVenue.amenities.filter((a) => a.trim()),
      images: newVenue.images,
    }
    try {
      if (editingVenueId) {
        await venueService.update(editingVenueId, payload)
        toast.success('سالن با موفقیت ویرایش شد')
      } else {
        await venueService.create(payload)
        toast.success('سالن با موفقیت ایجاد شد')
      }
      setOpenCreateVenue(false)
      setEditingVenueId(null)
      resetVenueForm()
      fetchVenues()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || (editingVenueId ? 'خطا در ویرایش سالن' : 'خطا در ایجاد سالن'))
    } finally {
      setSavingVenue(false)
    }
  }

  const addAmenity = () => {
    const a = newAmenity.trim()
    if (a && !newVenue.amenities.includes(a)) {
      setNewVenue({ ...newVenue, amenities: [...newVenue.amenities, a] })
    }
    setNewAmenity('')
  }

  const removeAmenity = (a: string) => {
    setNewVenue(prev => ({ ...prev, amenities: prev.amenities.filter(x => x !== a) }))
  }

  const handleImageUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList).slice(0, 10)
    setUploadingImages(true)
    try {
      const urls = await uploadService.uploadImages(files)
      setNewVenue(prev => ({ ...prev, images: [...prev.images, ...urls] }))
      toast.success(`${urls.length} عکس با موفقیت آپلود شد`)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در آپلود عکس‌ها')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (url: string) => {
    setNewVenue(prev => ({ ...prev, images: prev.images.filter(x => x !== url) }))
  }

  const handleGenerateSlots = async () => {
    if (!selectedVenue || !slotDate) return
    try {
      await slotService.generateForDate(selectedVenue.id, slotDate)
      toast.success('سانس‌ها با موفقیت ایجاد شدند')
      setOpenGenerateSlots(false)
      setSelectedVenue(null)
      setSlotDate('')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در ایجاد سانس‌ها')
    }
  }

  // Calculate stats from real data
  const totalRevenue = bookings.reduce((sum: number, b: Booking) => sum + b.payment_amount, 0)
  const availableSlots = slots.filter(s => s.status === 'available').length
  const todayIso = new Date().toISOString().split('T')[0]
  const todayBookings = bookings.filter(b => b.slot_date === todayIso).length

  const stats: Array<{
    label: string
    value: string | number
    icon: string
    gradient: string
    lightBg: string
    color: string
    href?: string
    badge?: number
    hint?: string
  }> = [
    {
      label: 'سالن‌های من',
      value: venues.length,
      icon: 'mdi:store-outline',
      gradient: 'linear-gradient(135deg, #2563eb, #7c3aed)',
      lightBg: 'rgba(37,99,235,0.08)',
      color: '#2563eb',
    },
    {
      label: 'رزروهای امروز',
      value: todayBookings,
      icon: 'mdi:calendar-check-outline',
      gradient: 'linear-gradient(135deg, #059669, #10b981)',
      lightBg: 'rgba(5,150,105,0.08)',
      color: '#059669',
    },
    {
      label: 'درآمد (بازه انتخابی)',
      value: formatPrice(totalRevenue),
      icon: 'mdi:cash-multiple',
      gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
      lightBg: 'rgba(217,119,6,0.08)',
      color: '#d97706',
    },
    {
      label: 'سانس‌های آزاد',
      value: availableSlots,
      icon: 'mdi:clock-outline',
      gradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
      lightBg: 'rgba(220,38,38,0.08)',
      color: '#dc2626',
      href: '/competitions',
      hint: 'رقابت قیمت بگذار',
    },
    {
      label: 'درخواست‌های قرارداد',
      value: pendingContractCount,
      icon: 'mdi:file-document-edit-outline',
      gradient: 'linear-gradient(135deg, #7c3aed, #2563eb)',
      lightBg: 'rgba(124,58,237,0.08)',
      color: '#7c3aed',
      href: '/manager/contracts',
      badge: pendingContractCount,
      hint: 'برای بررسی',
    },
    {
      label: 'ثبت ورود (QR)',
      value: 'اسکن کد',
      icon: 'mdi:qrcode-scan',
      gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)',
      lightBg: 'rgba(8,145,178,0.08)',
      color: '#0891b2',
      href: '/manager/checkin',
      hint: 'ورود کاربران',
    },
    {
      label: 'مدیریت مالی',
      value: 'درآمد/هزینه',
      icon: 'mdi:finance',
      gradient: 'linear-gradient(135deg, #059669, #10b981)',
      lightBg: 'rgba(5,150,105,0.08)',
      color: '#059669',
      href: '/finance',
      hint: 'داشبورد مالی و تراکنش‌ها',
    },
    {
      label: 'شیفت پرسنل',
      value: 'برنامهٔ هفتگی',
      icon: 'mdi:calendar-clock',
      gradient: 'linear-gradient(135deg, #0891b2, #22d3ee)',
      lightBg: 'rgba(8,145,178,0.08)',
      color: '#0891b2',
      href: '/manager/shifts',
      hint: 'تعارض‌گیر + خروجی ماهانه',
    },
  ]

  const getVenueName = (venueId: number) => {
    return venues.find(v => v.id === venueId)?.name || 'نامشخص'
  }

  if (loading) {
    return (
      <Layout userRole="venue_manager">
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-background">
          <div className="text-center">
            <span
              role="status"
              aria-label="در حال بارگذاری"
              className="mx-auto mb-4 block h-12 w-12 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent"
            />
            <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="venue_manager">
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-background">
        {/* Header Section */}
        <header
          className="relative mx-auto mt-2 overflow-hidden rounded-[28px] pb-16 pt-8 md:pb-16 md:pt-10"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%)' }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-1/2 start-[-20%] h-[600px] w-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)' }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-[30%] end-[-10%] h-[400px] w-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }}
          />
          <div className="relative z-10 mx-auto max-w-[1200px] px-4 md:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="mb-2 text-2xl font-extrabold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.2)] md:text-[2rem]">
                    داشبورد مدیریت
                  </h1>
                  <p className="font-normal text-white">به پنل مدیریت سالن‌های خود خوش آمدید</p>
                </div>
                <button
                  type="button"
                  onClick={openCreateVenueDialog}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-white/30 bg-slate-950/25 px-3 py-1.5 text-[0.75rem] font-semibold text-white backdrop-blur transition-colors hover:bg-slate-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <Icon icon="mdi:plus-circle" aria-hidden="true" className="h-4 w-4" />
                  افزودن سالن جدید
                </button>
              </div>
            </motion.div>
          </div>
        </header>

        <main className="relative z-10 mx-auto -mt-12 max-w-[1200px] px-4 pb-16 md:-mt-16 md:px-8">
          {/* Stats Cards - Overlapping */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
              {stats.map((stat, index) => {
                const CardShell = (stat.href ? Link : 'div') as React.ElementType
                return (
                  <motion.div key={index} custom={index} variants={statCardVariants}>
                    <CardShell
                      {...(stat.href ? { to: stat.href as string } : {})}
                      className={cn(
                        'block overflow-hidden rounded-[20px] border border-border bg-card text-inherit shadow-sm transition-all duration-300 no-underline',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        stat.href ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : 'cursor-default',
                      )}
                    >
                      <div className="flex items-center justify-between gap-4 p-5">
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'mb-0.5 font-extrabold leading-tight text-foreground',
                              typeof stat.value === 'string' ? 'text-xl lg:text-[1.35rem]' : 'text-[1.75rem]',
                            )}
                          >
                            {stat.value}
                          </p>
                          <p className="text-[0.85rem] font-medium text-muted-foreground">{stat.label}</p>
                          {stat.hint && (
                            <div className="mt-0.5 flex items-center gap-2">
                              <p className="text-xs font-bold text-amber-800 dark:text-amber-400">{stat.hint}</p>
                              <Icon icon="mdi:arrow-left" aria-hidden="true" className="h-[13px] w-[13px] text-amber-800 dark:text-amber-400" />
                            </div>
                          )}
                        </div>
                        <div
                          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                          style={{ background: stat.lightBg }}
                        >
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 rounded-2xl"
                            style={{ background: stat.gradient, opacity: 0.1 }}
                          />
                          <Icon icon={stat.icon} aria-hidden="true" className="relative h-7 w-7" style={{ color: stat.color }} />
                          {typeof stat.badge === 'number' && stat.badge > 0 && (
                            <span className="absolute -end-1.5 -top-1.5 z-10 flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 border-card bg-red-600 px-0.5 text-xs font-extrabold text-white">
                              {stat.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardShell>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* گزارش هفتگی سانس‌های محبوب */}
          {weeklyPopQ.isSuccess && weeklyTotalBookings > 0 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="mb-8 rounded-[20px] border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-amber-500/10">
                    <Icon icon="mdi:fire-circle-outline" aria-hidden="true" className="h-5 w-5 text-amber-800 dark:text-amber-400" />
                  </div>
                  <p className="text-[0.95rem] font-extrabold">
                    {`سانس‌های محبوب ۷ روز اخیر — ${toPersianDigits(weeklyTotalBookings)} رزرو`}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/finance')}
                    className="ms-auto inline-flex min-h-11 items-center gap-1.5 rounded-xl px-4 text-[0.78rem] font-bold text-blue-700 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-blue-400"
                  >
                    جزئیات مالی
                    <Icon icon="mdi:arrow-left" aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {([['روزهای شلوغ', popularDays], ['ساعت‌های شلوغ', popularHours]] as Array<[string, SeriesPoint[]]>).map(([title, pts]) => {
                    const max = Math.max(...pts.map((p) => p.count), 1)
                    return (
                      <div key={title}>
                        <p className="mb-2 text-xs font-bold text-muted-foreground">{title}</p>
                        <div className="flex flex-col gap-2">
                          {pts.map((p) => (
                            <div key={p.key} className="flex items-center gap-2.5">
                              <p className="w-16 shrink-0 text-[0.8rem] font-extrabold">{toPersianDigits(p.label)}</p>
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-900/5 dark:bg-white/10">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.round((p.count / max) * 100)}%`,
                                    background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                                  }}
                                />
                              </div>
                              <p className="w-11 text-end text-xs text-muted-foreground [font-variant-numeric:tabular-nums]">
                                {`${toPersianDigits(p.count)} رزرو`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <Tabs value={String(tab)} onValueChange={(v) => changeTab(Number(v))}>
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <TabsList className="h-auto w-max flex-nowrap gap-1 bg-transparent p-0">
                  {TAB_ITEMS.map((item, index) => (
                    <TabsTrigger
                      key={item.text}
                      value={String(index)}
                      className="min-h-11 shrink-0 gap-1.5 rounded-[9px] px-3 py-1.5 text-[0.75rem] font-semibold text-muted-foreground transition-all hover:bg-muted data-[state=active]:shadow-none whitespace-nowrap"
                      style={tab === index ? { background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' } : undefined}
                    >
                      <Icon icon={item.icon} aria-hidden="true" className="h-3.5 w-3.5" />
                      {item.text}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {/* Venues Tab */}
            {tab === 0 && (
              <motion.div
                key="venues"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {venues.length === 0 ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                    <div className="rounded-[18px] border-2 border-dashed border-border bg-card/80 p-7 text-center backdrop-blur">
                      <div
                        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                        style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))' }}
                      >
                        <Icon icon="mdi:store-plus-outline" aria-hidden="true" className="h-8 w-8 text-blue-700 dark:text-blue-400" />
                      </div>
                      <h2 className="mb-1.5 text-lg font-bold">هنوز سالنی ثبت نکرده‌اید</h2>
                      <p className="mx-auto mb-5 max-w-[400px] text-[0.8rem] leading-6 text-muted-foreground">
                        اولین سالن خود را اضافه کنید و مدیریت سانس‌ها و رزروها را شروع کنید
                      </p>
                      <button
                        type="button"
                        onClick={openCreateVenueDialog}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-600 to-violet-600 px-3.5 py-1.5 text-[0.8rem] font-semibold text-white shadow-sm shadow-blue-600/20 transition-colors hover:from-blue-700 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Icon icon="mdi:plus" aria-hidden="true" className="h-4 w-4" />
                        افزودن سالن جدید
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                      {venues.map((venue) => {
                        let amenities: string[] = venue.amenities || []
                        if (typeof venue.amenities === 'string') {
                          try {
                            const parsed = JSON.parse(venue.amenities)
                            amenities = Array.isArray(parsed) ? parsed : []
                          } catch {
                            amenities = []
                          }
                        } else if (!Array.isArray(amenities)) {
                          amenities = []
                        }
                        return (
                          <motion.div key={venue.id} variants={itemVariants} className="h-full">
                            <div className="h-full overflow-hidden rounded-[20px] border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                              {/* Top Gradient Bar */}
                              <div
                                className="h-1"
                                style={{
                                  background: venue.is_verified
                                    ? 'linear-gradient(90deg, #059669, #10b981)'
                                    : 'linear-gradient(90deg, #d97706, #f59e0b)',
                                }}
                              />

                              <div className="p-4 sm:p-6">
                                {/* Header */}
                                <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4 sm:gap-3">
                                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                    <Avatar className="h-10 w-10 shrink-0 rounded-xl sm:h-12 sm:w-12 sm:rounded-[14px]">
                                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-[1.05rem] font-bold text-white sm:rounded-[14px] sm:text-[1.2rem]">
                                        {venue.name[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="mb-1 text-[0.95rem] font-bold leading-6 sm:mb-0.5 sm:text-base">{venue.name}</p>
                                      <div className="flex items-center gap-1.5 sm:gap-2">
                                        <Icon icon="mdi:map-marker" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                        <p className="truncate text-[0.72rem] leading-5 text-muted-foreground sm:text-xs">{venue.address}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <span
                                    className={cn(
                                      'inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5 text-[0.68rem] font-semibold leading-5 sm:min-h-11 sm:px-2 sm:text-xs',
                                      venue.is_verified
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-amber-500/10 text-amber-800 dark:text-amber-400',
                                    )}
                                  >
                                    <Icon
                                      icon={venue.is_verified ? 'mdi:check-circle' : 'mdi:clock-outline'}
                                      aria-hidden="true"
                                      className="h-4 w-4"
                                    />
                                    {venue.is_verified ? 'تایید شده' : 'در انتظار تایید'}
                                  </span>
                                </div>

                                {/* Amenities — در موبایل کارت را شلوغ می‌کرد، فقط از sm به بالا */}
                                {amenities.length > 0 && (
                                  <div className="mb-4 hidden flex-wrap gap-1.5 sm:flex">
                                    {amenities.slice(0, 4).map((a, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex min-h-7 items-center rounded-md border border-blue-600/15 px-2 py-0.5 text-[0.7rem] font-medium text-primary-ink"
                                      >
                                        {a}
                                      </span>
                                    ))}
                                    {amenities.length > 4 && (
                                      <span className="inline-flex min-h-7 items-center rounded-md bg-primary px-2 py-0.5 text-[0.7rem] font-semibold text-white">
                                        {`+${amenities.length - 4}`}
                                      </span>
                                    )}
                                  </div>
                                )}

                                <hr className="mb-3 border-border sm:mb-4" />

                                {/* Info Row */}
                                <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <Icon icon="mdi:phone" aria-hidden="true" className="h-4 w-4 text-slate-400" />
                                      <p dir="ltr" className="text-xs text-muted-foreground">{venue.phone}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Icon icon="mdi:cash-multiple" aria-hidden="true" className="h-4 w-4 text-slate-400" />
                                      <p className="text-xs font-semibold text-muted-foreground">{formatPrice(venue.price)}</p>
                                    </div>
                                    <span
                                      className={`inline-flex min-h-8 items-center gap-1 rounded-md px-2 py-0.5 text-[0.7rem] font-semibold leading-5 sm:min-h-11 sm:text-xs ${PAYMENT_MODE_CHIP_CLASS[venue.payment_mode ?? ''] ?? PAYMENT_MODE_CHIP_DEFAULT}`}
                                    >
                                      <Icon icon={getPaymentModeIcon(venue.payment_mode)} aria-hidden="true" className="h-4 w-4" />
                                      {getPaymentModeLabel(venue.payment_mode)}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions — در موبایل سه‌ستونی تا دکمهٔ سوم تنها به خط بعد نیفتد */}
                                <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedVenue(venue)
                                      setOpenGenerateSlots(true)
                                    }}
                                    className="inline-flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-[9px] bg-gradient-to-br from-blue-600 to-violet-600 px-1.5 py-1.5 text-[0.7rem] font-semibold text-white shadow-md shadow-blue-600/20 transition-colors hover:from-blue-700 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-11 sm:flex-1 sm:gap-2 sm:px-4 sm:text-[0.85rem]"
                                  >
                                    <Icon icon="mdi:calendar-plus" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                                    ایجاد سانس
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenWorkspace(venue)}
                                    className="inline-flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-[9px] border border-blue-600/20 px-1.5 py-1.5 text-[0.7rem] font-semibold text-primary-ink transition-colors hover:border-primary hover:bg-blue-600/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-11 sm:flex-1 sm:gap-2 sm:px-4 sm:text-[0.85rem]"
                                  >
                                    <Icon icon="mdi:view-dashboard-outline" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                                    داشبورد
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditVenueDialog(venue)}
                                    className="inline-flex min-h-11 items-center justify-center gap-1 whitespace-nowrap rounded-[9px] border border-amber-600/30 px-1.5 py-1.5 text-[0.7rem] font-semibold text-amber-800 transition-colors hover:border-amber-600 hover:bg-amber-600/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-amber-400 sm:min-h-11 sm:flex-1 sm:gap-2 sm:px-4 sm:text-[0.85rem]"
                                  >
                                    <Icon icon="mdi:pencil-outline" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                                    ویرایش
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Slots Tab */}
            {tab === 1 && (
              <motion.div
                key="slots"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Filters */}
                <div className="mb-6 rounded-2xl border border-border bg-card/90 p-5 backdrop-blur">
                  <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="slot-venue-filter" className="mb-1.5 block text-xs">سالن</Label>
                      <Select
                        value={String(selectedVenueForSlots)}
                        onValueChange={(v) => setSelectedVenueForSlots(v === 'all' ? 'all' : Number(v))}
                      >
                        <SelectTrigger id="slot-venue-filter" aria-label="سالن" className="rounded-[10px]">
                          <SelectValue placeholder="سالن" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">همه سالن‌ها</SelectItem>
                          {venues.map(v => (
                            <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <PersianDatePicker
                      fullWidth
                      size="small"
                      label="تاریخ"
                      value={slotFilterDate}
                      onChange={setSlotFilterDate}
                    />
                    <div>
                      <button
                        type="button"
                        onClick={fetchSlots}
                        disabled={slotsLoading}
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-blue-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:from-blue-700 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                      >
                        {slotsLoading ? (
                          <span role="status" aria-label="در حال بارگذاری" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Icon icon="mdi:refresh" aria-hidden="true" className="h-4 w-4" />
                        )}
                        {slotsLoading ? 'در حال بارگذاری...' : 'جستجو'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* نوار ابزار دیل — انتخاب چندسانسی و عرضه به‌عنوان تخفیف‌دار */}
                {publishableSlots.length > 0 && (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-50/90 px-4 py-3 backdrop-blur dark:bg-amber-500/10">
                    <div className="flex items-center gap-2.5">
                      <label
                        title="انتخاب همه"
                        className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center"
                      >
                        <input
                          type="checkbox"
                          aria-label="انتخاب همه سانس‌های قابل تخفیف"
                          className="h-5 w-5 cursor-pointer accent-blue-600"
                          checked={dealSelection.length > 0 && dealSelection.length === publishableSlots.length}
                          ref={(el) => {
                            if (el) el.indeterminate = dealSelection.length > 0 && dealSelection.length < publishableSlots.length
                          }}
                          onChange={(e) =>
                            setDealSelection(e.target.checked ? publishableSlots.map((s) => s.id) : [])
                          }
                        />
                      </label>
                      <Icon icon="mdi:lightning-bolt" aria-hidden="true" className="h-5 w-5 text-amber-800 dark:text-amber-400" />
                      <p className="text-sm font-bold">
                        {dealSelection.length > 0
                          ? (new Intl.NumberFormat('fa-IR')).format(dealSelection.length) + ' سانس انتخاب شده — عرضه به‌عنوان تخفیف‌دار'
                          : 'عرضه به‌عنوان تخفیف‌دار — سانس‌های آزاد آینده را علامت بزنید'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={dealSelection.length === 0}
                      onClick={() => setPublishOpen(true)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-amber-700 to-red-600 px-4 text-sm font-extrabold text-white transition-colors hover:from-amber-800 hover:to-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Icon icon="mdi:rocket-launch-outline" aria-hidden="true" className="h-4 w-4" />
                      انتشار {dealSelection.length ? `(${dealSelection.length})` : ''}
                    </button>
                  </div>
                )}

                {dealsError && (
                  <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-50/90 dark:bg-red-500/10">
                    <ErrorBox message={dealsError} onRetry={fetchDeals} />
                  </div>
                )}

                {/* Slots List */}
                {slotsLoading ? (
                  <div className="py-12 text-center">
                    <span
                      role="status"
                      aria-label="در حال بارگذاری"
                      className="mx-auto block h-10 w-10 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent"
                    />
                    <p className="mt-4 text-sm text-muted-foreground">در حال بارگذاری سانس‌ها...</p>
                  </div>
                ) : slotsError ? (
                  <ErrorBox message={slotsError} onRetry={fetchSlots} />
                ) : slots.length === 0 ? (
                  <div className="rounded-[20px] border-2 border-dashed border-border bg-card/80 p-12 text-center backdrop-blur">
                    <div
                      className="mx-auto mb-6 flex h-[100px] w-[100px] items-center justify-center rounded-full"
                      style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))' }}
                    >
                      <Icon icon="mdi:calendar-plus-outline" aria-hidden="true" className="h-12 w-12 text-blue-700 dark:text-blue-400" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold">سانسی یافت نشد</h2>
                    <p className="mx-auto mb-6 max-w-[450px] text-muted-foreground">
                      برای تاریخ انتخاب شده سانسی وجود ندارد. از بخش سالن‌های من سانس ایجاد کنید
                    </p>
                    <button
                      type="button"
                      onClick={() => setTab(0)}
                      className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 px-8 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition-colors hover:from-blue-700 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Icon icon="mdi:store" aria-hidden="true" className="h-5 w-5" />
                      مشاهده سالن‌ها
                    </button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    <Table aria-label="سانس‌های سالن">
                      <TableHeader>
                        <TableRow>
                          <TableHead scope="col" className="font-bold">سالن</TableHead>
                          <TableHead scope="col" className="font-bold">تاریخ</TableHead>
                          <TableHead scope="col" className="font-bold">ساعت شروع</TableHead>
                          <TableHead scope="col" className="font-bold">مدت (دقیقه)</TableHead>
                          <TableHead scope="col" className="font-bold">قیمت</TableHead>
                          <TableHead scope="col" className="font-bold">وضعیت</TableHead>
                          <TableHead scope="col" className="font-bold">تخفیف داینامیک</TableHead>
                          <TableHead scope="col" className="font-bold">عملیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {slots.map((slot) => (
                          <TableRow key={slot.id} className="transition-colors hover:bg-blue-600/5">
                            <TableCell>
                              <p className="text-sm font-semibold">{getVenueName(slot.venue_id)}</p>
                            </TableCell>
                            <TableCell>
                              <p dir="ltr" className="text-sm">{slot.slot_date}</p>
                            </TableCell>
                            <TableCell>
                              <p dir="ltr" className="font-mono text-sm font-semibold">{slot.start_time}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{slot.duration}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{formatPrice(slot.current_price)}</p>
                            </TableCell>
                            <TableCell>
                              <span
                                className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold"
                                style={{
                                  backgroundColor: `${statusColors[slot.status] || '#6b7280'}18`,
                                  color: statusColors[slot.status] || '#6b7280',
                                }}
                              >
                                {statusLabels[slot.status] || 'نامشخص'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {dealsMap[slot.id] ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-extrabold text-amber-800 dark:text-amber-400">
                                    ویژه
                                  </span>
                                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                    {formatPrice(dealsMap[slot.id].deal_price)}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => handleUnpublish(slot.id)}
                                    disabled={unpublishBusy === slot.id}
                                    className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
                                  >
                                    {unpublishBusy === slot.id ? '…' : 'لغو تخفیف'}
                                  </button>
                                </div>
                              ) : slot.status === 'available' && isFutureSlot(slot) ? (
                                <label className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center">
                                  <input
                                    type="checkbox"
                                    aria-label={`انتخاب سانس ${slot.start_time}`}
                                    className="h-5 w-5 cursor-pointer accent-blue-600"
                                    checked={dealSelection.includes(slot.id)}
                                    onChange={() => toggleDealSelection(slot.id)}
                                  />
                                </label>
                              ) : (
                                <p className="text-xs text-muted-foreground">—</p>
                              )}
                            </TableCell>
                            <TableCell>
                              {slot.status === 'available' && !slot.is_contract_slot && isFutureSlot(slot) ? (
                                <button
                                  type="button"
                                  disabled={slotActionBusy === slot.id}
                                  onClick={() => setBlockConfirmSlot(slot)}
                                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-amber-600/40 px-3 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-500/10 disabled:opacity-50 dark:text-amber-400"
                                >
                                  {slotActionBusy === slot.id ? '...' : (
                                    <>
                                      <Icon icon="mdi:lock-outline" aria-hidden="true" className="h-3.5 w-3.5" />
                                      مسدود
                                    </>
                                  )}
                                </button>
                              ) : slot.status === 'blocked' && isFutureSlot(slot) ? (
                                <button
                                  type="button"
                                  disabled={slotActionBusy === slot.id}
                                  onClick={() => handleUnblockSlot(slot)}
                                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-emerald-600/40 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
                                >
                                  {slotActionBusy === slot.id ? '...' : (
                                    <>
                                      <Icon icon="mdi:lock-open-variant-outline" aria-hidden="true" className="h-3.5 w-3.5" />
                                      آزاد
                                    </>
                                  )}
                                </button>
                              ) : (
                                <p className="text-xs text-muted-foreground/70">—</p>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </motion.div>
            )}

            {/* Bookings Tab */}
            {tab === 2 && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Filters */}
                <div className="mb-6 rounded-2xl border border-border bg-card/90 p-5 backdrop-blur">
                  <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-12">
                    <div className="sm:col-span-3">
                      <Label htmlFor="booking-venue-filter" className="mb-1.5 block text-xs">سالن</Label>
                      <Select
                        value={String(selectedVenueForBookings)}
                        onValueChange={(v) => setSelectedVenueForBookings(v === 'all' ? 'all' : Number(v))}
                      >
                        <SelectTrigger id="booking-venue-filter" aria-label="سالن" className="rounded-[10px]">
                          <SelectValue placeholder="سالن" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">همه سالن‌ها</SelectItem>
                          {venues.map(v => (
                            <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-6">
                      <PersianDateRangePicker
                        size="small"
                        start={bookingDateRange.start}
                        end={bookingDateRange.end}
                        onStartChange={(v) => setBookingDateRange(prev => ({ ...prev, start: v }))}
                        onEndChange={(v) => setBookingDateRange(prev => ({ ...prev, end: v }))}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={() => { fetchBookings(); fetchPending() }}
                        disabled={bookingsLoading}
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-blue-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:from-blue-700 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                      >
                        {bookingsLoading ? (
                          <span role="status" aria-label="در حال بارگذاری" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Icon icon="mdi:refresh" aria-hidden="true" className="h-4 w-4" />
                        )}
                        {bookingsLoading ? 'در حال بارگذاری...' : 'جستجو'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* رزروهای در انتظار تأیید (قبل از ثبت در دیتابیس) */}
                <div className="mb-6 rounded-2xl border border-amber-500/25 bg-amber-50/90 p-5 backdrop-blur dark:bg-amber-500/10">
                  <div className={cn('flex flex-wrap items-center gap-3', pendingList.length ? 'mb-4' : 'mb-0')}>
                    <Icon icon="mdi:clock-alert-outline" aria-hidden="true" className="h-5 w-5 text-amber-800 dark:text-amber-400" />
                    <p className="text-base font-bold">رزروهای در انتظار تأیید</p>
                    <span className="inline-flex items-center rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                      {pendingList.length}
                    </span>
                    {pendingList.length > 0 && (
                      <label
                        title="انتخاب همه"
                        className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center"
                      >
                        <input
                          type="checkbox"
                          aria-label="انتخاب همه رزروهای در انتظار"
                          className="h-5 w-5 cursor-pointer accent-blue-600"
                          checked={pendingSelection.length > 0 && pendingSelection.length === pendingList.length}
                          ref={(el) => {
                            if (el) el.indeterminate = pendingSelection.length > 0 && pendingSelection.length < pendingList.length
                          }}
                          onChange={(e) => setPendingSelection(e.target.checked ? pendingList.map((p) => p.id) : [])}
                        />
                      </label>
                    )}
                    <div className="flex-1" />
                    {pendingSelection.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setBulkAction('confirm')}
                          className="inline-flex min-h-11 items-center rounded-lg bg-green-700 px-3 text-xs font-bold text-white transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          تأیید انتخاب‌شده‌ها ({faDigits(pendingSelection.length)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setBulkAction('reject')}
                          className="inline-flex min-h-11 items-center rounded-lg border border-red-500/50 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-red-400"
                        >
                          رد انتخاب‌شده‌ها ({faDigits(pendingSelection.length)})
                        </button>
                      </div>
                    )}
                  </div>
                  {pendingLoading ? (
                    <div className="py-6 text-center">
                      <span
                        role="status"
                        aria-label="در حال بارگذاری"
                        className="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"
                      />
                    </div>
                  ) : pendingError ? (
                    <ErrorBox message={pendingError} onRetry={fetchPending} />
                  ) : pendingList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">رزروی در انتظار تأیید نیست</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {pendingList.map((p) => (
                        <div
                          key={p.id}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-500/20 bg-card/85 p-3"
                        >
                          <div className="flex min-w-0 items-center gap-1">
                            <label className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center">
                              <input
                                type="checkbox"
                                aria-label={`انتخاب رزرو ${p.id}`}
                                className="h-5 w-5 cursor-pointer accent-blue-600"
                                checked={pendingSelection.includes(p.id)}
                                onChange={() => togglePendingSelection(p.id)}
                              />
                            </label>
                            <div className="min-w-0">
                              <p className="text-sm font-bold">{p.venue_name || 'سالن'}</p>
                              <p className="text-xs text-muted-foreground">
                                {p.slot_date ? `${p.slot_date} — ${p.start_time}` : ''}
                                {p.slot_date ? '  •  ' : ''}
                                {formatPrice(p.payment_amount)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={pendingActionPid === p.id}
                              onClick={() => handleConfirmPending(p.id)}
                              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-green-700 px-3 text-xs font-semibold text-white transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                            >
                              {pendingActionPid === p.id ? (
                                <span role="status" aria-label="در حال بارگذاری" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : 'تأیید'}
                            </button>
                            <button
                              type="button"
                              disabled={pendingActionPid === p.id}
                              onClick={() => handleRejectPending(p.id)}
                              className="inline-flex min-h-11 items-center rounded-lg border border-red-500/50 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
                            >
                              رد
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bookings List */}
                {bookingsLoading ? (
                  <div className="py-12 text-center">
                    <span
                      role="status"
                      aria-label="در حال بارگذاری"
                      className="mx-auto block h-10 w-10 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent"
                    />
                    <p className="mt-4 text-sm text-muted-foreground">در حال بارگذاری رزروها...</p>
                  </div>
                ) : bookingsError ? (
                  <ErrorBox message={bookingsError} onRetry={fetchBookings} />
                ) : bookings.length === 0 ? (
                  <div className="rounded-[20px] border-2 border-dashed border-border bg-card/80 p-12 text-center backdrop-blur">
                    <div
                      className="mx-auto mb-6 flex h-[100px] w-[100px] items-center justify-center rounded-full"
                      style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))' }}
                    >
                      <Icon icon="mdi:calendar-blank-outline" aria-hidden="true" className="h-12 w-12 text-blue-700 dark:text-blue-400" />
                    </div>
                    <h2 className="mb-2 text-xl font-bold">رزروی یافت نشد</h2>
                    <p className="mx-auto max-w-[400px] text-muted-foreground">برای بازه انتخاب شده رزروی وجود ندارد</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    <Table aria-label="رزروهای سالن">
                      <TableHeader>
                        <TableRow>
                          <TableHead scope="col" className="font-bold">شناسه</TableHead>
                          <TableHead scope="col" className="font-bold">سالن</TableHead>
                          <TableHead scope="col" className="font-bold">مبلغ</TableHead>
                          <TableHead scope="col" className="font-bold">تاریخ رزرو</TableHead>
                          <TableHead scope="col" className="font-bold">وضعیت</TableHead>
                          <TableHead scope="col" className="font-bold">پرداخت / رسید</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow key={booking.id} className="transition-colors hover:bg-blue-600/5">
                            <TableCell>
                              <p className="font-mono text-sm font-semibold">{`#${booking.id}`}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-semibold">
                                {(booking as any).venue_id ? getVenueName((booking as any).venue_id) : '—'}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                {formatPrice(booking.payment_amount)}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">
                                {new Date(booking.booked_at).toLocaleDateString('fa-IR')}
                              </p>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ${getBookingStatusClass(booking.status)}`}
                              >
                                {getBookingStatusLabel(booking.status)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col items-start gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${PAYMENT_MODE_CHIP_CLASS[booking.payment_mode ?? ''] ?? PAYMENT_MODE_CHIP_DEFAULT}`}
                                >
                                  <Icon icon={getPaymentModeIcon(booking.payment_mode)} aria-hidden="true" className="h-3.5 w-3.5" />
                                  {getPaymentModeLabel(booking.payment_mode)}
                                </span>
                                {booking.payment_mode === 'bank_receipt' && booking.receipt_status && booking.receipt_status !== 'none' && (
                                  <span
                                    className={cn(
                                      'inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold',
                                      RECEIPT_TONE_CLASS[getReceiptStatusTone(booking.receipt_status)],
                                    )}
                                  >
                                    {getReceiptStatusLabel(booking.receipt_status)}
                                  </span>
                                )}
                                {booking.payment_mode === 'bank_receipt' && booking.receipt_status === 'submitted' && (
                                  <button
                                    type="button"
                                    onClick={() => setReviewTarget(booking)}
                                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-amber-700 px-3 text-xs font-bold text-white transition-colors hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  >
                                    <Icon icon="mdi:receipt-text-check-outline" aria-hidden="true" className="h-4 w-4" />
                                    بررسی فیش
                                  </button>
                                )}
                                {booking.payment_mode === 'pay_in_place' && booking.status !== 'cancelled' && (
                                  <button
                                    type="button"
                                    onClick={() => setInPersonTarget(booking)}
                                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  >
                                    <Icon icon="mdi:cash-register" aria-hidden="true" className="h-4 w-4" />
                                    ثبت دریافت در محل
                                  </button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </motion.div>
            )}

            {/* Memberships Tab — مدیریت اشتراک بدنسازی */}
            {tab === 3 && (
              <motion.div
                key="memberships"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {planVenues.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
                    <div
                      className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full"
                      style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1))' }}
                    >
                      <Icon icon="mdi:weight-lifter" aria-hidden="true" className="h-8 w-8 text-blue-700 dark:text-blue-400" />
                    </div>
                    <p className="mb-2 text-base font-bold">شما سالن بدنسازی ندارید</p>
                    <p className="text-sm text-muted-foreground">مدیریت اشتراک‌ها مخصوص سالن‌های بدنسازی است.</p>
                  </div>
                ) : (
                  <>
                    {/* انتخاب سالن + دکمه پلن جدید */}
                    <div className="mb-6 rounded-2xl border border-border bg-card p-5">
                      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-12">
                        <div className="sm:col-span-7">
                          <Label htmlFor="plan-venue" className="mb-1.5 block text-xs">سالن بدنسازی</Label>
                          <Select
                            value={planVenueId === '' ? undefined : String(planVenueId)}
                            onValueChange={(v) => {
                              const id = Number(v)
                              setPlanVenueId(id)
                              fetchPlans(id)
                              fetchVenuePurchases(id)
                            }}
                          >
                            <SelectTrigger id="plan-venue" aria-label="سالن بدنسازی" className="rounded-[10px]">
                              <SelectValue placeholder="سالن بدنسازی" />
                            </SelectTrigger>
                            <SelectContent>
                              {planVenues.map((v) => (
                                <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-5">
                          <button
                            type="button"
                            onClick={() => setOpenCreatePlan(true)}
                            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-blue-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-colors hover:from-blue-700 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Icon icon="mdi:plus" aria-hidden="true" className="h-4 w-4" />
                            ایجاد پلن اشتراک
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* لیست پلن‌ها */}
                    <p className="mb-3 text-base font-bold">پلن‌های اشتراک</p>
                    {plansLoading ? (
                      <div className="py-8 text-center">
                        <span
                          role="status"
                          aria-label="در حال بارگذاری"
                          className="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent"
                        />
                      </div>
                    ) : plans.length === 0 ? (
                      <div className="mb-6 rounded-2xl border border-dashed border-border p-6 text-center">
                        <p className="text-sm text-muted-foreground">هنوز پلنی ایجاد نکرده‌اید.</p>
                      </div>
                    ) : (
                      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {plans.map((plan) => (
                          <div
                            key={plan.id}
                            className={cn(
                              'h-full rounded-2xl border border-border bg-card shadow-sm',
                              plan.is_active ? 'opacity-100' : 'opacity-55',
                            )}
                          >
                            <div className="p-5">
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <p className="truncate font-bold">{plan.title}</p>
                                <span
                                  className={cn(
                                    'inline-flex shrink-0 items-center rounded-lg px-2 py-0.5 text-xs font-semibold',
                                    plan.is_active
                                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                      : 'bg-muted text-muted-foreground',
                                  )}
                                >
                                  {plan.is_active ? 'فعال' : 'غیرفعال'}
                                </span>
                              </div>
                              <p className="mb-2 block text-xs text-muted-foreground">
                                {PLAN_TYPE_LABEL[plan.plan_type]}
                                {plan.plan_type === 'sessions_pack' && plan.sessions_count
                                  ? ` · ${new Intl.NumberFormat('fa-IR').format(plan.sessions_count)} جلسه`
                                  : ''}
                                {plan.plan_type === 'monthly' && plan.duration_days
                                  ? ` · ${new Intl.NumberFormat('fa-IR').format(plan.duration_days)} روز`
                                  : ''}
                              </p>
                              {plan.description && (
                                <p className="mb-2 text-[0.8rem] text-muted-foreground">{plan.description}</p>
                              )}
                              <p className="mb-3 text-lg font-extrabold text-primary-ink">{formatPrice(plan.price)}</p>
                              {plan.is_active && (
                                <button
                                  type="button"
                                  onClick={() => handleDeactivatePlan(plan.id)}
                                  className="inline-flex min-h-11 items-center rounded-lg border border-red-500/40 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-red-400"
                                >
                                  غیرفعال‌سازی
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* خریدهای کاربران */}
                    <p className="mb-3 text-base font-bold">خریدهای کاربران</p>
                    {purchasesLoading ? (
                      <div className="py-8 text-center">
                        <span
                          role="status"
                          aria-label="در حال بارگذاری"
                          className="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent"
                        />
                      </div>
                    ) : purchasesError ? (
                      <ErrorBox message={purchasesError} onRetry={() => { if (planVenueId) fetchVenuePurchases(planVenueId) }} />
                    ) : venuePurchases.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                        <p className="text-sm text-muted-foreground">هنوز خریدی ثبت نشده است.</p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-border bg-card">
                        <Table aria-label="اشتراک‌های خریداری‌شده">
                          <TableHeader>
                            <TableRow className="bg-muted/40">
                              <TableHead scope="col" className="font-bold">پلن</TableHead>
                              <TableHead scope="col" className="font-bold">مبلغ</TableHead>
                              <TableHead scope="col" className="font-bold">وضعیت</TableHead>
                              <TableHead scope="col" className="font-bold">جلسات باقی‌مانده</TableHead>
                              <TableHead scope="col" className="font-bold">عملیات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {venuePurchases.map((p) => {
                              const canConsume =
                                p.status === 'paid' &&
                                (p.plan_type === 'session' || p.plan_type === 'sessions_pack') &&
                                (p.sessions_remaining ?? 0) > 0
                              // چیپ وضعیت خرید پلن: جوهرِ روشنِ پالت روی کارت تیره ≈۲٫۴:۱ می‌شد،
                              // پس کلاس با variant دارک (همان واژگانِ چیپ‌های قرارداد)
                              const statusMeta = {
                                paid: { label: 'پرداخت شده', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
                                pending: { label: 'در انتظار', cls: 'bg-amber-500/15 text-amber-800 dark:text-amber-300' },
                                refunded: { label: 'بازگشت وجه شده', cls: 'bg-slate-500/15 text-slate-600 dark:text-slate-300' },
                                cancelled: { label: 'لغو شده', cls: 'bg-red-500/15 text-red-700 dark:text-red-300' },
                              }[p.status]
                              return (
                                <TableRow key={p.id} className="hover:bg-blue-600/5">
                                  <TableCell>
                                    <p className="text-sm font-semibold">{p.plan_title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {p.plan_type ? PLAN_TYPE_LABEL[p.plan_type] : ''}
                                      {p.expires_at ? ` · اعتبار تا ${new Date(p.expires_at).toLocaleDateString('fa-IR')}` : ''}
                                    </p>
                                  </TableCell>
                                  <TableCell>
                                    <p className="text-sm">{formatPrice(p.amount)}</p>
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ${statusMeta.cls}`}
                                    >
                                      {statusMeta.label}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <p className="text-sm">
                                      {p.sessions_remaining != null
                                        ? new Intl.NumberFormat('fa-IR').format(p.sessions_remaining)
                                        : '—'}
                                    </p>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {canConsume && (
                                        <button
                                          type="button"
                                          disabled={consumeId === p.id}
                                          onClick={() => handleConsume(p.id)}
                                          className="inline-flex min-h-11 items-center rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-800 px-3 text-xs font-semibold text-white transition-colors hover:from-emerald-800 hover:to-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                                        >
                                          {consumeId === p.id ? (
                                            <span role="status" aria-label="در حال بارگذاری" className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                          ) : 'کسر جلسه'}
                                        </button>
                                      )}
                                      {p.status === 'paid' && (
                                        <button
                                          type="button"
                                          disabled={refundId === p.id}
                                          onClick={() => setRefundConfirm(p)}
                                          className="inline-flex min-h-11 items-center rounded-lg border border-red-600/45 px-3 text-xs font-semibold text-red-600 transition-colors hover:border-red-600 hover:bg-red-600/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 dark:text-red-400"
                                        >
                                          {refundId === p.id ? (
                                            <span role="status" aria-label="در حال بارگذاری" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                          ) : 'بازگشت وجه'}
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => void openPurchaseEvents(p)}
                                        className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-slate-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/10"
                                      >
                                        تاریخچه
                                      </button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* Week Calendar Tab — تقویم هفتگی سانس‌ها (شنبه–جمعه) */}
            {tab === 4 && (
              <motion.div
                key="week-calendar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <SlotWeekGrid
                  venues={venues.map((v) => ({ id: v.id, name: v.name }))}
                  venueNameOf={getVenueName}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <DealPublishDialog
        open={publishOpen}
        slots={selectedDealSlots}
        venueNameOf={(vid) => getVenueName(vid)}
        onClose={() => setPublishOpen(false)}
        onPublished={() => {
          setPublishOpen(false)
          setDealSelection([])
          fetchDeals()
          fetchSlots()
        }}
      />

      {/* تأیید مسدودسازی سانس (بدون دلیل — فقط Confirm) */}
      <ConfirmModal
        open={Boolean(blockConfirmSlot)}
        onOpenChange={(v) => { if (!v) setBlockConfirmSlot(null) }}
        title="مسدود این سانس؟"
        description={
          blockConfirmSlot
            ? `سانس ${blockConfirmSlot.start_time.slice(0, 5)} از تاریخ ${blockConfirmSlot.slot_date} مسدود می‌شود و در دسترس رزرو عمومی نخواهد بود.`
            : ''
        }
        confirmText="مسدود کردن"
        cancelText="انصراف"
        variant="destructive"
        loading={slotActionBusy === (blockConfirmSlot?.id ?? -1)}
        onConfirm={() => { if (blockConfirmSlot) void handleBlockSlot(blockConfirmSlot) }}
      />

      {/* بازگشت وجه اشتراک — عملِ ویرانگر: تأیید لازم است */}
      <ConfirmModal
        open={Boolean(refundConfirm)}
        onOpenChange={(v) => { if (!v && refundId === null) setRefundConfirm(null) }}
        title="بازگشت وجه این اشتراک؟"
        description={
          refundConfirm
            ? `فاکتور «${refundConfirm.plan_title ?? '—'}» به مبلغ ${formatPrice(refundConfirm.amount)} برگشت می‌خورد. اعتبار و جلسات باقی‌مانده صفر می‌شود و ردیفِ «برگشت وجه» در دفتر کل مالی ثبت می‌گردد؛ ردیفِ درآمدِ اصلی پاک نمی‌شود.`
            : ''
        }
        confirmText="بازگشت وجه"
        cancelText="انصراف"
        variant="destructive"
        loading={refundId === (refundConfirm?.id ?? -1)}
        onConfirm={() => { if (refundConfirm) void handleRefundPurchase(refundConfirm) }}
      />

      {/* تاریخچۀ «چه کسی، کِی» یک اشتراک — ممیزیِ کسر جلسه و بازگشت وجه */}
      <Dialog
        open={Boolean(eventsFor)}
        onOpenChange={(open) => { if (!open && !eventsLoading) setEventsFor(null) }}
      >
        <DialogContent aria-label="تاریخچۀ اشتراک" aria-describedby={undefined} className="sm:max-w-lg p-0">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="text-lg font-bold">تاریخچۀ اشتراک</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {eventsFor?.plan_title ?? '—'} — هر کسر جلسه و هر بازگشت وجه با نامِ عامل و زمان ثبت می‌شود.
            </p>
          </DialogHeader>
          <div className="px-5">
            {eventsLoading ? (
              <div className="flex items-center gap-2 py-6">
                <span role="status" aria-label="در حال بارگذاری" className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
              </div>
            ) : purchaseEvents.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">هنوز اقدامی روی این اشتراک ثبت نشده است.</p>
            ) : (
              <div>
                {purchaseEvents.map((ev) => (
                  <div key={ev.id} className="border-t border-border py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: ev.event_type === 'refunded' ? 'rgba(71,85,105,0.12)' : 'rgba(5,150,105,0.12)',
                          color: ev.event_type === 'refunded' ? '#475569' : '#047857',
                        }}
                      >
                        {ev.event_type === 'refunded' ? 'بازگشت وجه' : 'کسر جلسه'}
                      </span>
                      <p className="text-sm">
                        {new Date(ev.created_at).toLocaleDateString('fa-IR')}
                        {' · '}
                        {new Date(ev.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="mt-1 block text-xs text-muted-foreground">
                      {`عامل: ${ev.actor_name ?? '—'}`}
                      {ev.sessions_remaining_after != null
                        ? ` · باقی‌مانده: ${new Intl.NumberFormat('fa-IR').format(ev.sessions_remaining_after)}`
                        : ''}
                      {ev.amount != null ? ` · مبلغ: ${formatPrice(ev.amount)}` : ''}
                    </p>
                    {ev.detail && (
                      <p className="mt-0.5 block text-xs">{`دلیل: ${ev.detail}`}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="px-5 pb-5">
            <button
              type="button"
              onClick={() => setEventsFor(null)}
              className="inline-flex min-h-11 items-center rounded-[10px] px-4 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              بستن
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* اقدام گروهی روی رزروهای در انتظار تأیید — حلقه‌ی endpointهای تکی */}
      <ConfirmModal
        open={bulkAction !== null}
        onOpenChange={(v) => { if (!v) setBulkAction(null) }}
        title={bulkAction === 'confirm' ? 'تأیید انتخاب‌شده‌ها' : 'رد انتخاب‌شده‌ها'}
        description={
          bulkAction === 'confirm'
            ? `${faDigits(pendingSelection.length)} رزرو در انتظار تأیید در دیتابیس ثبت خواهند شد. در صورت خطای هر مورد، پیام سرور نمایش داده می‌شود.`
            : `${faDigits(pendingSelection.length)} رزرو رد و سانس‌های مربوط آزاد خواهند شد. این عمل قابل بازگشت نیست.`
        }
        confirmText={bulkAction === 'confirm' ? 'تأیید همه' : 'رد همه'}
        variant={bulkAction === 'reject' ? 'destructive' : 'default'}
        loading={bulkBusy}
        onConfirm={() => void bulkApply()}
      />

      {/* Create Venue Dialog */}
      <Dialog open={openCreateVenue} onOpenChange={(open) => { if (!open) setOpenCreateVenue(false) }}>
        <DialogContent
          aria-label={editingVenueId ? 'ویرایش سالن' : 'افزودن سالن جدید'}
          aria-describedby={undefined}
          className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          <div
            className="px-5 py-5"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
          >
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Icon icon="mdi:store-plus" aria-hidden="true" className="h-5 w-5" />
              {editingVenueId ? 'ویرایش سالن' : 'افزودن سالن جدید'}
            </DialogTitle>
          </div>
          <div className="px-5 pb-2 pt-5">
            <div className="mb-5 space-y-1.5">
              <Label htmlFor="venue-name">نام سالن</Label>
              <Input
                id="venue-name"
                value={newVenue.name}
                onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
              />
            </div>
            <div className="mb-5 space-y-1.5">
              <Label htmlFor="venue-address">آدرس</Label>
              <Input
                id="venue-address"
                value={newVenue.address}
                onChange={(e) => setNewVenue({ ...newVenue, address: e.target.value })}
              />
            </div>
            <div className="mb-5 space-y-1.5">
              <Label htmlFor="venue-phone">شماره تماس</Label>
              <Input
                id="venue-phone"
                dir="ltr"
                placeholder="09xxxxxxxxx"
                value={newVenue.phone}
                onChange={(e) => setNewVenue({ ...newVenue, phone: e.target.value })}
              />
            </div>
            <div className="mb-5">
              <Label htmlFor="venue-payment-mode" className="mb-1.5 block">روش پرداخت</Label>
              <Select
                value={newVenue.payment_mode}
                onValueChange={(v) => setNewVenue({ ...newVenue, payment_mode: v })}
              >
                <SelectTrigger id="venue-payment-mode" aria-label="روش پرداخت" className="rounded-[10px]">
                  <SelectValue placeholder="روش پرداخت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gateway">درگاه آنلاین</SelectItem>
                  <SelectItem value="bank_receipt">فیش واریزی (پیش‌فرض)</SelectItem>
                  <SelectItem value="pay_in_place">پرداخت در محل</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1.5 block text-xs text-muted-foreground">
                {newVenue.payment_mode === 'gateway'
                  ? 'کاربر هنگام رزرو، آنلاین از طریق درگاه پرداخت می‌کند.'
                  : newVenue.payment_mode === 'pay_in_place'
                    ? 'مبلغ هنگام حضور در سالن به‌صورت نقدی یا کارت‌خوان دریافت می‌شود.'
                    : 'کاربر تصویر فیش واریزی را ارسال می‌کند و مدیر آن را تأیید یا رد می‌کند.'}
              </p>
            </div>
            <div className="mb-5 space-y-1.5">
              <Label htmlFor="venue-description">توضیحات</Label>
              <textarea
                id="venue-description"
                rows={3}
                value={newVenue.description}
                onChange={(e) => setNewVenue({ ...newVenue, description: e.target.value })}
                className="flex min-h-[88px] w-full rounded-xl border border-input bg-card px-4 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            {/* امکانات سالن */}
            <div className="mb-5">
              <p className="mb-2 text-sm font-semibold">امکانات سالن</p>
              <div className="mb-3 flex gap-2">
                <Input
                  aria-label="افزودن امکان جدید"
                  placeholder="مثلاً: پارکینگ، دوش، رختکن..."
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }}
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="inline-flex min-h-12 shrink-0 items-center rounded-xl border border-blue-600/30 px-4 text-sm font-semibold text-primary-ink transition-colors hover:bg-blue-600/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  افزودن
                </button>
              </div>
              {newVenue.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {newVenue.amenities.map(a => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-600/10 py-0.5 ps-2 pe-0.5 text-xs font-medium text-primary-ink"
                    >
                      {a}
                      <button
                        type="button"
                        onClick={() => removeAmenity(a)}
                        aria-label={`حذف ${a}`}
                        className="flex h-11 w-11 -m-1.5 items-center justify-center rounded-full text-primary-ink transition-colors hover:bg-blue-600/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Icon icon="mdi:close" aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* عکس‌های سالن */}
            <div className="mb-1">
              <p className="mb-2 text-sm font-semibold">
                عکس‌های سالن <span className="text-xs font-normal text-muted-foreground">(حداکثر ۱۰ عکس، هرکدام تا ۵MB)</span>
              </p>
              <label
                htmlFor="venue-image-upload"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleImageUpload(e.dataTransfer.files) }}
                className="block cursor-pointer rounded-xl border-2 border-dashed border-blue-600/25 bg-blue-600/5 p-6 text-center transition-colors hover:border-blue-600/50 hover:bg-blue-600/10 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
              >
                {uploadingImages ? (
                  <span
                    role="status"
                    aria-label="در حال بارگذاری"
                    className="mx-auto block h-8 w-8 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent"
                  />
                ) : (
                  <span className="block">
                    <Icon icon="mdi:camera-plus-outline" aria-hidden="true" className="mx-auto h-8 w-8 text-blue-700 dark:text-blue-400" />
                    <span className="mt-2 block text-sm text-muted-foreground">
                      برای انتخاب عکس کلیک کنید یا بکشید و رها کنید
                    </span>
                  </span>
                )}
                <input
                  id="venue-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  // sr-only (نه display:none) تا با کیبورد قابل تمرکز بماند و Enter فایل باز کند
                  style={{
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    padding: 0,
                    border: 0,
                    overflow: 'hidden',
                    clip: 'rect(0 0 0 0)',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { handleImageUpload(e.target.files); e.target.value = '' }}
                />
              </label>
              {newVenue.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {newVenue.images.map((img, i) => (
                    <div key={i} className="relative h-20 w-20 overflow-hidden rounded-[10px] border border-border">
                      <img src={img} alt={`عکس ${i + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(img)}
                        aria-label={`حذف عکس ${i + 1}`}
                        className="absolute end-0 top-0 flex h-11 w-11 items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="ms-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white">
                          <Icon icon="mdi:close" aria-hidden="true" className="h-3 w-3" />
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 px-5 pb-5">
            <button
              type="button"
              onClick={() => setOpenCreateVenue(false)}
              className="inline-flex min-h-11 items-center rounded-[10px] border border-border px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSaveVenue}
              disabled={savingVenue}
              className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-gradient-to-br from-blue-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-colors hover:from-blue-700 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {savingVenue ? (
                <span role="status" aria-label="در حال بارگذاری" className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : editingVenueId ? 'ذخیره تغییرات' : 'ایجاد سالن'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Slots Dialog */}
      <Dialog open={openGenerateSlots} onOpenChange={(open) => { if (!open) setOpenGenerateSlots(false) }}>
        <DialogContent aria-label="ایجاد سانس برای سالن" aria-describedby={undefined} className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <div className="px-5 py-5" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Icon icon="mdi:calendar-plus" aria-hidden="true" className="h-5 w-5" />
              ایجاد سانس برای {selectedVenue?.name}
            </DialogTitle>
          </div>
          <div className="px-5 pb-2 pt-5">
            <PersianDatePicker label="تاریخ" value={slotDate} onChange={setSlotDate} />
          </div>
          <DialogFooter className="gap-2 px-5 pb-5">
            <button
              type="button"
              onClick={() => setOpenGenerateSlots(false)}
              className="inline-flex min-h-11 items-center rounded-[10px] border border-border px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleGenerateSlots}
              className="inline-flex min-h-11 items-center rounded-[10px] bg-gradient-to-br from-emerald-700 to-emerald-800 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-colors hover:from-emerald-800 hover:to-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              ایجاد سانس‌ها
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Plan Dialog — پلن اشتراک بدنسازی */}
      <Dialog open={openCreatePlan} onOpenChange={(open) => { if (!open && !savingPlan) setOpenCreatePlan(false) }}>
        <DialogContent aria-label="پلن اشتراک جدید" aria-describedby={undefined} className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <div className="px-5 py-5" style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Icon icon="mdi:card-account-details-star" aria-hidden="true" className="h-5 w-5" />
              پلن اشتراک جدید
            </DialogTitle>
          </div>
          <div className="flex flex-col gap-5 px-5 pb-2 pt-5">
            <div className="space-y-1.5">
              <Label htmlFor="plan-title">عنوان پلن</Label>
              <Input
                id="plan-title"
                placeholder="مثلاً: اشتراک ماهانه"
                value={newPlan.title}
                onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-type">نوع پلن</Label>
              <Select
                value={newPlan.plan_type}
                onValueChange={(v) => setNewPlan({ ...newPlan, plan_type: v as PlanType })}
              >
                <SelectTrigger id="plan-type" aria-label="نوع پلن">
                  <SelectValue placeholder="نوع پلن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">جلسه‌ای (تکی)</SelectItem>
                  <SelectItem value="sessions_pack">پک جلسه‌ای</SelectItem>
                  <SelectItem value="monthly">ماهانه (مدت‌دار)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-price">قیمت (ریال)</Label>
              <Input
                id="plan-price"
                type="number"
                dir="ltr"
                value={newPlan.price}
                onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
              />
            </div>
            {newPlan.plan_type === 'sessions_pack' && (
              <div className="space-y-1.5">
                <Label htmlFor="plan-sessions">تعداد جلسات</Label>
                <Input
                  id="plan-sessions"
                  type="number"
                  dir="ltr"
                  value={newPlan.sessions_count}
                  onChange={(e) => setNewPlan({ ...newPlan, sessions_count: e.target.value })}
                />
              </div>
            )}
            {newPlan.plan_type === 'monthly' && (
              <div className="space-y-1.5">
                <Label htmlFor="plan-duration">مدت اعتبار (روز)</Label>
                <Input
                  id="plan-duration"
                  type="number"
                  dir="ltr"
                  value={newPlan.duration_days}
                  onChange={(e) => setNewPlan({ ...newPlan, duration_days: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="plan-description">توضیحات (اختیاری)</Label>
              <textarea
                id="plan-description"
                rows={2}
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                className="flex min-h-[64px] w-full rounded-xl border border-input bg-card px-4 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 px-5 pb-5">
            <button
              type="button"
              onClick={() => setOpenCreatePlan(false)}
              className="inline-flex min-h-11 items-center rounded-[10px] border border-border px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleCreatePlan}
              disabled={savingPlan}
              className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-gradient-to-br from-blue-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-colors hover:from-blue-700 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {savingPlan ? (
                <span role="status" aria-label="در حال بارگذاری" className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : 'ایجاد پلن'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptReviewDialog
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        bookingId={reviewTarget?.id ?? null}
        venueName={reviewTarget ? getVenueName((reviewTarget as any).venue_id) : undefined}
        onDone={() => { fetchBookings(); fetchPending() }}
      />

      <InPersonCollectDialog
        open={Boolean(inPersonTarget)}
        onClose={() => setInPersonTarget(null)}
        bookingId={inPersonTarget?.id ?? null}
        defaultAmount={inPersonTarget?.payment_amount}
        venueName={inPersonTarget ? getVenueName((inPersonTarget as any).venue_id) : undefined}
        onDone={() => { fetchBookings(); fetchPending() }}
      />
    </Layout>
  )
}

export default ManagerDashboard
