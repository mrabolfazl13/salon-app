// frontend/src/components/membership/MembershipPurchaseDialog.tsx
// دیالوگ خرید اشتراک باشگاه: فاکتور → فرم کارت → پردازش → موفقیت (الگوی PaymentDialog)
import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import { membershipService, type CardPayData } from '@/services/membership'
import type { MembershipPlan, MembershipPurchase } from '@/types/membership'
import { PLAN_TYPE_LABEL } from '@/types/membership'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

// تبدیل ارقام فارسی/عربی به لاتین
const toLatinDigits = (value: string): string =>
  value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '')

interface Props {
  plan: MembershipPlan | null
  venueName?: string
  open: boolean
  onClose: () => void
  onSuccess?: (purchase: MembershipPurchase) => void
}

type Step = 'invoice' | 'form' | 'processing' | 'success'

const MembershipPurchaseDialog: React.FC<Props> = ({ plan, venueName, open, onClose, onSuccess }) => {
  const [step, setStep] = useState<Step>('invoice')
  const [purchase, setPurchase] = useState<MembershipPurchase | null>(null)
  const [creating, setCreating] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cvv, setCvv] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')

  // ساخت فاکتور (pending) هنگام باز شدن دیالوگ
  useEffect(() => {
    if (!open || !plan) return
    setStep('invoice')
    setPurchase(null)
    setCardNumber('')
    setCvv('')
    setMonth('')
    setYear('')
    setCreating(true)
    membershipService
      .createPurchase(plan.id)
      .then(setPurchase)
      .catch((err) => {
        toast.error(err?.response?.data?.detail || 'خطا در ایجاد فاکتور')
        onClose()
      })
      .finally(() => setCreating(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, plan?.id])

  const validate = (): boolean => {
    const card = toLatinDigits(cardNumber)
    if (card.length !== 16) {
      toast.error('شماره کارت باید ۱۶ رقم باشد')
      return false
    }
    const cvvDigits = toLatinDigits(cvv)
    if (cvvDigits.length < 3 || cvvDigits.length > 4) {
      toast.error('CVV2 نامعتبر است')
      return false
    }
    const m = Number(toLatinDigits(month))
    const y = Number(toLatinDigits(year))
    if (!m || m < 1 || m > 12) {
      toast.error('ماه انقضا نامعتبر است')
      return false
    }
    if (!y || y < 1390 || y > 1500) {
      toast.error('سال انقضا نامعتبر است')
      return false
    }
    return true
  }

  const handlePay = async () => {
    if (!purchase || !validate()) return
    setStep('processing')
    const payload: CardPayData = {
      card_number: toLatinDigits(cardNumber),
      cvv: toLatinDigits(cvv),
      month: Number(toLatinDigits(month)),
      year: Number(toLatinDigits(year)),
    }
    try {
      const paid = await membershipService.payPurchase(purchase.id, payload)
      setPurchase(paid)
      setStep('success')
      onSuccess?.(paid)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'پرداخت ناموفق بود')
      setStep('form')
    }
  }

  if (!plan) return null

  return (
    <Dialog
      open={open}
      onClose={() => step !== 'processing' && onClose()}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: '20px', p: 1 } } }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon="mdi:card-account-details-star" style={{ width: 22, height: 22, color: '#2563eb' }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            خرید اشتراک
          </Typography>
        </Box>
        <Chip
          label={PLAN_TYPE_LABEL[plan.plan_type]}
          size="small"
          sx={{
            borderRadius: '8px',
            fontWeight: 700,
            bgcolor: 'rgba(124,58,237,0.1)',
            color: '#7c3aed',
          }}
        />
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* خلاصه پلن */}
        <Box
          sx={{
            p: 2,
            borderRadius: '14px',
            bgcolor: 'rgba(37,99,235,0.05)',
            border: '1px solid rgba(37,99,235,0.12)',
            mb: 2.5,
          }}
        >
          {venueName && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                سالن
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {venueName}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              پلن
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {plan.title}
            </Typography>
          </Box>
          {plan.sessions_count ? (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                تعداد جلسات
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {plan.sessions_count.toLocaleString('fa-IR')} جلسه
              </Typography>
            </Box>
          ) : null}
          {plan.duration_days ? (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                مدت اعتبار
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {plan.duration_days.toLocaleString('fa-IR')} روز
              </Typography>
            </Box>
          ) : null}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              مبلغ قابل پرداخت
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {formatPrice(plan.price)}
            </Typography>
          </Box>
        </Box>

        {step === 'invoice' && (
          <Box sx={{ textAlign: 'center', py: 1 }}>
            {creating ? (
              <CircularProgress size={28} />
            ) : (
              <>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  فاکتور شما آماده است. برای ادامه، اطلاعات کارت بانکی را وارد کنید.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setStep('form')}
                  disabled={!purchase}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    py: 1.4,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  }}
                >
                  <Icon icon="mdi:credit-card-outline" style={{ width: 20, height: 20, marginLeft: 8 }} />
                  ورود به درگاه پرداخت
                </Button>
              </>
            )}
          </Box>
        )}

        {(step === 'form' || step === 'processing') && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: step === 'processing' ? 0.55 : 1 }}>
            <TextField
              label="شماره کارت"
              placeholder="•••• •••• •••• ••••"
              value={cardNumber}
              onChange={(e) => setCardNumber(toLatinDigits(e.target.value).slice(0, 16))}
              fullWidth
              size="small"
              inputMode="numeric"
              slotProps={{
                input: {
                  startAdornment: (
                    <Icon icon="mdi:credit-card-outline" style={{ width: 20, height: 20, marginLeft: 8, color: '#94a3b8' }} />
                  ),
                },
              }}
            />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="CVV2"
                value={cvv}
                onChange={(e) => setCvv(toLatinDigits(e.target.value).slice(0, 4))}
                size="small"
                inputMode="numeric"
                sx={{ flex: 1 }}
              />
              <TextField
                label="ماه"
                value={month}
                onChange={(e) => setMonth(toLatinDigits(e.target.value).slice(0, 2))}
                size="small"
                inputMode="numeric"
                placeholder="۱۲"
                sx={{ flex: 1 }}
              />
              <TextField
                label="سال"
                value={year}
                onChange={(e) => setYear(toLatinDigits(e.target.value).slice(0, 4))}
                size="small"
                inputMode="numeric"
                placeholder="۱۴۰۵"
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        )}

        {step === 'success' && purchase && (
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'rgba(76,175,80,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Icon icon="mdi:check-circle" style={{ width: 34, height: 34, color: '#22c55e' }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
              اشتراک فعال شد!
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {plan.plan_type === 'monthly'
                ? 'اعتبار اشتراک ماهانه از همین حالا آغاز شده است.'
                : 'برای استفاده، در ورود به باشگاه به مدیر سالن نشان دهید.'}
            </Typography>
            <Box
              sx={{
                p: 1.5,
                borderRadius: '12px',
                bgcolor: 'rgba(15,23,42,0.03)',
                textAlign: 'right',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  کد پیگیری
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, direction: 'ltr' }}>
                  {purchase.transaction_id}
                </Typography>
              </Box>
              {purchase.sessions_remaining != null && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    جلسات باقی‌مانده
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {purchase.sessions_remaining.toLocaleString('fa-IR')}
                  </Typography>
                </Box>
              )}
              {purchase.expires_at && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    انقضا
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {new Date(purchase.expires_at).toLocaleDateString('fa-IR')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        {step === 'success' ? (
          <Button
            fullWidth
            variant="contained"
            onClick={onClose}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              py: 1.2,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            }}
          >
            بستن
          </Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={step === 'processing'} variant="text" sx={{ textTransform: 'none', borderRadius: '10px' }}>
              انصراف
            </Button>
            {step === 'form' && (
              <Button
                variant="contained"
                onClick={handlePay}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  px: 3,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                }}
              >
                <Icon icon="mdi:bank-outline" style={{ width: 18, height: 18, marginLeft: 6 }} />
                پرداخت
              </Button>
            )}
            {step === 'processing' && (
              <Button variant="contained" disabled sx={{ borderRadius: '12px', textTransform: 'none', px: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={18} sx={{ color: 'white' }} />
                  در حال پرداخت…
                </Box>
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default MembershipPurchaseDialog
