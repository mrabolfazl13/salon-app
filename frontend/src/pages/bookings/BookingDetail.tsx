import React, { useState } from 'react'
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
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import ConfirmModal from '@/components/modals/ConfirmModal'
import { formatDate, formatDateTime, formatPrice, getStatusColor, getStatusLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

const BookingDetail: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Mock booking data
  const booking = {
    id: 1,
    venue: 'سالن آبی',
    address: 'تهران، خیابان آزادی',
    date: '۱۴۰۲/۱۰/۱۵',
    time: '۱۷:۰۰ - ۱۸:۳۰',
    price: 300000,
    status: 'confirmed' as const,
    createdAt: '۱۴۰۲/۱۰/۰۱ ۱۴:۳۰',
    user: 'علی محمدی',
    phone: '۰۹۱۲۳۴۵۶۷۸۹',
    notes: 'لطفاً سیستم صوتی آماده باشد.',
  }

  const timelineItems = [
    { label: 'رزرو ثبت شد', time: '۱۴۰۲/۱۰/۰۱ ۱۴:۳۰', status: 'completed' },
    { label: 'تایید شد', time: '۱۴۰۲/۱۰/۰۱ ۱۵:۰۰', status: 'completed' },
    { label: 'روز برگزاری', time: '۱۴۰۲/۱۰/۱۵ ۱۷:۰۰', status: 'pending' },
    { label: 'پایان جلسه', time: '۱۴۰۲/۱۰/۱۵ ۱۸:۳۰', status: 'pending' },
  ]

  const handleCancel = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('رزرو با موفقیت لغو شد!')
      setCancelModalOpen(false)
      navigate('/bookings')
    } catch (error) {
      toast.error('خطا در لغو رزرو')
    } finally {
      setLoading(false)
    }
  }

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
            onClick={() => navigate('/bookings')}
            className="mb-4"
          >
            <Icon icon="mdi:arrow-right" className="h-5 w-5 ml-2" />
            بازگشت به لیست رزروها
          </Button>

          <Grid container spacing={3}>
            {/* Main Content */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ borderRadius: '16px', mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        {booking.venue}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                        <Icon icon="mdi:map-marker" className="h-4 w-4 text-muted-foreground" />
                        <Typography variant="body2" color="text.secondary">
                          {booking.address}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={getStatusLabel(booking.status)}
                      color={getStatusColor(booking.status) as any}
                      sx={{ borderRadius: '8px' }}
                    />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Grid container spacing={3}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        تاریخ
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatDate(booking.date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        ساعت
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {booking.time}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        قیمت
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {formatPrice(booking.price)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        کد رزرو
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        #{String(booking.id).padStart(4, '0')}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    وضعیت رزرو
                  </Typography>
                  <Timeline position="right">
                    {timelineItems.map((item, index) => (
                      <TimelineItem key={index}>
                        <TimelineOppositeContent color="text.secondary">
                          {item.time}
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot
                            color={
                              item.status === 'completed'
                                ? 'success'
                                : item.status === 'pending'
                                ? 'warning'
                                : 'grey'
                            }
                          />
                          {index < timelineItems.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="body2" fontWeight={600}>
                            {item.label}
                          </Typography>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </CardContent>
              </Card>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ borderRadius: '16px', mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    اطلاعات رزرو
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Icon icon="mdi:account" className="h-5 w-5 text-primary" />
                      </ListItemIcon>
                      <ListItemText primary="رزرو کننده" secondary={booking.user} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Icon icon="mdi:phone" className="h-5 w-5 text-primary" />
                      </ListItemIcon>
                      <ListItemText primary="شماره تماس" secondary={booking.phone} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Icon icon="mdi:clock" className="h-5 w-5 text-primary" />
                      </ListItemIcon>
                      <ListItemText primary="تاریخ ثبت" secondary={formatDateTime(booking.createdAt)} />
                    </ListItem>
                  </List>

                  {booking.notes && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        توضیحات
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {booking.notes}
                      </Typography>
                    </>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {booking.status === 'confirmed' && (
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth
                      sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        py: 1.5,
                      }}
                      onClick={() => setCancelModalOpen(true)}
                    >
                      <Icon icon="mdi:close" className="h-5 w-5 ml-2" />
                      لغو رزرو
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      mt: 1,
                      borderRadius: '12px',
                      textTransform: 'none',
                    }}
                  >
                    <Icon icon="mdi:printer" className="h-5 w-5 ml-2" />
                    چاپ فاکتور
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      </Box>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        title="لغو رزرو"
        description="آیا از لغو این رزرو اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmText="بله، لغو شود"
        cancelText="خیر، بازگشت"
        variant="destructive"
        onConfirm={handleCancel}
        loading={loading}
      />
    </Layout>
  )
}

export default BookingDetail