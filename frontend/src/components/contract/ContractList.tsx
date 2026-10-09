// frontend/src/components/contract/ContractList.tsx
// کارت‌های لیست قرارداد کاربر — چیپ وضعیت از نگارخانه مرکزی، بنر «در انتظار تأیید مدیر»
// و نمایش دلیل رد/لغو. ورودی مستقیماً ContractData بک‌اند است.

import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Button,
  Avatar,
  Alert,
} from '@mui/material'
import { formatDate } from '@/lib/utils'
import {
  contractStatusMeta,
  faNum,
  formatRial,
  paymentStatusMeta,
  pyDayNames,
  RECURRENCE_LABELS,
} from '@/components/contract/shared'
import type { ContractData } from '@/services/contract'

interface ContractListProps {
  contracts: ContractData[]
  venueNames: Record<number, string>
  onView?: (id: number) => void
}

const ContractList: React.FC<ContractListProps> = ({ contracts, venueNames, onView }) => {
  return (
    <Grid container spacing={3}>
      {contracts.map((contract, index) => {
        const meta = contractStatusMeta(contract.status)
        const payMeta = paymentStatusMeta(contract.payment_status)
        return (
          <Grid size={{ xs: 12 }} key={contract.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card
                sx={{
                  borderRadius: '16px',
                  transition: 'all 0.3s',
                  '&:hover': { boxShadow: '0 8px 40px rgba(0,0,0,0.08)' },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: contract.status === 'pending'
                            ? 'warning.main'
                            : contract.status === 'rejected'
                              ? 'error.main'
                              : 'primary.main',
                        }}
                      >
                        <Icon
                          icon={contract.status === 'pending' ? 'mdi:hourglass-top' : 'mdi:file-document'}
                          style={{ width: 24, height: 24, color: 'white' }}
                        />
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }} variant="subtitle1">
                          {venueNames[contract.venue_id] || `سالن #${faNum(contract.venue_id)}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {`${formatDate(contract.start_date)} - ${formatDate(contract.end_date)} | `}
                          {`${(contract.days && contract.days.length ? contract.days : [contract.day_of_week]).map((d) => pyDayNames[d] ?? '—').join('، ')} ${(contract.start_time || '').slice(0, 5)} | `}
                          {RECURRENCE_LABELS[contract.recurrence] || contract.recurrence}
                        </Typography>
                      {(contract.days?.length ?? 0) > 1 && (
                        <Box sx={{ display: 'flex', gap: 0.4, mt: 0.75, flexWrap: 'wrap' }}>
                          {contract.days!.map((d) => (
                            <Chip
                              key={d}
                              label={pyDayNames[d] ?? `روز ${d}`}
                              size="small"
                              sx={{ height: 18, fontSize: '0.75rem', fontWeight: 700, borderRadius: '6px', bgcolor: 'rgba(37,99,235,0.08)', color: '#2563eb' }}
                            />
                          ))}
                        </Box>
                      )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      {contract.status === 'pending' && (
                        <Chip
                          icon={<Icon icon="mdi:account-clock-outline" />}
                          label="در انتظار تأیید مدیر"
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ borderRadius: '8px', fontWeight: 600 }}
                        />
                      )}
                      <Chip
                        label={meta.label}
                        size="small"
                        sx={{
                          borderRadius: '8px',
                          fontWeight: 700,
                          bgcolor: `${meta.color}18`,
                          color: meta.color,
                        }}
                      />
                    </Box>
                  </Box>

                  {contract.status === 'rejected' && contract.reject_reason && (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: '12px', fontSize: '0.8rem' }}>
                      {`دلیل رد درخواست: ${contract.reject_reason}`}
                    </Alert>
                  )}
                  {contract.status === 'cancelled' && contract.cancel_reason && (
                    <Alert severity="warning" sx={{ mt: 2, borderRadius: '12px', fontSize: '0.8rem' }}>
                      {`دلیل لغو: ${contract.cancel_reason}`}
                    </Alert>
                  )}

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">قیمت هر جلسه</Typography>
                      <Typography sx={{ fontWeight: 600 }} variant="body2">
                        {formatRial(contract.discounted_price)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">مبلغ کل</Typography>
                      <Typography sx={{ fontWeight: 600 }} variant="body2" color="primary">
                        {formatRial(contract.total_amount)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">وضعیت پرداخت</Typography>
                      <Chip
                        label={payMeta.label}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '8px',
                          bgcolor: `${payMeta.color}18`,
                          color: payMeta.color,
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onView?.(contract.id)}
                        sx={{ borderRadius: '8px', textTransform: 'none' }}
                      >
                        مشاهده جزئیات
                        <Icon icon="mdi:arrow-left" className="h-4 w-4 mr-1" />
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        )
      })}
    </Grid>
  )
}

export default ContractList