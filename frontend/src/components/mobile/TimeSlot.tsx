import React from 'react'
import { Box, Typography, useTheme } from '@mui/material'
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
  // وضعیت خام سانس از بک‌اند (available | booked | blocked | in_competition | reserved | ...)
  status?: string
}

interface Props {
  slot: MobileSlot
  selected?: boolean
  onSelect?: (slot: MobileSlot) => void
  onBid?: (slot: MobileSlot) => void
}

// تعیین وضعیت با fallback امن — وضعیت‌های ناشناختهٔ آینده UI را نمی‌شکنند
const statusOf = (slot: MobileSlot): string => slot.status ?? (slot.available ? 'available' : 'booked')

const HINT_BY_STATUS: Record<string, string> = {
  booked: 'رزرو شده',
  blocked: 'مسدود',
  reserved: 'رزرو قرارداد',
}

/** سانس قابل‌انتخاب (موبایل) — حالت انتخاب با گرادیان کهربایی برند */
const TimeSlot: React.FC<Props> = ({ slot, selected = false, onSelect, onBid }) => {
  const dark = useTheme().palette.mode === 'dark'
  const st = statusOf(slot)
  const bidable = st === 'in_competition'
  const isReserved = st === 'reserved'
  const disabled = !(slot.available || bidable)
  const end = slot.endTime ?? (slot.duration ? getSlotEndTime(slot.startTime, slot.duration) : undefined)

  const subLabel = bidable
    ? 'در حال رقابت قیمت'
    : isReserved
      ? 'رزرو قرارداد'
      : disabled
        ? HINT_BY_STATUS[st] ?? 'نامشخص'
        : slot.duration
          ? `${(slot.duration ?? 0).toLocaleString('fa-IR')} دقیقه`
          : 'سانس آزاد'

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.15 }}
      disabled={disabled}
      onClick={() => {
        if (bidable) {
          onBid?.(slot)
        } else if (!disabled) {
          onSelect?.(slot)
        }
      }}
      aria-pressed={selected}
      title={isReserved ? 'این سانس مربوط به قرارداد است' : undefined}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        minHeight: 64,
        padding: '10px 14px',
        borderRadius: radii.button + 2,
        border: selected
          ? '1.5px solid transparent'
          : bidable
            ? `1.5px solid ${dark ? 'rgba(251,191,36,0.45)' : 'rgba(217,119,6,0.45)'}`
            : `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`,
        background: selected
          ? gradients.brandEnergy
          : bidable
            ? dark ? 'rgba(251,191,36,0.06)' : 'rgba(245,158,11,0.05)'
            : disabled
              ? dark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.03)'
              : dark ? '#121a2b' : '#ffffff',
        boxShadow: selected
          ? dark ? '0 6px 18px rgba(245,158,11,0.25)' : '0 6px 18px rgba(245,158,11,0.35)'
          : 'none',
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
            bgcolor: selected
              ? 'rgba(28,25,23,0.14)'
              : bidable
                ? dark ? 'rgba(251,191,36,0.14)' : 'rgba(245,158,11,0.12)'
                : dark ? 'rgba(96,165,250,0.12)' : 'rgba(37,99,235,0.07)',
          }}
        >
          <Icon
            icon={isReserved ? 'mdi:file-lock-outline' : bidable ? 'mdi:gavel' : disabled ? 'mdi:lock-clock' : 'mdi:clock-outline'}
            style={{
              width: 20,
              height: 20,
              color: selected
                ? '#1c1917'
                : bidable
                  ? dark ? '#fbbf24' : '#d97706'
                  : disabled
                    ? dark ? '#5b6879' : '#94a3b8'
                    : dark ? '#60a5fa' : '#2563eb',
            }}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: selected
                ? '#1c1917'
                : disabled
                  ? dark ? '#5b6879' : '#94a3b8'
                  : dark ? '#eef2f7' : '#0f172a',
              whiteSpace: 'nowrap',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatTimeFa(slot.startTime)}
            {end ? ` – ${formatTimeFa(end)}` : ''}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.7rem',
              color: selected
                ? 'rgba(28,25,23,0.75)'
                : bidable
                  ? dark ? '#fbbf24' : '#d97706'
                  : isReserved
                    ? dark ? '#a78bfa' : '#8b5cf6'
                    : dark ? '#9aa7b8' : '#64748b',
            }}
          >
            {subLabel}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        {!disabled &&
          !bidable &&
          (selected ? (
            <Price value={slot.price} size="sm" color="#1c1917" />
          ) : (
            <Price value={slot.price} size="sm" />
          ))}
        {bidable && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.25,
              py: 0.5,
              borderRadius: '999px',
              background: dark
                ? 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(249,115,22,0.2))'
                : 'linear-gradient(135deg, rgba(245,158,11,0.16), rgba(249,115,22,0.16))',
              color: dark ? '#fcd34d' : '#b45309',
              fontSize: '0.68rem',
              fontWeight: 700,
            }}
          >
            <Icon icon="mdi:gavel" style={{ width: 13, height: 13 }} />
            رقابت با بقیه
          </Box>
        )}
        {isReserved && (
          <Box
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: '999px',
              bgcolor: dark ? 'rgba(167,139,250,0.16)' : 'rgba(139,92,246,0.12)',
              color: dark ? '#c4b5fd' : '#7c3aed',
              fontSize: '0.68rem',
              fontWeight: 700,
            }}
          >
            قرارداد
          </Box>
        )}
        {selected && !bidable && (
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: 'rgba(28,25,23,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon="mdi:check" style={{ width: 16, height: 16, color: '#1c1917' }} />
          </Box>
        )}
      </Box>
    </motion.button>
  )
}

export default TimeSlot
