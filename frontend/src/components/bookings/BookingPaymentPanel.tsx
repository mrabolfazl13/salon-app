// frontend/src/components/bookings/BookingPaymentPanel.tsx
// پنل پرداخت کاربر بر اساس روش پرداخت سالن:
//  - bank_receipt: فرم ارسال فیش واریزی + وضعیت بررسی مدیر
//  - pay_in_place: اطلاع‌رسانی پرداخت در محل (بدون اقدام آنلاین)
//  - gateway: چیزی رندر نمی‌شود (جریان فعلی PaymentDialog دست‌نخورده می‌ماند)
import React, { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { bookingService } from '@/services/booking'
import { uploadService } from '@/services/upload'
import { extractError, parseAmountInput } from '@/components/finance/shared'
import {
  cn,
  formatDateTime,
  formatPrice,
  getReceiptStatusLabel,
  getReceiptStatusTone,
  translatePaymentError,
} from '@/lib/utils'
import { Alert } from '@/components/ui/shadcn/alert'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'

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

// نگاشت رنگ‌های وضعیت فیش به پالت معنایی shadcn
const RECEIPT_TONE: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  default: 'bg-muted text-muted-foreground',
}

const ReceiptStatusBadge: React.FC<{ status?: string | null }> = ({ status }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold',
      RECEIPT_TONE[getReceiptStatusTone(status)] ?? RECEIPT_TONE.default
    )}
  >
    {getReceiptStatusLabel(status)}
  </span>
)

const Field: React.FC<{ label: string; value?: React.ReactNode; ltr?: boolean }> = ({ label, value, ltr }) => (
  <div className="min-w-[90px]">
    <span className="block text-xs text-muted-foreground">{label}</span>
    <p className="text-sm font-semibold text-foreground" dir={ltr ? 'ltr' : undefined}>
      {value ?? '—'}
    </p>
  </div>
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

  const fieldId = useId()
  const amountId = `${fieldId}-amount`
  const referenceId = `${fieldId}-reference`
  const bankId = `${fieldId}-bank`

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

  const pad = compact ? 'p-4' : 'p-5'

  // ───────── پرداخت در محل ─────────
  if (mode === 'pay_in_place') {
    return (
      <div className={cn('rounded-[14px] border border-emerald-600/25 bg-emerald-600/5', pad)}>
        <div className="mb-2 flex items-center gap-2">
          <Icon icon="mdi:cash-register" className="h-5 w-5" style={{ color: '#059669' }} />
          <h3 className="text-sm font-bold text-foreground">پرداخت در محل سالن دریافت می‌شود</h3>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          نیازی به پرداخت آنلاین نیست. مبلغ را هنگام حضور در سالن به‌صورت نقدی یا کارت‌خوان پرداخت کنید؛ مدیر سالن دریافت شما را ثبت می‌کند.
        </p>
        <div className="flex flex-wrap gap-6">
          <Field label="مبلغ قابل پرداخت" value={formatPrice(booking.payment_amount ?? 0)} />
          {booking.venue_address && <Field label="آدرس" value={booking.venue_address} />}
          {booking.venue_phone && <Field label="تلفن سالن" value={booking.venue_phone} ltr />}
        </div>
      </div>
    )
  }

  // ───────── فیش واریزی: تأییدشده ─────────
  if (status === 'approved') {
    return (
      <div className={cn('rounded-[14px] border border-emerald-600/30 bg-emerald-600/[0.06]', pad)}>
        <div className="mb-2 flex items-center gap-2">
          <Icon icon="mdi:check-decagram" className="h-5 w-5" style={{ color: '#059669' }} />
          <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">فیش شما تأیید شد</h3>
          <ReceiptStatusBadge status="approved" />
        </div>
        <p className="mb-3 text-sm text-muted-foreground">پرداخت شما با فیش واریزی تأیید شد و رزرو فعال است.</p>
        <div className="flex flex-wrap gap-6">
          <Field label="مبلغ فیش" value={formatPrice(booking.receipt_amount ?? booking.payment_amount ?? 0)} />
          {booking.receipt_reference && <Field label="شماره پیگیری" value={booking.receipt_reference} ltr />}
          {booking.receipt_bank && <Field label="بانک" value={booking.receipt_bank} />}
          {booking.receipt_submitted_at && <Field label="زمان ارسال" value={formatDateTime(booking.receipt_submitted_at)} />}
        </div>
      </div>
    )
  }

  // ───────── فیش واریزی: در انتظار بررسی ─────────
  if (status === 'submitted') {
    return (
      <div className={cn('rounded-[14px] border border-amber-600/30 bg-amber-600/[0.06]', pad)}>
        <div className="mb-2 flex items-center gap-2">
          <Icon icon="mdi:clock-outline" className="h-5 w-5" style={{ color: '#d97706' }} />
          <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400">در انتظار بررسی مدیر</h3>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          فیش واریزی شما ثبت شد و پس از تأیید مدیر سالن، رزرو شما پرداخت‌شده می‌شود.
        </p>
        <div className="flex flex-wrap items-start gap-6">
          <Field label="مبلغ فیش" value={formatPrice(booking.receipt_amount ?? booking.payment_amount ?? 0)} />
          {booking.receipt_reference && <Field label="شماره پیگیری" value={booking.receipt_reference} ltr />}
          {booking.receipt_bank && <Field label="بانک" value={booking.receipt_bank} />}
          {booking.receipt_submitted_at && <Field label="زمان ارسال" value={formatDateTime(booking.receipt_submitted_at)} />}
          {booking.receipt_image && (
            <div>
              <span className="block text-xs text-muted-foreground">تصویر فیش</span>
              <a href={booking.receipt_image} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block">
                <img
                  src={booking.receipt_image}
                  alt="فیش واریزی"
                  className="h-[72px] w-[72px] rounded-[10px] border border-border object-cover"
                />
              </a>
            </div>
          )}
        </div>
      </div>
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
    <div className={cn('rounded-[14px] border border-amber-600/30 bg-amber-600/[0.04]', pad)}>
      <div className="mb-2 flex items-center gap-2">
        <Icon icon="mdi:receipt-text-outline" className="h-5 w-5" style={{ color: '#d97706' }} />
        <h3 className="text-sm font-bold text-foreground">پرداخت با فیش واریزی</h3>
        <ReceiptStatusBadge status={status} />
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        مبلغ رزرو را به حساب سالن واریز کنید، سپس تصویر فیش را همراه با مبلغ و اطلاعات پیگیری ارسال کنید. پس از تأیید مدیر، رزرو شما پرداخت‌شده می‌شود.
      </p>

      {status === 'rejected' && (
        <Alert variant="destructive" className="mb-3 rounded-[10px]">
          فیش قبلی رد شد{booking.receipt_review_note ? `: ${booking.receipt_review_note}` : ''} — می‌توانید فیش جدیدی ارسال کنید.
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-3 rounded-[10px]">{error}</Alert>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={amountId}>مبلغ فیش (ریال)</Label>
          <Input
            id={amountId}
            inputMode="numeric"
            className="rounded-[10px]"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground">{`مبلغ رزرو: ${formatPrice(booking.payment_amount ?? 0)}`}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={referenceId}>شماره پیگیری / رهگیری</Label>
          <Input
            id={referenceId}
            className="rounded-[10px]"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={bankId}>نام بانک</Label>
          <Input
            id={bankId}
            className="rounded-[10px]"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null) }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => fileRef.current?.click()}
            className="min-h-11 rounded-[10px]"
          >
            <Icon icon="mdi:image-plus" className="h-4 w-4" />
            {file ? 'تغییر تصویر فیش' : 'انتخاب تصویر فیش'}
          </Button>
          {file && (
            <span className="max-w-[200px] truncate text-xs text-muted-foreground">{file.name}</span>
          )}
        </div>
        <Button
          disabled={submitting}
          onClick={handleSubmit}
          className="min-h-11 rounded-[10px] bg-gradient-to-br from-amber-600 to-amber-500 font-bold text-white hover:from-amber-700 hover:to-amber-600"
        >
          {submitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" aria-label="در حال بارگذاری" />
          ) : (
            <Icon icon="mdi:upload" className="h-4 w-4" />
          )}
          {submitting ? 'در حال ارسال...' : 'ارسال فیش واریزی'}
        </Button>
      </div>
    </div>
  )
}

export default BookingPaymentPanel
