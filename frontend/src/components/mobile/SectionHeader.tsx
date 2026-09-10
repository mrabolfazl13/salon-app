import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { Icon } from '@iconify/react'

interface Props {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

/** عنوان بخش با لینک «همه» */
const SectionHeader: React.FC<Props> = ({ title, subtitle, actionLabel, onAction }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {actionLabel && (
      <Button
        onClick={onAction}
        size="small"
        sx={{
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.8rem',
          color: '#2563eb',
          flexShrink: 0,
          px: 1,
          '&:hover': { color: '#1d4ed8' },
        }}
      >
        {actionLabel}
        <Icon icon="mdi:chevron-left" style={{ width: 18, height: 18 }} />
      </Button>
    )}
  </Box>
)

export default SectionHeader
