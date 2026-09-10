import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box, Typography, Paper, useTheme, Skeleton, Chip, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material'
import toast from 'react-hot-toast'
import Layout from '@/components/layout/Layout'
import { venueService } from '@/services/venue'
import { adminService } from '@/services/admin'
import { formatPrice, formatDate } from '@/lib/utils'

// سالن‌های در انتظار تایید (پاسخ خام بک‌اند)
interface PendingVenue {
  id: number
  name: string
  address: string
  phone: string | null
  manager_id: number
  created_at: string
  is_verified: boolean
}

const AdminVenues: React.FC = () => {
  const theme = useTheme()
  const [venues, setVenues] = useState<any[]>([])
  const [pending, setPending] = useState<PendingVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [verifyingId, setVerifyingId] = useState<number | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [all, pend] = await Promise.all([
        venueService.getAll(),
        adminService.getPendingVenues(),
      ])
      setVenues(all || [])
      setPending(pend || [])
    } catch {
      toast.error('خطا در دریافت لیست سالن‌ها')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (id: number) => {
    setVerifyingId(id)
    try {
      await adminService.verifyVenue(id)
      toast.success('سالن با موفقیت تایید شد')
      await fetchAll()
    } catch {
      toast.error('خطا در تایید سالن')
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          <Icon icon="mdi:stadium" className="h-7 w-7 ml-2" style={{ verticalAlign: 'middle', color: theme.palette.primary.main }} />
          مدیریت سالن‌ها
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {venues.length} سالن در سیستم | {pending.length} سالن در انتظار تایید
        </Typography>
      </Box>

      {/* Pending venues */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Icon icon="mdi:shield-question-outline" className="h-5 w-5" style={{ color: '#d97706' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            سالن‌های در انتظار تایید
          </Typography>
        </Box>
        {loading ? (
          <Skeleton variant="rounded" height={90} sx={{ borderRadius: 2 }} />
        ) : pending.length === 0 ? (
          <Paper sx={{ p: 3, borderRadius: 2, border: `1px dashed ${theme.palette.divider}`, textAlign: 'center' }}>
            <Icon icon="mdi:check-all" className="h-6 w-6" style={{ color: '#16a34a' }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              سالنی در انتظار تایید نیست
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {pending.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Paper sx={{
                  p: 2, borderRadius: 2,
                  border: `1px solid rgba(245,158,11,0.3)`,
                  bgcolor: 'rgba(245,158,11,0.04)',
                  display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
                }}>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{venue.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      <Icon icon="mdi:map-marker-outline" className="h-3.5 w-3.5 ml-1" style={{ verticalAlign: 'middle' }} />
                      {venue.address}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      ثبت‌نام: {formatDate(venue.created_at)}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={() => handleVerify(venue.id)}
                    disabled={verifyingId === venue.id}
                    startIcon={verifyingId === venue.id
                      ? <CircularProgress size={16} sx={{ color: 'white' }} />
                      : <Icon icon="mdi:shield-check" className="h-4 w-4" />}
                    sx={{
                      borderRadius: 1, textTransform: 'none', fontWeight: 600,
                      background: 'linear-gradient(135deg, #16a34a, #15803d)',
                    }}
                  >
                    تایید سالن
                  </Button>
                </Paper>
              </motion.div>
            ))}
          </Box>
        )}
      </Box>

      {/* All venues */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Icon icon="mdi:stadium-variant" className="h-5 w-5" style={{ color: theme.palette.primary.main }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          همه سالن‌ها
        </Typography>
      </Box>
      <Paper sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rounded" height={52} />
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>سالن</TableCell>
                  <TableCell>آدرس</TableCell>
                  <TableCell>تلفن</TableCell>
                  <TableCell>حداقل قیمت</TableCell>
                  <TableCell>وضعیت</TableCell>
                  <TableCell>تاریخ ثبت</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {venues.map((venue) => (
                  <TableRow key={venue.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{venue.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {venue.address}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" dir="ltr" sx={{ fontFamily: 'monospace' }}>{venue.phone}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {formatPrice(venue.price)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<Icon icon={venue.is_verified ? 'mdi:shield-check' : 'mdi:shield-outline'} className="h-3.5 w-3.5" />}
                        label={venue.is_verified ? 'تایید شده' : 'در انتظار'}
                        color={venue.is_verified ? 'success' : 'warning'}
                        size="small"
                        sx={{ borderRadius: '8px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{formatDate(venue.created_at)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {venues.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Icon icon="mdi:stadium-outline" className="h-8 w-8" style={{ color: 'rgba(0,0,0,0.2)' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          سالنی ثبت نشده است
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

export default AdminVenues