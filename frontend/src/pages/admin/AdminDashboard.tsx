import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box, Typography, Grid, Paper, useTheme, Skeleton, Chip, Button, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { adminService } from '@/services/admin'
import type { UserStats, VenueStats, AdminUser } from '@/services/admin'
import { formatDate, getInitials } from '@/lib/utils'

const roleConfig: Record<string, { label: string; color: 'default' | 'info' | 'secondary' | 'warning' }> = {
  user: { label: 'کاربر', color: 'default' },
  venue_manager: { label: 'مدیر سالن', color: 'info' },
  club_admin: { label: 'مدیر باشگاه', color: 'secondary' },
  super_admin: { label: 'مدیر کل', color: 'warning' },
}

const AdminDashboard: React.FC = () => {
  const theme = useTheme()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [venueStats, setVenueStats] = useState<VenueStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingManagers, setPendingManagers] = useState<AdminUser[]>([])
  const [actingId, setActingId] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [uStats, vStats, allUsers, pendingMgrs] = await Promise.all([
        adminService.getUserStats(),
        adminService.getVenueStats(),
        adminService.getUsers(),
        adminService.getPendingManagers().catch(() => [] as AdminUser[]),
      ])
      setUserStats(uStats)
      setVenueStats(vStats)
      setUsers(allUsers || [])
      setPendingManagers(pendingMgrs || [])
    } catch {
      // بک‌اند در دسترس نیست؛ صفحه با داده‌های خالی نمایش داده می‌شود
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    setActingId(id)
    try {
      await adminService.approveUser(id)
      await fetchData()
    } catch {
      // خطا
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async (id: number) => {
    setActingId(id)
    try {
      await adminService.rejectUser(id)
      await fetchData()
    } catch {
      // خطا
    } finally {
      setActingId(null)
    }
  }

  const stats = [
    { label: 'کل کاربران', value: userStats?.total_users, icon: 'mdi:account-group', gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
    { label: 'کاربران فعال', value: userStats?.active_users, icon: 'mdi:account-check', gradient: 'linear-gradient(135deg, #16a34a, #15803d)' },
    { label: 'کل سالن‌ها', value: venueStats?.total_venues, icon: 'mdi:stadium', gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
    { label: 'در انتظار تایید', value: venueStats?.pending_venues, icon: 'mdi:shield-question-outline', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  ]

  const recentUsers = [...users]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 5)

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          <Icon icon="mdi:crown" className="h-7 w-7 ml-2" style={{ verticalAlign: 'middle', color: theme.palette.primary.main }} />
          پنل مدیریت
        </Typography>
        <Typography variant="body2" color="text.secondary">
          نمای کلی کاربران و سالن‌های سیستم
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 6, md: 3 }} key={index}>
            {loading ? (
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{stat.label}</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        {stat.value ?? 0}
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: '14px',
                      background: stat.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon icon={stat.icon} className="h-6 w-6" style={{ color: 'white' }} />
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
            )}
          </Grid>
        ))}
      </Grid>

      {/* مدیران سالن در انتظار تایید */}
      {!loading && pendingManagers.length > 0 && (
        <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(255,247,237,0.9)', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Icon icon="mdi:account-clock-outline" className="h-5 w-5" style={{ color: '#d97706' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              مدیران سالن در انتظار تایید
            </Typography>
            <Chip label={pendingManagers.length} size="small" color="warning" sx={{ borderRadius: '8px' }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {pendingManagers.map((m) => (
              <Box
                key={m.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap',
                  p: 1.5,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(245,158,11,0.2)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 34, height: 34, fontSize: '0.85rem', bgcolor: 'warning.main' }}>
                    {getInitials(m.full_name)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{m.full_name}</Typography>
                    <Typography variant="caption" color="text.secondary" dir="ltr" sx={{ fontFamily: 'monospace', display: 'block' }}>
                      {m.phone} • {formatDate(m.created_at)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={actingId === m.id}
                    onClick={() => handleApprove(m.id)}
                    sx={{
                      borderRadius: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      bgcolor: '#16a34a',
                      '&:hover': { bgcolor: '#15803d' },
                    }}
                  >
                    <Icon icon="mdi:check" className="h-4 w-4 ml-1" />
                    تایید
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    disabled={actingId === m.id}
                    onClick={() => handleReject(m.id)}
                    sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600 }}
                  >
                    <Icon icon="mdi:close" className="h-4 w-4 ml-1" />
                    رد
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon icon="mdi:account-clock-outline" className="h-4.5 w-4.5" style={{ color: theme.palette.primary.main }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  آخرین کاربران
                </Typography>
              </Box>
              <Button
                component={Link}
                to="/admin/users"
                size="small"
                sx={{ textTransform: 'none', fontWeight: 600, color: 'primary.main' }}
              >
                مشاهده همه
              </Button>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} variant="rounded" height={48} />
                ))}
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>کاربر</TableCell>
                      <TableCell>شماره موبایل</TableCell>
                      <TableCell>نقش</TableCell>
                      <TableCell>تاریخ ثبت‌نام</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 30, height: 30, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
                              {getInitials(user.full_name)}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.full_name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" dir="ltr" sx={{ fontFamily: 'monospace' }}>{user.phone}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={roleConfig[user.role]?.label || user.role}
                            color={roleConfig[user.role]?.color || 'default'}
                            size="small"
                            sx={{ borderRadius: '8px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{formatDate(user.created_at)}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    {recentUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                            کاربری یافت نشد
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Icon icon="mdi:chart-donut" className="h-4.5 w-4.5" style={{ color: theme.palette.primary.main }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                کاربران بر اساس نقش
              </Typography>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="rounded" height={36} />
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {Object.entries(userStats?.by_role || {}).map(([role, count]) => (
                  <Box key={role}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {roleConfig[role]?.label || role}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">{count}</Typography>
                    </Box>
                    <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.05)' }}>
                      <Box sx={{
                        height: '100%', borderRadius: 3,
                        width: `${userStats?.total_users ? Math.max(4, (count / userStats.total_users) * 100) : 0}%`,
                        background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                      }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 1.5 }}>
              <Button
                component={Link}
                to="/admin/users"
                variant="outlined"
                fullWidth
                size="small"
                startIcon={<Icon icon="mdi:account-group" />}
                sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600 }}
              >
                کاربران
              </Button>
              <Button
                component={Link}
                to="/admin/venues"
                variant="outlined"
                fullWidth
                size="small"
                startIcon={<Icon icon="mdi:stadium" />}
                sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600 }}
              >
                سالن‌ها
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  )
}

export default AdminDashboard