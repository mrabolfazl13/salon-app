// frontend/src/components/contract/ContractInstallmentPayDialog.tsx
// پرداخت قسط قرارداد — جریانش درگاه شبیه‌سازی‌شده (الگوی BookingPaymentDialog)
// روی endpoint بک‌اند: POST /contracts/{id}/payments/{payment_id}/pay {card_number}
// نکات بک‌اند: فقط مالک قرارداد؛ قرارداد active/expired؛ کارت اختیاری (بدون کارت = نقدی).

import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { usePayInstallment } from '@/hooks/useContracts'
import { formatJalaliDate } from '@/lib/jalali'
import { extractError, formatRial } from '@/components/contract/shared'
import type { ContractPaymentData } from '@/services/contract'

// تبدیل ارقام فارسی/عربی به لاتین (هم‌رفتار با payments.py در نرمال‌سازی)
export const toLatinDigits = (value: string): string =>
  value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))

type Step = 'form' | 'processing' | 'success'

interface Props {
  open: boolean
  onClose: () => void
  contractId: number
  venueName?: string | null
  payment: ContractPaymentData | null
  onSuccess?: () => void
}

const ContractInstallmentPayDialog: React.FC<Props> = ({
  open,
  onClose,
  contractId,
  venueName,
  payment,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState<string | null>(null)
  const [cardNumber, setCardNumber] = useState('')
  const [cardError, setCardError] = useState<string | null>(null)
  const payMutation = usePayInstallment(contractId)

  useEffect(() => {
    if (open) {
      setStep('form')
      setError(null)
      setCardError(null)
      setCardNumber('')
    }
  }, [open])

  if (!payment) return null

  const handlePay = async () => {
    const card = toLatinDigits(cardNumber).replace(/[\s-]/g, '')
    if (card && !/^\d{16}$/.test(card)) {
      setCardError('شماره کارت باید ۱۶ رقم باشد (یا خالی بگذارید تا ثبت نقدی شود)')
      return
    }
    setStep('processing')
    setError(null)
    try {
      await payMutation.mutateAsync({
        paymentId: payment.id,
        cardNumber: card || null,
      })
      setStep('success')
      toast.success(`«${payment.label || 'قسط'}» با موفقیت پرداخت شد`)
      onSuccess?.()
    } catch (err) {
      setError(extractError(err, 'پرداخت ناموفق بود، دوباره تلاش کنید'))
      setStep('form')
    }
  }

  return (
    <Dialog
      open={open}
      onClose={step === 'processing' ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: '20px' } } }}
    >
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
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon="mdi:bank-outline" className="h-5 w-5" />
          درگاه پرداخت قسط
        </Typography>
        <Chip label="شبیه‌سازی‌شده" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ bgcolor: 'action.hover', borderRadius: '14px', p: 2, mb: 2.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">سالن</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{venueName || '—'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">قسط</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{payment.label || 'قسط'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">سررسید</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatJalaliDate(payment.due_date)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">مبلغ قابل پرداخت</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatRial(payment.amount)}</Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

        <AnimatePresence mode="wait">
          {(step === 'form' || step === 'processing') && (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: step === 'processing' ? 0.5 : 1 }}>
                <TextField
                  label="شماره کارت (اختیاری)"
                  placeholder="6037 9971 0000 0000"
                  value={cardNumber}
                  onChange={(e) => {
                    const digits = toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 16)
                    setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '))
                    setCardError(null)
                  }}
                  fullWidth
                  size="small"
                  disabled={step === 'processing'}
                  error={Boolean(cardError)}
                  helperText={cardError || 'برای ثبت به‌صورت کارت‌به‌کارت وارد کنید؛ خالی = پرداخت نقدی'}
                  slotProps={{
                    input: {
                      startAdornment: <Icon icon="mdi:credit-card-outline" className="h-5 w-5 ml-2" style={{ color: 'rgba(0,0,0,0.4)' }} />,
                    },
                  }}
                />
              </Box>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '8px 0' }}>
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
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>پرداخت موفق</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                «{payment.label || 'قسط'}» با مبلغ {formatRial(payment.amount)} تسویه شد
              </Typography>
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
            }}
          >
            بستن
          </Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={step === 'processing'} sx={{ borderRadius: '12px', textTransform: 'none' }}>
              انصراف
            </Button>
            <Button
              variant="contained"
              onClick={handlePay}
              disabled={step !== 'form'}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                flex: 1,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
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
                  {`پرداخت ${formatRial(payment.amount)}`}
                </>
              )}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ContractInstallmentPayDialog