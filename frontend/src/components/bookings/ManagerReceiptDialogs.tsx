// frontend/src/components/bookings/ManagerReceiptDialogs.tsx
// دیالوگ‌های مدیر: بررسی/رد فیش واریزی + ثبت دریافت وجه در محل
import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { bookingService } from '@/services/booking'
import { extractError, parseAmountInput, TX_METHOD_LABELS } from '@/components/finance/shared'
import { formatDateTime, formatPrice, translatePaymentError } from '@/lib/utils'
import type { PayInPersonMethod } from '@/types/booking'
import { Alert } from '@/components/ui/shadcn/alert'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog'

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

const Header: React.FC<{ icon: string; title: string; gradient: string }> = ({ icon, title, gradient }) => (
  <div className="px-6 py-5" style={{ background: gradient }}>
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 pe-10 text-lg font-bold text-white">
        <Icon icon={icon} className="h-5 w-5" />
        {title}
      </DialogTitle>
    </DialogHeader>
  </div>
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
    <Dialog open={open} onOpenChange={(o) => { if (!o && !busy) onClose() }}>
      <DialogContent
        aria-label="بررسی فیش واریزی"
        className="gap-0 overflow-hidden p-0 sm:max-w-[600px] [&>button]:text-white/90 [&>button:hover]:bg-white/15 [&>button:hover]:text-white"
      >
        <Header icon="mdi:receipt-text-check-outline" title={`بررسی فیش واریزی${venueName ? ` — ${venueName}` : ''}`} gradient="linear-gradient(135deg, #d97706, #f59e0b)" />
        <div className="px-6 pb-2 pt-6">
          {loading ? (
            <div className="py-10 text-center">
              <span
                className="mx-auto block h-8 w-8 animate-spin rounded-full border-[3px] border-slate-300 border-t-amber-600"
                role="status"
                aria-label="در حال بارگذاری"
              />
              <p className="mt-3 text-sm text-muted-foreground">در حال دریافت جزئیات فیش...</p>
            </div>
          ) : loadError ? (
            <Alert variant="destructive" className="rounded-xl">{loadError}</Alert>
          ) : (
            <>
              <div className="flex flex-wrap items-start gap-5">
                <div className="flex min-w-[220px] flex-1 flex-col gap-3">
                  <div>
                    <span className="block text-xs text-muted-foreground">مبلغ فیش / رزرو</span>
                    <p className="text-base font-bold text-foreground">
                      {formatPrice(detail?.receipt_amount ?? detail?.payment_amount ?? 0)}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">شماره پیگیری</span>
                    <p className="text-sm font-semibold text-foreground" dir="ltr">{detail?.receipt_reference || '—'}</p>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">بانک</span>
                    <p className="text-sm font-semibold text-foreground">{detail?.receipt_bank || '—'}</p>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">زمان ارسال</span>
                    <p className="text-sm font-semibold text-foreground">
                      {detail?.receipt_submitted_at ? formatDateTime(detail.receipt_submitted_at) : '—'}
                    </p>
                  </div>
                  {detail?.receipt_status && (
                    <span className="inline-flex items-center self-start rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-300">
                      {detail.receipt_status === 'submitted' ? 'در انتظار بررسی' : detail.receipt_status}
                    </span>
                  )}
                </div>
                <div className="w-[180px] shrink-0">
                  <span className="mb-1 block text-xs text-muted-foreground">تصویر فیش</span>
                  {detail?.receipt_image ? (
                    <a href={detail.receipt_image} target="_blank" rel="noopener noreferrer">
                      <img
                        src={detail.receipt_image}
                        alt="فیش واریزی"
                        className="block w-full rounded-xl border border-border"
                      />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">تصویری ثبت نشده</p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-1.5">
                <Label htmlFor="receipt-reject-reason">دلیل رد فیش (حداقل ۴ حرف)</Label>
                <Textarea
                  id="receipt-reject-reason"
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => { setRejectReason(e.target.value); setRejectError(null) }}
                  disabled={Boolean(busy)}
                  aria-invalid={Boolean(rejectError) || undefined}
                  className={rejectError ? 'rounded-[10px] border-red-500' : 'rounded-[10px]'}
                />
                {rejectError && <p className="text-sm text-red-600 dark:text-red-400">{rejectError}</p>}
              </div>
            </>
          )}
        </div>
        <DialogFooter className="flex-wrap gap-2 px-6 pb-6 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={Boolean(busy)} className="rounded-[10px]">
            بستن
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            disabled={Boolean(busy) || loading || Boolean(loadError)}
            onClick={handleReject}
            className="min-h-11 rounded-[10px] border-red-300 font-bold text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            {busy === 'reject' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" aria-label="در حال بارگذاری" /> : <Icon icon="mdi:close-circle-outline" className="h-4 w-4" />}
            رد فیش
          </Button>
          <Button
            disabled={Boolean(busy) || loading || Boolean(loadError)}
            onClick={handleApprove}
            className="min-h-11 rounded-[10px] bg-emerald-700 font-bold text-white hover:bg-emerald-800"
          >
            {busy === 'approve' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" aria-label="در حال بارگذاری" /> : <Icon icon="mdi:check-circle-outline" className="h-4 w-4" />}
            تأیید فیش
          </Button>
        </DialogFooter>
      </DialogContent>
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
    <Dialog open={open} onOpenChange={(o) => { if (!o && !busy) onClose() }}>
      <DialogContent
        aria-label="ثبت دریافت در محل"
        className="gap-0 overflow-hidden p-0 sm:max-w-[444px] [&>button]:text-white/90 [&>button:hover]:bg-white/15 [&>button:hover]:text-white"
      >
        <Header icon="mdi:cash-register" title={`ثبت دریافت در محل${venueName ? ` — ${venueName}` : ''}`} gradient="linear-gradient(135deg, #059669, #10b981)" />
        <div className="px-6 pb-2 pt-6">
          <p className="mb-4 text-sm text-muted-foreground">
            مبلغ دریافتی از مشتری را در محل ثبت کنید. در صورت خالی گذاشتن مبلغ، مبلغ رزرو ثبت می‌شود.
          </p>
          {error && <Alert variant="destructive" className="mb-4 rounded-[10px]">{error}</Alert>}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="collect-amount">
                {`مبلغ دریافتی (ریال)${defaultAmount ? ` — پیش‌فرض ${formatPrice(defaultAmount)}` : ''}`}
              </Label>
              <Input
                id="collect-amount"
                inputMode="numeric"
                className="rounded-[10px]"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(null) }}
                disabled={busy}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label id="collect-method-label">روش دریافت</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PayInPersonMethod)} disabled={busy}>
                <SelectTrigger aria-labelledby="collect-method-label" className="rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IN_PERSON_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{TX_METHOD_LABELS[m] ?? m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 px-6 pb-6 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={busy} className="rounded-[10px]">
            انصراف
          </Button>
          <Button
            disabled={busy}
            onClick={handleCollect}
            className="min-h-11 flex-1 rounded-[10px] bg-emerald-700 font-bold text-white hover:bg-emerald-800"
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" aria-label="در حال بارگذاری" />
            ) : (
              <Icon icon="mdi:cash-check" className="h-4 w-4" />
            )}
            {busy ? 'در حال ثبت...' : 'ثبت دریافت'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
