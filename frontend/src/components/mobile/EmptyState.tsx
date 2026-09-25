import React from 'react'
import { Box, Typography, Button, useTheme } from '@mui/material'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { gradients } from '@/theme'

interface Props {
  icon?: string
  /** @deprecated به‌جای ایموجی از آیکون SVG (mdi) استفاده کنید */
  emoji?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

/** حالت خالی استاندارد — مثل «هنوز سالنی ذخیره نکرده‌اید» */
const EmptyState: React.FC<Props> = ({ icon, title, description, actionLabel, onAction }) => {
  const dark = useTheme().palette.mode === 'dark'
  return (
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
          background: dark
            ? 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(96,165,250,0.1))'
            : gradients.primarySoft,
        }}
      >
        <Icon
          icon={icon || 'mdi:inbox-outline'}
          style={{ width: 40, height: 40, color: dark ? '#fbbf24' : '#d97706' }}
        />
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'text.primary', mb: 0.75 }}>{title}</Typography>
      {description && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', lineHeight: 1.8, maxWidth: 300, mx: 'auto' }}>
          {description}
        </Typography>
      )}
      {actionLabel && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            mt: 3,
            textTransform: 'none',
            fontWeight: 700,
            px: 4,
            py: 1.25,
            borderRadius: '14px',
            background: gradients.primary,
            boxShadow: dark ? '0 6px 20px rgba(29,78,216,0.35)' : '0 6px 20px rgba(30,58,138,0.28)',
            '&:hover': { background: gradients.primaryHover },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}

export default EmptyState
