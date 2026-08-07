import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Button,
  Input,
  Select,
  Alert,
  CircularProgress,
  Typography,
  Grid,
  Paper,
} from '@mui/material'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const bookingSchema = z.object({
  venueId: z.string().min(1, 'لطفاً سالن را انتخاب کنید'),
  date: z.string().min(1, 'لطفاً تاریخ را انتخاب کنید'),
  slotId: z.string().min(1, 'لطفاً سانس را انتخاب کنید'),
})

type BookingFormData = z.infer<typeof bookingSchema>

interface BookingFormProps {
  venues: Array<{ id: string; name: string; price: number }>
  onSuccess?: () => void
}

const BookingForm: React.FC<BookingFormProps> = ({ venues, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedVenue, setSelectedVenue] = useState<any>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  })

  const venueId = watch('venueId')

  // Mock slots
  const slots = [
    { id: '1', startTime: '۱۶:۰۰', endTime: '۱۷:۳۰', available: true },
    { id: '2', startTime: '۱۷:۳۰', endTime: '۱۹:۰۰', available: true },
    { id: '3', startTime: '۱۹:۰۰', endTime: '۲۰:۳۰', available: false },
    { id: '4', startTime: '۲۰:۳۰', endTime: '۲۲:۰۰', available: true },
  ]

  const onSubmit = async (data: BookingFormData) => {
    setLoading(true)
    setError(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('رزرو با موفقیت انجام شد!')
      onSuccess?.()
    } catch (err) {
      setError('خطا در رزرو. لطفاً دوباره تلاش کنید.')
      toast.error('خطا در رزرو')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Alert severity="error">{error}</Alert>
          </motion.div>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Select
              {...register('venueId')}
              label="انتخاب سالن"
              options={venues.map((v) => ({ value: v.id, label: v.name }))}
              error={errors.venueId?.message}
              fullWidth
              onChange={(e) => {
                const venue = venues.find((v) => v.id === e.target.value)
                setSelectedVenue(venue)
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Input
              {...register('date')}
              type="date"
              label="تاریخ"
              error={errors.date?.message}
              fullWidth
            />
          </Grid>

          {venueId && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                انتخاب سانس
              </Typography>
              <Grid container spacing={1}>
                {slots.map((slot) => (
                  <Grid item xs={6} sm={4} key={slot.id}>
                    <motion.div
                      whileHover={slot.available ? { scale: 1.02 } : {}}
                      whileTap={slot.available ? { scale: 0.98 } : {}}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          borderRadius: '12px',
                          cursor: slot.available ? 'pointer' : 'not-allowed',
                          opacity: slot.available ? 1 : 0.5,
                          border: watch('slotId') === slot.id ? '2px solid' : 'none',
                          borderColor: 'primary.main',
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: slot.available ? 'translateY(-2px)' : 'none',
                            boxShadow: slot.available ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
                          },
                        }}
                        onClick={() => {
                          if (slot.available) {
                            // @ts-ignore
                            document.querySelector(`input[value="${slot.id}"]`)?.click()
                          }
                        }}
                      >
                        <input
                          {...register('slotId')}
                          type="radio"
                          value={slot.id}
                          className="hidden"
                          disabled={!slot.available}
                        />
                        <Typography variant="body2" fontWeight={600}>
                          {slot.startTime} - {slot.endTime}
                        </Typography>
                        {!slot.available && (
                          <Typography variant="caption" color="error">
                            پر
                          </Typography>
                        )}
                        {watch('slotId') === slot.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500 }}
                          >
                            <Icon icon="mdi:check-circle" className="h-5 w-5 text-primary mx-auto mt-1" />
                          </motion.div>
                        )}
                      </Paper>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
              {errors.slotId && (
                <Typography variant="caption" color="error">
                  {errors.slotId.message}
                </Typography>
              )}
            </Grid>
          )}

          {selectedVenue && watch('slotId') && (
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
                    <Box>
                      <Typography variant="body2">
                        {selectedVenue.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        قیمت: {formatPrice(selectedVenue.price)}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      {formatPrice(selectedVenue.price)}
                    </Typography>
                  </Box>
                </Alert>
              </motion.div>
            </Grid>
          )}
        </Grid>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            py: 1.5,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
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
    </motion.div>
  )
}

export default BookingForm