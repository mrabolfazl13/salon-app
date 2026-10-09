import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Typography, Button, LinearProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import SectionHeader from '@/components/mobile/SectionHeader'
import { gradients, radii, shadows } from '@/theme'

interface LevelCardProps {
  icon: string
  name: string
  description: string
  minPoints: number
  maxPoints?: number
  color: string
  isCurrent?: boolean
  delay?: number
}

const LevelCard: React.FC<LevelCardProps> = ({
  icon,
  name,
  description,
  minPoints,
  maxPoints,
  color,
  isCurrent = false,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <Box
      sx={{
        p: 2.5,
        borderRadius: '16px',
        bgcolor: isCurrent ? `${color}15` : 'background.paper',
        border: '2px solid',
        borderColor: isCurrent ? color : 'divider',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${color}25`,
        },
      }}
    >
      {isCurrent && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            px: 1,
            py: 0.3,
            borderRadius: '6px',
            bgcolor: color,
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          سطح فعلی
        </Box>
      )}

      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '14px',
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <Icon icon={icon} style={{ width: 28, height: 28, color }} />
      </Box>

      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '1rem',
          color: 'text.primary',
          mb: 0.5,
        }}
      >
        {name}
      </Typography>

      <Typography
        sx={{
          fontSize: '0.78rem',
          color: 'text.secondary',
          mb: 1.5,
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>

      <Typography
        sx={{
          fontSize: '0.75rem',
          color: color,
          fontWeight: 700,
        }}
      >
        از {minPoints.toLocaleString('fa-IR')} امتیاز
        {maxPoints && ` تا ${maxPoints.toLocaleString('fa-IR')} امتیاز`}
      </Typography>
    </Box>
  </motion.div>
)

interface RewardCardProps {
  icon: string
  title: string
  description: string
  pointsRequired: number
  userPoints: number
  canClaim: boolean
  color: string
  delay?: number
}

const RewardCard: React.FC<RewardCardProps> = ({
  icon,
  title,
  description,
  pointsRequired,
  userPoints,
  canClaim,
  color,
  delay = 0,
}) => {
  const progress = Math.min((userPoints / pointsRequired) * 100, 100)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
    >
      <Box
        sx={{
          p: 2.5,
          borderRadius: '16px',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: canClaim ? color : 'divider',
          opacity: canClaim ? 1 : 0.7,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: canClaim ? `0 8px 24px ${color}30` : shadows.card,
          },
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: canClaim ? `${color}20` : 'rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.5,
          }}
        >
          <Icon icon={icon} style={{ width: 24, height: 24, color: canClaim ? color : '#9ca3af' }} />
        </Box>

        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.9rem',
            color: 'text.primary',
            mb: 0.5,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            fontSize: '0.75rem',
            color: 'text.secondary',
            mb: 1.5,
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>

        {/* نوار پیشرفت */}
        <Box sx={{ mb: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: '3px',
              bgcolor: 'rgba(0,0,0,0.08)',
              '& .MuiLinearProgress-bar': {
                bgcolor: canClaim ? color : '#9ca3af',
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: 'text.secondary',
            }}
          >
            {userPoints.toLocaleString('fa-IR')} از {pointsRequired.toLocaleString('fa-IR')}
          </Typography>
          {canClaim && (
            <Button
              size="small"
              sx={{
                px: 1.5,
                minHeight: 44,
                borderRadius: '8px',
                bgcolor: color,
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': {
                  opacity: 0.9,
                },
              }}
            >
              دریافت جایزه
            </Button>
          )}
        </Box>
      </Box>
    </motion.div>
  )
}

const LEVELS = [
  {
    icon: 'mdi:star-outline',
    name: 'برنزی',
    description: 'شروع سفر فوتسالی شما',
    minPoints: 0,
    maxPoints: 1000,
    color: '#cd7f32',
    isCurrent: true,
  },
  {
    icon: 'mdi:medal',
    name: 'نقره‌ای',
    description: 'بازیکن فعال با تخفیف‌های ویژه',
    minPoints: 1000,
    maxPoints: 5000,
    color: '#64748b',
  },
  {
    icon: 'mdi:crown',
    name: 'طلایی',
    description: 'بازیکن حرفه‌ای با مزایای عالی',
    minPoints: 5000,
    maxPoints: 15000,
    color: '#fbbf24',
  },
  {
    icon: 'mdi:diamond-stone',
    name: 'الماسی',
    description: 'VIP با بهترین امکانات و تخفیف‌ها',
    minPoints: 15000,
    color: '#3b82f6',
  },
]

const REWARDS = [
  {
    icon: 'mdi:ticket-percent',
    title: 'تخفیف ۲۰٪',
    description: 'یک ساعت رزرو رایگان',
    pointsRequired: 500,
    userPoints: 750,
    canClaim: true,
    color: '#10b981',
  },
  {
    icon: 'mdi:tshirt-crew',
    title: 'تیشرت فوتسال',
    description: 'تیشرت اختصاصی با لوگوی تیم',
    pointsRequired: 2000,
    userPoints: 750,
    canClaim: false,
    color: '#3b82f6',
  },
  {
    icon: 'mdi:soccer',
    title: 'توپ فوتسال',
    description: 'توپ حرفه‌ای سایز ۴',
    pointsRequired: 3000,
    userPoints: 750,
    canClaim: false,
    color: '#f59e0b',
  },
  {
    icon: 'mdi:gift-outline',
    title: 'هدیه تولد',
    description: '۲ ساعت بازی رایگان در ماه تولد',
    pointsRequired: 1000,
    userPoints: 750,
    canClaim: false,
    color: '#ec4899',
  },
]

export const LoyaltySection: React.FC = () => {
  const navigate = useNavigate()
  const currentPoints = 750
  const nextLevelPoints = 1000
  const progress = (currentPoints / nextLevelPoints) * 100

  return (
    <Box sx={{ mb: 6 }}>
      <SectionHeader
        title="برنامه وفاداری"
        subtitle="هر چی بیشتر بازی کنی، بیشتر سود می‌بری!"
      />

      {/* وضعیت فعلی کاربر */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            p: 3,
            borderRadius: `${radii.card}px`,
            background: gradients.primary,
            color: '#fff',
            mb: 3,
            boxShadow: '0 12px 40px rgba(245,158,11,0.3)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '14px',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon icon="mdi:star" style={{ width: 28, height: 28, color: '#fff' }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>سطح برنزی</Typography>
                <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>
                  {currentPoints.toLocaleString('fa-IR')} امتیاز جمع‌آوری شده
                </Typography>
              </Box>
            </Box>
            <Button
              onClick={() => navigate('/profile')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.82rem',
                px: 2,
                py: 0.8,
                borderRadius: '10px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              مشاهده جزئیات
            </Button>
          </Box>

          {/* نوار پیشرفت به سطح بعدی */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                پیشرفت به سطح نقره‌ای
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>
                {(nextLevelPoints - currentPoints).toLocaleString('fa-IR')} امتیاز دیگر
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: '4px',
                bgcolor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#fff',
                },
              }}
            />
          </Box>
        </Box>
      </motion.div>

      {/* سطوح کاربری */}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '1rem',
          color: 'text.primary',
          mb: 2,
        }}
      >
        سطوح وفاداری
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2,
          mb: 4,
        }}
      >
        {LEVELS.map((level, index) => (
          <LevelCard key={level.name} {...level} delay={index * 0.1} />
        ))}
      </Box>

      {/* جوایز قابل دریافت */}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '1rem',
          color: 'text.primary',
          mb: 2,
        }}
      >
        جوایز ویژه
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
          },
          gap: 2,
        }}
      >
        {REWARDS.map((reward, index) => (
          <RewardCard key={reward.title} {...reward} delay={index * 0.1} />
        ))}
      </Box>
    </Box>
  )
}
