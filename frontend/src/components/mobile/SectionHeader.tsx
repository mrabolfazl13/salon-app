import React from 'react'
import { Box, Typography, Button, useTheme } from '@mui/material'
import { Icon } from '@iconify/react'

interface Props {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  /** سطح سرتیتر; صفحاتی که SectionHeader عنوان اصلی خودشان است «h1» می‌دهند */
  heading?: 'h1' | 'h2'
}

/** عنوان بخش با لینک «همه» — خط تأکید کهربایی برای هویت اسپرت */
const SectionHeader: React.FC<Props> = ({ title, subtitle, actionLabel, onAction, heading = 'h2' }) => {
  const dark = useTheme().palette.mode === 'dark'
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 4,
              height: 20,
              borderRadius: 2,
              flexShrink: 0,
              background: 'linear-gradient(180deg, #fbbf24, #f97316)',
            }}
          />
          <Typography component={heading} variant="subtitle1" sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'text.primary' }}>
            {title}
          </Typography>
        </Box>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary', ps: 1.75, display: 'block' }}>
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
            color: dark ? '#fbbf24' : '#b45309',
            flexShrink: 0,
            px: 1,
            '&:hover': { color: dark ? '#fcd34d' : '#92400e', bgcolor: dark ? 'rgba(251,191,36,0.08)' : 'rgba(245,158,11,0.07)' },
          }}
        >
          {actionLabel}
          <Icon icon="mdi:chevron-left" style={{ width: 18, height: 18 }} />
        </Button>
      )}
    </Box>
  )
}

export default SectionHeader
