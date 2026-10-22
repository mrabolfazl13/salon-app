// frontend/src/components/membership/MembershipPurchaseDialog.tsx
// دیالوگ خرید اشتراک باشگاه: فاکتور → فرم کارت → پردازش → موفقیت (الگوی PaymentDialog)
import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { membershipService, type CardPayData } from '@/services/membership'
import type { MembershipPlan, MembershipPurchase } from '@/types/membership'
import { PLAN_TYPE_LABEL } from '@/types/membership'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Separator } from '@/components/ui/shadcn/separator'

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
    <Dialog open={open} onOpenChange={(next) => { if (!next && step !== 'processing') onClose() }}>
      <DialogContent aria-label="خرید اشتراک" className="gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Icon icon="mdi:card-account-details-star" style={{ width: 22, height: 22, color: '#2563eb' }} />
              <span className="text-lg font-extrabold">خرید اشتراک</span>
            </span>
            <span className="rounded-lg bg-violet-600/10 px-2.5 py-1 text-[0.68rem] font-bold text-violet-700 dark:text-violet-300">
              {PLAN_TYPE_LABEL[plan.plan_type]}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* خلاصه پلن */}
        <div className="mb-1.5 rounded-[14px] border border-blue-600/[0.12] bg-blue-600/5 p-4">
          {venueName && (
            <div className="mb-1 flex justify-between">
              <span className="text-[0.68rem] text-muted-foreground">سالن</span>
              <span className="text-[0.68rem] font-semibold">{venueName}</span>
            </div>
          )}
          <div className="mb-1 flex justify-between">
            <span className="text-[0.68rem] text-muted-foreground">پلن</span>
            <span className="text-[0.68rem] font-semibold">{plan.title}</span>
          </div>
          {plan.sessions_count ? (
            <div className="mb-1 flex justify-between">
              <span className="text-[0.68rem] text-muted-foreground">تعداد جلسات</span>
              <span className="text-[0.68rem] font-semibold">
                {plan.sessions_count.toLocaleString('fa-IR')} جلسه
              </span>
            </div>
          ) : null}
          {plan.duration_days ? (
            <div className="mb-1 flex justify-between">
              <span className="text-[0.68rem] text-muted-foreground">مدت اعتبار</span>
              <span className="text-[0.68rem] font-semibold">
                {plan.duration_days.toLocaleString('fa-IR')} روز
              </span>
            </div>
          ) : null}
          <Separator className="my-2" />
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] text-muted-foreground">مبلغ قابل پرداخت</span>
            <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
              {formatPrice(plan.price)}
            </span>
          </div>
        </div>

        {step === 'invoice' && (
          <div className="py-1 text-center">
            {creating ? (
              <span
                className="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground"
                role="status"
                aria-label="در حال بارگذاری"
              />
            ) : (
              <>
                <p className="mb-4 text-[0.68rem] text-muted-foreground">
                  فاکتور شما آماده است. برای ادامه، اطلاعات کارت بانکی را وارد کنید.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setStep('form')}
                  disabled={!purchase}
                  className="w-full rounded-xl py-3.5 font-bold"
                >
                  <Icon icon="mdi:credit-card-outline" style={{ width: 20, height: 20 }} />
                  ورود به درگاه پرداخت
                </Button>
              </>
            )}
          </div>
        )}

        {(step === 'form' || step === 'processing') && (
          <div className={step === 'processing' ? 'flex flex-col gap-4 opacity-[0.55]' : 'flex flex-col gap-4'}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="membership-card">شماره کارت</Label>
              <Input
                id="membership-card"
                placeholder="•••• •••• •••• ••••"
                value={cardNumber}
                onChange={(e) => setCardNumber(toLatinDigits(e.target.value).slice(0, 16))}
                inputMode="numeric"
                startIcon={<Icon icon="mdi:credit-card-outline" style={{ width: 20, height: 20 }} />}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Label htmlFor="membership-cvv">CVV2</Label>
                <Input
                  id="membership-cvv"
                  value={cvv}
                  onChange={(e) => setCvv(toLatinDigits(e.target.value).slice(0, 4))}
                  inputMode="numeric"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Label htmlFor="membership-month">ماه</Label>
                <Input
                  id="membership-month"
                  value={month}
                  onChange={(e) => setMonth(toLatinDigits(e.target.value).slice(0, 2))}
                  inputMode="numeric"
                  placeholder="۱۲"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Label htmlFor="membership-year">سال</Label>
                <Input
                  id="membership-year"
                  value={year}
                  onChange={(e) => setYear(toLatinDigits(e.target.value).slice(0, 4))}
                  inputMode="numeric"
                  placeholder="۱۴۰۵"
                />
              </div>
            </div>
          </div>
        )}

        {step === 'success' && purchase && (
          <div className="py-1 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/[0.12]">
              <Icon icon="mdi:check-circle" style={{ width: 34, height: 34, color: '#22c55e' }} />
            </div>
            <p className="mb-0.5 text-[0.68rem] font-extrabold">
              اشتراک فعال شد!
            </p>
            <p className="mb-4 text-[0.68rem] text-muted-foreground">
              {plan.plan_type === 'monthly'
                ? 'اعتبار اشتراک ماهانه از همین حالا آغاز شده است.'
                : 'برای استفاده، در ورود به باشگاه به مدیر سالن نشان دهید.'}
            </p>
            <div className="flex flex-col gap-1.5 rounded-xl bg-slate-900/[0.03] p-3 text-start dark:bg-white/5">
              <div className="flex justify-between">
                <span className="text-[0.68rem] text-muted-foreground">کد پیگیری</span>
                <span className="text-[0.68rem] font-bold" dir="ltr">{purchase.transaction_id}</span>
              </div>
              {purchase.sessions_remaining != null && (
                <div className="flex justify-between">
                  <span className="text-[0.68rem] text-muted-foreground">جلسات باقی‌مانده</span>
                  <span className="text-[0.68rem] font-bold">
                    {purchase.sessions_remaining.toLocaleString('fa-IR')}
                  </span>
                </div>
              )}
              {purchase.expires_at && (
                <div className="flex justify-between">
                  <span className="text-[0.68rem] text-muted-foreground">انقضا</span>
                  <span className="text-[0.68rem] font-bold">
                    {new Date(purchase.expires_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'success' ? (
            <Button type="button" onClick={onClose} className="w-full rounded-xl py-3 font-bold">
              بستن
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={step === 'processing'}
              >
                انصراف
              </Button>
              {step === 'form' && (
                <Button
                  type="button"
                  onClick={handlePay}
                  className="px-6 font-bold"
                >
                  <Icon icon="mdi:bank-outline" style={{ width: 18, height: 18 }} />
                  پرداخت
                </Button>
              )}
              {step === 'processing' && (
                <Button type="button" disabled className="px-6">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-current border-t-transparent"
                      role="status"
                      aria-label="در حال بارگذاری"
                    />
                    در حال پرداخت…
                  </span>
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MembershipPurchaseDialog
