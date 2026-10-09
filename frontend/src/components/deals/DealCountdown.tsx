// frontend/src/components/deals/DealCountdown.tsx
// شمارش معکوس زنده «تا پایان تخفیف» — رشته UTC بک‌اند (گاهی بی‌timezone) را
// آگاهانه UTC فرض می‌کند و هر ثانیه تیک می‌خورد.

import React, { useEffect, useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { Icon } from '@iconify/react'
import { toPersianDigits } from '@/lib/jalali'

function toExpiresTime(expiresAt: string): number {
  let s = expiresAt
  if (!/[zZ]$/.test(s) && !/[+-]\d{2}:?\d{2}$/.test(s)) s += 'Z'
  const t = new Date(s).getTime()
  return Number.isNaN(t) ? 0 : t
}

const fmt = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return toPersianDigits(h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`)
}

const DealCountdown: React.FC<{ expiresAt: string | null; compact?: boolean }> = ({ expiresAt, compact = false }) => {
  const deadline = useMemo(() => (expiresAt ? toExpiresTime(expiresAt) : null), [expiresAt])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!deadline) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [deadline])

  if (!deadline) {
    return (
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <Icon icon="mdi:infinity" style={{ width: 14, height: 14 }} />
        تخفیف تا شروع سانس معتبر است
      </Typography>
    )
  }
  const diff = deadline - now
  if (diff <= 0) {
    return (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: '8px', bgcolor: 'rgba(239,68,68,0.1)', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700 }}>
        <Icon icon="mdi:timer-off-outline" style={{ width: 14, height: 14 }} />
        تخفیف منقضی شده
      </Box>
    )
  }
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: compact ? 0.75 : 1.25,
        py: 0.4,
        borderRadius: '999px',
        bgcolor: diff < 15 * 60 * 1000 ? 'rgba(220,38,38,0.1)' : 'rgba(245,158,11,0.12)',
        color: diff < 15 * 60 * 1000 ? '#dc2626' : '#d97706',
        fontSize: '0.75rem',
        fontWeight: 800,
      }}
    >
      <Icon icon="mdi:timer-sand" style={{ width: 14, height: 14 }} />
      تا پایان تخفیف
      <Typography component="span" dir="ltr" sx={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fmt(diff)}</Typography>
    </Box>
  )
}

export default DealCountdown