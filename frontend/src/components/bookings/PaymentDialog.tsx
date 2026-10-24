import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'
import { paymentService, type PaymentItem } from '@/services/payment'
import { cn, formatPrice, formatTimeFa } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Alert } from '@/components/ui/shadcn/alert'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog'

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

const spinnerClass =
  'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent'

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

  const handleOpenChange = (next: boolean) => {
    if (next) return
    if (step === 'processing') return
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-label="پرداخت آنلاین رزرو"
        className="gap-0 overflow-hidden p-0 sm:max-w-[444px] [&>button]:text-white/90 [&>button:hover]:bg-white/15 [&>button:hover]:text-white"
      >
        {/* هدر گرادیانی شبیه درگاه بانک */}
        <div className="flex items-center justify-between gap-2 bg-gradient-to-br from-blue-900 via-blue-600 to-violet-600 ps-6 pe-16 py-5">
          <DialogHeader className="flex-1">
            <DialogTitle className="flex items-center gap-2 pe-10 text-base font-bold text-white">
              <Icon icon="mdi:bank-outline" className="h-5 w-5" />
              درگاه پرداخت
            </DialogTitle>
          </DialogHeader>
          <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
            شبیه‌سازی‌شده
          </span>
        </div>

        <div className="px-6 pt-6">
          {/* خلاصه سفارش */}
          <div className="mb-5 flex flex-col gap-1.5 rounded-[14px] bg-muted p-4">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">سالن</span>
              <span className="text-sm font-semibold text-foreground">{venueName || `رزرو #${bookingId}`}</span>
            </div>
            {slotDate && (
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">زمان</span>
                <span className="text-sm font-semibold text-foreground">
                  {slotDate}
                  {startTime ? ` — ${formatTimeFa(startTime)}` : ''}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">مبلغ قابل پرداخت</span>
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{formatPrice(amount)}</span>
            </div>
          </div>

          {error && <Alert variant="destructive" className="mb-4 rounded-xl">{error}</Alert>}

          <AnimatePresence mode="wait">
            {step === 'invoice' && (
              <motion.div
                key="invoice"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '32px 0' }}
              >
                <span
                  className="mx-auto block h-8 w-8 animate-spin rounded-full border-[3px] border-slate-300 border-t-blue-600"
                  role="status"
                  aria-label="در حال بارگذاری"
                />
                <p className="mt-3 text-sm text-muted-foreground">در حال صدور فاکتور...</p>
              </motion.div>
            )}

            {(step === 'form' || step === 'processing') && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className={cn('flex flex-col gap-4', step === 'processing' && 'opacity-50')}>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="payment-card-number">شماره کارت</Label>
                    <Input
                      id="payment-card-number"
                      placeholder="6037 9971 0000 0000"
                      inputMode="numeric"
                      startIcon={<Icon icon="mdi:credit-card-outline" />}
                      value={cardNumber}
                      onChange={(e) => {
                        const digits = toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 16)
                        setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '))
                      }}
                      disabled={step === 'processing'}
                      error={fieldErrors.cardNumber}
                      aria-describedby={!fieldErrors.cardNumber ? 'payment-card-hint' : undefined}
                    />
                    {!fieldErrors.cardNumber && (
                      <p id="payment-card-hint" className="text-xs text-muted-foreground">۱۶ رقم روی کارت</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex w-[100px] shrink-0 flex-col gap-1.5">
                      <Label htmlFor="payment-cvv">CVV2</Label>
                      <Input
                        id="payment-cvv"
                        placeholder="123"
                        inputMode="numeric"
                        value={cvv}
                        onChange={(e) => setCvv(toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 4))}
                        disabled={step === 'processing'}
                        error={fieldErrors.cvv}
                        className="px-3"
                      />
                    </div>
                    <div className="flex w-[72px] shrink-0 flex-col gap-1.5">
                      <Label htmlFor="payment-month">ماه</Label>
                      <Input
                        id="payment-month"
                        placeholder="01"
                        inputMode="numeric"
                        value={month}
                        onChange={(e) => setMonth(toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 2))}
                        disabled={step === 'processing'}
                        error={fieldErrors.month}
                        className="px-3"
                      />
                    </div>
                    <div className="flex w-[84px] shrink-0 flex-col gap-1.5">
                      <Label htmlFor="payment-year">سال</Label>
                      <Input
                        id="payment-year"
                        placeholder="1405"
                        inputMode="numeric"
                        value={year}
                        onChange={(e) => setYear(toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 4))}
                        disabled={step === 'processing'}
                        error={fieldErrors.year}
                        className="px-3"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'success' && payment && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '8px 0' }}
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600">
                  <Icon icon="mdi:check-bold" className="h-8 w-8" style={{ color: 'white' }} />
                </div>
                <h2 className="mb-1 text-lg font-bold text-foreground">پرداخت موفق</h2>
                <p className="mb-4 text-sm text-muted-foreground">تراکنش شما با موفقیت انجام شد</p>
                <div className="flex flex-col gap-1 rounded-xl bg-muted p-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">کد پیگیری</span>
                    <span className="text-sm font-semibold text-foreground" dir="ltr">{payment.transaction_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">مبلغ</span>
                    <span className="text-sm font-semibold text-foreground">{formatPrice(payment.amount)}</span>
                  </div>
                  {payment.card_pan && (
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">کارت</span>
                      <span className="text-sm font-semibold text-foreground" dir="ltr">**** {payment.card_pan}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="gap-2 px-6 pb-6 pt-4">
          {step === 'success' ? (
            <Button
              onClick={onClose}
              className="w-full rounded-xl bg-gradient-to-br from-green-700 to-green-800 font-bold text-white hover:from-green-800 hover:to-green-900"
            >
              بستن
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={step === 'processing'}
                className="rounded-xl"
              >
                انصراف
              </Button>
              <Button
                onClick={handlePay}
                disabled={step !== 'form' || !payment}
                className="flex-1 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 font-bold text-white hover:from-blue-700 hover:to-violet-700"
              >
                {step === 'processing' ? (
                  <span className="flex items-center gap-2">
                    <span className={spinnerClass} role="status" aria-label="در حال بارگذاری" />
                    در حال پرداخت...
                  </span>
                ) : (
                  <>
                    <Icon icon="mdi:lock-check-outline" className="h-5 w-5" />
                    پرداخت {formatPrice(amount)}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PaymentDialog
