import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
} from '@mui/material'
import { formatDate } from '@/lib/utils'

interface Booking {
  id: number
  venue: string
  date: string
  time: string
  status: 'confirmed' | 'pending' | 'cancelled'
  user: string
}

interface RecentBookingsProps {
  bookings: Booking[]
}

const RecentBookings: React.FC<RecentBookingsProps> = ({ bookings }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'تایید شده'
      case 'pending':
        return 'در انتظار'
      case 'cancelled':
        return 'لغو شده'
      default:
        return status
    }
  }

  return (
    <Card sx={{ borderRadius: '16px' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          رزروهای اخیر
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {bookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: 'grey.50',
                  transition: 'all 0.3s',
                  '&:hover': {
                    bgcolor: 'grey.100',
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'primary.main',
                    }}
                  >
                    <Icon icon="mdi:calendar" className="h-5 w-5 text-white" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {booking.venue}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(booking.date)} - {booking.time}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • {booking.user}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Chip
                  label={getStatusLabel(booking.status)}
                  color={getStatusColor(booking.status) as any}
                  size="small"
                  sx={{ borderRadius: '8px' }}
                />
              </Box>
            </motion.div>
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}

export default RecentBookings