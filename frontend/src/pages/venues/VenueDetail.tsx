// frontend/src/pages/venues/VenueDetail.tsx
import React, { useState, useEffect } from 'react'
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
  Avatar,
  Divider,
  Rating,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import TimeSlotPicker from '@/components/booking/TimeSlotPicker'
import { bookingService } from '@/services/booking'
import { venueService } from '@/services/venue'
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const VenueDetail: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [venue, setVenue] = useState<any>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<any>(null)

  useEffect(() => {
    fetchVenueData()
  }, [id])

  const fetchVenueData = async () => {
    setLoading(true)
    try {
      // دریافت اطلاعات سالن
      const venueData = await venueService.getById(Number(id))
      setVenue(venueData)

      // دریافت سانس‌ها
      const today = new Date().toISOString().split('T')[0]
      const slotsData = await venueService.getSlots(Number(id), today)
      setSlots(slotsData)
    } catch (error) {
      toast.error('خطا در دریافت اطلاعات سالن')
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async () => {
    if (!selectedSlot) {
      toast.error('لطفاً یک سانس را انتخاب کنید')
      return
    }

    setBookingLoading(true)
    try {
      await bookingService.create({ slotId: selectedSlot.id })
      toast.success('رزرو با موفقیت انجام شد!')
      
      // به‌روزرسانی لیست سانس‌ها
      await fetchVenueData()
      setSelectedSlot(null)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در رزرو')
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout isAuthenticated>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Layout>
    )
  }

  if (!venue) {
    return (
      <Layout isAuthenticated>
        <Alert severity="error">سالن مورد نظر یافت نشد</Alert>
      </Layout>
    )
  }

  const slotList = slots.map((slot) => ({
    id: slot.id,
    startTime: slot.start_time.slice(0, 5),
    endTime: (new Date(`2000-01-01T${slot.start_time}`).getTime() + 90 * 60000),
    // محاسبه زمان پایان
    price: slot.current_price,
    available: slot.status === 'available',
  }))

  return (
    <Layout isAuthenticated>
      <Box sx={{ py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/venues')}
            className="mb-4"
          >
            <Icon icon="mdi:arrow-right" className="h-5 w-5 ml-2" />
            بازگشت به لیست سالن‌ها
          </Button>

          <Grid container spacing={3}>
            {/* Main Content */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ borderRadius: '16px', mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        {venue.name}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                        <Icon icon="mdi:map-marker" className="h-4 w-4 text-muted-foreground" />
                        <Typography variant="body2" color="text.secondary">
                          {venue.address}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={venue.status === 'available' ? 'آزاد' : 'پر'}
                      color={venue.status === 'available' ? 'success' : 'error'}
                      sx={{ borderRadius: '8px' }}
                    />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Tabs
                    value={tab}
                    onChange={(_, newValue) => setTab(newValue)}
                    sx={{
                      mb: 3,
                      '& .MuiTab-root': {
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                      },
                      '& .Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white !important',
                        borderRadius: '8px',
                      },
                    }}
                  >
                    <Tab label="اطلاعات" />
                    <Tab label="سانس‌ها" />
                  </Tabs>

                  {tab === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Typography variant="body1" sx={{ mb: 3 }}>
                        {venue.description}
                      </Typography>

                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        امکانات
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                        {JSON.parse(venue.amenities || '[]').map((amenity: string) => (
                          <Chip
                            key={amenity}
                            label={amenity}
                            icon={<Icon icon="mdi:check" className="h-4 w-4" />}
                            sx={{ borderRadius: '8px' }}
                          />
                        ))}
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box display="flex" gap={4}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            قیمت هر جلسه
                          </Typography>
                          <Typography variant="h6" fontWeight={700} color="primary">
                            {formatPrice(venue.price)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            مدیر سالن
                          </Typography>
                          <Typography variant="body2">{venue.manager_name || 'نامشخص'}</Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  )}

                  {tab === 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TimeSlotPicker
                        slots={slotList}
                        onSelect={(slot) => setSelectedSlot(slot)}
                      />
                      
                      {selectedSlot && (
                        <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: '12px' }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            سانس انتخاب شده: {selectedSlot.startTime} - {selectedSlot.endTime}
                          </Typography>
                          <Typography variant="body2">
                            قیمت: {formatPrice(selectedSlot.price)}
                          </Typography>
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={handleBooking}
                            disabled={bookingLoading}
                            sx={{
                              mt: 2,
                              borderRadius: '12px',
                              textTransform: 'none',
                              py: 1.5,
                              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                            }}
                          >
                            {bookingLoading ? (
                              <CircularProgress size={24} className="text-white" />
                            ) : (
                              'تایید و رزرو'
                            )}
                          </Button>
                        </Box>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ borderRadius: '16px' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    اطلاعات تماس
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Icon icon="mdi:phone" className="h-5 w-5 text-primary" />
                      </ListItemIcon>
                      <ListItemText primary={venue.phone} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Icon icon="mdi:map-marker" className="h-5 w-5 text-primary" />
                      </ListItemIcon>
                      <ListItemText primary={venue.address} />
                    </ListItem>
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    قیمت هر جلسه
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary" sx={{ mb: 2 }}>
                    {formatPrice(venue.price)}
                  </Typography>

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setTab(1)}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      py: 1.5,
                      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    }}
                  >
                    <Icon icon="mdi:calendar-plus" className="h-5 w-5 ml-2" />
                    مشاهده سانس‌ها
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      </Box>
    </Layout>
  )
}

export default VenueDetail