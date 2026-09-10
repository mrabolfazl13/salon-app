import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Grid,
  Typography,
  Button,
  Paper,
  Chip,
  useTheme,
  Container,
  Skeleton,
  Alert,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { useAuthStore } from '@/store/authStore'
import { bookingService } from '@/services/booking'
import { membershipService } from '@/services/membership'
import { MembershipPurchase, PLAN_TYPE_LABEL } from '@/types/membership'
import { formatPrice, formatDateTime, getStatusLabel, getMuiStatusColor } from '@/lib/utils'

interface ApiBooking {
  id: number
  slot_id: number
  user_id: number
  booked_at: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_amount: number
}

const Dashboard: React.FC = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const [bookings, setBookings] = useState<ApiBooking[]>([])
  const [purchases, setPurchases] = useState<MembershipPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await bookingService.getAll()
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  useEffect(() => {
    membershipService
      .getMyPurchases()
      .then((data) => setPurchases(Array.isArray(data) ? data : []))
      .catch(() => setPurchases([]))
  }, [])

  const purchaseStatusChip = (p: MembershipPurchase): { label: string; color: 'success' | 'warning' | 'default' } => {
    if (p.status === 'paid') return { label: 'فعال', color: 'success' }
    if (p.status === 'pending') return { label: 'در انتظار پرداخت', color: 'warning' }
    return { label: 'لغو شده', color: 'default' }
  }

  const activeCount = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  ).length
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length
  const totalSpent = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.payment_amount || 0), 0)

  const stats = [
    {
      title: 'کل رزروها',
      value: new Intl.NumberFormat('fa-IR').format(bookings.length),
      icon: 'mdi:calendar-check',
      color: theme.palette.primary.main,
    },
    {
      title: 'رزروهای فعال',
      value: new Intl.NumberFormat('fa-IR').format(activeCount),
      icon: 'mdi:calendar-clock',
      color: '#10b981',
    },
    {
      title: 'جمع پرداختی',
      value: formatPrice(totalSpent),
      icon: 'mdi:wallet-outline',
      color: '#8b5cf6',
    },
    {
      title: 'رزروهای لغو شده',
      value: new Intl.NumberFormat('fa-IR').format(cancelledCount),
      icon: 'mdi:calendar-remove',
      color: '#f59e0b',
    },
  ]

  const quickActions = [
    { icon: 'mdi:store-search', label: 'رزرو جدید', href: '/venues' },
    { icon: 'mdi:trophy', label: 'رقابت‌ها', href: '/competitions' },
    { icon: 'mdi:file-document', label: 'قراردادها', href: '/contracts' },
    { icon: 'mdi:account', label: 'پروفایل', href: '/profile' },
  ]

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
          <Skeleton variant="rounded" height={48} sx={{ borderRadius: 2, mb: 3 }} />
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[1, 2, 3, 4].map((i) => (
              <Grid size={{ xs: 6, md: 3 }} key={i}>
                <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} />
        </Container>
      </Layout>
    )
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              سلام{user?.fullName ? `، ${user.fullName.split(' ')[0]}` : ''} 👋
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              به داشبورد سیستم رزرو سالن فوتسال خوش آمدید
            </Typography>
          </Box>
          <Button
            variant="contained"
            component={Link}
            to="/venues"
            startIcon={<Icon icon="mdi:plus" />}
            sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, px: 2.5 }}
          >
            رزرو جدید
          </Button>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ borderRadius: 2, mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={fetchBookings}>
                تلاش دوباره
              </Button>
            }
          >
            در دریافت اطلاعات خطایی رخ داد.
          </Alert>
        )}

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map((stat, index) => (
            <Grid size={{ xs: 6, md: 3 }} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
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
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {stat.value}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          {/* Recent Bookings */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon icon="mdi:calendar-history" className="h-4.5 w-4.5" style={{ color: theme.palette.primary.main }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    آخرین رزروها
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  to="/bookings"
                  size="small"
                  sx={{ textTransform: 'none', fontWeight: 600, color: 'primary.main' }}
                >
                  مشاهده همه
                </Button>
              </Box>

              {recentBookings.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Icon icon="mdi:calendar-remove-outline" className="h-8 w-8" style={{ color: 'rgba(0,0,0,0.2)' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    هنوز رزروی ندارید
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {recentBookings.map((b) => (
                    <Box
                      key={b.id}
                      onClick={() => navigate(`/bookings/${b.id}`)}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(0,0,0,0.02)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        '&:hover': { bgcolor: 'rgba(37,99,235,0.05)' },
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          رزرو #{b.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(b.booked_at)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
                          {formatPrice(b.payment_amount)}
                        </Typography>
                        <Chip
                          label={getStatusLabel(b.status)}
                          color={getMuiStatusColor(b.status) as any}
                          size="small"
                          sx={{ borderRadius: '8px' }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Icon icon="mdi:lightning-bolt" className="h-4.5 w-4.5" style={{ color: theme.palette.primary.main }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  دسترسی سریع
                </Typography>
              </Box>
              <Grid container spacing={1.5}>
                {quickActions.map((action, index) => (
                  <Grid size={{ xs: 6 }} key={index}>
                    <Button
                      component={Link}
                      to={action.href}
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

        {/* اشتراک‌های من — باشگاه‌های بدنسازی */}
        {purchases.length > 0 && (
          <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Icon icon="mdi:card-account-details-star" className="h-4.5 w-4.5" style={{ color: theme.palette.primary.main }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                اشتراک‌های من
              </Typography>
            </Box>
            <Grid container spacing={1.5}>
              {purchases.slice(0, 6).map((p) => {
                const chip = purchaseStatusChip(p)
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 1.5,
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: 'rgba(0,0,0,0.02)',
                        height: '100%',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                            {p.plan_title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap component="div">
                            {p.venue_name} · {p.plan_type ? PLAN_TYPE_LABEL[p.plan_type] : ''}
                          </Typography>
                        </Box>
                        <Chip label={chip.label} color={chip.color} size="small" sx={{ borderRadius: '8px', flexShrink: 0 }} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {p.status === 'paid' && p.plan_type === 'monthly' && p.expires_at
                            ? `اعتبار تا ${new Date(p.expires_at).toLocaleDateString('fa-IR')}`
                            : p.status === 'paid' && p.sessions_remaining != null
                              ? `${new Intl.NumberFormat('fa-IR').format(p.sessions_remaining)} جلسه باقی‌مانده`
                              : formatPrice(p.amount)}
                        </Typography>
                        {p.status === 'pending' && (
                          <Button
                            size="small"
                            component={Link}
                            to={`/venues/${p.venue_id}`}
                            sx={{ textTransform: 'none', fontWeight: 700, color: 'primary.main' }}
                          >
                            پرداخت
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                )
              })}
            </Grid>
          </Paper>
        )}
      </Container>
    </Layout>
  )
}

export default Dashboard