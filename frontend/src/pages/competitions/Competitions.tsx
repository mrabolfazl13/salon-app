import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/authStore'
import { venueService } from '@/services/venue'
import { slotService } from '@/services/slot'
import type { Slot } from '@/services/slot'
import { competitionService } from '@/services/competition'
import { formatPrice } from '@/lib/utils'
import PersianDatePicker from '@/components/ui/PersianDatePicker'
import Dialog from '@/components/ui/Dialog'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Badge } from '@/components/ui/shadcn/badge'
import { Button } from '@/components/ui/shadcn/button'
import { Card, CardContent } from '@/components/ui/shadcn/card'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import toast from 'react-hot-toast'

type SlotBadgeVariant = 'default' | 'primary' | 'success' | 'destructive' | 'outline' | 'muted'

const slotStatusConfig: Record<string, { label: string; variant: SlotBadgeVariant }> = {
  available: { label: 'آزاد', variant: 'success' },
  booked: { label: 'رزرو شده', variant: 'destructive' },
  blocked: { label: 'مسدود', variant: 'muted' },
  in_competition: { label: 'در حال رقابت', variant: 'default' },
  reserved: { label: 'رزرو قرارداد', variant: 'primary' },
  unknown: { label: 'نامشخص', variant: 'muted' },
}

const Competitions: React.FC = () => {
  const { user } = useAuthStore()
  const isManager =
    user?.role === 'venue_manager' || user?.role === 'club_admin' || user?.role === 'super_admin'

  const [venues, setVenues] = useState<Array<{ id: number; name: string }>>([])
  const [venueId, setVenueId] = useState<number | ''>('')
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingVenues, setLoadingVenues] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [bestBids, setBestBids] = useState<Record<number, number | null>>({})
  const [startTarget, setStartTarget] = useState<Slot | null>(null)
  const [offerPrice, setOfferPrice] = useState<number>(0)
  const [starting, setStarting] = useState(false)

  const fetchMyVenues = useCallback(async () => {
    setLoadingVenues(true)
    try {
      const data = await venueService.getMyVenues()
      const list = Array.isArray(data) ? data.map((v: any) => ({ id: v.id, name: v.name })) : []
      setVenues(list)
      if (list.length > 0) setVenueId(list[0].id)
    } catch (err) {
      toast.error('دریافت سالن‌های شما ممکن نشد')
    } finally {
      setLoadingVenues(false)
    }
  }, [])

  useEffect(() => {
    if (isManager) fetchMyVenues()
  }, [isManager, fetchMyVenues])

  const fetchSlots = useCallback(async () => {
    if (!venueId || !date) return
    setLoadingSlots(true)
    try {
      const data = await slotService.getByVenueAndDate(venueId, date)
      const list = Array.isArray(data) ? data : []
      setSlots(list)

      // بهترین پیشنهاد برای سانس‌های در حال رقابت
      const inCompetition = list.filter((s) => s.status === 'in_competition')
      const bids: Record<number, number | null> = {}
      await Promise.all(
        inCompetition.map(async (s) => {
          try {
            const res = await competitionService.getBestBid(s.id)
            bids[s.id] = res?.best_price ?? null
          } catch {
            bids[s.id] = null
          }
        })
      )
      setBestBids(bids)
    } catch (err) {
      toast.error('دریافت سانس‌ها ممکن نشد')
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [venueId, date])

  useEffect(() => {
    if (isManager && venueId) fetchSlots()
  }, [isManager, venueId, fetchSlots])

  const openStartDialog = (slot: Slot) => {
    setStartTarget(slot)
    // پیشنهاد اولیه: ۱۰٪ کمتر از قیمت فعلی، گرد شده به هزار
    setOfferPrice(Math.floor((slot.current_price * 0.9) / 1000) * 1000)
  }

  const handleStart = async () => {
    if (!startTarget) return
    if (offerPrice <= 0) {
      toast.error('قیمت پیشنهادی معتبر نیست')
      return
    }
    setStarting(true)
    try {
      await competitionService.start({ slotId: startTarget.id, offeredPrice: offerPrice })
      toast.success('رقابت قیمت با موفقیت شروع شد!')
      setStartTarget(null)
      await fetchSlots()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در شروع رقابت')
    } finally {
      setStarting(false)
    }
  }

  const slotEndTime = (slot: Slot) => {
    const [h, m] = (slot.start_time || '00:00').split(':').map(Number)
    const total = (h || 0) * 60 + (m || 0) + (slot.duration || 90)
    const endH = Math.floor(total / 60) % 24
    const endM = total % 60
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  }

  // ===== حالت غیر مدیر =====
  if (!isManager) {
    return (
      <Layout>
        <div className="mx-auto max-w-[560px] py-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-600/10">
              <Icon icon="mdi:trophy-outline" className="h-12 w-12 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-foreground">
              رقابت قیمت
            </h1>
            <p className="mb-8 text-sm leading-[1.8] text-muted-foreground">
              مدیران سالن برای سانس‌های آزادشان رقابت قیمت راه‌اندازی می‌کنند. شما می‌توانید در
              صفحهٔ هر سالن، سانس‌های «در حال رقابت» را با برچسب «رقابت با بقیه» پیدا کنید و
              پیشنهاد قیمت کمتری ثبت کنید؛ در پایان رقابت، کمترین پیشنهاد برنده می‌شود.
            </p>
            <Button asChild variant="primary" size="lg">
              <Link to="/venues">
                <Icon icon="mdi:store-search" className="h-5 w-5" aria-hidden="true" />
                مشاهده سالن‌ها
              </Link>
            </Button>
          </motion.div>
        </div>
      </Layout>
    )
  }

  // ===== حالت مدیر =====
  return (
    <Layout>
      <div className="py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-1 text-2xl font-bold text-foreground md:text-3xl">
            رقابت قیمت
          </h1>
          <p className="mb-6 text-muted-foreground">
            برای سانس‌های آزاد سالن خود رقابت قیمت راه‌اندازی کنید
          </p>
        </motion.div>

        <Alert variant="info" className="mb-6 rounded-2xl">
          <Icon icon="mdi:information-outline" aria-hidden="true" />
          <AlertDescription>
            رقابت ۲۴ ساعت ادامه دارد و در پایان آن، کمترین قیمت پیشنهادی برنده می‌شود و قیمت سانس
            به همان میزان تنظیم خواهد شد.
          </AlertDescription>
        </Alert>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
              <div className="sm:col-span-6">
                {loadingVenues ? (
                  <Skeleton aria-hidden="true" className="h-14 rounded-[10px]" />
                ) : venues.length === 0 ? (
                  <Alert variant="warning" className="rounded-[10px]">
                    <Icon icon="mdi:alert-outline" aria-hidden="true" />
                    <AlertDescription>
                      هنوز سالنی ندارید. ابتدا از پنل مدیریت سالن‌ها سالن خود را ایجاد کنید.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="competition-venue">سالن</Label>
                    <Select
                      value={venueId === '' ? undefined : String(venueId)}
                      onValueChange={(v) => setVenueId(Number(v))}
                    >
                      <SelectTrigger id="competition-venue" className="rounded-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {venues.map((v) => (
                          <SelectItem key={v.id} value={String(v.id)}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="sm:col-span-4">
                <PersianDatePicker
                  label="تاریخ"
                  value={date}
                  onChange={setDate}
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  variant="outline"
                  onClick={fetchSlots}
                  disabled={loadingSlots || !venueId}
                  className="w-full rounded-[10px]"
                >
                  <Icon icon="mdi:refresh" className="h-5 w-5" aria-hidden="true" />
                  {loadingSlots ? 'در حال...' : 'به‌روزرسانی'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Slots */}
        {loadingSlots ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} aria-hidden="true" className="h-[190px] rounded-2xl" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <Card className="py-6 text-center">
            <CardContent className="px-4 text-center">
              <Icon
                icon="mdi:calendar-clock-outline"
                className="h-10 w-10 text-muted-foreground/50"
                aria-hidden="true"
              />
              <h2 className="mb-1 mt-4 text-lg font-semibold text-foreground">
                سانسی برای این تاریخ ثبت نشده است
              </h2>
              <p className="text-sm text-muted-foreground">
                از پنل مدیریت سالن‌ها، سانس‌های روز مورد نظر را تولید کنید
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {slots.map((slot, index) => {
              const conf = slotStatusConfig[slot.status] ?? slotStatusConfig.unknown
              return (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="h-full rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-foreground">
                          {slot.start_time} - {slotEndTime(slot)}
                        </h3>
                        <Badge variant={conf.variant} className="rounded-lg">{conf.label}</Badge>
                      </div>

                      <p className="mb-4 text-sm text-muted-foreground">
                        مدت: {slot.duration} دقیقه
                      </p>

                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground">
                          قیمت فعلی سانس
                        </p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(slot.current_price)}
                        </p>
                      </div>

                      {slot.status === 'in_competition' && (
                        <div className="mb-4 flex items-center justify-between rounded-[10px] bg-amber-500/10 p-3">
                          <p className="text-xs text-muted-foreground">
                            بهترین پیشنهاد
                          </p>
                          <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                            {bestBids[slot.id] != null
                              ? formatPrice(bestBids[slot.id] as number)
                              : 'هنوز پیشنهادی ثبت نشده'}
                          </p>
                        </div>
                      )}

                      <Button
                        variant="primary"
                        disabled={slot.status !== 'available'}
                        onClick={() => openStartDialog(slot)}
                        className="w-full rounded-[10px]"
                      >
                        <Icon icon="mdi:gavel" className="h-4 w-4" aria-hidden="true" />
                        شروع رقابت
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Start Competition Dialog */}
      <Dialog
        open={Boolean(startTarget)}
        onClose={() => { if (!starting) setStartTarget(null) }}
        maxWidth="xs"
        title="شروع رقابت قیمت"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setStartTarget(null)}
              disabled={starting}
              className="flex-1 rounded-[10px]"
            >
              انصراف
            </Button>
            <Button
              variant="primary"
              onClick={handleStart}
              disabled={starting}
              className="flex-1 rounded-[10px]"
            >
              {starting ? (
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                  role="status"
                  aria-label="در حال بارگذاری"
                />
              ) : 'شروع رقابت'}
            </Button>
          </>
        }
      >
        {startTarget && (
          <div>
            <div className="mb-6 text-center">
              <p className="mb-1 text-sm text-muted-foreground">
                سانس {startTarget.start_time} - {slotEndTime(startTarget)}
              </p>
              <p className="text-sm text-muted-foreground">
                قیمت فعلی: {formatPrice(startTarget.current_price)}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="competition-offer-price">قیمت پیشنهادی (ریال)</Label>
              <Input
                id="competition-offer-price"
                type="number"
                min={1000}
                step={1000}
                value={offerPrice}
                onChange={(e) => setOfferPrice(Number(e.target.value))}
                className="rounded-[10px]"
              />
              <p className="text-xs text-muted-foreground">هرچه قیمت پیشنهادی کمتر باشد، شانس برنده شدن بیشتر است</p>
            </div>
          </div>
        )}
      </Dialog>
    </Layout>
  )
}

export default Competitions
