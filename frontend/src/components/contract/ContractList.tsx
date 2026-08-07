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
} from '@mui/material'
import { formatPrice, formatDate } from '@/lib/utils'

interface Contract {
  id: number
  venue: string
  startDate: string
  endDate: string
  sessionsCount: number
  pricePerSession: number
  totalAmount: number
  status: 'active' | 'expired' | 'cancelled'
}

interface ContractListProps {
  contracts: Contract[]
  onView?: (id: number) => void
}

const ContractList: React.FC<ContractListProps> = ({ contracts, onView }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'expired':
        return 'default'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'فعال'
      case 'expired':
        return 'منقضی'
      case 'cancelled':
        return 'لغو شده'
      default:
        return status
    }
  }

  return (
    <Grid container spacing={3}>
      {contracts.map((contract, index) => (
        <Grid item xs={12} key={contract.id}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
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
                      <Icon icon="mdi:file-document" className="h-6 w-6 text-white" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {contract.venue}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Chip
                    label={getStatusLabel(contract.status)}
                    color={getStatusColor(contract.status) as any}
                    size="small"
                    sx={{ borderRadius: '8px' }}
                  />
                </Box>

                <Box
                  display="grid"
                  gridTemplateColumns={{ xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }}
                  gap={2}
                  sx={{ mt: 2 }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      تعداد جلسات
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {contract.sessionsCount} جلسه
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      قیمت هر جلسه
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatPrice(contract.pricePerSession)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      مبلغ کل
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {formatPrice(contract.totalAmount)}
                    </Typography>
                  </Box>
                  <Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onView?.(contract.id)}
                      sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                      }}
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
      ))}
    </Grid>
  )
}

export default ContractList