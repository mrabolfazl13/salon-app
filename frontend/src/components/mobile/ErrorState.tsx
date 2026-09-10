import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'

interface Props {
  title?: string
  description?: string
  onRetry?: () => void
}

/** حالت خطا — «مشکلی پیش آمد / تلاش مجدد» */
const ErrorState: React.FC<Props> = ({
  title = 'مشکلی پیش آمد',
  description = 'لطفاً دوباره تلاش کنید.',
  onRetry,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    style={{ textAlign: 'center', padding: '40px 24px' }}
  >
    <Box
      sx={{
        width: 84,
        height: 84,
        borderRadius: '50%',
        mx: 'auto',
        mb: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(239,68,68,0.08)',
      }}
    >
      <Icon icon="mdi:alert-circle-outline" style={{ width: 40, height: 40, color: '#ef4444' }} />
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', mb: 0.75 }}>{title}</Typography>
    <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>{description}</Typography>
    {onRetry && (
      <Button
        variant="outlined"
        onClick={onRetry}
        startIcon={<Icon icon="mdi:refresh" style={{ width: 18, height: 18 }} />}
        sx={{
          mt: 3,
          textTransform: 'none',
          fontWeight: 700,
          px: 4,
          py: 1.25,
          borderRadius: '14px',
          borderColor: 'rgba(37,99,235,0.4)',
          color: '#2563eb',
          '&:hover': { borderColor: '#2563eb', bgcolor: 'rgba(37,99,235,0.05)' },
        }}
      >
        تلاش مجدد
      </Button>
    )}
  </motion.div>
)

export default ErrorState
