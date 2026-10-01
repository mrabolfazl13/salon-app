import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Box, Typography } from '@mui/material'
import SectionHeader from '@/components/mobile/SectionHeader'
import { toPersianDigits } from '@/lib/jalali'

interface StatItemProps {
  icon: string
  value: number
  label: string
  suffix?: string
  color: string
  delay?: number
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, label, suffix = '', color, delay = 0 }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return

    const duration = 2000 // 2 seconds
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isInView, value])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <Box
        sx={{
          textAlign: 'center',
          p: 3,
          borderRadius: '20px',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: `0 12px 40px ${color}20`,
            borderColor: color,
          },
        }}
      >
        {/* آیکون */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '18px',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <Icon icon={icon} style={{ width: 36, height: 36, color }} />
        </Box>

        {/* شمارنده */}
        <Typography
          sx={{
            fontSize: '2.2rem',
            fontWeight: 900,
            color: 'text.primary',
            fontVariantNumeric: 'tabular-nums',
            mb: 0.5,
          }}
        >
          {toPersianDigits(count.toLocaleString())}{suffix}
        </Typography>

        {/* لیبل */}
        <Typography
          sx={{
            fontSize: '0.88rem',
            color: 'text.secondary',
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
      </Box>
    </motion.div>
  )
}

const STATS = [
  {
    icon: 'mdi:users',
    value: 12500,
    label: 'کاربر فعال',
    suffix: '+',
    color: '#3b82f6',
  },
  {
    icon: 'mdi:soccer-field',
    value: 58,
    label: 'زمین فوتسال',
    suffix: '+',
    color: '#10b981',
  },
  {
    icon: 'mdi:calendar-check',
    value: 45000,
    label: 'رزرو موفق',
    suffix: '+',
    color: '#f59e0b',
  },
  {
    icon: 'mdi:soccer',
    value: 38000,
    label: 'بازی انجام شده',
    suffix: '+',
    color: '#ef4444',
  },
  {
    icon: 'mdi:star',
    value: 4.8,
    label: 'امتیاز کاربران',
    suffix: '/۵',
    color: '#8b5cf6',
  },
  {
    icon: 'mdi:headset',
    value: 99,
    label: 'رضایت مشتریان',
    suffix: '%',
    color: '#ec4899',
  },
]

export const StatsSection: React.FC = () => {
  return (
    <Box sx={{ mb: 6 }}>
      <SectionHeader
        title="آمار و ارقام"
        subtitle="اعتماد هزاران بازیکن، افتخار ماست"
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(6, 1fr)',
          },
          gap: 2,
        }}
      >
        {STATS.map((stat, index) => (
          <StatItem key={stat.label} {...stat} delay={index * 0.1} />
        ))}
      </Box>
    </Box>
  )
}
