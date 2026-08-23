import React from 'react'
import { Icon } from '@iconify/react'
import {
  Box, Grid, Typography, Button, Paper,
  Chip, useTheme, Container,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { formatPrice } from '@/lib/utils'

const Dashboard: React.FC = () => {
  const theme = useTheme()

  const stats = [
    { title: 'رزروهای امروز', value: '۱۲', icon: 'mdi:calendar-check', color: theme.palette.primary.main, change: '+۲۰٪' },
    { title: 'رقابت‌های فعال', value: '۸', icon: 'mdi:trophy', color: '#10b981', change: '+۵٪' },
    { title: 'درآمد امروز', value: formatPrice(2400000), icon: 'mdi:wallet-outline', color: '#8b5cf6', change: '+۱۵٪' },
    { title: 'کاربران جدید', value: '۴۵', icon: 'mdi:account-group-outline', color: '#f59e0b', change: '+۳۰٪' },
  ]

  const recentBookings = [
    { id: 1, venue: 'سالن آبی', address: 'خیابان آزادی', date: '۱۴۰۲/۱۰/۱۵', time: '۱۷:۰۰', status: 'confirmed', price: 300000 },
    { id: 2, venue: 'سالن سبز', address: 'خیابان ولیعصر', date: '۱۴۰۲/۱۰/۱۶', time: '۱۹:۳۰', status: 'pending', price: 350000 },
    { id: 3, venue: 'سالن قرمز', address: 'خیابان شریعتی', date: '۱۴۰۲/۱۰/۱۷', time: '۲۱:۰۰', status: 'confirmed', price: 280000 },
    { id: 4, venue: 'سالن بنفش', address: 'خیابان کاظمی', date: '۱۴۰۲/۱۰/۱۸', time: '۱۶:۰۰', status: 'cancelled', price: 400000 },
  ]

  const statusConfig: Record<string, { label: string; color: 'success' | 'warning' | 'error' }> = {
    confirmed: { label: 'تایید شده', color: 'success' },
    pending: { label: 'در انتظار', color: 'warning' },
    cancelled: { label: 'لغو شده', color: 'error' },
  }

  const quickStats = [
    { label: 'اشغال سالن‌ها', value: 72 },
    { label: 'رضایت کاربران', value: 94 },
    { label: 'رشد ماهانه', value: 28 },
  ]

  const quickActions = [
    { icon: 'mdi:calendar-check', label: 'رزرو جدید' },
    { icon: 'mdi:trophy', label: 'رقابت‌ها' },
    { icon: 'mdi:file-document', label: 'قراردادها' },
    { icon: 'mdi:account-group', label: 'تیم‌ها' },
  ]

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>داشبورد</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              به سیستم رزرو سالن فوتسال خوش آمدید
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:plus" />}
            sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, px: 2.5 }}
          >
            رزرو جدید
          </Button>
        </Box>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map((stat, index) => (
            <Grid size={{ xs: 6, md: 3 }} key={index}>
              <Paper sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {stat.title}
                  </Typography>
                  <Box sx={{
                    width: 36, height: 36,
                    bgcolor: `${stat.color}10`,
                    borderRadius: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon icon={stat.icon} className="h-4.5 w-4.5" style={{ color: stat.color }} />
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1.3rem' }}>
                  {stat.value}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Icon icon="mdi:arrow-up-bold" className="h-3.5 w-3.5" style={{ color: '#4caf50' }} />
                  <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600, fontSize: '0.75rem' }}>
                    {stat.change}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          {/* Recent Bookings */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Paper sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, height: '100%', overflow: 'hidden' }}>
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon icon="mdi:calendar-clock" className="h-4.5 w-4.5" style={{ color: theme.palette.primary.main }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    رزروهای اخیر
                  </Typography>
                </Box>
                <Button size="small" sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
                  مشاهده همه
                </Button>
              </Box>

              <Box>
                {recentBookings.map((booking) => {
                  const status = statusConfig[booking.status]
                  return (
                    <Box
                      key={booking.id}
                      sx={{
                        px: 2.5,
                        py: 2,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '&:last-child': { borderBottom: 'none' },
                        '&:hover': { bgcolor: 'grey.50' },
                        cursor: 'pointer',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                          <Box sx={{
                            width: 38, height: 38,
                            bgcolor: `${theme.palette.primary.main}08`,
                            borderRadius: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Icon icon="mdi:stadium" className="h-4.5 w-4.5" style={{ color: theme.palette.primary.main }} />
                          </Box>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {booking.venue}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {booking.address} · {booking.date} · {booking.time}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
                            {formatPrice(booking.price)}
                          </Typography>
                          <Chip
                            label={status?.label || booking.status}
                            size="small"
                            color={status?.color || 'default'}
                            variant="outlined"
                            sx={{ borderRadius: 1, fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Grid container spacing={2}>
              {/* Quick Stats */}
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                    <Icon icon="mdi:chart-line" className="h-4.5 w-4.5" style={{ color: theme.palette.primary.main }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      آمار سریع
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {quickStats.map((item, index) => (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                            {item.label}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                            {item.value}٪
                          </Typography>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: 3, bgcolor: theme.palette.grey[100], overflow: 'hidden' }}>
                          <Box sx={{
                            height: '100%',
                            width: `${item.value}%`,
                            borderRadius: 3,
                            bgcolor: theme.palette.primary.main,
                          }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              {/* Quick Actions */}
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Icon icon="mdi:zap" className="h-4.5 w-4.5" style={{ color: theme.palette.primary.main }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      دسترسی سریع
                    </Typography>
                  </Box>

                  <Grid container spacing={1.5}>
                    {quickActions.map((action, index) => (
                      <Grid size={{ xs: 6 }} key={index}>
                        <Button
                          variant="outlined"
                          fullWidth
                          sx={{
                            borderRadius: 1,
                            textTransform: 'none',
                            py: 1.25,
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            '&:hover': { bgcolor: `${theme.palette.primary.main}05` },
                          }}
                          startIcon={<Icon icon={action.icon} />}
                        >
                          {action.label}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  )
}

export default Dashboard