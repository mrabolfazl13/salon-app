import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Typography } from '@mui/material'
import SectionHeader from '@/components/mobile/SectionHeader'

interface StepProps {
  number: number
  icon: string
  title: string
  description: string
  color: string
  delay?: number
}

const Step: React.FC<StepProps> = ({ number, icon, title, description, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <Box sx={{ position: 'relative', textAlign: 'center' }}>
      {/* شماره مرحله */}
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: `${color}15`,
          border: `3px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Icon icon={icon} style={{ width: 28, height: 28, color }} />
      </Box>

      {/* عنوان */}
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '1.05rem',
          color: 'text.primary',
          mb: 1,
        }}
      >
        {title}
      </Typography>

      {/* توضیحات */}
      <Typography
        sx={{
          fontSize: '0.82rem',
          color: 'text.secondary',
          lineHeight: 1.7,
          maxWidth: 280,
          mx: 'auto',
        }}
      >
        {description}
      </Typography>
    </Box>
  </motion.div>
)

const STEPS = [
  {
    number: 1,
    icon: 'mdi:account-plus',
    title: 'ثبت‌نام رایگان',
    description: 'با شماره موبایل در کمتر از ۳۰ ثانیه ثبت‌نام کن',
    color: '#3b82f6',
  },
  {
    number: 2,
    icon: 'mdi:magnify',
    title: 'جستجوی زمین',
    description: 'زمین مورد نظرت رو بر اساس موقعیت و امکانات پیدا کن',
    color: '#10b981',
  },
  {
    number: 3,
    icon: 'mdi:calendar-check',
    title: 'انتخاب زمان',
    description: 'سانس دلخواهت رو انتخاب و رزرو کن',
    color: '#f59e0b',
  },
  {
    number: 4,
    icon: 'mdi:credit-card-check',
    title: 'پرداخت آنلاین',
    description: 'به صورت امن و سریع پرداخت کن',
    color: '#8b5cf6',
  },
  {
    number: 5,
    icon: 'mdi:soccer',
    title: 'بازی کن!',
    description: 'برو سر زمین و از بازیت لذت ببر',
    color: '#ef4444',
  },
]

export const HowItWorksSection: React.FC = () => {
  return (
    <Box sx={{ mb: 6 }}>
      <SectionHeader
        title="چطور کار می‌کنه؟"
        subtitle="در ۵ قدم ساده، زمین رزرو کن"
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
          gap: 3,
          position: 'relative',
        }}
      >
        {STEPS.map((step, index) => (
          <React.Fragment key={step.number}>
            <Step {...step} delay={index * 0.1} />
            {/* خط اتصال بین مراحل (فقط در دسکتاپ) */}
            {index < STEPS.length - 1 && (
              <Box
                sx={{
                  display: { xs: 'none', lg: 'block' },
                  position: 'absolute',
                  top: 32,
                  left: `calc(${(index + 1) * 20}% - 10%)`,
                  width: '10%',
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)',
                  zIndex: 0,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </Box>

      {/* نکته مهم */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        style={{ marginTop: 32 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 2,
            borderRadius: '12px',
            bgcolor: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          <Icon icon="mdi:lightbulb-on" style={{ width: 24, height: 24, color: '#3b82f6', flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', flex: 1 }}>
            <strong>نکته:</strong> اولین رزروت با{' '}
            <Box component="span" sx={{ color: '#3b82f6', fontWeight: 700 }}>
              ۵۰٪ تخفیف
            </Box>{' '}
            همراهه! همین حالا شروع کن.
          </Typography>
        </Box>
      </motion.div>
    </Box>
  )
}
