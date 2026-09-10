import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { gradients } from '@/theme'

interface Props {
  icon?: string
  emoji?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

/** حالت خالی استاندارد — مثل «هنوز سالنی ذخیره نکرده‌اید» */
const EmptyState: React.FC<Props> = ({ icon, emoji, title, description, actionLabel, onAction }) => (
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
        background: gradients.primarySoft,
      }}
    >
      {emoji ? (
        <span style={{ fontSize: '2.2rem' }}>{emoji}</span>
      ) : (
        <Icon icon={icon || 'mdi:inbox-outline'} style={{ width: 40, height: 40, color: '#2563eb' }} />
      )}
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', mb: 0.75 }}>{title}</Typography>
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
          boxShadow: '0 6px 20px rgba(37,99,235,0.3)',
          '&:hover': { background: gradients.primaryHover },
        }}
      >
        {actionLabel}
      </Button>
    )}
  </motion.div>
)

export default EmptyState
