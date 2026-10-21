import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Icon } from '@iconify/react'
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
  const ref = useRef<HTMLDivElement>(null)
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
      className="min-w-0"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <div
        className="min-w-0 rounded-[20px] border border-border bg-card p-4 text-center transition-all duration-300 hover:-translate-y-2 hover:border-[color:var(--stat-color)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] sm:p-6"
        style={{ '--stat-color': color } as React.CSSProperties}
      >
        {/* آیکون */}
        <span
          className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[18px]"
          style={{ background: `${color}15` }}
        >
          <Icon icon={icon} style={{ width: 36, height: 36, color }} />
        </span>

        {/* شمارنده */}
        <p className="mb-1 text-[1.65rem] font-black tabular-nums text-foreground sm:text-[1.9rem] md:text-[2.2rem]">
          {toPersianDigits(count.toLocaleString())}{suffix}
        </p>

        {/* لیبل */}
        <p className="text-[0.88rem] font-semibold text-muted-foreground">
          {label}
        </p>
      </div>
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
    <section className="mb-12">
      <SectionHeader
        title="آمار و ارقام"
        subtitle="اعتماد هزاران بازیکن، افتخار ماست"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {STATS.map((stat, index) => (
          <StatItem key={stat.label} {...stat} delay={index * 0.1} />
        ))}
      </div>
    </section>
  )
}
