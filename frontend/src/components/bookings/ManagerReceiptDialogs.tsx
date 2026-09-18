// frontend/src/components/bookings/ManagerReceiptDialogs.tsx
// دیالوگ‌های مدیر: بررسی/رد فیش واریزی + ثبت دریافت وجه در محل
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
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { bookingService } from '@/services/booking'
import { extractError, parseAmountInput, TX_METHOD_LABELS } from '@/components/finance/shared'
import { formatDateTime, formatPrice, translatePaymentError } from '@/lib/utils'
import type { PayInPersonMethod } from '@/types/booking'

interface ReceiptDetail {
  id: number
  payment_amount?: number | null
  receipt_amount?: number | null
  receipt_reference?: string | null
  receipt_bank?: string | null
  receipt_image?: string | null
  receipt_submitted_at?: string | null
  receipt_status?: string | null
}

const IN_PERSON_METHODS: PayInPersonMethod[] = ['cash', 'card_to_card', 'pos', 'gateway', 'credit', 'other']

const dialogPaper = { sx: { borderRadius: '20px', overflow: 'hidden' } }

const Header: React.FC<{ icon: string; title: string; gradient: string }> = ({ icon, title, gradient }) => (
  <Box sx={{ background: gradient, px: 3, py: 2.5 }}>
    <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
      <Icon icon={icon} className="h-5 w-5" />
      {title}
    </Typography>
  </Box>
)

// ───────────────────────── بررسی فیش واریزی ─────────────────────────

export const ReceiptReviewDialog: React.FC<{
  open: boolean
  onClose: () => void
  bookingId: number | null
  venueName?: string
  onDone?: () => void
}> = ({ open, onClose, bookingId, venueName, onDone }) => {
  const [detail, setDetail] = useState<ReceiptDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !bookingId) return
    setDetail(null)
    setLoadError(null)
    setRejectReason('')
    setRejectError(null)
    setLoading(true)
    let cancelled = false
    bookingService
      .getById(bookingId)
      .then((data) => { if (!cancelled) setDetail(data as ReceiptDetail) })
      .catch((err) => { if (!cancelled) setLoadError(extractError(err, 'خطا در دریافت جزئیات فیش')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, bookingId])

  const handleApprove = async () => {
    if (!bookingId) return
    setBusy('approve')
    try {
      await bookingService.approveReceipt(bookingId)
      toast.success('فیش تأیید و رزرو فعال شد')
      onDone?.()
      onClose()
    } catch (err) {
      toast.error(translatePaymentError(extractError(err, 'خطا در تأیید فیش'), 'خطا در تأیید فیش'))
    } finally {
      setBusy(null)
    }
  }

  const handleReject = async () => {
    if (!bookingId) return
    const reason = rejectReason.trim()
    if (reason.length < 4) {
      setRejectError('دلیل رد فیش باید حداقل ۴ حرف باشد')
      return
    }
    setBusy('reject')
    setRejectError(null)
    try {
      await bookingService.rejectReceipt(bookingId, reason)
      toast.success('فیش رد شد؛ کاربر می‌تواند دوباره ارسال کند')
      onDone?.()
      onClose()
    } catch (err) {
      const msg = translatePaymentError(extractError(err, 'خطا در رد فیش'), 'خطا در رد فیش')
      setRejectError(msg)
      toast.error(msg)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth slotProps={{ paper: dialogPaper }}>
      <Header icon="mdi:receipt-text-check-outline" title={`بررسی فیش واریزی${venueName ? ` — ${venueName}` : ''}`} gradient="linear-gradient(135deg, #d97706, #f59e0b)" />
      <DialogContent sx={{ pt: 3, pb: 1 }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>در حال دریافت جزئیات فیش...</Typography>
          </Box>
        ) : loadError ? (
          <Alert severity="error" sx={{ borderRadius: '12px' }}>{loadError}</Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>مبلغ فیش / رزرو</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {formatPrice(detail?.receipt_amount ?? detail?.payment_amount ?? 0)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>شماره پیگیری</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} dir="ltr">{detail?.receipt_reference || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>بانک</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{detail?.receipt_bank || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>زمان ارسال</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {detail?.receipt_submitted_at ? formatDateTime(detail.receipt_submitted_at) : '—'}
                  </Typography>
                </Box>
                {detail?.receipt_status && (
                  <Chip
                    label={detail.receipt_status === 'submitted' ? 'در انتظار بررسی' : detail.receipt_status}
                    color="warning"
                    size="small"
                    sx={{ borderRadius: '8px', fontWeight: 600, alignSelf: 'flex-start' }}
                  />
                )}
              </Box>
              <Box sx={{ width: 180, flexShrink: 0 }}>
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.5 }}>تصویر فیش</Typography>
                {detail?.receipt_image ? (
                  <Link href={detail.receipt_image} target="_blank" rel="noopener noreferrer">
                    <Box
                      component="img"
                      src={detail.receipt_image}
                      alt="فیش واریزی"
                      sx={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', display: 'block' }}
                    />
                  </Link>
                ) : (
                  <Typography variant="body2" color="text.secondary">تصویری ثبت نشده</Typography>
                )}
              </Box>
            </Box>

            <TextField
              fullWidth
              multiline
              minRows={2}
              label="دلیل رد فیش (حداقل ۴ حرف)"
              value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); setRejectError(null) }}
              disabled={Boolean(busy)}
              error={Boolean(rejectError)}
              helperText={rejectError || undefined}
              sx={{ mt: 2.5 }}
              slotProps={{ input: { sx: { borderRadius: '10px' } } }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={onClose} disabled={Boolean(busy)} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
          بستن
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          color="error"
          disabled={Boolean(busy) || loading || Boolean(loadError)}
          onClick={handleReject}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, minHeight: 40 }}
          startIcon={busy === 'reject' ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:close-circle-outline" className="h-4 w-4" />}
        >
          رد فیش
        </Button>
        <Button
          variant="contained"
          disabled={Boolean(busy) || loading || Boolean(loadError)}
          onClick={handleApprove}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            minHeight: 40,
            bgcolor: '#16a34a',
            '&:hover': { bgcolor: '#15803d' },
          }}
          startIcon={busy === 'approve' ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:check-circle-outline" className="h-4 w-4" />}
        >
          تأیید فیش
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ───────────────────────── ثبت دریافت در محل ─────────────────────────

export const InPersonCollectDialog: React.FC<{
  open: boolean
  onClose: () => void
  bookingId: number | null
  defaultAmount?: number
  venueName?: string
  onDone?: () => void
}> = ({ open, onClose, bookingId, defaultAmount, venueName, onDone }) => {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PayInPersonMethod>('cash')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setAmount(defaultAmount ? String(defaultAmount) : '')
    setMethod('cash')
    setError(null)
  }, [open, defaultAmount])

  const handleCollect = async () => {
    if (!bookingId) return
    const value = amount.trim() ? parseAmountInput(amount) : undefined
    if (value !== undefined && (Number.isNaN(value) || value <= 0)) {
      setError('مبلغ وارد‌شده معتبر نیست')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await bookingService.collectInPerson(bookingId, value ? { amount: value, method } : { method })
      toast.success('دریافت وجه در محل ثبت شد')
      onDone?.()
      onClose()
    } catch (err) {
      const msg = translatePaymentError(extractError(err, 'خطا در ثبت دریافت در محل'), 'خطا در ثبت دریافت در محل')
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth slotProps={{ paper: dialogPaper }}>
      <Header icon="mdi:cash-register" title={`ثبت دریافت در محل${venueName ? ` — ${venueName}` : ''}`} gradient="linear-gradient(135deg, #059669, #10b981)" />
      <DialogContent sx={{ pt: 3, pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          مبلغ دریافتی از مشتری را در محل ثبت کنید. در صورت خالی گذاشتن مبلغ، مبلغ رزرو ثبت می‌شود.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label={`مبلغ دریافتی (تومان)${defaultAmount ? ` — پیش‌فرض ${formatPrice(defaultAmount)}` : ''}`}
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(null) }}
            disabled={busy}
            slotProps={{ input: { sx: { borderRadius: '10px' } }, htmlInput: { inputMode: 'numeric' } }}
          />
          <FormControl fullWidth>
            <InputLabel>روش دریافت</InputLabel>
            <Select
              value={method}
              label="روش دریافت"
              disabled={busy}
              onChange={(e) => setMethod(e.target.value as PayInPersonMethod)}
              sx={{ borderRadius: '10px' }}
            >
              {IN_PERSON_METHODS.map((m) => (
                <MenuItem key={m} value={m}>{TX_METHOD_LABELS[m] ?? m}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} disabled={busy} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
          انصراف
        </Button>
        <Button
          variant="contained"
          disabled={busy}
          onClick={handleCollect}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            flex: 1,
            bgcolor: '#059669',
            '&:hover': { bgcolor: '#047857' },
          }}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:cash-check" className="h-4 w-4" />}
        >
          {busy ? 'در حال ثبت...' : 'ثبت دریافت'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}