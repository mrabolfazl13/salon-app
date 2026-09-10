import React from 'react'
import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { radii } from '@/theme'

export interface Sport {
  key: string
  emoji: string
  label: string
  /** فیلتر اعمال‌شده روی venueService */
  category?: 'futsal' | 'gym'
  query?: string
}

export const SPORTS: Sport[] = [
  { key: 'futsal', emoji: '⚽', label: 'فوتسال', category: 'futsal' },
  { key: 'football', emoji: '🥅', label: 'فوتبال', category: 'futsal', query: 'فوتبال' },
  { key: 'basketball', emoji: '🏀', label: 'بسکتبال', category: 'futsal', query: 'بسکتبال' },
  { key: 'volleyball', emoji: '🏐', label: 'والیبال', category: 'futsal', query: 'والیبال' },
  { key: 'tennis', emoji: '🎾', label: 'تنیس', category: 'futsal', query: 'تنیس' },
  { key: 'badminton', emoji: '🏸', label: 'بدمینتون', category: 'futsal', query: 'بدمینتون' },
  { key: 'gym', emoji: '🏋️', label: 'بدنسازی', category: 'gym' },
  { key: 'pool', emoji: '🎱', label: 'بیلیارد', category: 'futsal', query: 'بیلیارد' },
]

interface Props {
  sport: Sport
  active?: boolean
  onClick?: (sport: Sport) => void
}

/** چیپ ورزش — اسکرول افقی در Home */
const SportChip: React.FC<Props> = ({ sport, active = false, onClick }) => {
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
        gap: 4,
        minWidth: 76,
        height: 76,
        padding: '8px 12px',
        borderRadius: radii.card,
        border: active ? '1.5px solid transparent' : '1px solid rgba(15,23,42,0.07)',
        background: active ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' : '#ffffff',
        boxShadow: active ? '0 6px 18px rgba(37,99,235,0.28)' : '0 1px 3px rgba(15,23,42,0.05)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        flexShrink: 0,
      }}
      aria-pressed={active}
    >
      <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{sport.emoji}</span>
      <Typography
        component="span"
        sx={{
          fontSize: '0.72rem',
          fontWeight: 600,
          color: active ? '#fff' : '#334155',
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
