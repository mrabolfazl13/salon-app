import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import {
  Box,
  CircularProgress,
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
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import ConfirmModal from '@/components/modals/ConfirmModal'
import BookingPaymentPanel from '@/components/bookings/BookingPaymentPanel'
import VenueThumb from '@/components/venue/VenueThumb'
import { bookingService } from '@/services/booking'
import { venueService } from '@/services/venue'
import { checkinService } from '@/services/checkin'
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
import PricingBreakdown, { normalizeBreakdown } from '@/components/deals/PricingBreakdown'

interface ApiBooking {
  id: number
  slot_id: number
  user_id: number
  booked_at: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_amount: number
  // اطلاعات تکمیلی (اختیاری؛ از بک‌اند ارسال می‌شود)
  venue_name?: string
  venue_images?: string[] | string
  slot_date?: string
  start_time?: string
  duration?: number
  // اجزای تخفیف سمت سرور — ریز قیمت پس از تأیید/ثبت
  discount_amount?: number
  coupon_code?: string | null
  loyalty_points_used?: number
  pricing_breakdown?: unknown
  // آخرین فاکتور پرداخت (از اندپوینت جزئیات رزرو)
  payment?: PaymentItem | null
  // روش پرداخت + فیلدهای کامل فیش واریزی
  payment_mode?: string | null
  needs_receipt?: boolean
  receipt_status?: string | null
  receipt_amount?: number | null
  receipt_reference?: string | null
  receipt_bank?: string | null
  receipt_image?: string | null
  receipt_submitted_at?: string | null
  receipt_reviewed_at?: string | null
  receipt_review_note?: string | null
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
  const [searchParams] = useSearchParams()
  const [booking, setBooking] = useState<ApiBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [rebookBusy, setRebookBusy] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null)

  // باز کردن خودکار مودال لغو وقتی از یادآوری اومده
  useEffect(() => {
    if (searchParams.get('cancel') === 'true') {
      setCancelModalOpen(true)
      // پاک کردن query param برای جلوگیری از باز شدن مجدد در refresh
      navigate(`/bookings/${id}`, { replace: true })
    }
  }, [searchParams, id, navigate])

  // دریافت QR code بعد از لود رزرو
  useEffect(() => {
    if (booking && booking.status === 'confirmed' && !qrCodeData) {
      fetchQrCode()
    }
  }, [booking])

  const fetchQrCode = async () => {
    if (!booking || booking.status !== 'confirmed') return
    try {
      setCheckinLoading(true)
      const data = await checkinService.getQrCode(booking.id)
      setQrCodeData(data.check_in_code)
      if (data.checked_in_at) {
        setCheckedInAt(data.checked_in_at)
      }
    } catch (err) {
      // خطا را نادیده بگیر — ممکن است هنوز کد تولید نشده باشد
    } finally {
      setCheckinLoading(false)
    }
  }

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

  // رزرو دوباره — پاسخ بک‌اند venue_id ندارد؛ تطبیق با جست‌وجوی نام سالن و
  // ناوبری /venues/{id}?date=&time= (الگوی preselect لینک دیل در VenueDetail)
  const handleRebook = async () => {
    if (!booking) return
    if (!booking.slot_date || !booking.start_time || !booking.venue_name) {
      toast.error('اطلاعات سانس این رزرو کامل نیست')
      return
    }
    setRebookBusy(true)
    try {
      const results: any = await venueService.getAll({ search: booking.venue_name, limit: 50 })
      const list = Array.isArray(results) ? results : []
      const venue =
        list.find((v: any) => v.name === booking.venue_name) ??
        (list.length === 1 ? list[0] : null)
      if (!venue) {
        toast.error('سالن مورد نظر پیدا نشد — از فهرست سالن‌ها انتخاب کنید')
        navigate('/venues')
        return
      }
      const time = String(booking.start_time).slice(0, 5)
      navigate(`/venues/${venue.id}?date=${booking.slot_date}&time=${time}`)
    } catch {
      toast.error('خطا در آماده‌سازی رزرو دوباره')
    } finally {
      setRebookBusy(false)
    }
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
              <VenueThumb
                images={booking.venue_images}
                name={booking.venue_name || `سالن #${booking.slot_id}`}
                size={44}
                radius={8}
              />
              <Box>
                <Typography component="h1" variant="h6" sx={{ fontWeight: 700 }}>
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

              {normalizeBreakdown(booking.pricing_breakdown) && (
                <Box sx={{ mt: 2 }}>
                  <PricingBreakdown
                    steps={normalizeBreakdown(booking.pricing_breakdown) ?? []}
                    payable={Number(booking.payment_amount) || null}
                  />
                </Box>
              )}

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

              {/* QR Code Check-in */}
              {booking.status === 'confirmed' && (
                <>
                  <Divider sx={{ my: 3 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      کد ورود (Check-in)
                    </Typography>
                    {checkedInAt && (
                      <Chip
                        label={`ورود ثبت شد: ${formatDateTime(checkedInAt)}`}
                        size="small"
                        color="success"
                        sx={{ borderRadius: 1, fontWeight: 600 }}
                        icon={<Icon icon="mdi:check-circle" />}
                      />
                    )}
                  </Box>

                  {checkinLoading ? (
                    <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
                  ) : qrCodeData ? (
                    <Paper
                      onClick={() => setQrDialogOpen(true)}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: `2px dashed ${theme.palette.primary.main}`,
                        bgcolor: `${theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)'}`,
                        '&:hover': {
                          bgcolor: `${theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)'}`,
                        },
                      }}
                    >
                      <Typography
                        variant="h3"
                        sx={{
                          fontFamily: 'monospace',
                          letterSpacing: '0.2em',
                          fontWeight: 700,
                          color: 'primary.main',
                          userSelect: 'all',
                        }}
                      >
                        {qrCodeData}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        برای نمایش کد بزرگ کلیک کنید
                      </Typography>
                    </Paper>
                  ) : null}
                </>
              )}

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
                {(booking.payment_mode === 'bank_receipt' || booking.payment_mode === 'pay_in_place') && (
                  <BookingPaymentPanel booking={booking} onChanged={fetchBooking} />
                )}
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
                  variant="contained"
                  onClick={handleRebook}
                  disabled={rebookBusy || !booking.slot_date}
                  sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 800, py: 1, background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 55%, #f97316 100%)', color: '#1c1917', boxShadow: '0 4px 14px rgba(245,158,11,0.35)', '&:hover': { background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' } }}
                  startIcon={rebookBusy ? <CircularProgress size={18} color="inherit" /> : <Icon icon="mdi:calendar-refresh" />}
                >
                  رزرو دوباره
                </Button>
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

      {/* QR Code Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, pb: 1 }}>
          کد ورود به سالن
        </DialogTitle>
        <DialogContent>
          {qrCodeData && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: 'monospace',
                  letterSpacing: '0.15em',
                  fontWeight: 800,
                  color: 'primary.main',
                  mb: 2,
                  userSelect: 'all',
                }}
              >
                {qrCodeData}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                این کد را به مسئول سالن ارائه دهید
              </Typography>
              {checkedInAt ? (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  ورود شما در تاریخ {formatDateTime(checkedInAt)} ثبت شده است
                </Alert>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  هنوز وارد نشده‌اید — کد را به مدیر سالن نشان دهید
                </Alert>
              )}
              <Button
                onClick={() => setQrDialogOpen(false)}
                variant="contained"
                sx={{ mt: 3, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                بستن
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

export default BookingDetail