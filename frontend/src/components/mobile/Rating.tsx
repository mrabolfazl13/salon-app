import React from 'react'
import { Box, Typography } from '@mui/material'
import { Icon } from '@iconify/react'
import { toPersianDigits } from '@/utils/l10n'

interface Props {
  value?: number
  count?: number
  size?: 'sm' | 'md'
}

/** ⭐ 4.8 (120) — نمایش فشرده امتیاز */
const Rating: React.FC<Props> = ({ value = 0, count = 0, size = 'sm' }) => {
  const iconPx = size === 'md' ? 18 : 15
  const font = size === 'md' ? '0.95rem' : '0.82rem'
  // «4.5» با ارقام لاتین و نقطهٔ اعشار در بقیهٔ رابط فارسی ناهمگون بود.
  const valueText = value ? toPersianDigits(value.toFixed(1)).replace('.', '٫') : '—'
  const label = value
    ? `امتیاز ${valueText} از ۵${count > 0 ? `، ${toPersianDigits(count.toLocaleString('fa-IR'))} نظر` : ''}`
    : 'امتیازی ثبت نشده'
  return (
    <Box
      role="img"
      aria-label={label}
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
    >
      <Icon icon="mdi:star" style={{ color: '#f59e0b', width: iconPx, height: iconPx }} />
      <Typography component="span" sx={{ fontWeight: 700, fontSize: font, color: 'text.primary' }}>
        {valueText}
      </Typography>
      {count > 0 && (
        <Typography component="span" sx={{ fontSize: font, color: 'text.secondary' }}>
          ({count.toLocaleString('fa-IR')})
        </Typography>
      )}
    </Box>
  )
}

export default Rating
