// frontend/src/components/competition/CompetitionBidDialog.tsx
// دیالوگ پیشنهاد قیمت کاربران در رقابت قیمت سانس (وضعیت in_competition)
// الگو: MembershipPurchaseDialog — شادcn Dialog + react-hot-toast + پاسخ خطای Persian بک‌اند
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { competitionService } from '@/services/competition'
import { formatDate, formatPrice } from '@/lib/utils'
import { Alert } from '@/components/ui/shadcn/alert'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip'

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
    <Dialog open={open} onOpenChange={(next) => { if (!next && !submitting) onClose() }}>
      <DialogContent aria-label="ثبت پیشنهاد قیمت سانس" className="gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-violet-600">
              <Icon icon="mdi:gavel" style={{ width: 20, height: 20, color: 'white' }} />
            </span>
            <span>
              <span className="block text-lg font-extrabold leading-snug">رقابت با بقیه!</span>
              <span className="block text-[0.68rem] font-normal text-muted-foreground">
                کمترین پیشنهاد پس از پایان رقابت برنده می‌شود
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* اطلاعات سانس */}
        <div className="mb-1.5 rounded-[14px] border border-blue-600/[0.12] bg-blue-600/5 p-4">
          {venueName && (
            <div className="mb-1 flex justify-between">
              <span className="text-[0.68rem] text-muted-foreground">سالن</span>
              <span className="text-[0.68rem] font-semibold">{venueName}</span>
            </div>
          )}
          <div className="mb-1 flex justify-between">
            <span className="text-[0.68rem] text-muted-foreground">تاریخ و ساعت</span>
            <span className="text-[0.68rem] font-semibold">
              {formatDate(slot.date + 'T00:00:00')} • {slot.startTime}
              {slot.endTime ? ` - ${slot.endTime}` : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[0.68rem] text-muted-foreground">قیمت فعلی سانس</span>
            <span className="text-[0.68rem] font-extrabold text-blue-600 dark:text-blue-400">
              {formatPrice(slot.price)}
            </span>
          </div>
          <Separator className="my-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[0.68rem] text-muted-foreground">بهترین پیشنهاد فعلی</span>
              {!loadingBest && !bestError && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => fetchBest(slot.id)}
                      aria-label="به‌روزرسانی بهترین پیشنهاد"
                      className="inline-flex h-9 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Icon icon="mdi:refresh" style={{ width: 16, height: 16 }} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>به‌روزرسانی</TooltipContent>
                </Tooltip>
              )}
            </div>
            {loadingBest ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground"
                role="status"
                aria-label="در حال بارگذاری"
              />
            ) : bestError ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fetchBest(slot.id)}
                className="px-2 text-[0.68rem] font-bold"
              >
                دریافت نشد — تلاش مجدد
              </Button>
            ) : (
              <span className="text-[0.68rem] font-extrabold text-amber-600 dark:text-amber-400">
                {bestPrice != null ? formatPrice(bestPrice) : 'هنوز پیشنهادی ثبت نشده'}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bid-amount">قیمت پیشنهادی (تومان)</Label>
          <div className="relative">
            <Input
              id="bid-amount"
              value={amount}
              onChange={(e) => setAmount(toLatinDigits(e.target.value).slice(0, 9))}
              inputMode="numeric"
              autoFocus
              min={1}
              step={1}
              disabled={submitting}
              error={validationError ?? undefined}
              startIcon={<Icon icon="mdi:currency-usd" style={{ width: 18, height: 18 }} />}
              className="pe-14"
            />
            <span className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-[0.68rem] text-muted-foreground">
              تومان
            </span>
          </div>
          {!validationError && (
            <p className="text-[0.68rem] text-muted-foreground">
              {bestPrice != null
                ? `برای برنده شدن باید کمتر از بهترین پیشنهاد (${formatPrice(bestPrice)}) باشد`
                : 'حداقل ۱ تومان و کمتر از قیمت فعلی سانس'}
            </p>
          )}
        </div>

        {amount !== '' && !validationError && bestPrice != null && amountValue >= bestPrice && (
          <Alert variant="warning" className="mt-2 rounded-xl py-3 text-[0.8rem]">
            پیشنهاد شما از بهترین قیمت فعلی کمتر نیست؛ تا پایان رقابت شانس برنده شدن ندارد.
          </Alert>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
          >
            انصراف
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || amount === '' || Boolean(validationError)}
            className="px-6"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span
                  className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-current border-t-transparent"
                  role="status"
                  aria-label="در حال بارگذاری"
                />
                در حال ثبت…
              </span>
            ) : (
              <>
                <Icon icon="mdi:gavel" style={{ width: 18, height: 18 }} />
                ثبت پیشنهاد
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CompetitionBidDialog
