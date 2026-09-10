import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  Paper,
  useTheme,
  Grid,
  Container,
  Skeleton,
  Alert,
} from '@mui/material'
import Layout from '@/components/layout/Layout'
import { contractService } from '@/services/contract'
import type { ContractData } from '@/services/contract'
import { venueService } from '@/services/venue'
import { formatPrice, formatDate, pyDayNames, countContractSessions } from '@/lib/utils'

const recurrenceLabels: Record<string, string> = {
  weekly: 'هفتگی',
  biweekly: 'دو هفته یکبار',
  monthly: 'ماهانه',
}

const statusConfig: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  active: { label: 'فعال', color: 'success' },
  expired: { label: 'منقضی', color: 'default' },
  cancelled: { label: 'لغو شده', color: 'error' },
}

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const theme = useTheme()

  const [contract, setContract] = useState<ContractData | null>(null)
  const [venueName, setVenueName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        const data = await contractService.getById(Number(id))
        setContract(data)
        try {
          const venue = await venueService.getById(data.venue_id)
          if (venue?.name) setVenueName(venue.name)
        } catch {
          setVenueName(`سالن #${data.venue_id}`)
        }
      } catch (err) {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
          <Skeleton variant="rounded" height={48} sx={{ borderRadius: 2, mb: 3 }} />
          <Skeleton variant="rounded" height={140} sx={{ borderRadius: 2, mb: 3 }} />
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} />
        </Container>
      </Layout>
    )
  }

  if (notFound || !contract) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
          <Button
            variant="text"
            onClick={() => navigate('/contracts')}
            sx={{ mb: 3, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
            startIcon={<Icon icon="mdi:arrow-right" />}
          >
            بازگشت به لیست قراردادها
          </Button>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            قرارداد مورد نظر یافت نشد یا دسترسی شما به آن محدود است.
          </Alert>
        </Container>
      </Layout>
    )
  }

  const status = statusConfig[contract.status] || statusConfig.active
  const sessionsCount = countContractSessions(
    contract.start_date,
    contract.end_date,
    contract.day_of_week,
    contract.recurrence
  )

  const infoItems = [
    {
      icon: 'mdi:calendar-range',
      label: 'بازه قرارداد',
      value: `${formatDate(contract.start_date)} تا ${formatDate(contract.end_date)}`,
    },
    {
      icon: 'mdi:calendar-clock',
      label: 'روز و ساعت',
      value: `${pyDayNames[contract.day_of_week] || '—'} - ${contract.start_time}`,
    },
    {
      icon: 'mdi:repeat',
      label: 'نوع تکرار',
      value: recurrenceLabels[contract.recurrence] || contract.recurrence,
    },
    {
      icon: 'mdi:calendar-check',
      label: 'تعداد جلسات',
      value: `${sessionsCount} جلسه (۹۰ دقیقه‌ای)`,
    },
    {
      icon: 'mdi:tag-outline',
      label: 'قیمت اصلی سانس',
      value: formatPrice(contract.original_price),
    },
    {
      icon: 'mdi:sale',
      label: 'قیمت هر جلسه (تخفیف‌دار)',
      value: formatPrice(contract.discounted_price),
    },
    {
      icon: 'mdi:cash-multiple',
      label: 'مبلغ کل قرارداد',
      value: formatPrice(contract.total_amount),
    },
  ]

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {/* Back Button */}
        <Button
          variant="text"
          onClick={() => navigate('/contracts')}
          sx={{ mb: 3, borderRadius: 1, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
          startIcon={<Icon icon="mdi:arrow-right" />}
        >
          بازگشت به لیست قراردادها
        </Button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Paper sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                  width: 44, height: 44,
                  bgcolor: `${theme.palette.primary.main}08`,
                  borderRadius: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon icon="mdi:file-document-multiple" className="h-5 w-5" style={{ color: theme.palette.primary.main }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {venueName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    قرارداد #{contract.id}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={status.label}
                color={status.color}
                variant="outlined"
                sx={{ borderRadius: 1, fontWeight: 600 }}
              />
            </Box>
          </Paper>
        </motion.div>

        <Grid container spacing={3}>
          {/* Details */}
          <Grid size={{ xs: 12, md: 8 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
              <Paper sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  جزئیات قرارداد
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {infoItems.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Icon icon={item.icon} className="h-4 w-4" style={{ color: theme.palette.text.secondary }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {item.value}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {contract.description && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        توضیحات
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
                        {contract.description}
                      </Typography>
                    </Box>
                  </>
                )}
              </Paper>
            </motion.div>
          </Grid>

          {/* Summary */}
          <Grid size={{ xs: 12, md: 4 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
              <Paper sx={{
                borderRadius: 2,
                p: 3,
                background: 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(124,58,237,0.06))',
                border: `1px solid ${theme.palette.divider}`,
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  خلاصه مالی
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      قیمت هر جلسه
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatPrice(contract.discounted_price)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      تعداد جلسات
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {sessionsCount}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      مبلغ کل
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {formatPrice(contract.total_amount)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  )
}

export default ContractDetail