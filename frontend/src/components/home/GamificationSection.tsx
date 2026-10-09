import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import SectionHeader from '@/components/mobile/SectionHeader'
import { gradients, radii, shadows } from '@/theme'

interface LeaderboardPlayerProps {
  rank: number
  name: string
  avatar: string
  points: number
  gamesPlayed: number
  delay?: number
}

const LeaderboardPlayer: React.FC<LeaderboardPlayerProps> = ({ rank, name, avatar, points, gamesPlayed, delay = 0 }) => {
  const getRankStyle = (r: number) => {
    if (r === 1) return { bg: '#fbbf24', color: '#1c1917', icon: 'mdi:crown' }
    if (r === 2) return { bg: '#64748b', color: '#1c1917', icon: 'mdi:medal' }
    if (r === 3) return { bg: '#cd7f32', color: '#fff', icon: 'mdi:award-star' }
    return { bg: 'rgba(255,255,255,0.1)', color: '#fff', icon: null }
  }

  const style = getRankStyle(rank)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          borderRadius: '12px',
          bgcolor: rank <= 3 ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: rank <= 3 ? '1px solid rgba(255,255,255,0.15)' : 'none',
          mb: 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.12)',
          },
        }}
      >
        {/* رتبه */}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: style.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '0.9rem',
            color: style.color,
            position: 'relative',
          }}
        >
          {style.icon && (
            <Icon
              icon={style.icon}
              style={{
                width: rank === 1 ? 20 : 18,
                height: rank === 1 ? 20 : 18,
                position: 'absolute',
                top: -8,
                right: -8,
              }}
            />
          )}
          {rank}
        </Box>

        {/* آواتار و نام */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {avatar}
            </Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.88rem',
                color: '#fff',
              }}
              noWrap
            >
              {name}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.6)',
              mt: 0.25,
            }}
          >
            {gamesPlayed} بازی
          </Typography>
        </Box>

        {/* امتیاز */}
        <Box
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: '8px',
            bgcolor: 'rgba(251,191,36,0.15)',
            color: '#fbbf24',
            fontWeight: 800,
            fontSize: '0.85rem',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {points.toLocaleString('fa-IR')}
        </Box>
      </Box>
    </motion.div>
  )
}

interface BadgeProps {
  icon: string
  name: string
  description: string
  color: string
  unlocked: boolean
  delay?: number
}

const Badge: React.FC<BadgeProps> = ({ icon, name, description, color, unlocked, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
  >
    <Box
      sx={{
        p: 2,
        borderRadius: '16px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: unlocked ? color : 'divider',
        opacity: unlocked ? 1 : 0.5,
        textAlign: 'center',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: unlocked ? `0 8px 20px ${color}30` : shadows.card,
        },
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '14px',
          background: unlocked ? `${color}20` : 'rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 1.5,
        }}
      >
        <Icon icon={icon} style={{ width: 28, height: 28, color: unlocked ? color : '#9ca3af' }} />
      </Box>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '0.85rem',
          color: 'text.primary',
          mb: 0.5,
        }}
      >
        {name}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.75rem',
          color: 'text.secondary',
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>
      {!unlocked && (
        <Box
          sx={{
            mt: 1,
            px: 1,
            py: 0.3,
            borderRadius: '6px',
            bgcolor: 'rgba(0,0,0,0.05)',
            fontSize: '0.75rem',
            color: 'text.secondary',
          }}
        >
          قفل شده
        </Box>
      )}
    </Box>
  </motion.div>
)

const LEADERBOARD = [
  { rank: 1, name: 'محمد رضایی', avatar: 'م', points: 12450, gamesPlayed: 48 },
  { rank: 2, name: 'علی احمدی', avatar: 'ع', points: 11200, gamesPlayed: 42 },
  { rank: 3, name: 'حسن کریمی', avatar: 'ح', points: 10800, gamesPlayed: 45 },
  { rank: 4, name: 'رضا نوری', avatar: 'ر', points: 9500, gamesPlayed: 38 },
  { rank: 5, name: 'سعید موسوی', avatar: 'س', points: 8900, gamesPlayed: 35 },
]

const BADGES = [
  {
    icon: 'mdi:star-shooting',
    name: 'ستاره درخشان',
    description: '۱۰ بازی متوالی بدون کنسل',
    color: '#fbbf24',
    unlocked: true,
  },
  {
    icon: 'mdi:soccer-field',
    name: 'بازیکن حرفه‌ای',
    description: '۵۰ بازی تکمیل شده',
    color: '#3b82f6',
    unlocked: true,
  },
  {
    icon: 'mdi:users',
    name: 'رهبر تیم',
    description: 'ساخت تیم با ۸ عضو فعال',
    color: '#10b981',
    unlocked: false,
  },
  {
    icon: 'mdi:trophy-variant',
    name: 'قهرمان مسابقات',
    description: 'برنده ۵ مسابقه',
    color: '#ef4444',
    unlocked: false,
  },
]

export const GamificationSection: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Box sx={{ mb: 6 }}>
      <SectionHeader
        title="چالش‌ها و جوایز"
        subtitle="بازی کن، امتیاز بگیر، جایزه ببر!"
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '1fr 1fr',
          },
          gap: 3,
        }}
      >
        {/* جدول امتیازات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            sx={{
              p: 3,
              borderRadius: `${radii.card}px`,
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              color: '#fff',
              boxShadow: shadows.card,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon icon="mdi:trophy" style={{ width: 24, height: 24, color: '#fbbf24' }} />
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>جدول برترین‌ها</Typography>
              </Box>
              <Button
                size="small"
                onClick={() => navigate('/quiz')}
                sx={{
                  color: '#fbbf24',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'rgba(251,191,36,0.1)',
                  },
                }}
              >
                مشاهده همه
              </Button>
            </Box>

            {LEADERBOARD.map((player, index) => (
              <LeaderboardPlayer key={player.rank} {...player} delay={index * 0.1} />
            ))}
          </Box>
        </motion.div>

        {/* نشان‌های افتخار */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Box
            sx={{
              p: 3,
              borderRadius: `${radii.card}px`,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: shadows.card,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon icon="mdi:badge-outline" style={{ width: 24, height: 24, color: '#3b82f6' }} />
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>نشان‌های افتخار</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                {BADGES.filter((b) => b.unlocked).length} از {BADGES.length} باز شده
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2,
              }}
            >
              {BADGES.map((badge, index) => (
                <Badge key={badge.name} {...badge} delay={index * 0.1} />
              ))}
            </Box>

            <Button
              fullWidth
              onClick={() => navigate('/profile')}
              sx={{
                mt: 2.5,
                py: 1.2,
                borderRadius: '12px',
                background: gradients.primary,
                color: '#fff',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': {
                  opacity: 0.9,
                },
              }}
            >
              مشاهده پروفایل من
            </Button>
          </Box>
        </motion.div>
      </Box>
    </Box>
  )
}
