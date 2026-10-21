import type React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
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
    className="h-full"
  >
    <div
      className="flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-[color:var(--feature-color)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
      style={{ '--feature-color': color } as React.CSSProperties}
    >
      <span
        className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl"
        style={{ background: bgColor }}
      >
        <Icon icon={icon} style={{ width: 26, height: 26, color }} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="mb-1 text-[0.92rem] font-bold text-foreground">
          {title}
        </h3>
        <p className="text-[0.78rem] leading-[1.7] text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
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
    <section className="mb-12">
      <SectionHeader
        title="امکانات ویژه"
        subtitle="هر چی که برای یه بازی عالی نیاز داری"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {FEATURES.map((feature, index) => (
          <FeatureItem key={feature.title} {...feature} delay={index * 0.08} />
        ))}
      </div>
    </section>
  )
}
