// frontend/src/components/competition/CompetitionBidDialog.tsx
// دیالوگ پیشنهاد قیمت کاربران در رقابت قیمت سانس (وضعیت in_competition)
// الگو: MembershipPurchaseDialog — MUI Dialog + react-hot-toast + پاسخ خطای Persian بک‌اند
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { competitionService } from '@/services/competition'
import { formatDate, formatPrice } from '@/lib/utils'

// تبدیل ارقام فارسی/عربی به لاتین (الگوی یکسان با سایر ورودی‌های عددی)
const toLatinDigits = (value: string): string =>
  value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '')

// سانس قابل‌پیشنهاد — همان شکل slotList صفحهٔ سالن
export interface BidTargetSlot {
  id: number
  date: string
  startTime: string
  endTime?: string
  price: number
}

interface Props {
  slot: BidTargetSlot | null
  open: boolean
  onClose: () => void
  venueName?: string
  onBidSuccess?: (offeredPrice: number) => void
}

const POLL_INTERVAL_MS = 20000

// 400 بک‌اند Persian detail دارد؛ 401/403 (ورود نکردن / ایمیل تایید نشده) هم پیام فارسی می‌گیرد
const bidErrorMessage = (err: any): string => {
  const status = err?.response?.status
  const detail = err?.response?.data?.detail
  if (status === 401) return 'برای ثبت پیشنهاد ابتدا وارد حساب خود شوید'
  if (status === 403) {
    return typeof detail === 'string' && detail
      ? detail
      : 'برای شرکت در رقابت قیمت، ابتدا ایمیل خود را تایید کنید'
  }
  if (typeof detail === 'string' && detail) return detail
  return 'خطا در ثبت پیشنهاد. لطفاً دوباره تلاش کنید.'
}

const CompetitionBidDialog: React.FC<Props> = ({ slot, open, onClose, venueName, onBidSuccess }) => {
  const [bestPrice, setBestPrice] = useState<number | null>(null)
  const [loadingBest, setLoadingBest] = useState(false)
  const [bestError, setBestError] = useState(false)
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const pollRef = useRef<number | null>(null)

  const fetchBest = useCallback(async (slotId: number, silent = false) => {
    if (!silent) setLoadingBest(true)
    try {
      const res = await competitionService.getBestBid(slotId)
      setBestPrice(res?.best_price ?? null)
      setBestError(false)
    } catch {
      setBestError(true)
    } finally {
      if (!silent) setLoadingBest(false)
    }
  }, [])

  useEffect(() => {
    if (!open || !slot) return
    setAmount('')
    setBestPrice(null)
    setBestError(false)
    fetchBest(slot.id)
    pollRef.current = window.setInterval(() => fetchBest(slot.id, true), POLL_INTERVAL_MS)
    return () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current)
      pollRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slot?.id, fetchBest])

  const amountValue = amount === '' ? NaN : Number(amount)
  const validationError =
    amount === ''
      ? null
      : !Number.isFinite(amountValue) || amountValue <= 0
        ? 'قیمت پیشنهادی باید عددی بزرگ‌تر از صفر باشد'
        : amountValue >= (slot?.price ?? 0)
          ? 'قیمت پیشنهادی باید کمتر از قیمت فعلی باشد'
          : null

  const handleSubmit = async () => {
    if (!slot || submitting || validationError || amount === '') return
    const value = Number(amount)
    setSubmitting(true)
    try {
      await competitionService.placeBid(slot.id, value)
      toast.success('پیشنهاد شما ثبت شد! کمترین پیشنهاد در پایان رقابت برنده می‌شود 🎉', { duration: 5000 })
      onBidSuccess?.(value)
    } catch (err: any) {
      toast.error(bidErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (!slot) return null

  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose()}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: '20px', p: 1 } } }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon icon="mdi:gavel" style={{ width: 20, height: 20, color: 'white' }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.4 }}>
            رقابت با بقیه!
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            کمترین پیشنهاد پس از پایان رقابت برنده می‌شود
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* اطلاعات سانس */}
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
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>سالن</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{venueName}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>تاریخ و ساعت</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatDate(slot.date + 'T00:00:00')} • {slot.startTime}
              {slot.endTime ? ` - ${slot.endTime}` : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>قیمت فعلی سانس</Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {formatPrice(slot.price)}
            </Typography>
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>بهترین پیشنهاد فعلی</Typography>
              {!loadingBest && !bestError && (
                <Tooltip title="به‌روزرسانی" arrow>
                  <span>
                    <IconButton size="small" onClick={() => fetchBest(slot.id)} aria-label="به‌روزرسانی بهترین پیشنهاد">
                      <Icon icon="mdi:refresh" style={{ width: 16, height: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Box>
            {loadingBest ? (
              <CircularProgress size={16} />
            ) : bestError ? (
              <Button
                size="small"
                onClick={() => fetchBest(slot.id)}
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
              >
                دریافت نشد — تلاش مجدد
              </Button>
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'warning.main' }}>
                {bestPrice != null ? formatPrice(bestPrice) : 'هنوز پیشنهادی ثبت نشده'}
              </Typography>
            )}
          </Box>
        </Box>

        <TextField
          label="قیمت پیشنهادی (ریال)"
          value={amount}
          onChange={(e) => setAmount(toLatinDigits(e.target.value).slice(0, 9))}
          fullWidth
          inputMode="numeric"
          autoFocus
          error={Boolean(validationError)}
          disabled={submitting}
          helperText={
            validationError ??
            (bestPrice != null
              ? `برای برنده شدن باید کمتر از بهترین پیشنهاد (${formatPrice(bestPrice)}) باشد`
              : 'حداقل ۱ ریال و کمتر از قیمت فعلی سانس')
          }
          slotProps={{
            htmlInput: { min: 1, step: 1 },
            input: {
              endAdornment: (
                <Typography variant="caption" sx={{ color: 'text.secondary', pr: 1 }}>ریال</Typography>
              ),
              startAdornment: (
                <Icon icon="mdi:currency-usd" style={{ width: 18, height: 18, marginLeft: 8, color: '#64748b' }} />
              ),
            },
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        />

        {amount !== '' && !validationError && bestPrice != null && amountValue >= bestPrice && (
          <Alert severity="warning" sx={{ mt: 2, borderRadius: '12px', fontSize: '0.8rem' }}>
            پیشنهاد شما از بهترین قیمت فعلی کمتر نیست؛ تا پایان رقابت شانس برنده شدن ندارد.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          variant="text"
          sx={{ textTransform: 'none', borderRadius: '10px' }}
        >
          انصراف
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || amount === '' || Boolean(validationError)}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            px: 3,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #f59e0b, #7c3aed)',
          }}
        >
          {submitting ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} sx={{ color: 'white' }} />
              در حال ثبت…
            </Box>
          ) : (
            <>
              <Icon icon="mdi:gavel" style={{ width: 18, height: 18, marginLeft: 6 }} />
              ثبت پیشنهاد
            </>
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CompetitionBidDialog