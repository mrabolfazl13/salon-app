// src/pages/dashboard/Dashboard.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Paper,
  useTheme,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { formatPrice } from '@/lib/utils'

const Dashboard: React.FC = () => {
  const theme = useTheme()

  const stats = [
    {
      title: 'رزروهای امروز',
      value: '۱۲',
      icon: 'mdi:calendar-check',
      color: '#3b82f6',
      change: '+۲۰٪',
      bg: 'rgba(59, 130, 246, 0.08)',
    },
    {
      title: 'رقابت‌های فعال',
      value: '۸',
      icon: 'mdi:trophy',
      color: '#10b981',
      change: '+۵٪',
      bg: 'rgba(16, 185, 129, 0.08)',
    },
    {
      title: 'درآمد امروز',
      value: formatPrice(2400000),
      icon: 'mdi:coin',
      color: '#8b5cf6',
      change: '+۱۵٪',
      bg: 'rgba(139, 92, 246, 0.08)',
    },
    {
      title: 'کاربران جدید',
      value: '۴۵',
      icon: 'mdi:account-plus',
      color: '#f59e0b',
      change: '+۳۰٪',
      bg: 'rgba(245, 158, 11, 0.08)',
    },
  ]

  const recentBookings = [
    { id: 1, venue: 'سالن آبی', date: '۱۴۰۲/۱۰/۱۵', time: '۱۷:۰۰', status: 'تایید شده' },
    { id: 2, venue: 'سالن سبز', date: '۱۴۰۲/۱۰/۱۶', time: '۱۹:۳۰', status: 'در انتظار' },
    { id: 3, venue: 'سالن قرمز', date: '۱۴۰۲/۱۰/۱۷', time: '۲۱:۰۰', status: 'تایید شده' },
    { id: 4, venue: 'سالن بنفش', date: '۱۴۰۲/۱۰/۱۸', time: '۱۶:۰۰', status: 'لغو شده' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'تایید شده':
        return 'success'
      case 'در انتظار':
        return 'warning'
      case 'لغو شده':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <Layout isAuthenticated userRole="user">
      <Box sx={{ py: 2 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              mb: 4,
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={700}>
                داشبورد
              </Typography>
              <Typography variant="body2" color="text.secondary">
                به سیستم رزرو سالن فوتسال خوش آمدید
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Icon icon="mdi:plus" className="h-5 w-5" />}
              sx={{
                borderRadius: 2,
                px: 3,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                boxShadow: '0 4px 20px rgba(37,99,235,0.25)',
              }}
            >
              رزرو جدید
            </Button>
          </Box>
        </motion.div>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          {stat.title}
                        </Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                          {stat.value}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5} sx={{ mt: 1 }}>
                          <Icon icon="mdi:trending-up" className="h-3 w-3 text-green-500" />
                          <Typography variant="caption" sx={{ color: 'success.main' }}>
                            {stat.change}
                          </Typography>
                        </Box>
                      </Box>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: stat.bg,
                          color: stat.color,
                          borderRadius: 2,
                        }}
                      >
                        <Icon icon={stat.icon} className="h-6 w-6" />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Recent Bookings & Chart */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={600}>
                      رزروهای اخیر
                    </Typography>
                    <Button size="small" sx={{ borderRadius: 2 }}>
                      مشاهده همه
                    </Button>
                  </Box>

                  <List sx={{ p: 0 }}>
                    {recentBookings.map((booking, index) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <ListItem
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderRadius: 2,
                            mb: 1,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              bgcolor: 'grey.50',
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: 'primary.main',
                              }}
                            >
                              <Icon icon="mdi:calendar" className="h-5 w-5 text-white" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" fontWeight={600}>
                                {booking.venue}
                              </Typography>
                            }
                            secondary={`${booking.date} - ${booking.time}`}
                          />
                          <Chip
                            label={booking.status}
                            color={getStatusColor(booking.status) as any}
                            size="small"
                            sx={{ borderRadius: 1.5 }}
                          />
                        </ListItem>
                      </motion.div>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                    آمار سریع
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        اشغال سالن‌ها
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ۷۲٪
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={72}
                      sx={{
                        height: 8,
                        borderRadius: 2,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 2,
                          background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        رضایت کاربران
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ۹۴٪
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={94}
                      sx={{
                        height: 8,
                        borderRadius: 2,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 2,
                          background: 'linear-gradient(90deg, #10b981, #059669)',
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        رشد ماهانه
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ۲۸٪
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={28}
                      sx={{
                        height: 8,
                        borderRadius: 2,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 2,
                          background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  )
}

export default Dashboard