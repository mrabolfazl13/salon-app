import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  LinearProgress,
} from '@mui/material'

interface StatCardProps {
  title: string
  value: string | number
  icon: string
  color: string
  change?: string
  progress?: number
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  change,
  progress,
}) => {
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
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                {value}
              </Typography>
              {change && (
                <Typography
                  variant="caption"
                  sx={{
                    color: change.startsWith('+') ? 'success.main' : 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 0.5,
                  }}
                >
                  <Icon
                    icon={change.startsWith('+') ? 'mdi:trending-up' : 'mdi:trending-down'}
                    className="h-3 w-3"
                  />
                  {change}
                </Typography>
              )}
            </Box>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: `${color}15`,
                color: color,
              }}
            >
              <Icon icon={icon} className="h-6 w-6" />
            </Avatar>
          </Box>

          {progress !== undefined && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: '4px',
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                    borderRadius: '4px',
                  },
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default StatCard