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
} from '@mui/material'
import TimeSlotPicker from './TimeSlotPicker'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const bookingSchema = z.object({
  venueId: z.string().min(1, 'لطفاً سالن را انتخاب کنید'),
  date: z.string().min(1, 'لطفاً تاریخ را انتخاب کنید'),
})

type BookingForm = z.infer<typeof bookingSchema>

interface BookingFormProps {
  venues: Array<{ id: string; name: string }>
  onSuccess?: () => void
}

const BookingForm: React.FC<BookingFormProps> = ({ venues, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
  })

  const selectedVenue = watch('venueId')

  // Mock slots
  const slots = [
    { id: 1, startTime: '۱۶:۰۰', endTime: '۱۷:۳۰', price: 300000, available: true },
    { id: 2, startTime: '۱۷:۳۰', endTime: '۱۹:۰۰', price: 320000, available: true },
    { id: 3, startTime: '۱۹:۰۰', endTime: '۲۰:۳۰', price: 350000, available: false },
    { id: 4, startTime: '۲۰:۳۰', endTime: '۲۲:۰۰', price: 380000, available: true },
  ]

  const onSubmit = async (data: BookingForm) => {
    if (!selectedSlot) {
      toast.error('لطفاً یک سانس را انتخاب کنید')
      return
    }

    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('رزرو با موفقیت انجام شد!')
      onSuccess?.()
    } catch (error) {
      toast.error('خطا در رزرو')
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
          رزرو سالن
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box display="flex" flexDirection="column" gap={3}>
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

            <Input
              {...register('date')}
              type="date"
              label="تاریخ"
              error={errors.date?.message}
              sx={{ borderRadius: '10px' }}
            />

            {selectedVenue && (
              <TimeSlotPicker
                slots={slots}
                onSelect={(slot) => setSelectedSlot(slot)}
              />
            )}

            {selectedSlot && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert
                  severity="info"
                  sx={{ borderRadius: '10px' }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2">
                        سانس انتخاب شده: {selectedSlot.startTime} - {selectedSlot.endTime}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        قیمت: {formatPrice(selectedSlot.price)}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      {formatPrice(selectedSlot.price)}
                    </Typography>
                  </Box>
                </Alert>
              </motion.div>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
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
                  تایید و رزرو
                </>
              )}
            </Button>
          </Box>
        </form>
      </Paper>
    </motion.div>
  )
}

export default BookingForm