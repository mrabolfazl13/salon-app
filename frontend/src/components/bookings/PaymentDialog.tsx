import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { paymentService, PaymentItem } from '@/services/payment'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

// تبدیل ارقام فارسی/عربی به لاتین
const toLatinDigits = (value: string): string =>
  value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))

interface PaymentDialogProps {
  open: boolean
  onClose: () => void
  bookingId: number
  amount: number
  venueName?: string
  slotDate?: string
  startTime?: string
  onSuccess?: (payment: PaymentItem) => void
}

type Step = 'invoice' | 'form' | 'processing' | 'success'

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  bookingId,
  amount,
  venueName,
  slotDate,
  startTime,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('invoice')
  const [payment, setPayment] = useState<PaymentItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [cardNumber, setCardNumber] = useState('')
  const [cvv, setCvv] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // ساخت/بازیابی فاکتور هنگام باز شدن
  useEffect(() => {
    if (!open) return
    setStep('invoice')
    setError(null)
    setPayment(null)
    setCardNumber('')
    setCvv('')
    setMonth('')
    setYear('')
    setFieldErrors({})

    let cancelled = false
    paymentService
      .create(bookingId)
      .then((p) => {
        if (cancelled) return
        setPayment(p)
        setStep('form')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.data?.detail || 'خطا در ایجاد فاکتور پرداخت')
        setStep('form')
      })
    return () => {
      cancelled = true
    }
  }, [open, bookingId])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    const card = toLatinDigits(cardNumber).replace(/[\s-]/g, '')
    if (!/^\d{16}$/.test(card)) errs.cardNumber = 'شماره کارت باید ۱۶ رقم باشد'
    const cvvVal = toLatinDigits(cvv)
    if (!/^\d{3,4}$/.test(cvvVal)) errs.cvv = 'CVV2 نامعتبر است'
    const m = Number(toLatinDigits(month))
    if (!m || m < 1 || m > 12) errs.month = 'ماه نامعتبر است'
    const y = Number(toLatinDigits(year))
    if (!y || y < 1300 || y > 1500) errs.year = 'سال نامعتبر است'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePay = async () => {
    if (!payment || !validate()) return
    setStep('processing')
    setError(null)
    try {
      const paid = await paymentService.pay(payment.id, {
        card_number: toLatinDigits(cardNumber).replace(/[\s-]/g, ''),
        cvv: toLatinDigits(cvv),
        month: Number(toLatinDigits(month)),
        year: Number(toLatinDigits(year)),
      })
      setPayment(paid)
      setStep('success')
      toast.success('پرداخت با موفقیت انجام شد!')
      onSuccess?.(paid)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'پرداخت ناموفق بود، دوباره تلاش کنید')
      setStep('form')
    }
  }

  return (
    <Dialog
      open={open}
      onClose={step === 'processing' ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: '20px', overflow: 'visible' } } }}
    >
      {/* هدر گرادیانی شبیه درگاه بانک */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #7c3aed 100%)',
          borderRadius: '20px 20px 0 0',
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Icon icon="mdi:bank-outline" className="h-5 w-5" />
          درگاه پرداخت
        </Typography>
        <Chip
          label="شبیه‌سازی‌شده"
          size="small"
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
        />
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        {/* خلاصه سفارش */}
        <Box
          sx={{
            bgcolor: 'action.hover',
            borderRadius: '14px',
            p: 2,
            mb: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              سالن
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {venueName || `رزرو #${bookingId}`}
            </Typography>
          </Box>
          {slotDate && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                زمان
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {slotDate}
                {startTime ? ` — ${startTime.slice(0, 5)}` : ''}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              مبلغ قابل پرداخت
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {formatPrice(amount)}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        <AnimatePresence mode="wait">
          {step === 'invoice' && (
            <motion.div
              key="invoice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '32px 0' }}
            >
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                در حال صدور فاکتور...
              </Typography>
            </motion.div>
          )}

          {(step === 'form' || step === 'processing') && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: step === 'processing' ? 0.5 : 1 }}>
                <TextField
                  label="شماره کارت"
                  placeholder="6037 9971 0000 0000"
                  value={cardNumber}
                  onChange={(e) => {
                    const digits = toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 16)
                    setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '))
                  }}
                  fullWidth
                  size="small"
                  disabled={step === 'processing'}
                  error={Boolean(fieldErrors.cardNumber)}
                  helperText={fieldErrors.cardNumber || '۱۶ رقم روی کارت'}
                  slotProps={{
                    input: {
                      startAdornment: <Icon icon="mdi:credit-card-outline" className="h-5 w-5 ml-2" style={{ color: 'rgba(0,0,0,0.4)' }} />,
                    },
                  }}
                />
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <TextField
                    label="CVV2"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 4))}
                    size="small"
                    sx={{ width: 100 }}
                    disabled={step === 'processing'}
                    error={Boolean(fieldErrors.cvv)}
                    helperText={fieldErrors.cvv}
                  />
                  <TextField
                    label="ماه"
                    placeholder="01"
                    value={month}
                    onChange={(e) => setMonth(toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 2))}
                    size="small"
                    sx={{ width: 72 }}
                    disabled={step === 'processing'}
                    error={Boolean(fieldErrors.month)}
                    helperText={fieldErrors.month}
                  />
                  <TextField
                    label="سال"
                    placeholder="1405"
                    value={year}
                    onChange={(e) => setYear(toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 4))}
                    size="small"
                    sx={{ width: 84 }}
                    disabled={step === 'processing'}
                    error={Boolean(fieldErrors.year)}
                    helperText={fieldErrors.year}
                  />
                </Box>
              </Box>
            </motion.div>
          )}

          {step === 'success' && payment && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '8px 0' }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Icon icon="mdi:check-bold" className="h-8 w-8" style={{ color: 'white' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                پرداخت موفق
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                تراکنش شما با موفقیت انجام شد
              </Typography>
              <Box
                sx={{
                  bgcolor: 'action.hover',
                  borderRadius: '12px',
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    کد پیگیری
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, direction: 'ltr' }}>
                    {payment.transaction_id}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    مبلغ
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatPrice(payment.amount)}
                  </Typography>
                </Box>
                {payment.card_pan && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      کارت
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, direction: 'ltr' }}>
                      **** {payment.card_pan}
                    </Typography>
                  </Box>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {step === 'success' ? (
          <Button
            variant="contained"
            fullWidth
            onClick={onClose}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              '&:hover': { background: 'linear-gradient(135deg, #15803d, #166534)' },
            }}
          >
            بستن
          </Button>
        ) : (
          <>
            <Button
              onClick={onClose}
              disabled={step === 'processing'}
              sx={{ borderRadius: '12px', textTransform: 'none' }}
            >
              انصراف
            </Button>
            <Button
              variant="contained"
              onClick={handlePay}
              disabled={step !== 'form' || !payment}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                flex: 1,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)' },
              }}
            >
              {step === 'processing' ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} color="inherit" />
                  در حال پرداخت...
                </Box>
              ) : (
                <>
                  <Icon icon="mdi:lock-check-outline" className="h-5 w-5 ml-1" />
                  پرداخت {formatPrice(amount)}
                </>
              )}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default PaymentDialog
