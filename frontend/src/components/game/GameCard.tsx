// frontend/src/components/game/GameCard.tsx
// کارت بازی در صفحه کشف — موبایل‌فرست، هم‌الگو با VenueCard

import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Card, CardContent, Typography, Box, Chip } from '@mui/material'
import { Link } from 'react-router-dom'

import type { Game } from '@/types/game'
import { PAYMENT_MODE_LABELS } from '@/types/game'
import { radii, shadows } from '@/theme'
import { CapacityBar, GameStatusChip, SkillChip, VisibilityChip, formatGameDateTime } from './shared'

interface Props {
  game: Game
  /** نمایش وضعیت کاربر روی کارت (عضو/در انتظار/لیست انتظار...) */
  showMyStatus?: boolean
}

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽',
  futsal: '⚽',
  basketball: '🏀',
  volleyball: '🏐',
  tennis: '🎾',
  badminton: '🏸',
  gym: '🏋️',
  pool: '🎱',
}

const MY_STATUS_BADGE: Record<string, { label: string; fg: string; bg: string }> = {
  accepted: { label: 'عضو هستید', fg: '#059669', bg: 'rgba(16,185,129,0.12)' },
  pending: { label: 'در انتظار تأیید', fg: '#b45309', bg: 'rgba(245,158,11,0.14)' },
  invited: { label: 'دعوت‌نامه دارید', fg: '#2563eb', bg: 'rgba(37,99,235,0.10)' },
}

const GameCard: React.FC<Props> = ({ game, showMyStatus = true }) => {
  const href = `/games/${game.id}`
  const remaining = Math.max(game.max_players - game.current_players, 0)
  const myBadge = showMyStatus && game.my_participant_status
    ? MY_STATUS_BADGE[game.my_participant_status]
    : undefined

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ height: '100%' }}
    >
      <Card
        component={Link}
        to={href}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          textDecoration: 'none',
          color: 'inherit',
          borderRadius: `${radii.card}px`,
          overflow: 'hidden',
          border: '1px solid rgba(15,23,42,0.06)',
          boxShadow: shadows.card,
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
          '&:hover': {
            boxShadow: shadows.cardHover,
            borderColor: 'rgba(37,99,235,0.25)',
          },
        }}
      >
        <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.25, flex: 1 }}>
          {/* هدر: ایموجی ورزش + نام + وضعیت */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, minWidth: 0 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: `${radii.chip}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))',
              }}
            >
              {SPORT_EMOJI[game.sport] ?? '⚽'}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, fontSize: '0.98rem', lineHeight: 1.4, color: '#0f172a' }}
                noWrap
              >
                {game.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                <Icon icon="mdi:map-marker-outline" style={{ width: 15, height: 15, color: '#2563eb', flexShrink: 0 }} />
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.78rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {game.venue_name ?? '—'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flexShrink: 0 }}>
              <GameStatusChip status={game.status} />
            </Box>
          </Box>

          {/* زمان + ظرفیت */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0 }}>
              <Icon icon="mdi:clock-outline" style={{ width: 15, height: 15, color: '#64748b', flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                {formatGameDateTime(game.slot_date, game.start_time)}
              </Typography>
              {game.distance_km != null && (
                <Chip
                  size="small"
                  label={`${game.distance_km.toLocaleString('fa-IR')} کیلومتر`}
                  sx={{
                    height: 22,
                    borderRadius: '999px',
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(124,58,237,0.08)',
                    color: '#7c3aed',
                    '& .MuiChip-label': { px: 0.9 },
                  }}
                />
              )}
            </Box>
            <CapacityBar current={game.current_players} max={game.max_players} />
          </Box>

          {/* چیپ‌ها: سطح + حریم خصوصی + پرداخت */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <SkillChip level={game.skill_level} />
            <VisibilityChip visibility={game.visibility} />
            <Chip
              size="small"
              label={PAYMENT_MODE_LABELS[game.payment_mode] ?? game.payment_mode}
              sx={{
                height: 24,
                borderRadius: '999px',
                fontSize: '0.68rem',
                fontWeight: 600,
                bgcolor: 'rgba(15,23,42,0.05)',
                color: '#64748b',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          </Box>

          {/* فوتر: قیمت + جای خالی / وضعیت من */}
          <Box
            sx={{
              mt: 'auto',
              pt: 1.25,
              borderTop: '1px solid rgba(15,23,42,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              {game.payment_mode === 'free' || game.price_per_player == null ? (
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669' }}>رایگان</Typography>
              ) : (
                <Box sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography
                    component="span"
                    dir="rtl"
                    sx={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {game.price_per_player.toLocaleString('fa-IR')}
                  </Typography>
                  <Typography component="span" sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                    تومان / نفر
                  </Typography>
                </Box>
              )}
            </Box>
            {myBadge ? (
              <Box
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: '999px',
                  bgcolor: myBadge.bg,
                  color: myBadge.fg,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                {myBadge.label}
              </Box>
            ) : game.my_waitlist_position ? (
              <Box
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: '999px',
                  bgcolor: 'rgba(245,158,11,0.14)',
                  color: '#b45309',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                {`رتبه انتظار ${game.my_waitlist_position.toLocaleString('fa-IR')}`}
              </Box>
            ) : (
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: remaining > 0 ? '#059669' : '#b45309', whiteSpace: 'nowrap' }}>
                {remaining > 0 ? `${remaining.toLocaleString('fa-IR')} جای خالی` : 'تکمیل — لیست انتظار'}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default GameCard
