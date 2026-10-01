import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Typography } from '@mui/material'
import SectionHeader from '@/components/mobile/SectionHeader'

interface FeatureItemProps {
  icon: string
  title: string
  description: string
  color: string
  bgColor: string
  delay?: number
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, color, bgColor, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ y: -6, transition: { duration: 0.3 } }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        p: 2.5,
        borderRadius: '16px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          borderColor: color,
        },
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '12px',
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon icon={icon} style={{ width: 26, height: 26, color }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.92rem',
            color: 'text.primary',
            mb: 0.5,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.78rem',
            color: 'text.secondary',
            lineHeight: 1.7,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  </motion.div>
)

const FEATURES = [
  {
    icon: 'mdi:camera',
    title: 'عکس‌برداری حرفه‌ای',
    description: 'عکس‌های باکیفیت از بازی‌ها و لحظات خاص شما',
    color: '#ec4899',
    bgColor: 'rgba(236,72,153,0.1)',
  },
  {
    icon: 'mdi:whistle',
    title: 'داور حرفه‌ای',
    description: 'داوران مجرب و دارای گواهینامه برای مسابقات رسمی',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.1)',
  },
  {
    icon: 'mdi:soccer-field',
    title: 'زمین چمن مصنوعی',
    description: 'چمن درجه یک با استانداردهای فیفا',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.1)',
  },
  {
    icon: 'mdi:lightbulb-on',
    title: 'نورپردازی عالی',
    description: 'سیستم روشنایی LED برای بازی شبانه',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.1)',
  },
  {
    icon: 'mdi:shower-head',
    title: 'رختکن مجهز',
    description: 'دوش آب گرم، کمد و امکانات کامل',
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.1)',
  },
  {
    icon: 'mdi:parking',
    title: 'پارکینگ رایگان',
    description: 'فضای پارک امن و کافی برای همه بازیکنان',
    color: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.1)',
  },
  {
    icon: 'mdi:coffee',
    title: 'بوفه و کافه',
    description: 'نوشیدنی‌های خنک و تنقلات بعد از بازی',
    color: '#06b6d4',
    bgColor: 'rgba(6,182,212,0.1)',
  },
  {
    icon: 'mdi:first-aid-kit',
    title: 'جعبه کمک‌های اولیه',
    description: 'تجهیزات پزشکی و پرسنل آموزش‌دیده',
    color: '#dc2626',
    bgColor: 'rgba(220,38,38,0.1)',
  },
]

export const FeaturesSection: React.FC = () => {
  return (
    <Box sx={{ mb: 6 }}>
      <SectionHeader
        title="امکانات ویژه"
        subtitle="هر چی که برای یه بازی عالی نیاز داری"
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2,
        }}
      >
        {FEATURES.map((feature, index) => (
          <FeatureItem key={feature.title} {...feature} delay={index * 0.08} />
        ))}
      </Box>
    </Box>
  )
}
