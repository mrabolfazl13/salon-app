import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Avatar,
  Tabs,
  Tab,
  Pagination,
} from '@mui/material'
import { formatDate, formatPrice, getStatusColor, getStatusLabel } from '@/lib/utils'

interface BookingItem {
  id: number
  venue: string
  date: string
  time: string
  price: number
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
}

interface BookingListProps {
  bookings: BookingItem[]
  onCancel?: (id: number) => void
  onView?: (id: number) => void
}

const BookingList: React.FC<BookingListProps> = ({ bookings, onCancel, onView }) => {
  const [tab, setTab] = useState(0)

  const filteredBookings = bookings.filter((booking) => {
    if (tab === 0) return true
    if (tab === 1) return booking.status === 'confirmed'
    if (tab === 2) return booking.status === 'pending'
    if (tab === 3) return booking.status === 'cancelled'
    if (tab === 4) return booking.status === 'completed'
    return true
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Paper
        sx={{
          p: 3,
          borderRadius: '16px',
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
            },
            '& .Mui-selected': {
              bgcolor: 'primary.main',
              color: 'white !important',
              borderRadius: '8px',
            },
          }}
        >
          <Tab label="همه" />
          <Tab label="تایید شده" />
          <Tab label="در انتظار" />
          <Tab label="لغو شده" />
          <Tab label="انجام شده" />
        </Tabs>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredBookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: 'grey.50',
                  transition: 'all 0.3s',
                  '&:hover': {
                    bgcolor: 'grey.100',
                  },
                  gap: 2,
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
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(booking.date)} - {booking.time}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Typography variant="body2" fontWeight={600}>
                    {formatPrice(booking.price)}
                  </Typography>
                  <Chip
                    label={getStatusLabel(booking.status)}
                    color={getStatusColor(booking.status) as any}
                    size="small"
                    sx={{ borderRadius: '8px' }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => onView?.(booking.id)}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                    }}
                  >
                    جزئیات
                  </Button>
                  {booking.status === 'confirmed' && (
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => onCancel?.(booking.id)}
                      sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                      }}
                    >
                      لغو
                    </Button>
                  )}
                </Box>
              </Box>
            </motion.div>
          ))}
        </Box>

        {filteredBookings.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
            }}
          >
            <Icon icon="mdi:calendar-blank" className="h-16 w-16 text-muted-foreground/50 mx-auto" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              هیچ رزروی یافت نشد
            </Typography>
          </Box>
        )}

        <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
          <Pagination count={5} color="primary" shape="rounded" />
        </Box>
      </Paper>
    </motion.div>
  )
}

export default BookingList