import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import {
  Box, Typography, Button, Chip, Divider, Paper,
  useTheme, Grid, Container,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import ConfirmModal from '@/components/modals/ConfirmModal'
import { formatDate, formatPrice, getStatusLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

const BookingDetail: React.FC = () => {
  const navigate = useNavigate()
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const theme = useTheme()

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

  const statusColor = booking.status === 'confirmed' ? 'success' : booking.status === 'pending' ? 'warning' : 'error'

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Back Button */}
        <Button
          variant="text"
          onClick={() => navigate('/bookings')}
          sx={{ mb: 3, borderRadius: 1, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
          startIcon={<Icon icon="mdi:arrow-right" />}
        >
          بازگشت به لیست رزروها
        </Button>

        {/* Header */}
        <Paper sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 44, height: 44,
                bgcolor: `${theme.palette.primary.main}08`,
                borderRadius: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon icon="mdi:stadium" className="h-5 w-5" style={{ color: theme.palette.primary.main }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{booking.venue}</Typography>
                <Typography variant="body2" color="text.secondary">{booking.address}</Typography>
              </Box>
            </Box>
            <Chip
              label={getStatusLabel(booking.status)}
              color={statusColor}
              variant="outlined"
              sx={{ borderRadius: 1, fontWeight: 600 }}
            />
          </Box>
        </Paper>

        <Grid container spacing={2}>
          {/* Main Content */}
          <Grid size={{ xs: 12, lg: 8 }}>
            {/* Booking Info */}
            <Paper sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>
                اطلاعات رزرو
              </Typography>
              <Grid container spacing={2}>
                {[
                  { icon: 'mdi:calendar', label: 'تاریخ', value: formatDate(booking.date) },
                  { icon: 'mdi:clock-outline', label: 'ساعت', value: booking.time },
                  { icon: 'mdi:currency-ils', label: 'قیمت', value: formatPrice(booking.price) },
                  { icon: 'mdi:ticket', label: 'کد رزرو', value: `#${String(booking.id).padStart(4, '0')}` },
                ].map((item, index) => (
                  <Grid size={{ xs: 6, md: 3 }} key={index}>
                    <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
                      <Icon icon={item.icon} className="h-4 w-4" style={{ color: theme.palette.primary.main, marginBottom: 8 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Timeline */}
            <Paper sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
                مراحل رزرو
              </Typography>
              <Box>
                {timelineItems.map((item, index) => {
                  const isCompleted = item.status === 'completed'
                  return (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: index < timelineItems.length - 1 ? 3 : 0, position: 'relative' }}>
                      {index < timelineItems.length - 1 && (
                        <Box sx={{
                          position: 'absolute',
                          right: 11,
                          top: 24,
                          bottom: -16,
                          width: 2,
                          bgcolor: isCompleted ? 'success.main' : theme.palette.grey[300],
                        }} />
                      )}
                      <Box sx={{
                        width: 24, height: 24,
                        borderRadius: '50%',
                        bgcolor: isCompleted ? 'success.main' : theme.palette.grey[300],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        ml: 1.5,
                        zIndex: 1,
                      }}>
                        <Icon
                          icon={isCompleted ? 'mdi:check' : 'mdi:circle-small'}
                          className="h-3.5 w-3.5"
                          style={{ color: 'white' }}
                        />
                      </Box>
                      <Box sx={{ pt: 0.25 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: isCompleted ? 'text.primary' : 'text.secondary' }}>
                          {item.label}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {item.time}
                        </Typography>
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, lg: 4 }}>
            {/* Contact Info */}
            <Paper sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                اطلاعات تماس
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { icon: 'mdi:account', label: 'رزرو کننده', value: booking.user },
                  { icon: 'mdi:phone', label: 'شماره تماس', value: booking.phone },
                  { icon: 'mdi:clock', label: 'تاریخ ثبت', value: booking.createdAt },
                ].map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Icon icon={item.icon} className="h-4 w-4" style={{ color: theme.palette.text.secondary }} />
                    <Box>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {booking.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      توضیحات
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
                      {booking.notes}
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>

            {/* Actions */}
            <Paper sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, border: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {booking.status === 'confirmed' && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setCancelModalOpen(true)}
                    sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, py: 1 }}
                    startIcon={<Icon icon="mdi:close-circle" />}
                  >
                    لغو رزرو
                  </Button>
                )}
                <Button
                  variant="outlined"
                  sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, py: 1 }}
                  startIcon={<Icon icon="mdi:printer" />}
                >
                  چاپ فاکتور
                </Button>
                <Button
                  variant="outlined"
                  sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, py: 1 }}
                  startIcon={<Icon icon="mdi:share" />}
                >
                  اشتراک‌گذاری
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

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