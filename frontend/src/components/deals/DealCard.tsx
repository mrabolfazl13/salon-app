// frontend/src/components/deals/DealCard.tsx
// کارت سانس لحظه آخری — قیمت اصلی خط‌خورده + قیمت دیل + نشان صرفه‌جویی + شمارش معکوس.

import React from 'react'
import { Box, Button, Card, Chip, Typography } from '@mui/material'
import { Icon } from '@iconify/react'
import { formatJalaliDate, toPersianDigits } from '@/lib/jalali'
import { formatRial } from '@/components/finance/shared'
import { formatTimeFa, getSlotEndTime } from '@/lib/utils'
import { parseUtcAware } from '@/components/pricing/shared'
import type { DealAvailableItem } from '@/services/deals'
import DealCountdown from './DealCountdown'

interface Props {
  deal: DealAvailableItem
  onBook: (deal: DealAvailableItem) => void
}

const isExpired = (d: DealAvailableItem): boolean =>
  d.deal_expires_at != null && parseUtcAware(d.deal_expires_at) <= Date.now()

/** نمایش «امروز / فردا / فلان‌روز» کنار تاریخ جلالی */
const dayHint = (slotDate: string): string => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${slotDate}T00:00:00`)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diffDays === 0) return 'امروز'
  if (diffDays === 1) return 'فردا'
  return ''
}

const DealCard: React.FC<Props> = ({ deal, onBook }) => {
  const expired = isExpired(deal)
  const end = getSlotEndTime(deal.start_time.slice(0, 5), deal.duration || 90)
  const hint = dayHint(deal.slot_date)

  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: expired ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(245,158,11,0.35)',
        background: expired ? 'rgba(0,0,0,0.02)' : 'linear-gradient(135deg, rgba(255,251,235,0.9), rgba(254,243,199,0.55))',
        overflow: 'hidden',
        position: 'relative',
        opacity: expired ? 0.65 : 1,
        transition: 'all 0.25s ease',
        '&:hover': expired ? undefined : { transform: 'translateY(-3px)', boxShadow: '0 12px 32px rgba(245,158,11,0.18)' },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          insetInlineStart: 0,
          px: 1.5,
          py: 0.5,
          borderBottomRightRadius: '14px',
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Icon icon="mdi:fire" style={{ width: 13, height: 13 }} />
        تا ‪{toPersianDigits(deal.discount_percent)}٪‬ تخفیف
      </Box>

      <Box sx={{ p: 2.5, pt: 4.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, minWidth: 0 }} noWrap>
            {deal.venue_name}
          </Typography>
          {deal.distance_km != null && (
            <Chip
              size="small"
              icon={<Icon icon="mdi:crosshairs-gps" style={{ width: 14, height: 14 }} />}
              label={`${toPersianDigits(Math.round(deal.distance_km * 10) / 10)} کیلومتر`}
              sx={{ borderRadius: '8px', fontSize: '0.75rem', bgcolor: 'rgba(37,99,235,0.08)', color: '#2563eb', fontWeight: 700 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Icon icon="mdi:calendar-blank-outline" style={{ width: 15, height: 15, color: '#64748b' }} />
            <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
              {formatJalaliDate(deal.slot_date, { format: 'long' })}
              {hint ? ` (${hint})` : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Icon icon="mdi:clock-outline" style={{ width: 15, height: 15, color: '#64748b' }} />
            <Typography variant="body2" dir="rtl" sx={{ color: '#334155', fontWeight: 600 }}>
              {formatTimeFa(deal.start_time)} – {end}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#059669' }}>
              {formatRial(deal.deal_price)}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', textDecoration: 'line-through' }}>
              {formatRial(deal.original_price)}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`${toPersianDigits(deal.savings)} ریال سود شما`}
            sx={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, bgcolor: 'rgba(5,150,105,0.12)', color: '#059669' }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <DealCountdown expiresAt={deal.deal_expires_at} compact />
          <Button
            variant="contained"
            disabled={expired}
            onClick={() => onBook(deal)}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 800,
              px: 2.5,
              background: expired ? 'rgba(0,0,0,0.12)' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
              boxShadow: expired ? 'none' : '0 4px 14px rgba(239,68,68,0.3)',
              '&:hover': expired ? undefined : { background: 'linear-gradient(135deg, #d97706, #dc2626)' },
            }}
            startIcon={<Icon icon="mdi:lightning-bolt" className="h-4 w-4" />}
          >
            رزرو
          </Button>
        </Box>
      </Box>
    </Card>
  )
}

export default DealCard