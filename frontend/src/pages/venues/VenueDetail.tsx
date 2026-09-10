// src/pages/venues/VenueDetail.tsx — جزئیات سالن: موبایل‌فرست (گالری/تاریخ/سانس/CTA) + دسکتاپ تب‌دار
import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  IconButton,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import TimeSlotPicker from '@/components/booking/TimeSlotPicker'
import ReviewSection from '@/components/venue/ReviewSection'
import PlanCards from '@/components/membership/PlanCards'
import MembershipPurchaseDialog from '@/components/membership/MembershipPurchaseDialog'
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
import { venueService } from '@/services/venue'
import { slotService } from '@/services/slot'
import { formatPrice, formatTimeFa, getSlotEndTime } from '@/lib/utils'
import { parseList, toFullUrl } from '@/utils/venueMedia'
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore'
import { gradients, radii, shadows } from '@/theme'
import toast from 'react-hot-toast'

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

const VenueDetail: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
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

  const dates = useMemo(() => buildDateOptions(14), [])
  const isGym = venue?.category === 'gym'
  const minPlanPrice = plans.length > 0 ? Math.min(...plans.map((p) => p.price)) : null

  useEffect(() => {
    fetchVenueData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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
        const slotsData = await slotService.getByVenueAndDateRange(Number(id), startDate, endDate)
        setSlots(slotsData || [])
      }
    } catch (error) {
      toast.error('خطا در دریافت اطلاعات سالن')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyPlan = (plan: MembershipPlan) => {
    if (!isAuthenticated) {
      toast('ابتدا وارد حساب خود شوید', { icon: '🔐' })
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
    setBookingLoading(true)
    try {
      await bookingService.create({ slotId: selectedSlot.id })
      toast.success('رزرو شما ثبت شد و در انتظار تایید مدیر سالن است ⏳', { duration: 5000 })
      await fetchVenueData()
      setSelectedSlot(null)
      setConfirmOpen(false)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در رزرو')
    } finally {
      setBookingLoading(false)
    }
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

  const handleCta = () => {
    if (!selectedSlot) {
      toast('ابتدا یک سانس را انتخاب کنید', { icon: '👆' })
      return
    }
    setConfirmOpen(true)
  }

  if (loading) {
    return (
      <Layout>
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <VenueDetailSkeleton />
        </Box>
      </Layout>
    )
  }

  if (!venue) {
    return (
      <Layout>
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)' }}>
          <Container maxWidth="lg" sx={{ py: 8 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/venues')}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                mb: 3,
              }}
            >
              <Icon icon="mdi:arrow-right" className="h-5 w-5 ml-2" />
              بازگشت به لیست سالن‌ها
            </Button>
            <Alert severity="error" sx={{ borderRadius: '12px' }}>
              سالن مورد نظر یافت نشد یا حذف شده است.
            </Alert>
          </Container>
        </Box>
      </Layout>
    )
  }

  const amenities: string[] = safeJsonParse(venue.amenities, [])
  const images: string[] = parseList(venue.images)
  const mainImage = images[0] ? toFullUrl(images[0]) : ''

  return (
    <Layout>
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)' }}>
        {/* ==================== موبایل: گالری هیرو ==================== */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Box
            sx={{
              position: 'relative',
              height: 260,
              overflow: 'hidden',
              bgcolor: 'grey.100',
            }}
          >
            {images.length > 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  height: '100%',
                  overflowX: 'auto',
                  scrollSnapType: 'x mandatory',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' },
                }}
              >
                {images.map((img, i) => (
                  <Box
                    key={i}
                    component="img"
                    src={toFullUrl(img)}
                    alt={`${venue.name} ${i + 1}`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      flexShrink: 0,
                      scrollSnapAlign: 'start',
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  background: gradients.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon icon="mdi:stadium-variant" style={{ width: 72, height: 72, color: 'rgba(255,255,255,0.35)' }} />
              </Box>
            )}
            {/* هدر شیشه‌ای روی گالری: بازگشت + قلب */}
            <Box
              sx={{
                position: 'absolute',
                top: 'calc(12px + env(safe-area-inset-top))',
                insetInlineStart: 12,
                insetInlineEnd: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 2,
              }}
            >
              <IconButton
                onClick={() => navigate(-1)}
                aria-label="بازگشت"
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(8px)',
                  color: '#0f172a',
                  boxShadow: shadows.card,
                  '&:hover': { bgcolor: '#fff' },
                }}
              >
                <Icon icon="mdi:arrow-right" style={{ width: 24, height: 24 }} />
              </IconButton>
              <FavoriteButton venue={{ id: venue.id, name: venue.name }} size="md" />
            </Box>
            {venue.is_verified && (
              <Chip
                icon={<Icon icon="mdi:shield-check" style={{ width: 16, height: 16 }} />}
                label="تأیید شده"
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  insetInlineStart: 12,
                  zIndex: 2,
                  bgcolor: 'rgba(76,175,80,0.92)',
                  color: 'white',
                  fontWeight: 700,
                  borderRadius: '10px',
                  '& .MuiChip-icon': { color: 'white' },
                }}
              />
            )}
          </Box>

          {/* ==================== موبایل: اطلاعات اصلی ==================== */}
          <Box sx={{ px: 2, pt: 2, pb: 26, maxWidth: 640, mx: 'auto' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0f172a', lineHeight: 1.5 }}>
              {venue.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.75, flexWrap: 'wrap' }}>
              <MobileRating value={venue.average_rating || 0} count={venue.total_reviews || 0} size="md" />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                <Icon icon="mdi:map-marker-outline" style={{ width: 18, height: 18, color: '#64748b' }} />
                <Typography variant="body2" sx={{ color: '#64748b', minWidth: 0 }}>
                  {venue.address}
                </Typography>
              </Box>
            </Box>

            {amenities.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
                {amenities.map((a) => (
                  <Chip
                    key={a}
                    label={a}
                    size="small"
                    icon={<Icon icon="mdi:check-circle-outline" style={{ width: 15, height: 15 }} />}
                    sx={{
                      borderRadius: '10px',
                      bgcolor: 'rgba(37,99,235,0.07)',
                      color: '#2563eb',
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: '#2563eb' },
                    }}
                  />
                ))}
              </Box>
            )}

            {venue.description && (
              <Paper
                elevation={0}
                sx={{ mt: 2, p: 2, borderRadius: `${radii.card}px`, bgcolor: 'background.paper', border: '1px solid rgba(15,23,42,0.06)' }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75 }}>درباره سالن</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.9 }}>
                  {venue.description}
                </Typography>
              </Paper>
            )}

            {isGym ? (
              /* باشگاه: پلن‌های اشتراک (جلسه‌ای / پک / ماهانه) به‌جای سانس */
              <Box sx={{ mt: 3 }}>
                <SectionHeader title="🎟️ خرید اشتراک" subtitle="بدون نیاز به رزرو سانس" />
                {plans.length === 0 ? (
                  <EmptyState
                    emoji="🏋️"
                    title="پلن اشتراکی تعریف نشده"
                    description="هنوز مدیر این باشگاه پلن اشتراکی ثبت نکرده است. برای اطلاع از قیمت‌ها تماس بگیرید."
                  />
                ) : (
                  <PlanCards plans={plans} onBuy={handleBuyPlan} compact />
                )}
              </Box>
            ) : (
              <>
                {/* انتخاب تاریخ — اسکرول افقی */}
                <Box sx={{ mt: 3 }}>
                  <SectionHeader title="📅 انتخاب تاریخ" subtitle="۱۴ روز آینده" />
                  <DateSelector dates={dates} value={selectedDate} onChange={setSelectedDate} />
                </Box>

                {/* سانس‌های روز انتخابی */}
                <Box sx={{ mt: 3 }}>
                  <SectionHeader
                    title="🕐 سانس‌ها"
                    subtitle={daySlots.length > 0 ? `${daySlots.length} سانس در ${dateLabel}` : dateLabel}
                  />
                  {daySlots.length === 0 ? (
                    <EmptyState
                      emoji="😴"
                      title="در این روز سانسی موجود نیست"
                      description="تاریخ دیگری را انتخاب کنید یا به روزهای بعد سر بزنید."
                    />
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {daySlots.map((s) => (
                        <TimeSlot
                          key={s.id}
                          slot={s}
                          selected={selectedSlot?.id === s.id}
                          onSelect={(slot) => setSelectedSlot(slot)}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </>
            )}

            {/* تماس و موقعیت — اطلاعات ثانویه */}
            <Paper
              elevation={0}
              sx={{ mt: 3, borderRadius: `${radii.card}px`, bgcolor: 'background.paper', border: '1px solid rgba(15,23,42,0.06)', overflow: 'hidden' }}
            >
              <List sx={{ p: 0 }}>
                {venue.phone && (
                <ListItem
                  sx={{ px: 2, py: 1.75, borderBottom: '1px solid rgba(15,23,42,0.05)' }}
                  secondaryAction={
                    <Button
                      href={`tel:${venue.phone}`}
                      size="small"
                      sx={{ textTransform: 'none', fontWeight: 700, color: '#2563eb' }}
                    >
                      تماس
                    </Button>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 42 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon icon="mdi:phone-outline" style={{ width: 18, height: 18, color: '#2563eb' }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={venue.phone}
                    secondary="شماره تماس سالن"
                    slotProps={{
                      primary: { sx: { fontWeight: 700, fontSize: '0.9rem' } },
                      secondary: { sx: { fontSize: '0.75rem' } },
                    }}
                  />
                </ListItem>
                )}
                <ListItem sx={{ px: 2, py: 1.75 }}>
                  <ListItemIcon sx={{ minWidth: 42 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon icon="mdi:map-marker-outline" style={{ width: 18, height: 18, color: '#2563eb' }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={venue.address}
                    secondary="آدرس سالن"
                    slotProps={{
                      primary: { sx: { fontWeight: 600, fontSize: '0.85rem' } },
                      secondary: { sx: { fontSize: '0.75rem' } },
                    }}
                  />
                </ListItem>
              </List>
            </Paper>

            {/* نظرات */}
            <Box sx={{ mt: 3 }}>
              <SectionHeader title="⭐ نظرات کاربران" />
              <ReviewSection
                venueId={venue.id}
                averageRating={venue.average_rating}
                totalReviews={venue.total_reviews}
                onRatingChange={(avg, total) => {
                  setVenue((prev: any) => (prev ? { ...prev, average_rating: avg, total_reviews: total } : prev))
                }}
              />
            </Box>
          </Box>

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
        </Box>

        {/* ==================== دسکتاپ: هیرو + تب‌ها (بدون تغییر) ==================== */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ position: 'relative', height: 400, overflow: 'hidden' }}>
            {mainImage ? (
              <img src={mainImage} alt={venue.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Box sx={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon icon="mdi:stadium-variant" className="h-24 w-24" style={{ color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            )}
            <Box sx={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
            }} />
            <Container maxWidth="lg" sx={{ position: 'relative', height: '100%', zIndex: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', pb: 4 }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <Button
                    variant="text"
                    onClick={() => navigate('/venues')}
                    sx={{ color: 'rgba(255,255,255,0.8)', mb: 2, textTransform: 'none', '&:hover': { color: 'white' } }}
                  >
                    <Icon icon="mdi:arrow-right" className="h-5 w-5 ml-1" />
                    بازگشت به لیست سالن‌ها
                  </Button>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 1, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                    {venue.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Icon icon="mdi:map-marker" className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{venue.address}</Typography>
                    </Box>
                    {venue.average_rating > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: '8px', px: 1.5, py: 0.3 }}>
                        <Rating value={venue.average_rating} readOnly precision={0.5} size="small" sx={{ '& .MuiRating-icon': { color: '#fbbf24' } }} />
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
                          {venue.average_rating.toFixed(1)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                          ({venue.total_reviews})
                        </Typography>
                      </Box>
                    )}
                    <Chip
                      icon={<Icon icon={venue.is_verified ? 'mdi:shield-check' : 'mdi:shield-alert-outline'} className="h-4 w-4" />}
                      label={venue.is_verified ? 'تایید شده' : 'در انتظار تایید'}
                      color={venue.is_verified ? 'success' : 'warning'}
                      size="small"
                      sx={{ borderRadius: '8px', fontWeight: 600, bgcolor: venue.is_verified ? 'rgba(76,175,80,0.9)' : 'rgba(255,152,0,0.9)', color: 'white' }}
                    />
                  </Box>
                </motion.div>
              </Box>
            </Container>
          </Box>

          <Container maxWidth="lg" sx={{ mt: -2, position: 'relative', zIndex: 2 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Grid container spacing={3}>
                {/* Main Content */}
                <Grid size={{ xs: 12, lg: 8 }}>
                  <Card sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Tabs
                        value={tab}
                        onChange={(_, newValue) => setTab(newValue)}
                        sx={{
                          mb: 3,
                          minHeight: 48,
                          '& .MuiTabs-indicator': { display: 'none' },
                          '& .MuiTab-root': {
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 600,
                            minHeight: 48,
                            py: 1,
                            color: 'text.secondary',
                            '&.Mui-selected': {
                              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                              color: 'white',
                            },
                          },
                        }}
                      >
                        <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Icon icon="mdi:information" className="h-4 w-4" />اطلاعات</Box>} />
                        <Tab
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Icon icon={isGym ? 'mdi:card-account-details-star' : 'mdi:calendar-clock'} className="h-4 w-4" />
                              {isGym ? 'اشتراک‌ها' : 'سانس‌ها'}
                            </Box>
                          }
                        />
                        <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Icon icon="mdi:star" className="h-4 w-4" />نظرات</Box>} />
                      </Tabs>

                      {tab === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                          {/* Description */}
                          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 4 }}>
                            {venue.description}
                          </Typography>

                          {/* Amenities */}
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                            <Icon icon="mdi:star-outline" className="h-5 w-5 ml-1" style={{ verticalAlign: 'middle' }} />
                            امکانات
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                            {amenities.map((amenity: string) => (
                              <Chip
                                key={amenity}
                                label={amenity}
                                icon={<Icon icon="mdi:check-circle" className="h-4 w-4" />}
                                sx={{
                                  borderRadius: '10px',
                                  bgcolor: 'rgba(37,99,235,0.08)',
                                  color: 'primary.main',
                                  fontWeight: 500,
                                  '& .MuiChip-icon': { color: 'primary.main' },
                                }}
                              />
                            ))}
                          </Box>

                          <Divider sx={{ my: 3 }} />

                          {/* Price & Manager Info */}
                          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(37,99,235,0.05)', flex: 1, minWidth: 150 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>قیمت هر جلسه</Typography>
                              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>{formatPrice(venue.price)}</Typography>
                            </Paper>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(37,99,235,0.05)', flex: 1, minWidth: 150 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>مدیر سالن</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
                                  {(venue.manager_name || 'ن')[0]}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{venue.manager_name || 'نامشخص'}</Typography>
                              </Box>
                            </Paper>
                          </Box>
                        </motion.div>
                      )}

                      {tab === 1 && isGym && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>خرید اشتراک</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              در باشگاه‌ها رزرو سانس وجود ندارد — پلن مورد نظر (جلسه‌ای، پک یا ماهانه) را بخرید و با نشان دادن کد اشتراک در باشگاه استفاده کنید.
                            </Typography>
                          </Box>
                          {plans.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 5 }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                هنوز پلن اشتراکی برای این باشگاه تعریف نشده است.
                              </Typography>
                            </Box>
                          ) : (
                            <PlanCards plans={plans} onBuy={handleBuyPlan} />
                          )}
                        </motion.div>
                      )}

                      {tab === 1 && !isGym && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>انتخاب سانس</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              سانس مورد نظر خود را انتخاب کنید و با کلیک روی دکمه رزرو، آن را برای خود رزرو کنید
                            </Typography>
                          </Box>
                          <TimeSlotPicker
                            slots={slotList}
                            onSelect={(slot) => setSelectedSlot(slot)}
                          />

                          {selectedSlot && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Paper
                                elevation={0}
                                sx={{
                                  mt: 3,
                                  p: 3,
                                  borderRadius: '16px',
                                  background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(124,58,237,0.05))',
                                  border: '1px solid rgba(37,99,235,0.15)',
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                  <Box sx={{
                                    width: 48, height: 48, borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>
                                    <Icon icon="mdi:calendar-check" className="h-6 w-6" style={{ color: 'white' }} />
                                  </Box>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>سانس انتخاب شده</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                      {selectedSlot.startTime} - {selectedSlot.endTime}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>قیمت:</Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>{formatPrice(selectedSlot.price)}</Typography>
                                </Box>
                                <Button
                                  variant="contained"
                                  fullWidth
                                  onClick={() => setConfirmOpen(true)}
                                  disabled={bookingLoading}
                                  sx={{
                                    mt: 2.5,
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                    boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
                                    '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)' },
                                  }}
                                >
                                  {bookingLoading ? (
                                    <CircularProgress size={24} sx={{ color: 'white' }} />
                                  ) : (
                                    <><Icon icon="mdi:check-circle" className="h-5 w-5 ml-2" />تایید و رزرو</>
                                  )}
                                </Button>
                              </Paper>
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
                    </CardContent>
                  </Card>
                </Grid>

                {/* Sidebar */}
                <Grid size={{ xs: 12, lg: 4 }}>
                  <Box sx={{ position: 'sticky', top: 24 }}>
                    <Card sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', mb: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Icon icon="mdi:phone-in-talk" className="h-5 w-5" style={{ color: '#2563eb' }} />
                          اطلاعات تماس
                        </Typography>
                        <List sx={{ p: 0 }}>
                          {venue.phone && (
                          <ListItem sx={{ px: 0, py: 1.5 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon icon="mdi:phone" className="h-4 w-4" style={{ color: '#2563eb' }} />
                              </Box>
                            </ListItemIcon>
                            <ListItemText primary={venue.phone} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
                          </ListItem>
                          )}
                          <ListItem sx={{ px: 0, py: 1.5 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon icon="mdi:map-marker" className="h-4 w-4" style={{ color: '#2563eb' }} />
                              </Box>
                            </ListItemIcon>
                            <ListItemText primary={venue.address} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {isGym ? 'از قیمت' : 'قیمت هر جلسه'}
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                            {formatPrice(isGym ? (minPlanPrice ?? venue.price) : venue.price)}
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          fullWidth
                          disabled={isGym && plans.length === 0}
                          onClick={() => {
                            if (isGym && plans.length > 0) {
                              handleBuyPlan(plans[0])
                            } else {
                              setTab(1)
                            }
                          }}
                          sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            py: 1.5,
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                            boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
                            '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)' },
                          }}
                        >
                          <Icon icon={isGym ? 'mdi:card-account-details-star' : 'mdi:calendar-plus'} className="h-5 w-5 ml-2" />
                          {isGym ? (plans.length > 0 ? 'خرید اشتراک' : 'پلنی موجود نیست') : 'مشاهده سانس‌ها'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Box>
                </Grid>
              </Grid>
            </motion.div>
          </Container>
        </Box>
      </Box>

      {/* Confirmation Dialog — مشترک موبایل و دسکتاپ */}
      <Dialog
        open={confirmOpen}
        onClose={() => !bookingLoading && setConfirmOpen(false)}
        slotProps={{
          paper: { sx: { borderRadius: '20px', maxWidth: 400, p: 1 } }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
          }}>
            <Icon icon="mdi:calendar-check" className="h-8 w-8" style={{ color: '#2563eb' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>تایید رزرو</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>سالن: {venue.name}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              سانس: {selectedSlot?.startTime} - {selectedSlot?.endTime}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mt: 1 }}>
              {formatPrice(selectedSlot?.price)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={bookingLoading}
            variant="outlined"
            sx={{ borderRadius: '10px', textTransform: 'none', px: 3 }}
          >
            انصراف
          </Button>
          <Button
            onClick={handleBooking}
            disabled={bookingLoading}
            variant="contained"
            sx={{
              borderRadius: '10px', textTransform: 'none', px: 3,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)' },
            }}
          >
            {bookingLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'تایید رزرو'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Membership Purchase Dialog — مخصوص سالن‌های بدنسازی */}
      <MembershipPurchaseDialog
        plan={purchaseOpen ? selectedPlan : null}
        venueName={venue?.name}
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        onSuccess={() => {
          setPurchaseOpen(false)
          toast.success('اشتراک شما با موفقیت فعال شد 🎉')
        }}
      />
    </Layout>
  )
}

export default VenueDetail
