import React from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { radii } from '@/theme'

export interface Sport {
  key: string
  /** آیکون SVG (mdi) — جایگزین ایموجی در چیپ‌ها */
  icon: string
  /** @deprecated فقط برای منوهای متنی قدیمی نگه داشته شده */
  emoji: string
  label: string
  /** فیلتر اعمال‌شده روی venueService */
  category?: 'futsal' | 'gym'
  query?: string
}

export const SPORTS: Sport[] = [
  { key: 'futsal', icon: 'mdi:soccer', emoji: '⚽', label: 'فوتسال', category: 'futsal' },
  { key: 'football', icon: 'mdi:soccer-field', emoji: '🥅', label: 'فوتبال', category: 'futsal', query: 'فوتبال' },
  { key: 'basketball', icon: 'mdi:basketball', emoji: '🏀', label: 'بسکتبال', category: 'futsal', query: 'بسکتبال' },
  { key: 'volleyball', icon: 'mdi:volleyball', emoji: '🏐', label: 'والیبال', category: 'futsal', query: 'والیبال' },
  { key: 'tennis', icon: 'mdi:tennis', emoji: '🎾', label: 'تنیس', category: 'futsal', query: 'تنیس' },
  { key: 'badminton', icon: 'mdi:badminton', emoji: '🏸', label: 'بدمینتون', category: 'futsal', query: 'بدمینتون' },
  { key: 'gym', icon: 'mdi:dumbbell', emoji: '🏋️', label: 'بدنسازی', category: 'gym' },
  { key: 'pool', icon: 'mdi:billiards', emoji: '🎱', label: 'بیلیارد', category: 'futsal', query: 'بیلیارد' },
]

interface Props {
  sport: Sport
  active?: boolean
  onClick?: (sport: Sport) => void
}

/** چیپ ورزش — اسکرول افقی در Home */
const SportChip: React.FC<Props> = ({ sport, active = false, onClick }) => {
  const dark = useTheme().palette.mode === 'dark'
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onClick={() => onClick?.(sport)}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minWidth: 76,
        height: 76,
        padding: '8px 12px',
        borderRadius: radii.card,
        border: active
          ? '1.5px solid transparent'
          : `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)'}`,
        background: active
          ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 55%, #f97316 100%)'
          : dark ? '#121a2b' : '#ffffff',
        boxShadow: active
          ? dark ? '0 6px 18px rgba(245,158,11,0.25)' : '0 6px 18px rgba(245,158,11,0.35)'
          : dark ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(15,23,42,0.05)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        flexShrink: 0,
      }}
      aria-pressed={active}
    >
      <Icon
        icon={sport.icon}
        style={{
          width: 26,
          height: 26,
          color: active ? '#1c1917' : dark ? '#fbbf24' : '#d97706',
        }}
      />
      <Typography
        component="span"
        sx={{
          fontSize: '0.75rem',
          fontWeight: active ? 800 : 600,
          color: active ? '#1c1917' : dark ? '#bcc7d4' : '#334155',
          whiteSpace: 'nowrap',
        }}
      >
        {sport.label}
      </Typography>
    </motion.button>
  )
}

/** ردیف اسکرول افقی چیپ‌ها */
export const SportChipRow: React.FC<{
  activeKey?: string | null
  onSelect: (sport: Sport) => void
}> = ({ activeKey, onSelect }) => (
  <Box
    sx={{
      display: 'flex',
      gap: 1.5,
      overflowX: 'auto',
      pb: 1,
      px: 0.25,
      WebkitOverflowScrolling: 'touch',
    }}
    className="scrollbar-hide"
  >
    {SPORTS.map((s) => (
      <SportChip key={s.key} sport={s} active={activeKey === s.key} onClick={onSelect} />
    ))}
  </Box>
)

export default SportChip
