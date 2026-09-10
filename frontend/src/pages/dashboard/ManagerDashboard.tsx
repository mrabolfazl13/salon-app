// frontend/src/pages/dashboard/ManagerDashboard.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  Avatar,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { venueService } from '@/services/venue'
import { slotService } from '@/services/slot'
import { bookingService } from '@/services/booking'
import { uploadService } from '@/services/upload'
import { membershipService } from '@/services/membership'
import { MembershipPlan, MembershipPurchase, PlanType, PLAN_TYPE_LABEL } from '@/types/membership'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Venue {
  id: number
  name: string
  address: string
  phone: string | null
  is_verified: boolean
  price: number
  amenities: string[]
  category?: 'futsal' | 'gym'
}

interface Slot {
  id: number
  venue_id: number
  slot_date: string
  start_time: string
  duration: number
  base_price: number
  current_price: number
  status: 'available' | 'booked' | 'blocked' | 'in_competition'
  is_competition_enabled: boolean
}

interface Booking {
  id: number
  slot_id: number
  user_id: number
  booked_at: string
  status: string
  payment_amount: number
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
}

const statusLabels: Record<string, string> = {
  available: 'آزاد',
  booked: 'رزرو شده',
  blocked: 'مسدود',
  in_competition: 'مسابقه',
}

const ManagerDashboard: React.FC = () => {
  const [tab, setTab] = useState(0)
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
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
  })
  const [newAmenity, setNewAmenity] = useState('')
  const [uploadingImages, setUploadingImages] = useState(false)

  // Slots state
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedVenueForSlots, setSelectedVenueForSlots] = useState<number | 'all'>('all')
  const [slotFilterDate, setSlotFilterDate] = useState(() => new Date().toISOString().split('T')[0])

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [selectedVenueForBookings, setSelectedVenueForBookings] = useState<number | 'all'>('all')
  // رزروهای در انتظار تأیید (Redis)
  const [pendingList, setPendingList] = useState<any[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
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
  const [consumeId, setConsumeId] = useState<number | null>(null)
  const [bookingDateRange, setBookingDateRange] = useState(() => {
    const today = new Date()
    const weekLater = new Date(today)
    weekLater.setDate(weekLater.getDate() + 7)
    return {
      start: today.toISOString().split('T')[0],
      end: weekLater.toISOString().split('T')[0],
    }
  })

  const navigate = useNavigate()

  useEffect(() => {
    fetchVenues()
  }, [])

  // Fetch slots when tab changes to Slots
  useEffect(() => {
    if (tab === 1 && venues.length > 0) {
      fetchSlots()
    }
  }, [tab, venues])

  // Fetch bookings when tab changes to Bookings
  useEffect(() => {
    if (tab === 2 && venues.length > 0) {
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
    try {
      const venuesToFetch = selectedVenueForSlots === 'all'
        ? venues
        : venues.filter(v => v.id === selectedVenueForSlots)

      const allSlots: Slot[] = []
      for (const venue of venuesToFetch) {
        const venueSlots = await slotService.getByVenueAndDate(venue.id, slotFilterDate)
        allSlots.push(...venueSlots.map(s => ({ ...s, venue_id: venue.id })))
      }
      setSlots(allSlots)
    } catch (error) {
      toast.error('خطا در دریافت سانس‌ها')
    } finally {
      setSlotsLoading(false)
    }
  }

  const fetchBookings = async () => {
    setBookingsLoading(true)
    setBookings([])
    try {
      const venuesToFetch = selectedVenueForBookings === 'all'
        ? venues
        : venues.filter(v => v.id === selectedVenueForBookings)

      const allBookings: Booking[] = []
      for (const venue of venuesToFetch) {
        const venueBookings = await bookingService.getVenueBookings(
          venue.id,
          bookingDateRange.start,
          bookingDateRange.end
        )
        allBookings.push(...venueBookings.map((b: Booking) => ({ ...b, venue_id: venue.id })))
      }
      setBookings(allBookings)
    } catch (error) {
      toast.error('خطا در دریافت رزروها')
    } finally {
      setBookingsLoading(false)
    }
  }

  const fetchPending = async () => {
    setPendingLoading(true)
    try {
      const venuesToFetch = selectedVenueForBookings === 'all'
        ? venues
        : venues.filter(v => v.id === selectedVenueForBookings)
      const allPending: any[] = []
      for (const venue of venuesToFetch) {
        const venuePending = await bookingService.getVenuePending(venue.id)
        if (Array.isArray(venuePending)) allPending.push(...venuePending)
      }
      setPendingList(allPending)
    } catch {
      setPendingList([])
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
    try {
      const data = await membershipService.getVenuePurchases(venueId)
      setVenuePurchases(Array.isArray(data) ? data : [])
    } catch {
      setVenuePurchases([])
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

  const handleCreateVenue = async () => {
    try {
      await venueService.create({
        ...newVenue,
        amenities: newVenue.amenities.filter(a => a.trim()),
        images: newVenue.images,
      })
      toast.success('سالن با موفقیت ایجاد شد')
      setOpenCreateVenue(false)
      setNewVenue({ name: '', address: '', phone: '', latitude: 34.6482, longitude: 50.8799, description: '', amenities: [], images: [] })
      setNewAmenity('')
      fetchVenues()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در ایجاد سالن')
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

  const stats = [
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
      value: bookings.length,
      icon: 'mdi:calendar-check-outline',
      gradient: 'linear-gradient(135deg, #059669, #10b981)',
      lightBg: 'rgba(5,150,105,0.08)',
      color: '#059669',
    },
    {
      label: 'درآمد (بازه انتخابی)',
      value: formatPrice(totalRevenue),
      icon: 'mdi:currency-usd',
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
    },
  ]

  const getVenueName = (venueId: number) => {
    return venues.find(v => v.id === venueId)?.name || 'نامشخص'
  }

  if (loading) {
    return (
      <Layout userRole="venue_manager">
        <Box sx={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={48} sx={{ mb: 2, color: '#2563eb' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>در حال بارگذاری...</Typography>
          </Box>
        </Box>
      </Layout>
    )
  }

  return (
    <Layout userRole="venue_manager">
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)',
      }}>
        {/* Header Section */}
        <Box sx={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%)',
          pt: { xs: 4, md: 6 },
          pb: { xs: 8, md: 10 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-30%',
            left: '-10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          },
        }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, position: 'relative', zIndex: 1 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 1, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                    داشبورد مدیریت
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
                    به پنل مدیریت سالن‌های خود خوش آمدید
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={() => setOpenCreateVenue(true)}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    px: 3,
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.25)',
                    },
                  }}
                  startIcon={<Icon icon="mdi:plus-circle" className="h-5 w-5" />}
                >
                  افزودن سالن جدید
                </Button>
              </Box>
            </motion.div>
          </Box>
        </Box>

        {/* Stats Cards - Overlapping */}
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, mt: { xs: -6, md: -8 }, position: 'relative', zIndex: 2 }}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {stats.map((stat, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                  <motion.div custom={index} variants={statCardVariants}>
                    <Card
                      sx={{
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                        border: '1px solid rgba(0,0,0,0.04)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: '16px',
                              background: stat.lightBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              position: 'relative',
                              overflow: 'hidden',
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: stat.gradient,
                                opacity: 0.1,
                              },
                            }}
                          >
                            <Icon icon={stat.icon} className="h-7 w-7" style={{ color: stat.color }} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="h4"
                              sx={{
                                fontWeight: 800,
                                fontSize: '1.75rem',
                                lineHeight: 1.2,
                                mb: 0.25,
                                background: stat.gradient,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}
                            >
                              {stat.value}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.85rem' }}>
                              {stat.label}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>

          {/* Tabs */}
          <Box sx={{ mb: 3 }}>
            <Tabs
              value={tab}
              onChange={(_, newValue) => setTab(newValue)}
              sx={{
                minHeight: 48,
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
                '& .MuiTab-root': {
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  minHeight: 48,
                  py: 1,
                  px: 3,
                  color: 'text.secondary',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease',
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
                  },
                  '&:hover:not(.Mui-selected)': {
                    background: 'rgba(0,0,0,0.04)',
                  },
                },
              }}
            >
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon icon="mdi:store" className="h-4 w-4" />
                    سالن‌های من
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon icon="mdi:calendar-clock" className="h-4 w-4" />
                    سانس‌ها
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon icon="mdi:calendar-check" className="h-4 w-4" />
                    رزروها
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon icon="mdi:card-account-details-star" className="h-4 w-4" />
                    اشتراک‌ها
                  </Box>
                }
              />
            </Tabs>
          </Box>

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
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: '20px',
                        p: 6,
                        textAlign: 'center',
                        border: '2px dashed rgba(0,0,0,0.08)',
                        background: 'rgba(255,255,255,0.8)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <Box
                        sx={{
                          width: 100,
                          height: 100,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 3,
                        }}
                      >
                        <Icon icon="mdi:store-plus-outline" className="h-12 w-12" style={{ color: '#2563eb' }} />
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        هنوز سالنی ثبت نکرده‌اید
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, maxWidth: 400, mx: 'auto' }}>
                        اولین سالن خود را اضافه کنید و مدیریت سانس‌ها و رزروها را شروع کنید
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => setOpenCreateVenue(true)}
                        sx={{
                          borderRadius: '12px',
                          textTransform: 'none',
                          px: 4,
                          py: 1.5,
                          fontWeight: 700,
                          fontSize: '1rem',
                          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                          boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
                          },
                        }}
                        startIcon={<Icon icon="mdi:plus" className="h-5 w-5" />}
                      >
                        افزودن سالن جدید
                      </Button>
                    </Paper>
                  </motion.div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    <Grid container spacing={3}>
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
                          <Grid size={{ xs: 12, md: 6 }} key={venue.id}>
                            <motion.div variants={itemVariants}>
                              <Card
                                sx={{
                                  borderRadius: '20px',
                                  overflow: 'hidden',
                                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                  border: '1px solid rgba(0,0,0,0.04)',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                                  },
                                }}
                              >
                                {/* Top Gradient Bar */}
                                <Box
                                  sx={{
                                    height: 4,
                                    background: venue.is_verified
                                      ? 'linear-gradient(90deg, #059669, #10b981)'
                                      : 'linear-gradient(90deg, #d97706, #f59e0b)',
                                  }}
                                />

                                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                                  {/* Header */}
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                                      <Avatar
                                        sx={{
                                          width: 48,
                                          height: 48,
                                          borderRadius: '14px',
                                          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                          fontSize: '1.2rem',
                                          fontWeight: 700,
                                          flexShrink: 0,
                                        }}
                                      >
                                        {venue.name[0]}
                                      </Avatar>
                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.25 }}>
                                          {venue.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <Icon icon="mdi:map-marker" className="h-3.5 w-3.5" style={{ color: '#9ca3af' }} />
                                          <Typography variant="caption" sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {venue.address}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Box>
                                    <Chip
                                      label={venue.is_verified ? 'تایید شده' : 'در انتظار تایید'}
                                      size="small"
                                      icon={
                                        <Icon
                                          icon={venue.is_verified ? 'mdi:check-circle' : 'mdi:clock-outline'}
                                          className="h-3.5 w-3.5"
                                        />
                                      }
                                      sx={{
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                        height: 26,
                                        flexShrink: 0,
                                        bgcolor: venue.is_verified ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)',
                                        color: venue.is_verified ? '#059669' : '#d97706',
                                        '& .MuiChip-icon': {
                                          color: venue.is_verified ? '#059669' : '#d97706',
                                        },
                                      }}
                                    />
                                  </Box>

                                  {/* Amenities */}
                                  {amenities.length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                                      {amenities.slice(0, 4).map((a, i) => (
                                        <Chip
                                          key={i}
                                          label={a}
                                          size="small"
                                          variant="outlined"
                                          sx={{
                                            borderRadius: '6px',
                                            fontSize: '0.65rem',
                                            height: 24,
                                            borderColor: 'rgba(37,99,235,0.15)',
                                            color: 'primary.main',
                                            fontWeight: 500,
                                          }}
                                        />
                                      ))}
                                      {amenities.length > 4 && (
                                        <Chip
                                          label={`+${amenities.length - 4}`}
                                          size="small"
                                          sx={{
                                            borderRadius: '6px',
                                            fontSize: '0.65rem',
                                            height: 24,
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            fontWeight: 600,
                                          }}
                                        />
                                      )}
                                    </Box>
                                  )}

                                  <Divider sx={{ mb: 2 }} />

                                  {/* Info Row */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Icon icon="mdi:phone" className="h-4 w-4" style={{ color: '#9ca3af' }} />
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                          {venue.phone}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Icon icon="mdi:currency-usd" className="h-4 w-4" style={{ color: '#9ca3af' }} />
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                          {formatPrice(venue.price)}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>

                                  {/* Actions */}
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      onClick={() => {
                                        setSelectedVenue(venue)
                                        setOpenGenerateSlots(true)
                                      }}
                                      sx={{
                                        borderRadius: '10px',
                                        textTransform: 'none',
                                        px: 2,
                                        py: 0.75,
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        flex: 1,
                                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                        boxShadow: '0 4px 10px rgba(37,99,235,0.2)',
                                        '&:hover': {
                                          background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
                                        },
                                      }}
                                      startIcon={<Icon icon="mdi:calendar-plus" className="h-4 w-4" />}
                                    >
                                      ایجاد سانس
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => navigate(`/venues/${venue.id}`)}
                                      sx={{
                                        borderRadius: '10px',
                                        textTransform: 'none',
                                        px: 2,
                                        py: 0.75,
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        flex: 1,
                                        borderColor: 'rgba(37,99,235,0.2)',
                                        color: 'primary.main',
                                        '&:hover': {
                                          borderColor: 'primary.main',
                                          background: 'rgba(37,99,235,0.04)',
                                        },
                                      }}
                                      startIcon={<Icon icon="mdi:eye-outline" className="h-4 w-4" />}
                                    >
                                      مشاهده
                                    </Button>
                                  </Box>
                                </CardContent>
                              </Card>
                            </motion.div>
                          </Grid>
                        )
                      })}
                    </Grid>
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
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '16px',
                    p: 2.5,
                    mb: 3,
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,0,0,0.04)',
                  }}
                >
                  <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>سالن</InputLabel>
                        <Select
                          value={selectedVenueForSlots}
                          label="سالن"
                          onChange={(e) => setSelectedVenueForSlots(e.target.value as number | 'all')}
                          sx={{ borderRadius: '10px' }}
                        >
                          <MenuItem value="all">همه سالن‌ها</MenuItem>
                          {venues.map(v => (
                            <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="تاریخ"
                        value={slotFilterDate}
                        onChange={(e) => setSlotFilterDate(e.target.value)}
                        slotProps={{
                          inputLabel: { shrink: true },
                          input: { sx: { borderRadius: '10px' } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={fetchSlots}
                        disabled={slotsLoading}
                        sx={{
                          borderRadius: '10px',
                          textTransform: 'none',
                          py: 1,
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
                          },
                        }}
                        startIcon={slotsLoading ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:refresh" className="h-4 w-4" />}
                      >
                        {slotsLoading ? 'در حال بارگذاری...' : 'جستجو'}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Slots List */}
                {slotsLoading ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={40} sx={{ color: '#2563eb' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>در حال بارگذاری سانس‌ها...</Typography>
                  </Box>
                ) : slots.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: '20px',
                      p: 6,
                      textAlign: 'center',
                      border: '2px dashed rgba(0,0,0,0.08)',
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                      }}
                    >
                      <Icon icon="mdi:calendar-plus-outline" className="h-12 w-12" style={{ color: '#2563eb' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      سانسی یافت نشد
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, maxWidth: 450, mx: 'auto' }}>
                      برای تاریخ انتخاب شده سانسی وجود ندارد. از بخش سالن‌های من سانس ایجاد کنید
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => setTab(0)}
                      sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        px: 4,
                        py: 1.5,
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
                        },
                      }}
                      startIcon={<Icon icon="mdi:store" className="h-5 w-5" />}
                    >
                      مشاهده سالن‌ها
                    </Button>
                  </Paper>
                ) : (
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                      borderRadius: '16px',
                      border: '1px solid rgba(0,0,0,0.04)',
                      overflow: 'hidden',
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>سالن</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>تاریخ</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>ساعت شروع</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>مدت (دقیقه)</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>قیمت</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>وضعیت</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {slots.map((slot) => (
                          <TableRow
                            key={slot.id}
                            sx={{
                              '&:hover': { background: 'rgba(37,99,235,0.02)' },
                              transition: 'background 0.2s',
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {getVenueName(slot.venue_id)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{slot.slot_date}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                {slot.start_time}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{slot.duration}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                                {formatPrice(slot.current_price)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={statusLabels[slot.status] || slot.status}
                                size="small"
                                sx={{
                                  borderRadius: '8px',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  height: 24,
                                  bgcolor: `${statusColors[slot.status] || '#6b7280'}18`,
                                  color: statusColors[slot.status] || '#6b7280',
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
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
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '16px',
                    p: 2.5,
                    mb: 3,
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,0,0,0.04)',
                  }}
                >
                  <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>سالن</InputLabel>
                        <Select
                          value={selectedVenueForBookings}
                          label="سالن"
                          onChange={(e) => setSelectedVenueForBookings(e.target.value as number | 'all')}
                          sx={{ borderRadius: '10px' }}
                        >
                          <MenuItem value="all">همه سالن‌ها</MenuItem>
                          {venues.map(v => (
                            <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="از تاریخ"
                        value={bookingDateRange.start}
                        onChange={(e) => setBookingDateRange(prev => ({ ...prev, start: e.target.value }))}
                        slotProps={{
                          inputLabel: { shrink: true },
                          input: { sx: { borderRadius: '10px' } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="تا تاریخ"
                        value={bookingDateRange.end}
                        onChange={(e) => setBookingDateRange(prev => ({ ...prev, end: e.target.value }))}
                        slotProps={{
                          inputLabel: { shrink: true },
                          input: { sx: { borderRadius: '10px' } },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => { fetchBookings(); fetchPending() }}
                        disabled={bookingsLoading}
                        sx={{
                          borderRadius: '10px',
                          textTransform: 'none',
                          py: 1,
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
                          },
                        }}
                        startIcon={bookingsLoading ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:refresh" className="h-4 w-4" />}
                      >
                        {bookingsLoading ? 'در حال بارگذاری...' : 'جستجو'}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {/* رزروهای در انتظار تأیید (قبل از ثبت در دیتابیس) */}
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '16px',
                    p: 2.5,
                    mb: 3,
                    border: '1px solid rgba(245,158,11,0.25)',
                    background: 'rgba(255,247,237,0.9)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: pendingList.length ? 2 : 0 }}>
                    <Icon icon="mdi:clock-alert-outline" className="h-5 w-5" style={{ color: '#d97706' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      رزروهای در انتظار تأیید
                    </Typography>
                    <Chip label={pendingList.length} size="small" color="warning" sx={{ borderRadius: '8px' }} />
                  </Box>
                  {pendingLoading ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <CircularProgress size={28} sx={{ color: '#d97706' }} />
                    </Box>
                  ) : pendingList.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      رزروی در انتظار تأیید نیست
                    </Typography>
                  ) : (
                    <Grid container spacing={1.5}>
                      {pendingList.map((p) => (
                        <Grid size={{ xs: 12 }} key={p.id}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 2,
                              flexWrap: 'wrap',
                              p: 1.5,
                              borderRadius: '12px',
                              background: 'rgba(255,255,255,0.85)',
                              border: '1px solid rgba(245,158,11,0.2)',
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {p.venue_name || 'سالن'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {p.slot_date ? `${p.slot_date} — ${p.start_time}` : ''}
                                {p.slot_date ? '  •  ' : ''}
                                {formatPrice(p.payment_amount)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                disabled={pendingActionPid === p.id}
                                onClick={() => handleConfirmPending(p.id)}
                                sx={{
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  bgcolor: '#16a34a',
                                  '&:hover': { bgcolor: '#15803d' },
                                }}
                              >
                                {pendingActionPid === p.id ? <CircularProgress size={16} color="inherit" /> : 'تأیید'}
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                disabled={pendingActionPid === p.id}
                                onClick={() => handleRejectPending(p.id)}
                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                              >
                                رد
                              </Button>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Paper>

                {/* Bookings List */}
                {bookingsLoading ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={40} sx={{ color: '#2563eb' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>در حال بارگذاری رزروها...</Typography>
                  </Box>
                ) : bookings.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: '20px',
                      p: 6,
                      textAlign: 'center',
                      border: '2px dashed rgba(0,0,0,0.08)',
                      background: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                      }}
                    >
                      <Icon icon="mdi:calendar-blank-outline" className="h-12 w-12" style={{ color: '#2563eb' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      رزروی یافت نشد
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
                      برای بازه انتخاب شده رزروی وجود ندارد
                    </Typography>
                  </Paper>
                ) : (
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                      borderRadius: '16px',
                      border: '1px solid rgba(0,0,0,0.04)',
                      overflow: 'hidden',
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>شناسه</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>سالن</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>مبلغ</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>تاریخ رزرو</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>وضعیت</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow
                            key={booking.id}
                            sx={{
                              '&:hover': { background: 'rgba(37,99,235,0.02)' },
                              transition: 'background 0.2s',
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                #{booking.id}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {(booking as any).venue_id ? getVenueName((booking as any).venue_id) : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                                {formatPrice(booking.payment_amount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(booking.booked_at).toLocaleDateString('fa-IR')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={booking.status === 'confirmed' ? 'تایید شده' : booking.status === 'cancelled' ? 'لغو شده' : booking.status}
                                size="small"
                                sx={{
                                  borderRadius: '8px',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  height: 24,
                                  bgcolor: booking.status === 'confirmed' ? 'rgba(5,150,105,0.1)' : 'rgba(239,68,68,0.1)',
                                  color: booking.status === 'confirmed' ? '#059669' : '#ef4444',
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
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
                  <Paper
                    sx={{
                      p: 5,
                      borderRadius: '16px',
                      textAlign: 'center',
                      border: '1px dashed rgba(0,0,0,0.12)',
                      bgcolor: 'rgba(0,0,0,0.01)',
                    }}
                  >
                    <Box sx={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      mx: 'auto', mb: 2,
                    }}>
                      <Icon icon="mdi:weight-lifter" className="h-8 w-8" style={{ color: '#2563eb' }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      شما سالن بدنسازی ندارید
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      مدیریت اشتراک‌ها مخصوص سالن‌های بدنسازی است.
                    </Typography>
                  </Paper>
                ) : (
                  <>
                    {/* انتخاب سالن + دکمه پلن جدید */}
                    <Paper sx={{ p: 2.5, borderRadius: '16px', mb: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
                      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                        <Grid size={{ xs: 12, sm: 7 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>سالن بدنسازی</InputLabel>
                            <Select
                              value={planVenueId}
                              label="سالن بدنسازی"
                              onChange={(e) => {
                                const id = Number(e.target.value)
                                setPlanVenueId(id)
                                fetchPlans(id)
                                fetchVenuePurchases(id)
                              }}
                            >
                              {planVenues.map((v) => (
                                <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 5 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() => setOpenCreatePlan(true)}
                            startIcon={<Icon icon="mdi:plus" className="h-4 w-4" />}
                            sx={{
                              borderRadius: '10px',
                              textTransform: 'none',
                              fontWeight: 600,
                              py: 1.1,
                              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                              boxShadow: '0 4px 10px rgba(37,99,235,0.2)',
                              '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)' },
                            }}
                          >
                            ایجاد پلن اشتراک
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* لیست پلن‌ها */}
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                      پلن‌های اشتراک
                    </Typography>
                    {plansLoading ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={28} />
                      </Box>
                    ) : plans.length === 0 ? (
                      <Paper sx={{ p: 3, borderRadius: '16px', textAlign: 'center', mb: 3, border: '1px dashed rgba(0,0,0,0.12)' }}>
                        <Typography variant="body2" color="text.secondary">
                          هنوز پلنی ایجاد نکرده‌اید.
                        </Typography>
                      </Paper>
                    ) : (
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        {plans.map((plan) => (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={plan.id}>
                            <Card sx={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', height: '100%', opacity: plan.is_active ? 1 : 0.55 }}>
                              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
                                    {plan.title}
                                  </Typography>
                                  <Chip
                                    label={plan.is_active ? 'فعال' : 'غیرفعال'}
                                    size="small"
                                    sx={{
                                      borderRadius: '8px',
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                      height: 24,
                                      flexShrink: 0,
                                      bgcolor: plan.is_active ? 'rgba(5,150,105,0.1)' : 'rgba(0,0,0,0.06)',
                                      color: plan.is_active ? '#059669' : 'text.secondary',
                                    }}
                                  />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                  {PLAN_TYPE_LABEL[plan.plan_type]}
                                  {plan.plan_type === 'sessions_pack' && plan.sessions_count
                                    ? ` · ${new Intl.NumberFormat('fa-IR').format(plan.sessions_count)} جلسه`
                                    : ''}
                                  {plan.plan_type === 'monthly' && plan.duration_days
                                    ? ` · ${new Intl.NumberFormat('fa-IR').format(plan.duration_days)} روز`
                                    : ''}
                                </Typography>
                                {plan.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                    {plan.description}
                                  </Typography>
                                )}
                                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5 }}>
                                  {formatPrice(plan.price)}
                                </Typography>
                                {plan.is_active && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleDeactivatePlan(plan.id)}
                                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                                  >
                                    غیرفعال‌سازی
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}

                    {/* خریدهای کاربران */}
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                      خریدهای کاربران
                    </Typography>
                    {purchasesLoading ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={28} />
                      </Box>
                    ) : venuePurchases.length === 0 ? (
                      <Paper sx={{ p: 3, borderRadius: '16px', textAlign: 'center', border: '1px dashed rgba(0,0,0,0.12)' }}>
                        <Typography variant="body2" color="text.secondary">
                          هنوز خریدی ثبت نشده است.
                        </Typography>
                      </Paper>
                    ) : (
                      <TableContainer
                        component={Paper}
                        sx={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}
                      >
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                              <TableCell sx={{ fontWeight: 700 }}>پلن</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>مبلغ</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>وضعیت</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>جلسات باقی‌مانده</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>عملیات</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {venuePurchases.map((p) => {
                              const canConsume =
                                p.status === 'paid' &&
                                (p.plan_type === 'session' || p.plan_type === 'sessions_pack') &&
                                (p.sessions_remaining ?? 0) > 0
                              return (
                                <TableRow key={p.id} sx={{ '&:hover': { bgcolor: 'rgba(37,99,235,0.02)' } }}>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.plan_title}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {p.plan_type ? PLAN_TYPE_LABEL[p.plan_type] : ''}
                                      {p.expires_at ? ` · اعتبار تا ${new Date(p.expires_at).toLocaleDateString('fa-IR')}` : ''}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">{formatPrice(p.amount)}</Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={p.status === 'paid' ? 'پرداخت شده' : p.status === 'pending' ? 'در انتظار' : 'لغو شده'}
                                      size="small"
                                      sx={{
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                        height: 24,
                                        bgcolor:
                                          p.status === 'paid'
                                            ? 'rgba(5,150,105,0.1)'
                                            : p.status === 'pending'
                                              ? 'rgba(245,158,11,0.1)'
                                              : 'rgba(239,68,68,0.1)',
                                        color: p.status === 'paid' ? '#059669' : p.status === 'pending' ? '#d97706' : '#ef4444',
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {p.sessions_remaining != null
                                        ? new Intl.NumberFormat('fa-IR').format(p.sessions_remaining)
                                        : '—'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    {canConsume ? (
                                      <Button
                                        size="small"
                                        variant="contained"
                                        disabled={consumeId === p.id}
                                        onClick={() => handleConsume(p.id)}
                                        sx={{
                                          borderRadius: '8px',
                                          textTransform: 'none',
                                          fontWeight: 600,
                                          background: 'linear-gradient(135deg, #059669, #10b981)',
                                          '&:hover': { background: 'linear-gradient(135deg, #047857, #059669)' },
                                        }}
                                      >
                                        {consumeId === p.id ? <CircularProgress size={16} sx={{ color: 'white' }} /> : 'کسر جلسه'}
                                      </Button>
                                    ) : (
                                      <Typography variant="caption" color="text.secondary">—</Typography>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Box>

      {/* Create Venue Dialog */}
      <Dialog
        open={openCreateVenue}
        onClose={() => setOpenCreateVenue(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '20px',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          px: 3,
          py: 2.5,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon icon="mdi:store-plus" className="h-5 w-5" />
            افزودن سالن جدید
          </Typography>
        </Box>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <TextField
            fullWidth
            label="نام سالن"
            value={newVenue.name}
            onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
            sx={{ mb: 2.5 }}
            variant="outlined"
            slotProps={{
              input: {
                sx: { borderRadius: '10px' },
              },
            }}
          />
          <TextField
            fullWidth
            label="آدرس"
            value={newVenue.address}
            onChange={(e) => setNewVenue({ ...newVenue, address: e.target.value })}
            sx={{ mb: 2.5 }}
            variant="outlined"
            slotProps={{
              input: {
                sx: { borderRadius: '10px' },
              },
            }}
          />
          <TextField
            fullWidth
            label="شماره تماس"
            value={newVenue.phone}
            onChange={(e) => setNewVenue({ ...newVenue, phone: e.target.value })}
            sx={{ mb: 2.5 }}
            variant="outlined"
            placeholder="09xxxxxxxxx"
            slotProps={{
              input: {
                sx: { borderRadius: '10px' },
              },
            }}
          />
          <TextField
            fullWidth
            label="توضیحات"
            value={newVenue.description}
            onChange={(e) => setNewVenue({ ...newVenue, description: e.target.value })}
            multiline
            rows={3}
            variant="outlined"
            slotProps={{
              input: {
                sx: { borderRadius: '10px' },
              },
            }}
          />
          {/* امکانات سالن */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>امکانات سالن</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <TextField
                size="small"
                placeholder="مثلاً: پارکینگ، دوش، رختکن..."
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }}
                slotProps={{ input: { sx: { borderRadius: '10px' } } }}
              />
              <Button
                onClick={addAmenity}
                variant="outlined"
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: 'rgba(37,99,235,0.3)', color: 'primary.main' }}
              >
                افزودن
              </Button>
            </Box>
            {newVenue.amenities.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {newVenue.amenities.map(a => (
                  <Chip
                    key={a}
                    label={a}
                    size="small"
                    onDelete={() => removeAmenity(a)}
                    sx={{ borderRadius: '6px', bgcolor: 'rgba(37,99,235,0.08)', color: 'primary.main', fontWeight: 500 }}
                  />
                ))}
              </Box>
            )}
          </Box>
          {/* عکس‌های سالن */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              عکس‌های سالن <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>(حداکثر ۱۰ عکس، هرکدام تا ۵MB)</span>
            </Typography>
            <Box
              onClick={() => document.getElementById('venue-image-upload')?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleImageUpload(e.dataTransfer.files) }}
              sx={{
                border: '2px dashed rgba(37,99,235,0.25)',
                borderRadius: '12px',
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: 'rgba(37,99,235,0.03)',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'rgba(37,99,235,0.5)', bgcolor: 'rgba(37,99,235,0.06)' },
              }}
            >
              {uploadingImages ? (
                <CircularProgress size={32} />
              ) : (
                <Box>
                  <Icon icon="mdi:camera-plus-outline" className="h-8 w-8" style={{ color: '#2563eb' }} />
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    برای انتخاب عکس کلیک کنید یا بکشید و رها کنید
                  </Typography>
                </Box>
              )}
              <input
                id="venue-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                style={{ display: 'none' }}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => { handleImageUpload(e.target.files); e.target.value = '' }}
              />
            </Box>
            {newVenue.images.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                {newVenue.images.map((img, i) => (
                  <Box key={i} sx={{ position: 'relative', width: 80, height: 80, borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                    <img src={img} alt={`عکس ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <Box
                      onClick={() => removeImage(img)}
                      sx={{ position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(239,68,68,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Icon icon="mdi:close" className="h-3 w-3" style={{ color: 'white' }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setOpenCreateVenue(false)}
            variant="outlined"
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
              borderColor: 'rgba(0,0,0,0.1)',
              color: 'text.secondary',
            }}
          >
            انصراف
          </Button>
          <Button
            onClick={handleCreateVenue}
            variant="contained"
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              boxShadow: '0 4px 10px rgba(37,99,235,0.2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
              },
            }}
          >
            ایجاد سالن
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Slots Dialog */}
      <Dialog
        open={openGenerateSlots}
        onClose={() => setOpenGenerateSlots(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '20px',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #059669, #10b981)',
          px: 3,
          py: 2.5,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon icon="mdi:calendar-plus" className="h-5 w-5" />
            ایجاد سانس برای {selectedVenue?.name}
          </Typography>
        </Box>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <TextField
            fullWidth
            type="date"
            label="تاریخ"
            value={slotDate}
            onChange={(e) => setSlotDate(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                sx: { borderRadius: '10px' },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setOpenGenerateSlots(false)}
            variant="outlined"
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
              borderColor: 'rgba(0,0,0,0.1)',
              color: 'text.secondary',
            }}
          >
            انصراف
          </Button>
          <Button
            onClick={handleGenerateSlots}
            variant="contained"
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #059669, #10b981)',
              boxShadow: '0 4px 10px rgba(5,150,105,0.2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #047857, #059669)',
              },
            }}
          >
            ایجاد سانس‌ها
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Plan Dialog — پلن اشتراک بدنسازی */}
      <Dialog
        open={openCreatePlan}
        onClose={() => !savingPlan && setOpenCreatePlan(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '20px',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          px: 3,
          py: 2.5,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon icon="mdi:card-account-details-star" className="h-5 w-5" />
            پلن اشتراک جدید
          </Typography>
        </Box>
        <DialogContent sx={{ pt: 3, pb: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth
            label="عنوان پلن"
            placeholder="مثلاً: اشتراک ماهانه"
            value={newPlan.title}
            onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <FormControl fullWidth size="medium">
            <InputLabel>نوع پلن</InputLabel>
            <Select
              value={newPlan.plan_type}
              label="نوع پلن"
              onChange={(e) => setNewPlan({ ...newPlan, plan_type: e.target.value as PlanType })}
            >
              <MenuItem value="session">جلسه‌ای (تکی)</MenuItem>
              <MenuItem value="sessions_pack">پک جلسه‌ای</MenuItem>
              <MenuItem value="monthly">ماهانه (مدت‌دار)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="قیمت (تومان)"
            value={newPlan.price}
            onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          {newPlan.plan_type === 'sessions_pack' && (
            <TextField
              fullWidth
              type="number"
              label="تعداد جلسات"
              value={newPlan.sessions_count}
              onChange={(e) => setNewPlan({ ...newPlan, sessions_count: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          )}
          {newPlan.plan_type === 'monthly' && (
            <TextField
              fullWidth
              type="number"
              label="مدت اعتبار (روز)"
              value={newPlan.duration_days}
              onChange={(e) => setNewPlan({ ...newPlan, duration_days: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          )}
          <TextField
            fullWidth
            multiline
            rows={2}
            label="توضیحات (اختیاری)"
            value={newPlan.description}
            onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setOpenCreatePlan(false)}
            variant="outlined"
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
              borderColor: 'rgba(0,0,0,0.1)',
              color: 'text.secondary',
            }}
          >
            انصراف
          </Button>
          <Button
            onClick={handleCreatePlan}
            variant="contained"
            disabled={savingPlan}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              boxShadow: '0 4px 10px rgba(37,99,235,0.2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
              },
            }}
          >
            {savingPlan ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'ایجاد پلن'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

export default ManagerDashboard