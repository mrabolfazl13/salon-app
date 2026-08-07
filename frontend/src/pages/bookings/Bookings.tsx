import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Tabs,
  Tab,
  Avatar,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { formatDate, formatPrice } from '@/lib/utils'

const Bookings: React.FC = () => {
  const [tab, setTab] = useState(0)

  const bookings = [
    {
      id: 1,
      venue: 'سالن آبی',
      date: '۱۴۰۲/۱۰/۱۵',
      time: '۱۷:۰۰ - ۱۸:۳۰',
      price: 300000,
      status: 'confirmed' as const,
    },
    {
      id: 2,
      venue: 'سالن سبز',
      date: '۱۴۰۲/۱۰/۱۶',
      time: '۱۹:۳۰ - ۲۱:۰۰',
      price: 250000,
      status: 'pending' as const,
    },
    {
      id: 3,
      venue: 'سالن قرمز',
      date: '۱۴۰۲/۱۰/۱۰',
      time: '۲۱:۰۰ - ۲۲:۳۰',
      price: 350000,
      status: 'cancelled' as const,
    },
  ]

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
    <Layout isAuthenticated>
      <Box sx={{ py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            رزروهای من
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            لیست رزروهای شما
          </Typography>
        </motion.div>

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
        </Tabs>

        <Grid container spacing={3}>
          {bookings.map((booking, index) => (
            <Grid item xs={12} key={booking.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  sx={{
                    borderRadius: '16px',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  <CardContent>
                    <Box
                      display="flex"
                      flexDirection={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      gap={2}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: 'primary.main',
                          }}
                        >
                          <Icon icon="mdi:calendar" className="h-6 w-6 text-white" />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {booking.venue}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(booking.date)} - {booking.time}
                          </Typography>
                        </Box>
                      </Box>

                      <Box display="flex" alignItems="center" gap={2}>
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
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Layout>
  )
}

export default Bookings