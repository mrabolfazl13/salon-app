import React from 'react'
import { Box, Typography } from '@mui/material'
import { formatPrice } from '@/lib/utils'

interface Props {
  value: number
  from?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const sizes = {
  sm: { main: '0.85rem', label: '0.68rem' },
  md: { main: '1.05rem', label: '0.72rem' },
  lg: { main: '1.35rem', label: '0.78rem' },
} as const

/** قیمت برجسته و خوانا — «از: ۳۸۰٬۰۰۰ تومان» */
const Price: React.FC<Props> = ({ value, from = false, size = 'md', color = '#0f172a' }) => {
  const s = sizes[size]
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5, flexWrap: 'wrap' }}>
      {from && (
        <Typography component="span" sx={{ fontSize: s.label, color: 'text.secondary' }}>
          از:
        </Typography>
      )}
      <Typography
        component="span"
        dir="rtl"
        sx={{ fontSize: s.main, fontWeight: 800, color, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}
      >
        {formatPrice(value)}
      </Typography>
    </Box>
  )
}

export default Price
