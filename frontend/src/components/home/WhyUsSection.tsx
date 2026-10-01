import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Typography } from '@mui/material'
import SectionHeader from '@/components/mobile/SectionHeader'

interface BenefitCardProps {
  icon: string
  title: string
  description: string
  color: string
  bgColor: string
  delay?: number
}

const BenefitCard: React.FC<BenefitCardProps> = ({ icon, title, description, color, bgColor, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -8, transition: { duration: 0.3 } }}
  >
    <Box
      sx={{
        p: 3,
        borderRadius: '20px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${color}, transparent)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover': {
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          '&::before': {
            opacity: 1,
          },
        },
      }}
    >
      {/* آیکون */}
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '16px',
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <Icon icon={icon} style={{ width: 32, height: 32, color }} />
      </Box>

      {/* عنوان */}
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '1.1rem',
          mb: 1.5,
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>

      {/* توضیحات */}
      <Typography
        sx={{
          fontSize: '0.88rem',
          lineHeight: 1.8,
          color: 'text.secondary',
        }}
      >
        {description}
      </Typography>
    </Box>
  </motion.div>
)

const BENEFITS = [
  {
    icon: 'mdi:percent-outline',
    title: 'تخفیف‌های ویژه',
    description: 'تا ۵۰٪ تخفیف در سانس‌های خلوت و لحظه آخری. هر چی بیشتر بازی کنی، ارزون‌تر!',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.1)',
  },
  {
    icon: 'mdi:shield-check',
    title: 'تضمین کیفیت',
    description: 'تمام زمین‌ها تأیید شده با عکس‌های واقعی و نظرات کاربران. بدون سورپرایز بد!',
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.1)',
  },
  {
    icon: 'mdi:lightning-bolt',
    title: 'رزرو فوری',
    description: 'در کمتر از ۳۰ ثانیه زمین رزرو کن. بدون تماس تلفنی، بدون معطلی.',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.1)',
  },
  {
    icon: 'mdi:headset',
    title: 'پشتیبانی ۲۴/۷',
    description: 'تیم پشتیبانی همیشه آماده کمک. پاسخگویی سریع در واتساپ و تلگرام.',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.1)',
  },
  {
    icon: 'mdi:calendar-multiple-check',
    title: 'مدیریت تیم',
    description: 'ساخت تیم، دعوت اعضا، مدیریت هزینه‌ها و برنامه‌ریازی مسابقات.',
    color: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.1)',
  },
  {
    icon: 'mdi:gift-outline',
    title: 'برنامه وفاداری',
    description: 'با هر رزرو امتیاز بگیر و جایزه ببر. هدیه تولد و مناسبت‌های خاص.',
    color: '#ec4899',
    bgColor: 'rgba(236,72,153,0.1)',
  },
]

export const WhyUsSection: React.FC = () => {
  return (
    <Box sx={{ mb: 6 }}>
      <SectionHeader
        title="چرا فوتسال ما؟"
        subtitle="مزایایی که تجربه تو رو متحول می‌کنه"
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 2.5,
        }}
      >
        {BENEFITS.map((benefit, index) => (
          <BenefitCard
            key={benefit.title}
            {...benefit}
            delay={index * 0.1}
          />
        ))}
      </Box>
    </Box>
  )
}
