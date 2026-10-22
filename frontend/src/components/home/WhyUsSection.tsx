import type React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
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
    whileHover={{ y: -4, transition: { duration: 0.25 } }}
    className="h-full"
  >
    <div className="group relative h-full overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
      {/* نوار رنگی بالای کارت هنگام هاور */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />

      {/* آیکون */}
      <span
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: bgColor }}
      >
        <Icon icon={icon} style={{ width: 24, height: 24, color }} />
      </span>

      {/* عنوان */}
      <h3 className="mb-2 text-[0.88rem] font-extrabold text-foreground">
        {title}
      </h3>

      {/* توضیحات */}
      <p className="text-[0.75rem] leading-[1.7] text-muted-foreground">
        {description}
      </p>
    </div>
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
    <section className="mb-6">
      <SectionHeader
        title="چرا فوتسال ما؟"
        subtitle="مزایایی که تجربه تو رو متحول می‌کنه"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {BENEFITS.map((benefit, index) => (
          <BenefitCard
            key={benefit.title}
            {...benefit}
            delay={index * 0.1}
          />
        ))}
      </div>
    </section>
  )
}
