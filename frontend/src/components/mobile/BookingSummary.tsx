import React from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import { shadows, shadowsDark } from '@/theme'
import Price from './Price'
import PrimaryButton from './PrimaryButton'

interface Props {
  price?: number | null
  /** متن کمکی زیر قیمت — مثلاً «امروز • ۱۸:۰۰» */
  subtitle?: string
  ctaLabel?: string
  disabled?: boolean
  loading?: boolean
  onAction?: () => void
}

/**
 * خلاصه رزرو — نوار CTA چسبان پایین صفحه جزئیات سالن.
 * بالای BottomNavigation (ارتفاع ۶۲) قرار می‌گیرد و safe-area را رعایت می‌کند.
 */
const BookingSummary: React.FC<Props> = ({
  price,
  subtitle,
  ctaLabel = 'رزرو سانس',
  disabled = false,
  loading = false,
  onAction,
}) => {
  const dark = useTheme().palette.mode === 'dark'
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 'calc(62px + env(safe-area-inset-bottom))',
        insetInline: 0,
        zIndex: 55,
        display: { xs: 'block', md: 'none' },
        bgcolor: dark ? 'rgba(11,18,32,0.96)' : 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid',
        borderColor: 'divider',
        boxShadow: dark ? shadowsDark.nav : shadows.nav,
        px: 2,
        py: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, maxWidth: 560, mx: 'auto' }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          {price != null ? (
            <Price value={price} size="lg" />
          ) : (
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontWeight: 600 }}>
              سانسی انتخاب نشده
            </Typography>
          )}
          {subtitle && (
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }} noWrap>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ flexShrink: 0, width: { xs: 144, sm: 160 } }}>
          <PrimaryButton
            disabled={disabled || loading}
            loading={loading}
            onClick={onAction}
            fullWidth
            sx={{ minHeight: 48, whiteSpace: 'nowrap' }}
          >
            {ctaLabel}
          </PrimaryButton>
        </Box>
      </Box>
    </Box>
  )
}

export default BookingSummary
