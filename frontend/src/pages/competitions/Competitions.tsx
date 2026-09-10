import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/authStore'
import { venueService } from '@/services/venue'
import { slotService } from '@/services/slot'
import type { Slot } from '@/services/slot'
import { competitionService } from '@/services/competition'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const slotStatusConfig: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  available: { label: 'آزاد', color: 'success' },
  booked: { label: 'رزرو شده', color: 'error' },
  blocked: { label: 'مسدود', color: 'default' },
  in_competition: { label: 'در حال رقابت', color: 'warning' },
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
        <Box sx={{ py: 6, textAlign: 'center', maxWidth: 560, mx: 'auto' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Box
              sx={{
                width: 96, height: 96, borderRadius: '50%',
                bgcolor: 'rgba(37,99,235,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 3,
              }}
            >
              <Icon icon="mdi:trophy-outline" className="h-12 w-12" style={{ color: '#2563eb' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              رقابت قیمت
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
              بخش رقابت قیمت مخصوص مدیران سالن است. مدیران می‌توانند برای سانس‌های آزاد سالن خود
              رقابت قیمت راه‌اندازی کنند تا با بهترین قیمت ممکن، سانس‌های خود را پر کنند.
            </Typography>
            <Button
              component={Link}
              to="/venues"
              variant="contained"
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                px: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              }}
            >
              <Icon icon="mdi:store-search" className="h-5 w-5 ml-2" />
              مشاهده سالن‌ها
            </Button>
          </motion.div>
        </Box>
      </Layout>
    )
  }

  // ===== حالت مدیر =====
  return (
    <Layout>
      <Box sx={{ py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            رقابت قیمت
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            برای سانس‌های آزاد سالن خود رقابت قیمت راه‌اندازی کنید
          </Typography>
        </motion.div>

        <Alert severity="info" sx={{ borderRadius: '16px', mb: 3 }}>
          رقابت ۲۴ ساعت ادامه دارد و در پایان آن، کمترین قیمت پیشنهادی برنده می‌شود و قیمت سانس
          به همان میزان تنظیم خواهد شد.
        </Alert>

        {/* Controls */}
        <Card sx={{ borderRadius: '16px', mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid size={{  xs: 12, sm: 6  }}>
                {loadingVenues ? (
                  <Skeleton variant="rounded" height={56} sx={{ borderRadius: '10px' }} />
                ) : venues.length === 0 ? (
                  <Alert severity="warning" sx={{ borderRadius: '10px' }}>
                    هنوز سالنی ندارید. ابتدا از پنل مدیریت سالن‌ها سالن خود را ایجاد کنید.
                  </Alert>
                ) : (
                  <FormControl fullWidth>
                    <InputLabel>سالن</InputLabel>
                    <Select
                      label="سالن"
                      value={venueId}
                      onChange={(e) => setVenueId(e.target.value as number)}
                      sx={{ borderRadius: '10px' }}
                    >
                      {venues.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Grid>
              <Grid size={{  xs: 12, sm: 4  }}>
                <TextField
                  type="date"
                  label="تاریخ"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Grid>
              <Grid size={{  xs: 12, sm: 2  }}>
                <Button
                  variant="outlined"
                  onClick={fetchSlots}
                  disabled={loadingSlots || !venueId}
                  fullWidth
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, py: 1.2 }}
                  startIcon={<Icon icon="mdi:refresh" />}
                >
                  {loadingSlots ? 'در حال...' : 'به‌روزرسانی'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Slots */}
        {loadingSlots ? (
          <Grid container spacing={2}>
            {[1, 2, 3].map((i) => (
              <Grid size={{  xs: 12, sm: 6, md: 4  }} key={i}>
                <Skeleton variant="rounded" height={190} sx={{ borderRadius: '16px' }} />
              </Grid>
            ))}
          </Grid>
        ) : slots.length === 0 ? (
          <Card sx={{ borderRadius: '16px', textAlign: 'center', py: 6 }}>
            <CardContent>
              <Icon
                icon="mdi:calendar-clock-outline"
                className="h-10 w-10"
                style={{ color: 'rgba(0,0,0,0.2)' }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
                سانسی برای این تاریخ ثبت نشده است
              </Typography>
              <Typography variant="body2" color="text.secondary">
                از پنل مدیریت سالن‌ها، سانس‌های روز مورد نظر را تولید کنید
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {slots.map((slot, index) => {
              const conf = slotStatusConfig[slot.status] || slotStatusConfig.blocked
              return (
                <Grid size={{  xs: 12, sm: 6, md: 4  }} key={slot.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card sx={{ borderRadius: '16px', height: '100%', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography sx={{ fontWeight: 700 }} variant="h6">
                            {slot.start_time} - {slotEndTime(slot)}
                          </Typography>
                          <Chip label={conf.label} color={conf.color} size="small" sx={{ borderRadius: '8px' }} />
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          مدت: {slot.duration} دقیقه
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            قیمت فعلی سانس
                          </Typography>
                          <Typography sx={{ fontWeight: 700 }} variant="h6" color="primary">
                            {formatPrice(slot.current_price)}
                          </Typography>
                        </Box>

                        {slot.status === 'in_competition' && (
                          <Box
                            sx={{
                              mb: 2,
                              p: 1.5,
                              bgcolor: 'rgba(245,158,11,0.08)',
                              borderRadius: '10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              بهترین پیشنهاد
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }} variant="body2" color="warning.main">
                              {bestBids[slot.id] != null
                                ? formatPrice(bestBids[slot.id] as number)
                                : 'هنوز پیشنهادی ثبت نشده'}
                            </Typography>
                          </Box>
                        )}

                        <Button
                          variant="contained"
                          fullWidth
                          disabled={slot.status !== 'available'}
                          onClick={() => openStartDialog(slot)}
                          sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                          }}
                        >
                          <Icon icon="mdi:gavel" className="h-4 w-4 ml-2" />
                          شروع رقابت
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              )
            })}
          </Grid>
        )}
      </Box>

      {/* Start Competition Dialog */}
      <Dialog
        open={Boolean(startTarget)}
        onClose={() => !starting && setStartTarget(null)}
        maxWidth="xs"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '20px' } }}
      >
        {startTarget && (
          <>
            <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, pb: 1 }}>
              شروع رقابت قیمت
            </DialogTitle>
            <DialogContent>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  سانس {startTarget.start_time} - {slotEndTime(startTarget)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  قیمت فعلی: {formatPrice(startTarget.current_price)}
                </Typography>
              </Box>
              <TextField
                type="number"
                label="قیمت پیشنهادی (تومان)"
                value={offerPrice}
                onChange={(e) => setOfferPrice(Number(e.target.value))}
                fullWidth
                slotProps={{ htmlInput: { min: 1000, step: 1000 } }}
                helperText="هرچه قیمت پیشنهادی کمتر باشد، شانس برنده شدن بیشتر است"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setStartTarget(null)}
                disabled={starting}
                sx={{ borderRadius: '10px', textTransform: 'none', flex: 1 }}
              >
                انصراف
              </Button>
              <Button
                variant="contained"
                onClick={handleStart}
                disabled={starting}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  flex: 1,
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                }}
              >
                {starting ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'شروع رقابت'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Layout>
  )
}

export default Competitions