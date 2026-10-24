// frontend/src/components/contract/manager/ContractApproveDialog.tsx
// «تأیید با تغییرات» — POST /contracts/{id}/approve (ContractApprove):
// قیمت اصلاحی (< قیمت پایه)، سقف سانس ۱..۲۰۰، پلن اقساط {count 1..24, فاصله 7..90}،
// سیاست لغو. خطاهای ۴۰۰ فارسی بک‌اند اینلاین نمایش داده می‌شود.

import React, { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { useApproveContract } from '@/hooks/useContracts'
import {
  extractError,
  faNum,
  formatRial,
  parseAmountInput,
  SectionCard,
} from '@/components/contract/shared'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/shadcn/button'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Textarea } from '@/components/ui/shadcn/textarea'
import type { ContractApprovePayload } from '@/services/contract'

interface ApproveTarget {
  contractId: number
  venueName: string
  userName: string | null
  pricePerSession: number
  originalPrice: number
  totalSessions: number
  currentPolicy: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  target: ApproveTarget | null
}

const ContractApproveDialog: React.FC<Props> = ({ open, onClose, target }) => {
  const mutation = useApproveContract()
  const [price, setPrice] = useState('')
  const [maxSessions, setMaxSessions] = useState('')
  const [installCount, setInstallCount] = useState('')
  const [dueSpacing, setDueSpacing] = useState('')
  const [policy, setPolicy] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (open && target) {
      setPrice(String(target.pricePerSession))
      setMaxSessions(String(target.totalSessions || ''))
      setInstallCount('')
      setDueSpacing('')
      setPolicy(target.currentPolicy || '')
      setErrors({})
      setServerError(null)
    }
  }, [open, target])

  const parsedPrice = parseAmountInput(price)
  const parsedMax = maxSessions.trim() === '' ? null : parseAmountInput(maxSessions)
  const parsedCount = installCount.trim() === '' ? null : parseAmountInput(installCount)
  const parsedSpacing = dueSpacing.trim() === '' ? null : parseAmountInput(dueSpacing)

  const previewTotal = useMemo(() => {
    const count = parsedMax && Number.isFinite(parsedMax) ? parsedMax : target?.totalSessions ?? 0
    const p = Number.isFinite(parsedPrice) ? parsedPrice : 0
    return count * p
  }, [parsedMax, parsedPrice, target])

  if (!target) return null

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) errs.price = 'قیمت هر سانس را وارد کنید'
    else if (parsedPrice >= target.originalPrice) errs.price = 'قیمت اصلاحی باید کمتر از قیمت پایه سانس باشد'
    if (parsedMax !== null && (!Number.isInteger(parsedMax) || parsedMax < 1 || parsedMax > 200)) {
      errs.max = 'سقف سانس باید عددی بین ۱ تا ۲۰۰ باشد'
    }
    if (parsedCount !== null && (!Number.isInteger(parsedCount) || parsedCount < 1 || parsedCount > 24)) {
      errs.count = 'تعداد اقساط بین ۱ تا ۲۴'
    }
    if (parsedSpacing !== null && parsedCount === null) {
      errs.spacing = 'برای فاصله سررسید، تعداد اقساط را نیز مشخص کنید'
    }
    if (parsedSpacing !== null && (!Number.isInteger(parsedSpacing) || parsedSpacing < 7 || parsedSpacing > 90)) {
      errs.spacing = 'فاصله سررسید بین ۷ تا ۹۰ روز'
    }
    if (policy.length > 1000) errs.policy = 'سیاست لغو حداکثر ۱۰۰۰ کاراکتر'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submit = async () => {
    setServerError(null)
    if (!validate()) return
    const payload: ContractApprovePayload = {}
    if (parsedPrice !== target.pricePerSession) payload.adjusted_price_per_session = parsedPrice
    if (parsedMax !== null && parsedMax !== target.totalSessions) payload.max_sessions = parsedMax
    if (parsedCount !== null) {
      payload.installments = { count: parsedCount, due_in_days_between: parsedSpacing ?? null }
    }
    const policyTrim = policy.trim()
    if (policyTrim && policyTrim !== (target.currentPolicy || '')) payload.cancellation_policy = policyTrim
    try {
      await mutation.mutateAsync({ contractId: target.contractId, data: payload })
      toast.success('قرارداد تأیید و فعال شد')
      onClose()
    } catch (err) {
      setServerError(extractError(err, 'تأیید قرارداد ناموفق بود'))
    }
  }

  return (
    <Dialog
      open={open}
      onClose={mutation.isPending ? undefined : onClose}
      title="تأیید قرارداد با تغییرات"
      titleIcon={<Icon icon="mdi:check-decagram" style={{ color: '#059669' }} />}
      maxWidth="sm"
      actions={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-xl px-4"
          >
            انصراف
          </Button>
          <Button
            onClick={submit}
            disabled={mutation.isPending}
            className="rounded-xl !bg-none bg-emerald-700 font-bold text-white hover:bg-emerald-800"
          >
            {mutation.isPending ? 'در حال تأیید...' : 'تأیید و فعال‌سازی'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {(target.userName || 'کاربر') + ' — ' + target.venueName + ' | قیمت پیشنهادی: ' + formatRial(target.pricePerSession) + ' در ' + faNum(target.totalSessions) + ' سانس'}
        </p>
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="approve-price">قیمت هر سانس (ریال)</Label>
          <Input
            id="approve-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-invalid={errors.price ? true : undefined}
            className={errors.price ? 'h-11 border-red-500 focus-visible:ring-red-500' : 'h-11'}
          />
          <p className={errors.price ? 'text-xs text-red-600 dark:text-red-400' : 'text-xs text-muted-foreground'}>
            {errors.price || ('قیمت پایه سانس: ' + formatRial(target.originalPrice))}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="w-full space-y-1.5 sm:w-[180px]">
            <Label htmlFor="approve-max">سقف تعداد سانس (اختیاری)</Label>
            <Input
              id="approve-max"
              value={maxSessions}
              onChange={(e) => setMaxSessions(e.target.value)}
              aria-invalid={errors.max ? true : undefined}
              className={errors.max ? 'h-11 border-red-500 focus-visible:ring-red-500' : 'h-11'}
            />
            <p className={errors.max ? 'text-xs text-red-600 dark:text-red-400' : 'text-xs text-muted-foreground'}>
              {errors.max || 'سانس‌های اضافیِ آینده آزاد می‌شوند'}
            </p>
          </div>
          <div className="w-full space-y-1.5 sm:w-[180px]">
            <Label htmlFor="approve-count">تعداد اقساط (اختیاری ۱ تا ۲۴)</Label>
            <Input
              id="approve-count"
              value={installCount}
              onChange={(e) => setInstallCount(e.target.value)}
              aria-invalid={errors.count ? true : undefined}
              className={errors.count ? 'h-11 border-red-500 focus-visible:ring-red-500' : 'h-11'}
            />
            <p className={errors.count ? 'text-xs text-red-600 dark:text-red-400' : 'text-xs text-muted-foreground'}>
              {errors.count || 'خالی = پیش‌فرض ماهانه بر اساس روز سررسید'}
            </p>
          </div>
          <div className="w-full space-y-1.5 sm:w-[180px]">
            <Label htmlFor="approve-spacing">فاصله سررسید اقساط (روز)</Label>
            <Input
              id="approve-spacing"
              value={dueSpacing}
              onChange={(e) => setDueSpacing(e.target.value)}
              aria-invalid={errors.spacing ? true : undefined}
              className={errors.spacing ? 'h-11 border-red-500 focus-visible:ring-red-500' : 'h-11'}
            />
            <p className={errors.spacing ? 'text-xs text-red-600 dark:text-red-400' : 'text-xs text-muted-foreground'}>
              {errors.spacing || 'بین ۷ تا ۹۰ روز — فقط با تعداد اقساط'}
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="approve-policy">شرایط لغو قرارداد (اختیاری)</Label>
          <Textarea
            id="approve-policy"
            value={policy}
            onChange={(e) => setPolicy(e.target.value)}
            rows={2}
            aria-invalid={errors.policy ? true : undefined}
            className={errors.policy ? 'min-h-[72px] border-red-500 focus-visible:ring-red-500' : 'min-h-[72px]'}
          />
          <p className={errors.policy ? 'text-xs text-red-600 dark:text-red-400' : 'text-xs text-muted-foreground'}>
            {errors.policy || 'این متن در جزئیات قرارداد برای کاربر نمایش داده می‌شود'}
          </p>
        </div>

        <SectionCard title="پیش‌نمایش پس از تأیید" icon="mdi:eye-outline" dense>
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">مبلغ کل جدید</span>
            <span className="text-sm font-extrabold">{formatRial(previewTotal)}</span>
          </div>
        </SectionCard>
      </div>
    </Dialog>
  )
}

export type { ApproveTarget }
export default ContractApproveDialog
