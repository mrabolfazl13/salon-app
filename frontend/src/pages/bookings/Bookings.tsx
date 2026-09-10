import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Tabs,
  Tab,
  Avatar,
  Skeleton,
  Alert,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import ConfirmModal from '@/components/modals/ConfirmModal'
import PaymentDialog from '@/components/bookings/PaymentDialog'
import { EmptyState } from '@/components/mobile'
import { bookingService } from '@/services/booking'
import { paymentService, PaymentItem } from '@/services/payment'
import {
  formatPrice,
  formatDateTime,
  formatDate,
  formatTimeFa,
  getSlotEndTime,
  getStatusLabel,
  getMuiStatusColor,
} from '@/lib/utils'
import toast from 'react-hot-toast'

// شکل رزرو از سمت بک‌اند (snake_case)
interface ApiBooking {
  id: number | string
  slot_id: number
  user_id: number
  booked_at: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_amount: number
  // اطلاعات تکمیلی (اختیاری؛ از بک‌اند ارسال می‌شود)
  venue_name?: string
  slot_date?: string
  start_time?: string
  duration?: number
  // رزرو معلق در Redis (در انتظار تایید مدیر سالن)
  isPendingRedis?: boolean
}

export type TabFilter = 'all' | 'confirmed' | 'pending' | 'cancelled' | 'completed'

const Bookings: React.FC = () => {
  const [tab, setTab] = useState<TabFilter>('all')
  const [bookings, setBookings] = useState<ApiBooking[]>([])
  const [pendingBookings, setPendingBookings] = useState<ApiBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<ApiBooking | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [payTarget, setPayTarget] = useState<ApiBooking | null>(null)
  const navigate = useNavigate()

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [data, pending, pays] = await Promise.all([
        bookingService.getAll(),
        bookingService.getMyPending().catch(() => []),
        paymentService.getMy().catch(() => []),
      ])
      setBookings(Array.isArray(data) ? data : [])
      setPendingBookings(Array.isArray(pending) ? pending : [])
      setPayments(Array.isArray(pays) ? pays : [])
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      if (cancelTarget.isPendingRedis) {
        await bookingService.cancelPending(cancelTarget.id as string)
      } else {
        await bookingService.cancel(cancelTarget.id as number)
      }
      toast.success('رزرو با موفقیت لغو شد!')
      setCancelTarget(null)
      await fetchBookings()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در لغو رزرو')
    } finally {
      setCancelling(false)
    }
  }

  const merged: ApiBooking[] = [
    ...pendingBookings.map((p) => ({ ...p, isPendingRedis: true })),
    ...bookings,
  ]
  const filtered =
    tab === 'all'
      ? merged
      : tab === 'pending'
        ? merged.filter((b) => b.isPendingRedis)
        : bookings.filter((b) => b.status === tab)

  // شناسه رزروهایی که پرداخت موفق داشته‌اند
  const paidBookingIds = new Set(
    payments.filter((p) => p.status === 'paid').map((p) => p.booking_id),
  )
  // شناسه رزروهایی که وجه‌شان بازگردانده شده
  const refundedBookingIds = new Set(
    payments.filter((p) => p.status === 'refunded').map((p) => p.booking_id),
  )

  return (
    <Layout>
      <Box sx={{ py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            رزروهای من
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            لیست رزروهای شما
          </Typography>
        </motion.div>

        <Tabs
          value={tab}
          onChange={(_, newValue: TabFilter) => setTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
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
          <Tab value="all" label="همه" />
          <Tab value="confirmed" label="تایید شده" />
          <Tab value="pending" label="در انتظار" />
          <Tab value="cancelled" label="لغو شده" />
          <Tab value="completed" label="انجام شده" />
        </Tabs>

        {error ? (
          <Alert
            severity="error"
            sx={{ borderRadius: '16px' }}
            action={
              <Button color="inherit" size="small" onClick={fetchBookings}>
                تلاش دوباره
              </Button>
            }
          >
            در دریافت رزروها خطایی رخ داد. لطفاً دوباره تلاش کنید.
          </Alert>
        ) : loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid size={{ xs: 12 }} key={i}>
                <Skeleton variant="rounded" height={110} sx={{ borderRadius: '16px' }} />
              </Grid>
            ))}
          </Grid>
        ) : filtered.length === 0 ? (
          <EmptyState
            emoji="📅"
            title="رزرویی یافت نشد"
            description="هنوز رزروی در این بخش ندارید. یک سالن پیدا کنید و بازی بعدی‌تان را رزرو کنید."
            actionLabel="پیدا کردن سالن"
            onAction={() => navigate('/venues')}
          />
        ) : (
          <Grid container spacing={3}>
            {filtered.map((booking, index) => (
              <Grid size={{ xs: 12 }} key={booking.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    sx={{
                      borderRadius: '16px',
                      transition: 'all 0.3s',
                      '&:hover': {
                        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor: 'primary.main',
                            }}
                          >
                            <Icon icon="mdi:calendar" className="h-6 w-6 text-white" />
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 600 }} variant="subtitle1">
                              {booking.venue_name || `سالن #${booking.slot_id}`}
                            </Typography>
                            {booking.slot_date ? (
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(booking.slot_date)} —{' '}
                                {formatTimeFa(booking.start_time)} تا{' '}
                                {getSlotEndTime(booking.start_time || '', booking.duration || 90)}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                {formatDateTime(booking.booked_at)}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 1.5,
                            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                          }}
                        >
                          <Typography sx={{ fontWeight: 700 }} variant="body2">
                            {formatPrice(booking.payment_amount)}
                          </Typography>
                          <Chip
                            label={getStatusLabel(booking.status)}
                            color={getMuiStatusColor(booking.status) as any}
                            size="small"
                            sx={{ borderRadius: '8px' }}
                          />
                          {booking.status === 'cancelled' &&
                            refundedBookingIds.has(Number(booking.id)) && (
                              <Chip
                                label="بازگشت وجه"
                                size="small"
                                color="info"
                                icon={<Icon icon="mdi:restore" className="h-4 w-4" />}
                                sx={{ borderRadius: '8px', fontWeight: 600 }}
                              />
                            )}
                          {booking.status === 'confirmed' &&
                            !booking.isPendingRedis &&
                            (paidBookingIds.has(Number(booking.id)) ? (
                              <Chip
                                label="پرداخت شده"
                                size="small"
                                color="success"
                                icon={<Icon icon="mdi:check-circle-outline" className="h-4 w-4" />}
                                sx={{ borderRadius: '8px', fontWeight: 600 }}
                              />
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => setPayTarget(booking)}
                                sx={{
                                  borderRadius: '10px',
                                  textTransform: 'none',
                                  minHeight: { xs: 44, sm: 34 },
                                  px: { xs: 2, sm: 1.5 },
                                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                                  '&:hover': { background: 'linear-gradient(135deg, #15803d, #166534)' },
                                }}
                              >
                                <Icon icon="mdi:credit-card-plus-outline" className="h-4 w-4 ml-1" />
                                پرداخت
                              </Button>
                            ))}
                          {!booking.isPendingRedis && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => navigate(`/bookings/${booking.id}`)}
                              sx={{
                                borderRadius: '10px',
                                textTransform: 'none',
                                minHeight: { xs: 44, sm: 34 },
                                px: { xs: 2, sm: 1.5 },
                              }}
                            >
                              جزئیات
                            </Button>
                          )}
                          {(booking.status === 'confirmed' || booking.status === 'pending') && (
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => setCancelTarget(booking)}
                              sx={{
                                borderRadius: '10px',
                                textTransform: 'none',
                                minHeight: { xs: 44, sm: 34 },
                                px: { xs: 2, sm: 1.5 },
                              }}
                            >
                              لغو
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <ConfirmModal
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="لغو رزرو"
        description="آیا از لغو این رزرو اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmText="بله، لغو شود"
        cancelText="خیر، بازگشت"
        variant="destructive"
        onConfirm={handleConfirmCancel}
        loading={cancelling}
      />

      <PaymentDialog
        open={Boolean(payTarget)}
        onClose={() => {
          setPayTarget(null)
          fetchBookings()
        }}
        bookingId={Number(payTarget?.id ?? 0)}
        amount={payTarget?.payment_amount ?? 0}
        venueName={payTarget?.venue_name}
        slotDate={payTarget?.slot_date}
        startTime={payTarget?.start_time}
      />
    </Layout>
  )
}

export default Bookings