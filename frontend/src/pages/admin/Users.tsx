import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box, Typography, Paper, useTheme, Skeleton, Chip, InputBase,
  FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { adminService } from '@/services/admin'
import type { AdminUser, UserStats } from '@/services/admin'
import { formatDate, getInitials } from '@/lib/utils'

const roleConfig: Record<string, { label: string; color: 'default' | 'info' | 'secondary' | 'warning'; icon: string }> = {
  user: { label: 'کاربر', color: 'default', icon: 'mdi:account' },
  venue_manager: { label: 'مدیر سالن', color: 'info', icon: 'mdi:stadium' },
  club_admin: { label: 'مدیر باشگاه', color: 'secondary', icon: 'mdi:soccer' },
  super_admin: { label: 'مدیر کل', color: 'warning', icon: 'mdi:crown' },
}

const Users: React.FC = () => {
  const theme = useTheme()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [allUsers, userStats] = await Promise.all([
        adminService.getUsers(),
        adminService.getUserStats(),
      ])
      setUsers(allUsers || [])
      setStats(userStats)
    } catch {
      // بک‌اند در دسترس نیست
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = !search || u.full_name?.includes(search) || u.phone?.includes(search)
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  const miniStats = [
    { label: 'فعال', value: stats?.active_users, icon: 'mdi:account-check', color: '#16a34a' },
    { label: 'غیرفعال', value: stats?.inactive_users, icon: 'mdi:account-off', color: '#dc2626' },
    { label: 'تایید شده', value: stats?.verified_users, icon: 'mdi:check-decagram', color: '#2563eb' },
  ]

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          <Icon icon="mdi:account-group" className="h-7 w-7 ml-2" style={{ verticalAlign: 'middle', color: theme.palette.primary.main }} />
          مدیریت کاربران
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {users.length} کاربر در سیستم ثبت‌نام کرده‌اند
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
        {miniStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <Paper sx={{
              px: 2, py: 1.25, borderRadius: 1.5,
              border: `1px solid ${theme.palette.divider}`,
              display: 'flex', alignItems: 'center', gap: 1,
            }}>
              <Icon icon={stat.icon} className="h-4 w-4" style={{ color: stat.color }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{stat.label}</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: stat.color }}>
                {stat.value ?? 0}
              </Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>

      <Paper sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            px: 1.5, py: 0.75, flex: 1, minWidth: 220,
            bgcolor: 'grey.50',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            '&:focus-within': { border: `1px solid ${theme.palette.primary.main}` },
          }}>
            <Icon icon="mdi:magnify" className="h-4 w-4" style={{ color: theme.palette.text.secondary }} />
            <InputBase
              sx={{ flex: 1, fontSize: '0.875rem', direction: 'rtl' }}
              placeholder="جستجوی نام یا شماره موبایل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Box>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>نقش</InputLabel>
            <Select
              value={roleFilter}
              label="نقش"
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ borderRadius: 1, fontSize: '0.85rem' }}
            >
              <MenuItem value="all">همه نقش‌ها</MenuItem>
              {Object.entries(roleConfig).map(([value, conf]) => (
                <MenuItem key={value} value={value}>{conf.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} variant="rounded" height={52} />
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>کاربر</TableCell>
                  <TableCell>شماره موبایل</TableCell>
                  <TableCell>نقش</TableCell>
                  <TableCell>وضعیت</TableCell>
                  <TableCell>تایید</TableCell>
                  <TableCell>تاریخ ثبت‌نام</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, fontSize: '0.85rem', bgcolor: 'primary.main' }}>
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
                        icon={<Icon icon={roleConfig[user.role]?.icon || 'mdi:account'} className="h-3.5 w-3.5" />}
                        label={roleConfig[user.role]?.label || user.role}
                        color={roleConfig[user.role]?.color || 'default'}
                        size="small"
                        sx={{ borderRadius: '8px', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'فعال' : 'غیرفعال'}
                        color={user.is_active ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: '8px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Icon
                        icon={user.is_verified ? 'mdi:check-decagram' : 'mdi:minus-circle-outline'}
                        className="h-5 w-5"
                        style={{ color: user.is_verified ? '#16a34a' : 'rgba(0,0,0,0.25)' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{formatDate(user.created_at)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Icon icon="mdi:account-search-outline" className="h-8 w-8" style={{ color: 'rgba(0,0,0,0.2)' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          کاربری با این مشخصات یافت نشد
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Layout>
  )
}

export default Users