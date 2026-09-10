import React, { useMemo } from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'

export interface DateOption {
  iso: string // YYYY-MM-DD
  weekday: string // شنبه
  day: string // ۱۲
  month: string // شهریور
  isToday: boolean
}

interface Props {
  dates: DateOption[]
  value: string
  onChange: (iso: string) => void
}

/** انتخاب تاریخ — اسکرول افقی با فلش‌های قبلی/بعدی (جهت‌دار برای RTL) */
const DateSelector: React.FC<Props> = ({ dates, value, onChange }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const currentIndex = useMemo(() => Math.max(0, dates.findIndex((d) => d.iso === value)), [dates, value])

  const scrollBy = (dir: -1 | 1) => {
    const next = Math.min(dates.length - 1, Math.max(0, currentIndex + dir))
    onChange(dates[next].iso)
    scrollRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <IconButton
        onClick={() => scrollBy(-1)}
        disabled={currentIndex <= 0}
        aria-label="تاریخ قبل"
        sx={{ width: 40, height: 40, flexShrink: 0, color: '#2563eb', bgcolor: 'background.paper', border: '1px solid rgba(15,23,42,0.07)' }}
      >
        <Icon icon="mdi:chevron-right" style={{ width: 22, height: 22 }} />
      </IconButton>

      <Box
        ref={scrollRef}
        className="scrollbar-hide"
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          flex: 1,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          py: 0.5,
        }}
      >
        {dates.map((d) => {
          const active = d.iso === value
          return (
            <motion.button
              key={d.iso}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={() => onChange(d.iso)}
              style={{
                scrollSnapAlign: 'center',
                flexShrink: 0,
                minWidth: 62,
                padding: '10px 8px',
                borderRadius: 16,
                cursor: 'pointer',
                fontFamily: 'inherit',
                border: active ? 'none' : '1px solid rgba(15,23,42,0.07)',
                background: active ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' : '#ffffff',
                boxShadow: active ? '0 6px 18px rgba(37,99,235,0.28)' : 'none',
                color: active ? '#fff' : '#0f172a',
              }}
              aria-pressed={active}
            >
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, opacity: active ? 0.9 : 0.6 }}>
                {d.isToday ? 'امروز' : d.weekday}
              </Typography>
              <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.3 }}>{d.day}</Typography>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 500, opacity: active ? 0.9 : 0.55 }}>
                {d.month}
              </Typography>
            </motion.button>
          )
        })}
      </Box>

      <IconButton
        onClick={() => scrollBy(1)}
        disabled={currentIndex >= dates.length - 1}
        aria-label="تاریخ بعد"
        sx={{ width: 40, height: 40, flexShrink: 0, color: '#2563eb', bgcolor: 'background.paper', border: '1px solid rgba(15,23,42,0.07)' }}
      >
        <Icon icon="mdi:chevron-left" style={{ width: 22, height: 22 }} />
      </IconButton>
    </Box>
  )
}

/** ساخت لیست تاریخ برای n روز آینده */
export const buildDateOptions = (days = 14, startDate = new Date()): DateOption[] =>
  Array.from({ length: days }).map((_, i) => {
    const dt = new Date(startDate)
    dt.setDate(startDate.getDate() + i)
    const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    return {
      iso,
      weekday: dt.toLocaleDateString('fa-IR', { weekday: 'long' }),
      day: dt.toLocaleDateString('fa-IR', { day: 'numeric' }),
      month: dt.toLocaleDateString('fa-IR', { month: 'long' }),
      isToday: i === 0,
    }
  })

export default DateSelector
