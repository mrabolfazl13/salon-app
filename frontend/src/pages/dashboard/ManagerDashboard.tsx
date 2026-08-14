// frontend/src/pages/dashboard/ManagerDashboard.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  TextField,
  Paper,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { venueService } from '@/services/venue'
import { slotService } from '@/services/slot'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Venue {
  id: number
  name: string
  address: string
  phone: string
  is_verified: boolean
  price: number
  amenities: string[]
}

interface Slot {
  id: number
  slot_date: string
  start_time: string
  current_price: number
  status: string
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
    latitude: 35.6892,
    longitude: 51.3890,
    description: '',
    amenities: [] as string[],
  })

  const navigate = useNavigate()

  useEffect(() => {
    fetchVenues()
  }, [])

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

  const handleCreateVenue = async () => {
    try {
      await venueService.create({
        ...newVenue,
        amenities: newVenue.amenities.filter(a => a.trim()),
        images: [],
      })
      toast.success('سالن با موفقیت ایجاد شد')
      setOpenCreateVenue(false)
      setNewVenue({ name: '', address: '', phone: '', latitude: 35.6892, longitude: 51.3890, description: '', amenities: [] })
      fetchVenues()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در ایجاد سالن')
    }
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

  const stats = {
    totalVenues: venues.length,
    totalBookings: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
  }

  if (loading) {
    return (
      <Layout isAuthenticated userRole="venue_manager">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Layout>
    )
  }

  return (
    <Layout isAuthenticated userRole="venue_manager">
      <Box sx={{ py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            داشبورد مدیر سالن
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            مدیریت سالن‌ها و سانس‌ها
          </Typography>
        </motion.div>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon icon="mdi:store" className="h-6 w-6 text-primary" />
                  </Box>
                  <div>
                    <Typography variant="h4" fontWeight={700}>{stats.totalVenues}</Typography>
                    <Typography variant="caption" color="text.secondary">سالن‌های من</Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon icon="mdi:calendar-check" className="h-6 w-6 text-success" />
                  </Box>
                  <div>
                    <Typography variant="h4" fontWeight={700}>{stats.totalBookings}</Typography>
                    <Typography variant="caption" color="text.secondary">رزروهای امروز</Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'warning.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon icon="mdi:currency-IRR" className="h-6 w-6 text-warning" />
                  </Box>
                  <div>
                    <Typography variant="h4" fontWeight={700}>{formatPrice(stats.totalRevenue)}</Typography>
                    <Typography variant="caption" color="text.secondary">درآمد ماه</Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'info.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon icon="mdi:clock" className="h-6 w-6 text-info" />
                  </Box>
                  <div>
                    <Typography variant="h4" fontWeight={700}>{stats.pendingVerifications}</Typography>
                    <Typography variant="caption" color="text.secondary">در انتظار تایید</Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="سالن‌های من" />
          <Tab label="سانس‌ها" />
          <Tab label="رزروها" />
        </Tabs>

        {/* Venues Tab */}
        {tab === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6">لیست سالن‌ها</Typography>
              <Button
                variant="contained"
                startIcon={<Icon icon="mdi:plus" />}
                onClick={() => setOpenCreateVenue(true)}
                sx={{ borderRadius: '12px' }}
              >
                افزودن سالن جدید
              </Button>
            </Box>

            {venues.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: '16px' }}>
                شما هنوز سالنی اضافه نکرده‌اید. روی دکمه "افزودن سالن جدید" کلیک کنید.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {venues.map((venue) => (
                  <Grid item xs={12} md={6} key={venue.id}>
                    <Card sx={{ borderRadius: '16px' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <div>
                            <Typography variant="h6" fontWeight={600}>{venue.name}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {venue.address}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {venue.phone}
                            </Typography>
                          </div>
                          <Chip
                            label={venue.is_verified ? 'تایید شده' : 'در انتظار'}
                            color={venue.is_verified ? 'success' : 'warning'}
                            size="small"
                            sx={{ borderRadius: '8px' }}
                          />
                        </Box>

                        <Box display="flex" gap={1} sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Icon icon="mdi:calendar-plus" />}
                            onClick={() => {
                              setSelectedVenue(venue)
                              setOpenGenerateSlots(true)
                            }}
                            sx={{ borderRadius: '8px' }}
                          >
                            ایجاد سانس
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Icon icon="mdi:eye" />}
                            onClick={() => navigate(`/venues/${venue.id}`)}
                            sx={{ borderRadius: '8px' }}
                          >
                            مشاهده
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </motion.div>
        )}

        {/* Slots Tab */}
        {tab === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Alert severity="info" sx={{ borderRadius: '16px', mb: 3 }}>
              ابتدا باید برای سالن خود سانس ایجاد کنید.
            </Alert>
          </motion.div>
        )}

        {/* Bookings Tab */}
        {tab === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Alert severity="info" sx={{ borderRadius: '16px', mb: 3 }}>
              رزروی ثبت نشده است.
            </Alert>
          </motion.div>
        )}
      </Box>

      {/* Create Venue Dialog */}
      <Dialog open={openCreateVenue} onClose={() => setOpenCreateVenue(false)} maxWidth="sm" fullWidth>
        <DialogTitle>افزودن سالن جدید</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="نام سالن"
            value={newVenue.name}
            onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="آدرس"
            value={newVenue.address}
            onChange={(e) => setNewVenue({ ...newVenue, address: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="شماره تماس"
            value={newVenue.phone}
            onChange={(e) => setNewVenue({ ...newVenue, phone: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="09xxxxxxxxx"
          />
          <TextField
            fullWidth
            label="توضیحات"
            value={newVenue.description}
            onChange={(e) => setNewVenue({ ...newVenue, description: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenCreateVenue(false)}>انصراف</Button>
          <Button onClick={handleCreateVenue} variant="contained">
            ایجاد سالن
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Slots Dialog */}
      <Dialog open={openGenerateSlots} onClose={() => setOpenGenerateSlots(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ایجاد سانس برای {selectedVenue?.name}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            type="date"
            label="تاریخ"
            value={slotDate}
            onChange={(e) => setSlotDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenGenerateSlots(false)}>انصراف</Button>
          <Button onClick={handleGenerateSlots} variant="contained">
            ایجاد سانس‌ها
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  )
}

export default ManagerDashboard