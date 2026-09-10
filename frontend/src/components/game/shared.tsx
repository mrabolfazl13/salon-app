// frontend/src/components/game/shared.tsx
// اجزای مشترک بازی‌ها: چیپ‌ها، نوار ظرفیت، خطایار — سبک هم‌راستا با VenueCard

import React from 'react'
import { Box, Chip, LinearProgress, Typography } from '@mui/material'
import { Icon } from '@iconify/react'
import { isAxiosError } from 'axios'

import {
  GAME_STATUS_LABELS,
  GAME_VISIBILITY_LABELS,
  PARTICIPANT_ROLE_LABELS,
  SKILL_LEVEL_LABELS,
} from '@/types/game'
import type {
  GameStatus,
  GameVisibility,
  ParticipantRole,
  SkillLevel,
} from '@/types/game'
import { formatPersianDate } from '@/utils/helpers'

/**
 * پیام فارسی خطای بازی — بک‌اند ساختار {detail: {code, message}} برمی‌گرداند؛
 * مسیرهای قدیمی‌تر string ساده. (fallback برای خطاهای شبکه)
 */
export function getGameError(err: unknown, fallback = 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (detail && typeof detail === 'object' && typeof detail.message === 'string') return detail.message
    if (typeof detail === 'string' && detail) return detail
  }
  return fallback
}

const STATUS_COLORS: Record<GameStatus, { bg: string; fg: string; icon: string }> = {
  draft: { bg: 'rgba(100,116,139,0.10)', fg: '#64748b', icon: 'mdi:file-document-outline' },
  open: { bg: 'rgba(16,185,129,0.10)', fg: '#059669', icon: 'mdi:account-group-outline' },
  full: { bg: 'rgba(245,158,11,0.12)', fg: '#b45309', icon: 'mdi:account-multiple-outline' },
  started: { bg: 'rgba(37,99,235,0.10)', fg: '#2563eb', icon: 'mdi:play-circle-outline' },
  completed: { bg: 'rgba(124,58,237,0.10)', fg: '#7c3aed', icon: 'mdi:check-decagram' },
  cancelled: { bg: 'rgba(239,68,68,0.10)', fg: '#dc2626', icon: 'mdi:close-circle-outline' },
}

export const GameStatusChip: React.FC<{ status: GameStatus; size?: 'small' | 'medium' }> = ({
  status,
  size = 'small',
}) => {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.draft
  return (
    <Chip
      size={size}
      icon={<Icon icon={c.icon} style={{ width: 15, height: 15 }} />}
      label={GAME_STATUS_LABELS[status] ?? status}
      sx={{
        height: size === 'small' ? 26 : 32,
        borderRadius: '999px',
        fontWeight: 700,
        fontSize: '0.72rem',
        bgcolor: c.bg,
        color: c.fg,
        '& .MuiChip-icon': { color: c.fg },
      }}
    />
  )
}

export const VisibilityChip: React.FC<{ visibility: GameVisibility }> = ({ visibility }) => {
  const map: Record<GameVisibility, { icon: string; fg: string; bg: string }> = {
    public: { icon: 'mdi:web', fg: '#059669', bg: 'rgba(16,185,129,0.08)' },
    public_approval: { icon: 'mdi:shield-check-outline', fg: '#b45309', bg: 'rgba(245,158,11,0.10)' },
    private: { icon: 'mdi:lock-outline', fg: '#64748b', bg: 'rgba(100,116,139,0.10)' },
  }
  const c = map[visibility]
  return (
    <Chip
      size="small"
      icon={<Icon icon={c.icon} style={{ width: 14, height: 14 }} />}
      label={GAME_VISIBILITY_LABELS[visibility] ?? visibility}
      sx={{
        height: 24,
        borderRadius: '999px',
        fontWeight: 600,
        fontSize: '0.68rem',
        bgcolor: c.bg,
        color: c.fg,
        '& .MuiChip-icon': { color: c.fg },
        '& .MuiChip-label': { px: 1 },
      }}
    />
  )
}

export const SkillChip: React.FC<{ level: SkillLevel }> = ({ level }) => (
  <Chip
    size="small"
    label={SKILL_LEVEL_LABELS[level] ?? level}
    sx={{
      height: 24,
      borderRadius: '999px',
      fontWeight: 600,
      fontSize: '0.68rem',
      bgcolor: 'rgba(37,99,235,0.06)',
      color: '#2563eb',
      '& .MuiChip-label': { px: 1 },
    }}
  />
)

const ROLE_COLORS: Record<ParticipantRole, { fg: string; bg: string; icon: string }> = {
  organizer: { fg: '#7c3aed', bg: 'rgba(124,58,237,0.10)', icon: 'mdi:crown-outline' },
  admin: { fg: '#2563eb', bg: 'rgba(37,99,235,0.10)', icon: 'mdi:shield-account-outline' },
  member: { fg: '#64748b', bg: 'rgba(100,116,139,0.10)', icon: 'mdi:account-outline' },
}

export const RoleBadge: React.FC<{ role: ParticipantRole }> = ({ role }) => {
  const c = ROLE_COLORS[role] ?? ROLE_COLORS.member
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.9,
        py: 0.25,
        borderRadius: '999px',
        bgcolor: c.bg,
        color: c.fg,
        fontSize: '0.66rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      <Icon icon={c.icon} style={{ width: 13, height: 13 }} />
      {PARTICIPANT_ROLE_LABELS[role] ?? role}
    </Box>
  )
}

/** نوار ظرفیت — «۳/۸ نفر» + پیشرفت رنگی */
export const CapacityBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const ratio = max > 0 ? Math.min(current / max, 1) : 0
  const color = ratio >= 1 ? '#f59e0b' : '#10b981'
  return (
    <Box sx={{ minWidth: 90 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <Icon icon="mdi:account-group-outline" style={{ width: 15, height: 15, color }} />
        <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
          {`${current.toLocaleString('fa-IR')}/${max.toLocaleString('fa-IR')}`}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={ratio * 100}
        sx={{
          height: 5,
          borderRadius: 999,
          bgcolor: 'rgba(15,23,42,0.06)',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 999 },
        }}
      />
    </Box>
  )
}

/** «۱۴۰۴/۰۶/۱۹ - ۱۸:۰۰» از slot_date + start_time بک‌اند */
export function formatGameDateTime(slotDate?: string | null, startTime?: string | null): string {
  if (!slotDate) return '—'
  const d = formatPersianDate(slotDate)
  const t = startTime ? startTime.slice(0, 5) : ''
  return t ? `${d} - ${t}` : d
}
