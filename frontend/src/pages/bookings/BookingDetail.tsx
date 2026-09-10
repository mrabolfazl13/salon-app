import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  Paper,
  useTheme,
  Grid,
  Container,
  Skeleton,
  Alert,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import ConfirmModal from '@/components/modals/ConfirmModal'
import { bookingService } from '@/services/booking'
import type { PaymentItem } from '@/services/payment'
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

interface ApiBooking {
  id: number
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
  // آخرین فاکتور پرداخت (از اندپوینت جزئیات رزرو)
  payment?: PaymentItem | null
}

const paymentStatusMeta: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' }> = {
  paid: { label: 'پرداخت شده', color: 'success' },
  pending: { label: 'در انتظار پرداخت', color: 'warning' },
  failed: { label: 'ناموفق', color: 'error' },
  refunded: { label: 'بازگشت وجه', color: 'info' },
}

const BookingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const [booking, setBooking] = useState<ApiBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const fetchBooking = useCallback(async () => {
    setLoading(true)
    setNotFound(false)
    try {
      const data = await bookingService.getById(Number(id))
      if (data && data.id) {
        setBooking(data as ApiBooking)
      } else {
        setNotFound(true)
      }
    } catch (err) {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  const handleCancel = async () => {
    if (!booking) return
    setCancelling(true)
    try {
      await bookingService.cancel(booking.id)
      toast.success('رزرو با موفقیت لغو شد!')
      setCancelModalOpen(false)
      navigate('/bookings')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'خطا در لغو رزرو')
    } finally {
      setCancelling(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('لینک در کلیپ‌بورد کپی شد!')
    } catch {
      toast.error('امکان کپی لینک وجود ندارد')
    }
  }

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
          <Skeleton variant="rounded" height={48} sx={{ borderRadius: 2, mb: 3 }} />
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2, mb: 3 }} />
          <Skeleton variant="rounded" height={260} sx={{ borderRadius: 2 }} />
        </Container>
      </Layout>
    )
  }

  if (notFound || !booking) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
          <Button
            variant="text"
            onClick={() => navigate('/bookings')}
            sx={{ mb: 3, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
            startIcon={<Icon icon="mdi:arrow-right" />}
          >
            بازگشت به لیست رزروها
          </Button>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            رزرو مورد نظر یافت نشد یا دسترسی شما به آن محدود است.
          </Alert>
        </Container>
      </Layout>
    )
  }

  const timelineItems = [
    {
      label: 'رزرو ثبت شد',
      time: formatDateTime(booking.booked_at),
      status: 'completed',
    },
    {
      label: booking.status === 'confirmed' ? 'تایید شد' : 'در انتظار تایید',
      time: booking.status === 'confirmed' ? formatDateTime(booking.booked_at) : '—',
      status: booking.status === 'confirmed' ? 'completed' : 'pending',
    },
    {
      label: 'روز برگزاری',
      time: booking.slot_date
        ? `${formatDate(booking.slot_date)}، ${formatTimeFa(booking.start_time)}`
        : '—',
      status: 'pending',
    },
  ]

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
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {booking.venue_name || `سالن #${booking.slot_id}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  رزرو #{booking.id}
                  {booking.slot_date &&
                    ` — ${formatDate(booking.slot_date)}، ${formatTimeFa(booking.start_time)} تا ${getSlotEndTime(booking.start_time || '', booking.duration || 90)}`}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={getStatusLabel(booking.status)}
              color={getMuiStatusColor(booking.status) as any}
              variant="outlined"
              sx={{ borderRadius: 1, fontWeight: 600 }}
            />
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Main Info */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                جزئیات رزرو
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.5 }}>
                    مبلغ پرداختی
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {formatPrice(booking.payment_amount)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.5 }}>
                    تاریخ ثبت
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatDateTime(booking.booked_at)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.5 }}>
                    وضعیت
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {getStatusLabel(booking.status)}
                  </Typography>
                </Grid>
              </Grid>

              {/* اطلاعات فاکتور پرداخت */}
              {booking.payment && (() => {
                const meta = paymentStatusMeta[booking.payment.status] ?? { label: booking.payment.status, color: 'warning' as const }
                return (
                  <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: `${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon
                          icon={booking.payment.status === 'paid' ? 'mdi:check-decagram'
                            : booking.payment.status === 'refunded' ? 'mdi:restore'
                            : booking.payment.status === 'failed' ? 'mdi:alert-circle-outline'
                            : 'mdi:clock-outline'}
                          style={{
                            color: meta.color === 'success' ? theme.palette.success.main
                              : meta.color === 'error' ? theme.palette.error.main
                              : meta.color === 'info' ? theme.palette.info.main
                              : theme.palette.warning.main,
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>فاکتور پرداخت</Typography>
                      </Box>
                      <Chip label={meta.label} color={meta.color} size="small" sx={{ borderRadius: 1, fontWeight: 600 }} />
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>مبلغ فاکتور</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatPrice(booking.payment.amount)}</Typography>
                      </Box>
                      {booking.payment.paid_at && (
                        <Box>
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>زمان پرداخت</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateTime(booking.payment.paid_at)}</Typography>
                        </Box>
                      )}
                      {booking.payment.card_pan && (
                        <Box>
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>کارت</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} dir="ltr">**** {booking.payment.card_pan}</Typography>
                        </Box>
                      )}
                      {booking.payment.transaction_id && (
                        <Box>
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>شناسه تراکنش</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} dir="ltr">{booking.payment.transaction_id}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )
              })()}

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                خط زمانی
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {timelineItems.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 10, height: 10, borderRadius: '50%',
                      bgcolor: item.status === 'completed' ? 'success.main' : theme.palette.grey[300],
                      flexShrink: 0,
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.time}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Actions */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                عملیات
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {(booking.status === 'confirmed' || booking.status === 'pending') && (
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
                  onClick={handlePrint}
                  sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, py: 1 }}
                  startIcon={<Icon icon="mdi:printer" />}
                >
                  چاپ فاکتور
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleShare}
                  sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, py: 1 }}
                  startIcon={<Icon icon="mdi:share" />}
                >
                  اشتراک‌گذاری
                </Button>
                <Button
                  variant="text"
                  onClick={fetchBooking}
                  sx={{ textTransform: 'none', fontWeight: 600, py: 1 }}
                  startIcon={<Icon icon="mdi:refresh" />}
                >
                  به‌روزرسانی
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
        loading={cancelling}
      />
    </Layout>
  )
}

export default BookingDetail