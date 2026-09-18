// frontend/src/components/bookings/BookingPaymentPanel.tsx
// پنل پرداخت کاربر بر اساس روش پرداخت سالن:
//  - bank_receipt: فرم ارسال فیش واریزی + وضعیت بررسی مدیر
//  - pay_in_place: اطلاع‌رسانی پرداخت در محل (بدون اقدام آنلاین)
//  - gateway: چیزی رندر نمی‌شود (جریان فعلی PaymentDialog دست‌نخورده می‌ماند)
import React, { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Link,
  TextField,
  Typography,
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { bookingService } from '@/services/booking'
import { uploadService } from '@/services/upload'
import { extractError, parseAmountInput } from '@/components/finance/shared'
import {
  formatDateTime,
  formatPrice,
  getReceiptStatusLabel,
  getReceiptStatusMuiColor,
  translatePaymentError,
} from '@/lib/utils'

export interface PayableBooking {
  id: number | string
  payment_amount?: number | null
  status?: string | null
  payment_mode?: string | null
  receipt_status?: string | null
  receipt_amount?: number | null
  receipt_reference?: string | null
  receipt_bank?: string | null
  receipt_image?: string | null
  receipt_submitted_at?: string | null
  receipt_review_note?: string | null
  venue_name?: string
  venue_address?: string | null
  venue_phone?: string | null
}

interface Props {
  booking: PayableBooking
  compact?: boolean
  onChanged?: () => void
}

const Field: React.FC<{ label: string; value?: React.ReactNode; ltr?: boolean }> = ({ label, value, ltr }) => (
  <Box sx={{ minWidth: 90 }}>
    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 600 }} dir={ltr ? 'ltr' : undefined}>
      {value ?? '—'}
    </Typography>
  </Box>
)

const BookingPaymentPanel: React.FC<Props> = ({ booking, compact = false, onChanged }) => {
  const mode = booking.payment_mode ?? 'gateway'
  const status = booking.receipt_status ?? 'none'

  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [bank, setBank] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // مقداردهی اولیه / بازنشانی هنگام تغییر وضعیت فیش
  useEffect(() => {
    setAmount(booking.payment_amount ? String(booking.payment_amount) : '')
    setReference(booking.receipt_reference ?? '')
    setBank(booking.receipt_bank ?? '')
    setFile(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }, [booking.id, booking.receipt_status, booking.payment_amount, booking.receipt_reference, booking.receipt_bank])

  if (mode === 'gateway') return null

  const pad = compact ? 2 : 2.5

  // ───────── پرداخت در محل ─────────
  if (mode === 'pay_in_place') {
    return (
      <Box
        sx={{
          p: pad,
          borderRadius: '14px',
          border: '1px solid rgba(5,150,105,0.25)',
          background: 'rgba(5,150,105,0.05)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Icon icon="mdi:cash-register" className="h-5 w-5" style={{ color: '#059669' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>پرداخت در محل سالن دریافت می‌شود</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          نیازی به پرداخت آنلاین نیست. مبلغ را هنگام حضور در سالن به‌صورت نقدی یا کارت‌خوان پرداخت کنید؛ مدیر سالن دریافت شما را ثبت می‌کند.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Field label="مبلغ قابل پرداخت" value={formatPrice(booking.payment_amount ?? 0)} />
          {booking.venue_address && <Field label="آدرس" value={booking.venue_address} />}
          {booking.venue_phone && <Field label="تلفن سالن" value={booking.venue_phone} ltr />}
        </Box>
      </Box>
    )
  }

  // ───────── فیش واریزی: تأییدشده ─────────
  if (status === 'approved') {
    return (
      <Box
        sx={{
          p: pad,
          borderRadius: '14px',
          border: '1px solid rgba(5,150,105,0.3)',
          background: 'rgba(5,150,105,0.06)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Icon icon="mdi:check-decagram" className="h-5 w-5" style={{ color: '#059669' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#059669' }}>فیش شما تأیید شد</Typography>
          <Chip label={getReceiptStatusLabel('approved')} color="success" size="small" sx={{ borderRadius: '8px', fontWeight: 600 }} />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          پرداخت شما با فیش واریزی تأیید شد و رزرو فعال است.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Field label="مبلغ فیش" value={formatPrice(booking.receipt_amount ?? booking.payment_amount ?? 0)} />
          {booking.receipt_reference && <Field label="شماره پیگیری" value={booking.receipt_reference} ltr />}
          {booking.receipt_bank && <Field label="بانک" value={booking.receipt_bank} />}
          {booking.receipt_submitted_at && <Field label="زمان ارسال" value={formatDateTime(booking.receipt_submitted_at)} />}
        </Box>
      </Box>
    )
  }

  // ───────── فیش واریزی: در انتظار بررسی ─────────
  if (status === 'submitted') {
    return (
      <Box
        sx={{
          p: pad,
          borderRadius: '14px',
          border: '1px solid rgba(217,119,6,0.3)',
          background: 'rgba(217,119,6,0.06)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Icon icon="mdi:clock-outline" className="h-5 w-5" style={{ color: '#d97706' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#d97706' }}>در انتظار بررسی مدیر</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          فیش واریزی شما ثبت شد و پس از تأیید مدیر سالن، رزرو شما پرداخت‌شده می‌شود.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>
          <Field label="مبلغ فیش" value={formatPrice(booking.receipt_amount ?? booking.payment_amount ?? 0)} />
          {booking.receipt_reference && <Field label="شماره پیگیری" value={booking.receipt_reference} ltr />}
          {booking.receipt_bank && <Field label="بانک" value={booking.receipt_bank} />}
          {booking.receipt_submitted_at && <Field label="زمان ارسال" value={formatDateTime(booking.receipt_submitted_at)} />}
          {booking.receipt_image && (
            <Box>
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>تصویر فیش</Typography>
              <Link href={booking.receipt_image} target="_blank" rel="noopener noreferrer" sx={{ display: 'inline-block', mt: 0.5 }}>
                <Box
                  component="img"
                  src={booking.receipt_image}
                  alt="فیش واریزی"
                  sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)' }}
                />
              </Link>
            </Box>
          )}
        </Box>
      </Box>
    )
  }

  // ───────── فیش واریزی: ردشده یا ارسال‌نشده → فرم ─────────
  const handleSubmit = async () => {
    setError(null)
    const value = parseAmountInput(amount)
    if (!value || Number.isNaN(value) || value <= 0) {
      setError('مبلغ فیش را به درستی وارد کنید')
      return
    }
    if (!file) {
      setError('تصویر فیش واریزی را انتخاب کنید')
      return
    }
    setSubmitting(true)
    try {
      const url = await uploadService.uploadReceipt(file)
      await bookingService.submitReceipt(Number(booking.id), {
        amount: value,
        image_url: url,
        reference_number: reference.trim() || null,
        bank_name: bank.trim() || null,
      })
      toast.success('فیش واریزی ثبت شد و در انتظار بررسی مدیر است')
      onChanged?.()
    } catch (err) {
      const msg = translatePaymentError(extractError(err, 'خطا در ثبت فیش واریزی'), 'خطا در ثبت فیش واریزی')
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        p: pad,
        borderRadius: '14px',
        border: '1px solid rgba(217,119,6,0.28)',
        background: 'rgba(217,119,6,0.04)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Icon icon="mdi:receipt-text-outline" className="h-5 w-5" style={{ color: '#d97706' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>پرداخت با فیش واریزی</Typography>
        <Chip label={getReceiptStatusLabel(status)} color={getReceiptStatusMuiColor(status)} size="small" sx={{ borderRadius: '8px', fontWeight: 600 }} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        مبلغ رزرو را به حساب سالن واریز کنید، سپس تصویر فیش را همراه با مبلغ و اطلاعات پیگیری ارسال کنید. پس از تأیید مدیر، رزرو شما پرداخت‌شده می‌شود.
      </Typography>

      {status === 'rejected' && (
        <Alert severity="error" sx={{ mb: 1.5, borderRadius: '10px' }}>
          فیش قبلی رد شد{booking.receipt_review_note ? `: ${booking.receipt_review_note}` : ''} — می‌توانید فیش جدیدی ارسال کنید.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 1.5, borderRadius: '10px' }}>{error}</Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField
          label="مبلغ فیش (تومان)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          size="small"
          fullWidth
          disabled={submitting}
          helperText={`مبلغ رزرو: ${formatPrice(booking.payment_amount ?? 0)}`}
          slotProps={{ input: { sx: { borderRadius: '10px' } }, htmlInput: { inputMode: 'numeric' } }}
        />
        <TextField
          label="شماره پیگیری / رهگیری"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          size="small"
          fullWidth
          disabled={submitting}
          slotProps={{ input: { sx: { borderRadius: '10px' } } }}
        />
        <TextField
          label="نام بانک"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          size="small"
          fullWidth
          disabled={submitting}
          slotProps={{ input: { sx: { borderRadius: '10px' } } }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null) }}
          />
          <Button
            variant="outlined"
            size="small"
            disabled={submitting}
            onClick={() => fileRef.current?.click()}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, minHeight: 40 }}
            startIcon={<Icon icon="mdi:image-plus" className="h-4 w-4" />}
          >
            {file ? 'تغییر تصویر فیش' : 'انتخاب تصویر فیش'}
          </Button>
          {file && (
            <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          disabled={submitting}
          onClick={handleSubmit}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            minHeight: 42,
            background: 'linear-gradient(135deg, #d97706, #f59e0b)',
            '&:hover': { background: 'linear-gradient(135deg, #b45309, #d97706)' },
          }}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:upload" className="h-4 w-4" />}
        >
          {submitting ? 'در حال ارسال...' : 'ارسال فیش واریزی'}
        </Button>
      </Box>
    </Box>
  )
}

export default BookingPaymentPanel