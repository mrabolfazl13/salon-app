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
import {
  Box,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  TextField,
  Grid,
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material'
import PersianDatePicker from '@/components/ui/PersianDatePicker'
import { countContractSessions } from '@/lib/utils'
import { useCreateContract } from '@/hooks/useContracts'
import {
  extractError,
  formatRial,
  parseAmountInput,
  pyDayNames,
  RECURRENCE_LABELS,
  toPersianDigits,
} from '@/components/contract/shared'
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
    <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: '16px' }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        ثبت درخواست قرارداد بلندمدت
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        درخواست شما در وضعیت «در انتظار تأیید» برای مدیر سالن ارسال می‌شود؛ سانس‌ها از همین لحظه رزرو می‌مانند
      </Typography>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }} onClose={() => setServerError(null)}>
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth error={Boolean(errors.venueId)}>
              <InputLabel>انتخاب سالن</InputLabel>
              <Select
                {...register('venueId', { valueAsNumber: true })}
                label="انتخاب سالن"
                sx={{ borderRadius: '10px' }}
              >
                {venues.map((venue) => (
                  <MenuItem key={venue.id} value={venue.id}>{venue.name}</MenuItem>
                ))}
              </Select>
              {errors.venueId && (
                <Typography variant="caption" color="error">{errors.venueId.message}</Typography>
              )}
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
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
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
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
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>روز هفته سانس‌ها</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              حداکثر ۳ روز انتخاب کنید — اولین روز، روز اصلی قرارداد است
            </Typography>
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
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {pyDayNames.map((name, idx) => {
                      const pos = selected.indexOf(idx)
                      return (
                        <Chip
                          key={name}
                          label={pos >= 0 ? `${name} (${toPersianDigits(pos === 0 ? 'اصلی' : pos + 1)})` : name}
                          onClick={() => toggle(idx)}
                          color={pos >= 0 ? 'primary' : 'default'}
                          variant={pos >= 0 ? 'filled' : 'outlined'}
                          sx={{ borderRadius: '10px', fontWeight: 600 }}
                        />
                      )
                    })}
                  </Box>
                )
              }}
            />
            {errors.dayOrder && (
              <Typography variant="caption" color="error">{errors.dayOrder.message}</Typography>
            )}
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              {...register('startTime')}
              type="time"
              label="ساعت شروع"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(errors.startTime)}
              helperText={errors.startTime?.message}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              {...register('endTime')}
              type="time"
              label="ساعت پایان (اختیاری)"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(errors.endTime)}
              helperText={errors.endTime?.message || 'پیش‌فرض ۹۰ دقیقه'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>نوع تکرار</InputLabel>
              <Select {...register('recurrence')} label="نوع تکرار" sx={{ borderRadius: '10px' }}>
                {Object.entries(RECURRENCE_LABELS).map(([v, label]) => (
                  <MenuItem key={v} value={v}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              {...register('discountedPrice')}
              label="قیمت پیشنهادی هر جلسه (ریال)"
              fullWidth
              error={Boolean(errors.discountedPrice)}
              helperText={errors.discountedPrice?.message || 'پیشنهاد شما؛ باید کمتر از قیمت اصلی سانس باشد'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              {...register('downPayment')}
              label="پیش‌پرداخت (ریال — اختیاری)"
              fullWidth
              error={Boolean(errors.downPayment)}
              helperText={errors.downPayment?.message}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              {...register('dueDayOfMonth')}
              label="روز سررسید اقساط در ماه (۱ تا ۲۸)"
              fullWidth
              error={Boolean(errors.dueDayOfMonth)}
              helperText={errors.dueDayOfMonth?.message || 'اختیاری — پیش‌فرض ماهانه'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              {...register('desiredInstallments')}
              label="تعداد قسط مورد نظر (اختیاری)"
              fullWidth
              error={Boolean(errors.desiredInstallments)}
              helperText={errors.desiredInstallments?.message || 'به‌صورت پیشنهاد در توضیحات به مدیر ارسال می‌شود'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              name="autoRenew"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label="تمدید خودکار پس از پایان دوره"
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              {...register('description')}
              label="توضیحات (اختیاری)"
              fullWidth
              multiline
              minRows={2}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>

          {totalInfo.count > 0 && (
            <Grid size={{ xs: 12 }}>
              <Alert
                severity="info"
                sx={{
                  borderRadius: '10px',
                  '& .MuiAlert-message': { width: '100%' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    {`تعداد جلسات: ${toPersianDigits(totalInfo.count)} جلسه — جمع کل (محاسبه سمت سرور): `}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }} variant="h6" color="primary">
                    {formatRial(totalInfo.total)}
                  </Typography>
                </Box>
              </Alert>
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={mutation.isPending}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                py: 1.5,
              }}
            >
              {mutation.isPending ? (
                <CircularProgress size={24} className="text-white" />
              ) : (
                <>
                  <Icon icon="mdi:check" className="h-5 w-5 ml-2" />
                  ثبت درخواست قرارداد
                </>
              )}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  )
}

export default ContractForm