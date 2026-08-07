import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  LinearProgress,
  Avatar,
} from '@mui/material'
import { formatPrice, formatDate } from '@/lib/utils'

interface CompetitionCardProps {
  competition: {
    id: number
    venue: string
    date: string
    time: string
    currentPrice: number
    bestPrice: number
    bidsCount: number
    timeLeft: string
    status: 'active' | 'ended'
  }
  onBid?: (id: number) => void
}

const CompetitionCard: React.FC<CompetitionCardProps> = ({ competition, onBid }) => {
  const progress = (competition.bidsCount / 10) * 100

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
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
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {competition.venue}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                <Icon icon="mdi:calendar" className="h-4 w-4 text-muted-foreground" />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(competition.date)} - {competition.time}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={competition.status === 'active' ? 'فعال' : 'پایان یافته'}
              color={competition.status === 'active' ? 'success' : 'default'}
              size="small"
              sx={{ borderRadius: '8px' }}
            />
          </Box>

          <Box display="flex" gap={4} sx={{ my: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                قیمت فعلی
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary">
                {formatPrice(competition.currentPrice)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                بهترین پیشنهاد
              </Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">
                {formatPrice(competition.bestPrice)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                زمان باقی‌مانده
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {competition.timeLeft}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                پیشنهادات: {competition.bidsCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: '4px',
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                  borderRadius: '4px',
                },
              }}
            />
          </Box>

          <Button
            variant="contained"
            fullWidth
            disabled={competition.status !== 'active'}
            onClick={() => onBid?.(competition.id)}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            }}
          >
            <Icon icon="mdi:gavel" className="h-4 w-4 ml-2" />
            شرکت در رقابت
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default CompetitionCard