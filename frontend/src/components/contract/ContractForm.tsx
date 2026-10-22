// frontend/src/components/contract/ContractForm.tsx
// فرم ثبت درخواست قرارداد — هم‌راستا با ContractCreate بک‌اند:
// venue/start/end + روز هفته + ساعت شروع/پایان + تکرار + قیمت پیشنهادی (discounted_price
// با alias suggested_price) + پیش‌پرداخت + روز سررسید ماه + تمدید خودکار.
// اعتبارسنجی zod آینه‌ی قوانین سرویس است: حداقل ۱ و حداکثر ۶۰ سانس، قیمت < پایه،
// پیش‌پرداخت < نصف مبلغ کل، پایان > شروع. روی ۴۰۰/۴۰۹/۴۲۲ پیام فارسی نگارشمند.

import React, { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import PersianDatePicker from '@/components/ui/PersianDatePicker'
import { cn, countContractSessions } from '@/lib/utils'
import { useCreateContract } from '@/hooks/useContracts'
import {
  extractError,
  formatRial,
  parseAmountInput,
  pyDayNames,
  RECURRENCE_LABELS,
  toPersianDigits,
} from '@/components/contract/shared'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Switch } from '@/components/ui/shadcn/switch'
import { Textarea } from '@/components/ui/shadcn/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select'
import type { ContractCreatePayload } from '@/services/contract'
import toast from 'react-hot-toast'

const contractSchema = z
  .object({
    venueId: z.number({ message: 'لطفاً سالن را انتخاب کنید' }).min(1, 'لطفاً سالن را انتخاب کنید'),
    startDate: z.string().min(1, 'لطفاً تاریخ شروع را انتخاب کنید'),
    endDate: z.string().min(1, 'لطفاً تاریخ پایان را انتخاب کنید'),
    /** ترتیب انتخاب = ترتیب معنادار: عضو اول day_of_week، بقیه additional_days */
    dayOrder: z.array(z.number()).max(3, 'حداکثر ۳ روز هفته برای یک قرارداد مجاز است'),
    startTime: z.string().min(1, 'لطفاً ساعت شروع را انتخاب کنید'),
    endTime: z.string(),
    recurrence: z.enum(['weekly', 'biweekly', 'monthly']),
    discountedPrice: z.string(),
    downPayment: z.string(),
    dueDayOfMonth: z.string(),
    desiredInstallments: z.string(),
    autoRenew: z.boolean(),
    description: z.string().max(1000, 'توضیحات حداکثر ۱۰۰۰ کاراکتر').optional(),
  })
  .superRefine((d, ctx) => {
    if (d.dayOrder.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'حداقل یک روز هفته را انتخاب کنید', path: ['dayOrder'] })
    }
    if (d.endDate && d.startDate && d.endDate < d.startDate) {
      ctx.addIssue({ code: 'custom', message: 'تاریخ پایان باید بعد از تاریخ شروع باشد', path: ['endDate'] })
    }
    if (d.endTime && d.startTime && d.endTime <= d.startTime) {
      ctx.addIssue({ code: 'custom', message: 'ساعت پایان باید بعد از ساعت شروع باشد', path: ['endTime'] })
    }
    const price = parseAmountInput(d.discountedPrice)
    if (!Number.isFinite(price) || price <= 0) {
      ctx.addIssue({ code: 'custom', message: 'قیمت هر جلسه را وارد کنید (بزرگ‌تر از صفر)', path: ['discountedPrice'] })
    }
    const count = d.startDate && d.endDate && d.dayOrder.length > 0
      ? d.dayOrder.reduce((acc, day) => acc + countContractSessions(d.startDate, d.endDate, day, d.recurrence), 0)
      : 0
    if (d.startDate && d.endDate && d.dayOrder.length > 0) {
      if (count === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'با این تنظیمات هیچ جلسه‌ای در بازه انتخابی وجود ندارد (روز هفته را با بازه هماهنگ کنید)',
          path: ['startDate'],
        })
      } else if (count > 60) {
        ctx.addIssue({
          code: 'custom',
          message: 'حداکثر ۶۰ سانس در یک قرارداد — بازه را کوتاه کنید',
          path: ['endDate'],
        })
      }
      if (Number.isFinite(price) && price > 0) {
        const total = count * price
        const downStr = d.downPayment.trim()
        if (downStr) {
          const down = parseAmountInput(downStr)
          if (!Number.isFinite(down)) {
            ctx.addIssue({ code: 'custom', message: 'مبلغ پیش‌پرداخت نامعتبر است', path: ['downPayment'] })
          } else if (down >= total / 2) {
            ctx.addIssue({
              code: 'custom',
              message: 'پیش‌پرداخت باید کمتر از نصف مبلغ کل قرارداد باشد',
              path: ['downPayment'],
            })
          }
        }
      }
    }
    if (d.dueDayOfMonth.trim()) {
      const day = parseAmountInput(d.dueDayOfMonth)
      if (!Number.isInteger(day) || day < 1 || day > 28) {
        ctx.addIssue({ code: 'custom', message: 'روز سررسید باید بین ۱ تا ۲۸ باشد', path: ['dueDayOfMonth'] })
      }
    }
    if (d.desiredInstallments.trim()) {
      const n = parseAmountInput(d.desiredInstallments)
      if (!Number.isInteger(n) || n < 1 || n > 24) {
        ctx.addIssue({ code: 'custom', message: 'تعداد اقساط مورد نظر بین ۱ تا ۲۴', path: ['desiredInstallments'] })
      }
    }
  })

type ContractFormValues = z.infer<typeof contractSchema>

interface ContractFormProps {
  venues: Array<{ id: number; name: string }>
  onSuccess?: () => void
  onError?: (msg: string) => void
}

const helperCls = 'mt-1.5 text-[0.68rem] text-muted-foreground'
const helperErrCls = 'mt-1.5 text-[0.68rem] text-red-600 dark:text-red-400'

const ContractForm: React.FC<ContractFormProps> = ({ venues, onSuccess, onError }) => {
  const [serverError, setServerError] = useState<string | null>(null)
  const mutation = useCreateContract()

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      recurrence: 'weekly',
      dayOrder: [],
      startTime: '',
      endTime: '',
      discountedPrice: '',
      downPayment: '',
      dueDayOfMonth: '',
      desiredInstallments: '',
      autoRenew: false,
      description: '',
    },
  })

  const watched = watch()

  const totalInfo = useMemo(() => {
    const days = watched.dayOrder ?? []
    const count = days.length > 0
      ? days.reduce((acc, day) => acc + countContractSessions(watched.startDate || '', watched.endDate || '', day, watched.recurrence || 'weekly'), 0)
      : 0
    const price = parseAmountInput(watched.discountedPrice || '')
    const priceNum = Number.isFinite(price) ? price : 0
    return { count, total: count * priceNum, price: priceNum }
  }, [watched.startDate, watched.endDate, watched.dayOrder, watched.recurrence, watched.discountedPrice])

  const onSubmit = async (data: ContractFormValues) => {
    setServerError(null)
    const price = parseAmountInput(data.discountedPrice)
    const down = data.downPayment.trim() ? parseAmountInput(data.downPayment) : null
    const dueDay = data.dueDayOfMonth.trim() ? parseAmountInput(data.dueDayOfMonth) : null
    const installments = data.desiredInstallments.trim() ? parseAmountInput(data.desiredInstallments) : null
    // چندروزه: اولین روزِ انتخاب‌شده = day_of_week (روز اصلی)، بقیه = additional_days
    const ordered = [...(data.dayOrder ?? [])].sort((a, b) => (data.dayOrder ?? []).indexOf(a) - (data.dayOrder ?? []).indexOf(b))
    const primary = ordered[0] ?? 0
    const additional = ordered.slice(1).sort((a, b) => a - b)
    const payload: ContractCreatePayload = {
      venue_id: Number(data.venueId),
      start_date: data.startDate,
      end_date: data.endDate,
      day_of_week: primary,
      additional_days: additional,
      start_time: data.startTime,
      end_time: data.endTime || null,
      recurrence: data.recurrence,
      discounted_price: price,
      suggested_price: price,
      description: data.description?.trim() || null,
      auto_renew: data.autoRenew,
      down_payment_amount: down,
      payment_due_day_of_month: dueDay,
      desired_installments: installments,
      note: installments ? `پیشنهاد کاربر: تقسیط در ${toPersianDigits(installments)} قسط` : null,
    }
    try {
      await mutation.mutateAsync(payload)
      toast.success('درخواست قرارداد ثبت شد — در انتظار تأیید مدیر')
      onSuccess?.()
    } catch (error) {
      const msg = extractError(error, 'خطا در ثبت قرارداد. لطفاً دوباره تلاش کنید.')
      setServerError(msg)
      onError?.(msg)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm md:p-8">
      <h2 className="mb-1 text-lg font-extrabold text-foreground">
        ثبت درخواست قرارداد بلندمدت
      </h2>
      <p className="mb-4 text-[0.68rem] text-muted-foreground">
        درخواست شما در وضعیت «در انتظار تأیید» برای مدیر سالن ارسال می‌شود؛ سانس‌ها از همین لحظه رزرو می‌مانند
      </p>

      {serverError && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>{serverError}</span>
            <button
              type="button"
              onClick={() => setServerError(null)}
              aria-label="بستن"
              className="flex h-9 w-11 shrink-0 items-center justify-center rounded-full text-current transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/10"
            >
              <Icon icon="mdi:close" className="h-4 w-4" aria-hidden="true" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="contract-venue">انتخاب سالن</Label>
            <Controller
              name="venueId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value != null ? String(field.value) : undefined}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger
                    id="contract-venue"
                    aria-invalid={errors.venueId ? true : undefined}
                    className={cn('h-9', errors.venueId && 'border-red-500')}
                    onBlur={field.onBlur}
                  >
                    <SelectValue placeholder="انتخاب سالن" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={String(venue.id)}>{venue.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.venueId && (
              <p className="text-[0.68rem] text-red-600 dark:text-red-400">{errors.venueId.message}</p>
            )}
          </div>

          <div>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <PersianDatePicker
                  label="تاریخ شروع"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={Boolean(errors.startDate)}
                  helperText={errors.startDate?.message}
                  max={watched.endDate || undefined}
                />
              )}
            />
          </div>

          <div>
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <PersianDatePicker
                  label="تاریخ پایان"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={Boolean(errors.endDate)}
                  helperText={errors.endDate?.message}
                  min={watched.startDate || undefined}
                />
              )}
            />
          </div>

          <div className="sm:col-span-2">
            <p className="mb-1 text-[0.68rem] font-semibold text-foreground">روز هفته سانس‌ها</p>
            <p className="mb-1 block text-[0.68rem] text-muted-foreground">
              حداکثر ۳ روز انتخاب کنید — اولین روز، روز اصلی قرارداد است
            </p>
            <Controller
              name="dayOrder"
              control={control}
              render={({ field }) => {
                const selected: number[] = field.value ?? []
                const toggle = (idx: number) => {
                  if (selected.includes(idx)) {
                    field.onChange(selected.filter((x) => x !== idx))
                  } else if (selected.length >= 3) {
                    toast.error('حداکثر ۳ روز هفته برای یک قرارداد مجاز است')
                  } else {
                    field.onChange([...selected, idx])
                  }
                }
                return (
                  <div className="flex flex-wrap gap-2">
                    {pyDayNames.map((name, idx) => {
                      const pos = selected.indexOf(idx)
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toggle(idx)}
                          aria-pressed={pos >= 0}
                          className={cn(
                            'inline-flex min-h-9 items-center justify-center rounded-xl border px-4 text-[0.68rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            pos >= 0
                              ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500'
                              : 'border-border bg-card text-foreground hover:bg-muted',
                          )}
                        >
                          {pos >= 0 ? `${name} (${toPersianDigits(pos === 0 ? 'اصلی' : pos + 1)})` : name}
                        </button>
                      )
                    })}
                  </div>
                )
              }}
            />
            {errors.dayOrder && (
              <p className="mt-1.5 text-[0.68rem] text-red-600 dark:text-red-400">{errors.dayOrder.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-start-time">ساعت شروع</Label>
            <Input
              id="contract-start-time"
              {...register('startTime')}
              type="time"
              className={errors.startTime ? 'h-9 border-red-500' : 'h-9'}
            />
            <p className={errors.startTime ? helperErrCls : helperCls}>{errors.startTime?.message}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-end-time">ساعت پایان (اختیاری)</Label>
            <Input
              id="contract-end-time"
              {...register('endTime')}
              type="time"
              className={errors.endTime ? 'h-9 border-red-500' : 'h-9'}
            />
            <p className={errors.endTime ? helperErrCls : helperCls}>
              {errors.endTime?.message || 'پیش‌فرض ۹۰ دقیقه'}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-recurrence">نوع تکرار</Label>
            <Controller
              name="recurrence"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="contract-recurrence" className="h-9">
                    <SelectValue placeholder="نوع تکرار" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECURRENCE_LABELS).map(([v, label]) => (
                      <SelectItem key={v} value={v}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-price">قیمت پیشنهادی هر جلسه (ریال)</Label>
            <Input
              id="contract-price"
              {...register('discountedPrice')}
              className={errors.discountedPrice ? 'h-9 border-red-500' : 'h-9'}
            />
            <p className={errors.discountedPrice ? helperErrCls : helperCls}>
              {errors.discountedPrice?.message || 'پیشنهاد شما؛ باید کمتر از قیمت اصلی سانس باشد'}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-down-payment">پیش‌پرداخت (ریال — اختیاری)</Label>
            <Input
              id="contract-down-payment"
              {...register('downPayment')}
              className={errors.downPayment ? 'h-9 border-red-500' : 'h-9'}
            />
            <p className={errors.downPayment ? helperErrCls : helperCls}>{errors.downPayment?.message}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-due-day">روز سررسید اقساط در ماه (۱ تا ۲۸)</Label>
            <Input
              id="contract-due-day"
              {...register('dueDayOfMonth')}
              className={errors.dueDayOfMonth ? 'h-9 border-red-500' : 'h-9'}
            />
            <p className={errors.dueDayOfMonth ? helperErrCls : helperCls}>
              {errors.dueDayOfMonth?.message || 'اختیاری — پیش‌فرض ماهانه'}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-installments">تعداد قسط مورد نظر (اختیاری)</Label>
            <Input
              id="contract-installments"
              {...register('desiredInstallments')}
              className={errors.desiredInstallments ? 'h-9 border-red-500' : 'h-9'}
            />
            <p className={errors.desiredInstallments ? helperErrCls : helperCls}>
              {errors.desiredInstallments?.message || 'به‌صورت پیشنهاد در توضیحات به مدیر ارسال می‌شود'}
            </p>
          </div>

          <div className="sm:col-span-2">
            <Controller
              name="autoRenew"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Switch
                    id="contract-auto-renew"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="contract-auto-renew" className="font-normal">
                    تمدید خودکار پس از پایان دوره
                  </Label>
                </div>
              )}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="contract-description">توضیحات (اختیاری)</Label>
            <Textarea
              id="contract-description"
              {...register('description')}
              rows={2}
              className={errors.description ? 'min-h-[72px] border-red-500' : 'min-h-[72px]'}
            />
            <p className={errors.description ? helperErrCls : helperCls}>{errors.description?.message}</p>
          </div>

          {totalInfo.count > 0 && (
            <div className="sm:col-span-2">
              <Alert variant="info" className="rounded-xl">
                <AlertDescription className="w-full">
                  <div className="flex items-center justify-between">
                    <p className="text-[0.68rem]">
                      {`تعداد جلسات: ${toPersianDigits(totalInfo.count)} جلسه — جمع کل (محاسبه سمت سرور): `}
                    </p>
                    <h3 className="text-lg font-bold text-primary">
                      {formatRial(totalInfo.total)}
                    </h3>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="sm:col-span-2">
            <Button
              type="submit"
              variant="primary"
              disabled={mutation.isPending}
              className="w-full rounded-xl py-3.5"
            >
              {mutation.isPending ? (
                <span
                  aria-hidden="true"
                  className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
              ) : (
                <>
                  <Icon icon="mdi:check" className="h-5 w-5" aria-hidden="true" />
                  ثبت درخواست قرارداد
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ContractForm
