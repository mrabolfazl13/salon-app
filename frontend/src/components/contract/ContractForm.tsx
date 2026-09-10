import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
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
} from '@mui/material'
import { formatPrice, countContractSessions, pyDayNames } from '@/lib/utils'
import { contractService } from '@/services/contract'
import toast from 'react-hot-toast'

const contractSchema = z
  .object({
    venueId: z.number({ message: 'لطفاً سالن را انتخاب کنید' }).min(1, 'لطفاً سالن را انتخاب کنید'),
    startDate: z.string().min(1, 'لطفاً تاریخ شروع را انتخاب کنید'),
    endDate: z.string().min(1, 'لطفاً تاریخ پایان را انتخاب کنید'),
    dayOfWeek: z.number({ message: 'لطفاً روز هفته را انتخاب کنید' }),
    startTime: z.string().min(1, 'لطفاً ساعت شروع را انتخاب کنید'),
    recurrence: z.enum(['weekly', 'biweekly', 'monthly']),
    discountedPrice: z.number({ message: 'قیمت هر جلسه را وارد کنید' }).positive('قیمت باید بیشتر از صفر باشد'),
    description: z.string().optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'تاریخ پایان باید بعد از تاریخ شروع باشد',
    path: ['endDate'],
  })

type ContractFormValues = z.infer<typeof contractSchema>

interface ContractFormProps {
  venues: Array<{ id: number; name: string }>
  onSuccess?: () => void
  onError?: (msg: string) => void
}

// ترجمه خطاهای رایج بک‌اند
function translateError(detail: string): string {
  const map: Record<string, string> = {
    'Discounted price must be less than original price':
      'قیمت تخفیف‌دار باید کمتر از قیمت اصلی سالن باشد',
    'Start date must be before end date': 'تاریخ شروع باید قبل از تاریخ پایان باشد',
    'No sessions found': 'با این تنظیمات هیچ جلسه‌ای در بازه زمانی انتخابی وجود ندارد',
    'A contract already exists for this venue on the same day/time period':
      'قراردادی با همین روز و ساعت برای این سالن وجود دارد',
    'Venue not found': 'سالن مورد نظر یافت نشد',
  }
  return map[detail] || detail
}

const ContractForm: React.FC<ContractFormProps> = ({ venues, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      recurrence: 'weekly',
    },
  })

  const watched = watch()

  const totalInfo = useMemo(() => {
    const count = countContractSessions(
      watched.startDate || '',
      watched.endDate || '',
      watched.dayOfWeek ?? -1,
      watched.recurrence || 'weekly'
    )
    return {
      count,
      total: count * (watched.discountedPrice || 0),
    }
  }, [watched.startDate, watched.endDate, watched.dayOfWeek, watched.recurrence, watched.discountedPrice])

  const onSubmit = async (data: ContractFormValues) => {
    setLoading(true)
    try {
      await contractService.create({
        venueId: Number(data.venueId),
        startDate: data.startDate,
        endDate: data.endDate,
        dayOfWeek: Number(data.dayOfWeek),
        startTime: data.startTime,
        recurrence: data.recurrence,
        discountedPrice: Number(data.discountedPrice),
        description: data.description || undefined,
      })
      toast.success('قرارداد با موفقیت ثبت شد!')
      onSuccess?.()
    } catch (error: any) {
      const detail =
        error.response?.data?.detail || 'خطا در ثبت قرارداد. لطفاً دوباره تلاش کنید.'
      const message = typeof detail === 'string' ? translateError(detail) : 'خطا در ثبت قرارداد'
      toast.error(message)
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper sx={{ p: 4, borderRadius: '16px' }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        ثبت قرارداد بلندمدت
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        با قرارداد بلندمدت، هر هفته در روز و ساعت مشخص با قیمت تخفیف‌دار تمرین کنید
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid size={{  xs: 12  }}>
            <FormControl fullWidth error={!!errors.venueId}>
              <InputLabel>انتخاب سالن</InputLabel>
              <Select
                {...register('venueId', { valueAsNumber: true })}
                label="انتخاب سالن"
                sx={{ borderRadius: '10px' }}
              >
                {venues.map((venue) => (
                  <MenuItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.venueId && (
                <Typography variant="caption" color="error">
                  {errors.venueId.message}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid size={{  xs: 12, sm: 6  }}>
            <TextField
              {...register('startDate')}
              type="date"
              label="تاریخ شروع"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.startDate}
              helperText={errors.startDate?.message}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>

          <Grid size={{  xs: 12, sm: 6  }}>
            <TextField
              {...register('endDate')}
              type="date"
              label="تاریخ پایان"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.endDate}
              helperText={errors.endDate?.message}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>

          <Grid size={{  xs: 12, sm: 6  }}>
            <FormControl fullWidth error={!!errors.dayOfWeek}>
              <InputLabel>روز هفته</InputLabel>
              <Select
                {...register('dayOfWeek', { valueAsNumber: true })}
                label="روز هفته"
                sx={{ borderRadius: '10px' }}
              >
                {pyDayNames.map((name, index) => (
                  <MenuItem key={name} value={index}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
              {errors.dayOfWeek && (
                <Typography variant="caption" color="error">
                  {errors.dayOfWeek.message}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid size={{  xs: 12, sm: 6  }}>
            <TextField
              {...register('startTime')}
              type="time"
              label="ساعت شروع"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.startTime}
              helperText={errors.startTime?.message}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>

          <Grid size={{  xs: 12, sm: 6  }}>
            <FormControl fullWidth>
              <InputLabel>نوع تکرار</InputLabel>
              <Select {...register('recurrence')} label="نوع تکرار" sx={{ borderRadius: '10px' }}>
                <MenuItem value="weekly">هفتگی</MenuItem>
                <MenuItem value="biweekly">دو هفته یکبار</MenuItem>
                <MenuItem value="monthly">ماهانه</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{  xs: 12, sm: 6  }}>
            <TextField
              {...register('discountedPrice', { valueAsNumber: true })}
              type="number"
              label="قیمت تخفیف‌دار هر جلسه (تومان)"
              fullWidth
              error={!!errors.discountedPrice}
              helperText={
                errors.discountedPrice?.message ||
                'باید کمتر از قیمت اصلی سانس باشد'
              }
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>

          <Grid size={{  xs: 12  }}>
            <TextField
              {...register('description')}
              label="توضیحات (اختیاری)"
              fullWidth
              multiline
              minRows={2}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>

          {totalInfo.count > 0 && (
            <Grid size={{  xs: 12  }}>
              <Alert
                severity="info"
                sx={{
                  borderRadius: '10px',
                  '& .MuiAlert-message': { width: '100%' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    تعداد جلسات: {totalInfo.count} جلسه
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }} variant="h6" color="primary">
                    مبلغ کل: {formatPrice(totalInfo.total)}
                  </Typography>
                </Box>
              </Alert>
            </Grid>
          )}

          <Grid size={{  xs: 12  }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                py: 1.5,
              }}
            >
              {loading ? (
                <CircularProgress size={24} className="text-white" />
              ) : (
                <>
                  <Icon icon="mdi:check" className="h-5 w-5 ml-2" />
                  ثبت قرارداد
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