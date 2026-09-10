import React from 'react'
import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { formatTimeFa, getSlotEndTime } from '@/lib/utils'
import { gradients, radii } from '@/theme'
import Price from './Price'

export interface MobileSlot {
  id: number | string
  startTime: string
  endTime?: string
  price: number
  available: boolean
  duration?: number
}

interface Props {
  slot: MobileSlot
  selected?: boolean
  onSelect?: (slot: MobileSlot) => void
}

/** سانس قابل‌انتخاب (موبایل) — ردیت کارت با گرادیان در حالت انتخاب */
const TimeSlot: React.FC<Props> = ({ slot, selected = false, onSelect }) => {
  const disabled = !slot.available
  const end = slot.endTime ?? (slot.duration ? getSlotEndTime(slot.startTime, slot.duration) : undefined)

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.15 }}
      disabled={disabled}
      onClick={() => !disabled && onSelect?.(slot)}
      aria-pressed={selected}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        minHeight: 64,
        padding: '10px 14px',
        borderRadius: radii.button + 2,
        border: selected ? '1.5px solid transparent' : '1px solid rgba(15,23,42,0.08)',
        background: selected ? gradients.primary : disabled ? 'rgba(15,23,42,0.03)' : '#ffffff',
        boxShadow: selected ? '0 6px 18px rgba(37,99,235,0.28)' : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        textAlign: 'start',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            bgcolor: selected ? 'rgba(255,255,255,0.18)' : 'rgba(37,99,235,0.07)',
          }}
        >
          <Icon
            icon={disabled ? 'mdi:lock-clock' : 'mdi:clock-outline'}
            style={{ width: 20, height: 20, color: selected ? '#fff' : disabled ? '#94a3b8' : '#2563eb' }}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: selected ? '#fff' : disabled ? '#94a3b8' : '#0f172a',
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatTimeFa(slot.startTime)}
            {end ? ` – ${formatTimeFa(end)}` : ''}
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: selected ? 'rgba(255,255,255,0.8)' : '#64748b' }}>
            {disabled
              ? 'رزرو شده'
              : slot.duration
                ? `${slot.duration.toLocaleString('fa-IR')} دقیقه`
                : 'سانس آزاد'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        {!disabled &&
          (selected ? (
            <Price value={slot.price} size="sm" color="#ffffff" />
          ) : (
            <Price value={slot.price} size="sm" />
          ))}
        {selected && (
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon="mdi:check" style={{ width: 16, height: 16, color: '#fff' }} />
          </Box>
        )}
      </Box>
    </motion.button>
  )
}

export default TimeSlot
