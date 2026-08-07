import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import StatCard from '@/components/dashboard/StatCard'
import Chart from '@/components/dashboard/Chart'
import { formatPrice } from '@/lib/utils'

const AdminDashboard: React.FC = () => {
  const stats = [
    { title: 'کل کاربران', value: '۱,۲۴۵', icon: 'mdi:account-group', color: '#3b82f6', change: '+۱۲%' },
    { title: 'سالن‌ها', value: '۴۸', icon: 'mdi:store', color: '#10b981', change: '+۵%' },
    { title: 'رزروها', value: '۳,۲۸۰', icon: 'mdi:calendar-check', color: '#8b5cf6', change: '+۲۳%' },
    { title: 'درآمد کل', value: formatPrice(156000000), icon: 'mdi:coin', color: '#f59e0b', change: '+۱۸%' },
  ]

  const chartData = [
    { month: 'فروردین', bookings: 120 },
    { month: 'اردیبهشت', bookings: 150 },
    { month: 'خرداد', bookings: 180 },
    { month: 'تیر', bookings: 220 },
    { month: 'مرداد', bookings: 200 },
    { month: 'شهریور', bookings: 250 },
  ]

  const recentUsers = [
    { id: 1, name: 'علی محمدی', email: 'ali@example.com', date: '۱۴۰۲/۱۰/۱۵', status: 'فعال' },
    { id: 2, name: 'سارا حسینی', email: 'sara@example.com', date: '۱۴۰۲/۱۰/۱۴', status: 'فعال' },
    { id: 3, name: 'رضا کریمی', email: 'reza@example.com', date: '۱۴۰۲/۱۰/۱۳', status: 'غیرفعال' },
  ]

  return (
    <Layout isAuthenticated userRole="admin" showSidebar>
      <Box sx={{ py: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                داشبورد مدیریت
              </Typography>
              <Typography color="text.secondary">
                مدیریت کل سیستم رزرو سالن فوتسال
              </Typography>
            </Box>
            <Button
              variant="contained"
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              }}
            >
              <Icon icon="mdi:download" className="h-5 w-5 ml-2" />
              گزارش
            </Button>
          </Box>
        </motion.div>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        {/* Chart */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Chart
              title="آمار رزروها"
              data={chartData}
              type="area"
              dataKey="bookings"
              xAxisKey="month"
              height={300}
            />
          </Grid>
        </Grid>

        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card sx={{ borderRadius: '16px' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                کاربران جدید
              </Typography>
              <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>نام</TableCell>
                      <TableCell>ایمیل</TableCell>
                      <TableCell>تاریخ عضویت</TableCell>
                      <TableCell>وضعیت</TableCell>
                      <TableCell>عملیات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'primary.main',
                                fontSize: '0.75rem',
                              }}
                            >
                              {user.name.slice(0, 2)}
                            </Avatar>
                            {user.name}
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.date}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.status}
                            color={user.status === 'فعال' ? 'success' : 'default'}
                            size="small"
                            sx={{ borderRadius: '8px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: '8px', textTransform: 'none' }}
                          >
                            مدیریت
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </Layout>
  )
}

export default AdminDashboard