import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Input,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  TextField,
  Grid,
} from '@mui/material'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const contractSchema = z.object({
  venueId: z.string().min(1, 'لطفاً سالن را انتخاب کنید'),
  startDate: z.string().min(1, 'لطفاً تاریخ شروع را انتخاب کنید'),
  endDate: z.string().min(1, 'لطفاً تاریخ پایان را انتخاب کنید'),
  recurrence: z.string().min(1, 'لطفاً نوع تکرار را انتخاب کنید'),
  dayOfWeek: z.string().min(1, 'لطفاً روز هفته را انتخاب کنید'),
  startTime: z.string().min(1, 'لطفاً ساعت شروع را انتخاب کنید'),
  pricePerSession: z.number().min(10000, 'قیمت هر جلسه حداقل ۱۰,۰۰۰ تومان'),
})

type ContractForm = z.infer<typeof contractSchema>

interface ContractFormProps {
  venues: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

const ContractForm: React.FC<ContractFormProps> = ({ venues, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [totalAmount, setTotalAmount] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContractForm>({
    resolver: zodResolver(contractSchema),
  })

  const watched = watch()

  const calculateTotal = () => {
    // محاسبه تعداد جلسات
    const sessionsPerWeek = 1
    const totalWeeks = 52 // تقریبی
    const totalSessions = sessionsPerWeek * totalWeeks
    const total = totalSessions * (watched.pricePerSession || 0)
    setTotalAmount(total)
  }

  const onSubmit = async (data: ContractForm) => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('قرارداد با موفقیت ثبت شد!')
      onSuccess?.()
    } catch (error) {
      toast.error('خطا در ثبت قرارداد')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        sx={{
          p: 4,
          borderRadius: '16px',
        }}
      >
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          ثبت قرارداد بلندمدت
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.venueId}>
                <InputLabel>انتخاب سالن</InputLabel>
                <Select
                  {...register('venueId')}
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

            <Grid item xs={12} sm={6}>
              <Input
                {...register('startDate')}
                type="date"
                label="تاریخ شروع"
                error={errors.startDate?.message}
                fullWidth
                sx={{ borderRadius: '10px' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Input
                {...register('endDate')}
                type="date"
                label="تاریخ پایان"
                error={errors.endDate?.message}
                fullWidth
                sx={{ borderRadius: '10px' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.recurrence}>
                <InputLabel>نوع تکرار</InputLabel>
                <Select
                  {...register('recurrence')}
                  label="نوع تکرار"
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="weekly">هفتگی</MenuItem>
                  <MenuItem value="biweekly">دو هفته یکبار</MenuItem>
                  <MenuItem value="monthly">ماهانه</MenuItem>
                </Select>
                {errors.recurrence && (
                  <Typography variant="caption" color="error">
                    {errors.recurrence.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.dayOfWeek}>
                <InputLabel>روز هفته</InputLabel>
                <Select
                  {...register('dayOfWeek')}
                  label="روز هفته"
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="0">شنبه</MenuItem>
                  <MenuItem value="1">یکشنبه</MenuItem>
                  <MenuItem value="2">دوشنبه</MenuItem>
                  <MenuItem value="3">سه‌شنبه</MenuItem>
                  <MenuItem value="4">چهارشنبه</MenuItem>
                  <MenuItem value="5">پنجشنبه</MenuItem>
                  <MenuItem value="6">جمعه</MenuItem>
                </Select>
                {errors.dayOfWeek && (
                  <Typography variant="caption" color="error">
                    {errors.dayOfWeek.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Input
                {...register('startTime')}
                type="time"
                label="ساعت شروع"
                error={errors.startTime?.message}
                fullWidth
                sx={{ borderRadius: '10px' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                {...register('pricePerSession', { valueAsNumber: true })}
                type="number"
                label="قیمت هر جلسه (تومان)"
                fullWidth
                onChange={() => calculateTotal()}
                error={!!errors.pricePerSession}
                helperText={errors.pricePerSession?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                  },
                }}
              />
            </Grid>

            {totalAmount > 0 && (
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: '10px',
                      '& .MuiAlert-message': {
                        width: '100%',
                      },
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">
                        مبلغ کل قرارداد (تخمینی)
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        {formatPrice(totalAmount)}
                      </Typography>
                    </Box>
                  </Alert>
                </motion.div>
              </Grid>
            )}

            <Grid item xs={12}>
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
    </motion.div>
  )
}

export default ContractForm