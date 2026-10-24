// frontend/src/components/contract/ContractInstallmentPayDialog.tsx
// پرداخت قسط قرارداد — جریانش درگاه شبیه‌سازی‌شده (الگوی BookingPaymentDialog)
// روی endpoint بک‌اند: POST /contracts/{id}/payments/{payment_id}/pay {card_number}
// نکات بک‌اند: فقط مالک قرارداد؛ قرارداد active/expired؛ کارت اختیاری (بدون کارت = نقدی).

import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { usePayInstallment } from '@/hooks/useContracts'
import { formatJalaliDate } from '@/lib/jalali'
import { extractError, formatRial } from '@/components/contract/shared'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/shadcn/button'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
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
      aria-label="پرداخت قسط قرارداد"
      open={open}
      onClose={step === 'processing' ? undefined : onClose}
      maxWidth="xs"
      actions={
        step === 'success' ? (
          <Button
            onClick={onClose}
            className="w-full rounded-xl font-bold !bg-none bg-emerald-700 text-white hover:bg-emerald-800"
          >
            بستن
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={step === 'processing'}
              className="rounded-xl px-4"
            >
              انصراف
            </Button>
            <Button
              variant="primary"
              onClick={handlePay}
              disabled={step !== 'form'}
              className="flex-1 rounded-xl font-bold"
            >
              {step === 'processing' ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                  در حال پرداخت...
                </>
              ) : (
                <>
                  <Icon icon="mdi:lock-check-outline" className="h-5 w-5" aria-hidden="true" />
                  {`پرداخت ${formatRial(payment.amount)}`}
                </>
              )}
            </Button>
          </>
        )
      }
    >
      <div className="-mx-5 -mt-5 mb-1 flex items-center justify-between rounded-t-2xl bg-gradient-to-br from-blue-900 via-blue-600 to-violet-600 py-5 pe-16 ps-6">
        <p className="flex items-center gap-2 text-sm font-bold text-white">
          <Icon icon="mdi:bank-outline" className="h-5 w-5" aria-hidden="true" />
          درگاه پرداخت قسط
        </p>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[0.68rem] font-semibold text-white">
          شبیه‌سازی‌شده
        </span>
      </div>

      <div className="rounded-lg bg-muted p-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <span className="text-[0.68rem] text-muted-foreground">سالن</span>
            <span className="text-[0.68rem] font-semibold">{venueName || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[0.68rem] text-muted-foreground">قسط</span>
            <span className="text-[0.68rem] font-semibold">{payment.label || 'قسط'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[0.68rem] text-muted-foreground">سررسید</span>
            <span className="text-[0.68rem] font-semibold">{formatJalaliDate(payment.due_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[0.68rem] text-muted-foreground">مبلغ قابل پرداخت</span>
            <span className="text-[0.68rem] font-bold text-primary-ink">{formatRial(payment.amount)}</span>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <AnimatePresence mode="wait">
        {(step === 'form' || step === 'processing') && (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className={step === 'processing' ? 'flex flex-col gap-4 opacity-50' : 'flex flex-col gap-4'}>
              <div className="space-y-1.5">
                <Label htmlFor="installment-card">شماره کارت (اختیاری)</Label>
                <Input
                  id="installment-card"
                  dir="ltr"
                  className="text-start tabular-nums"
                  placeholder="6037 9971 0000 0000"
                  value={cardNumber}
                  onChange={(e) => {
                    const digits = toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 16)
                    setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '))
                    setCardError(null)
                  }}
                  disabled={step === 'processing'}
                  startIcon={<Icon icon="mdi:credit-card-outline" className="text-muted-foreground" aria-hidden="true" />}
                />
                <p className={cardError ? 'text-[0.68rem] text-red-600 dark:text-red-400' : 'text-[0.68rem] text-muted-foreground'}>
                  {cardError || 'برای ثبت به‌صورت کارت‌به‌کارت وارد کنید؛ خالی = پرداخت نقدی'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-2 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600">
              <Icon icon="mdi:check-bold" className="h-8 w-8" style={{ color: 'white' }} aria-hidden="true" />
            </div>
            <h2 className="mb-1 text-lg font-bold text-foreground">پرداخت موفق</h2>
            <p className="mb-4 text-[0.68rem] text-muted-foreground">
              «{payment.label || 'قسط'}» با مبلغ {formatRial(payment.amount)} تسویه شد
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  )
}

export default ContractInstallmentPayDialog
