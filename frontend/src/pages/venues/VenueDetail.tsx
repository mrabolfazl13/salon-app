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
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import TimeSlotPicker from '@/components/booking/TimeSlotPicker'
import { bookingService } from '@/services/booking'
import { venueService } from '@/services/venue'
import { slotService } from '@/services/slot'
import { formatPrice } from '@/lib/utils'
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
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    fetchVenueData()
  }, [id])

  useEffect(() => {
    console.log("Selected Slot", selectedSlot)
  }, [selectedSlot])

  const fetchVenueData = async () => {
    setLoading(true)
    try {
      const venueData = await venueService.getById(Number(id))
      setVenue(venueData)
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      const startDate = today.toISOString().split('T')[0]
      const endDate = nextWeek.toISOString().split('T')[0]
      const slotsData = await slotService.getByVenueAndDateRange(Number(id), startDate, endDate)
      setSlots(slotsData || [])
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
      await fetchVenueData()
      setSelectedSlot(null)
      setConfirmOpen(false)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در رزرو')
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout isAuthenticated>
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)' }}>
          <Container maxWidth="lg" sx={{ py: 8 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>در حال بارگذاری...</Typography>
              </Box>
            </Box>
          </Container>
        </Box>
      </Layout>
    )
  }

  if (!venue) {
    return (
      <Layout isAuthenticated>
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)' }}>
          <Container maxWidth="lg" sx={{ py: 8 }}>
            <Alert severity="error" sx={{ borderRadius: '12px' }}>سالن مورد نظر یافت نشد</Alert>
          </Container>
        </Box>
      </Layout>
    )
  }

  const slotList = slots.map((slot: any) => ({
    id: slot.id,
    date: slot.slot_date,
    startTime: slot.start_time?.slice(0, 5) || '00:00',
    endTime: new Date(new Date(`2000-01-01T${slot.start_time}`).getTime() + 90 * 60000).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    price: slot.current_price || slot.price || 0,
    available: slot.status === 'available',
  }))

  const amenities: string[] = typeof venue.amenities === 'string' ? JSON.parse(venue.amenities) : (venue.amenities || [])
  const images: string[] = typeof venue.images === 'string' ? JSON.parse(venue.images) : (venue.images || [])
  const mainImage = images[0] || '/placeholder-venue.jpg'

  return (
    <Layout isAuthenticated>
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0f5ff 0%, #ffffff 100%)' }}>
        {/* Hero Image */}
        <Box sx={{ position: 'relative', height: { xs: 250, md: 400 }, overflow: 'hidden' }}>
          <img src={mainImage} alt={venue.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                  <Chip
                    label={venue.status === 'available' ? 'آزاد' : 'پر'}
                    color={venue.status === 'available' ? 'success' : 'error'}
                    size="small"
                    sx={{ borderRadius: '8px', fontWeight: 600, bgcolor: venue.status === 'available' ? 'rgba(76,175,80,0.9)' : 'rgba(244,67,54,0.9)', color: 'white' }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Rating value={venue.rating || 4} precision={0.5} size="small" readOnly sx={{ '& .MuiRating-iconEmpty': { color: 'rgba(255,255,255,0.3)' } }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{venue.rating || 4} از ۵</Typography>
                  </Box>
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
                      <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Icon icon="mdi:calendar-clock" className="h-4 w-4" />سانس‌ها</Box>} />
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

                    {tab === 1 && (
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
                        <ListItem sx={{ px: 0, py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon icon="mdi:phone" className="h-4 w-4" style={{ color: '#2563eb' }} />
                            </Box>
                          </ListItemIcon>
                          <ListItemText primary={venue.phone} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
                        </ListItem>
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
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>قیمت هر جلسه</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                          {formatPrice(venue.price)}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => setTab(1)}
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
                        <Icon icon="mdi:calendar-plus" className="h-5 w-5 ml-2" />
                        مشاهده سانس‌ها
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Confirmation Dialog */}
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
              سانس: {selectedSlot?.startTime} - {selectedSlot?.endTime && new Date(selectedSlot.endTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
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
    </Layout>
  )
}

export default VenueDetail