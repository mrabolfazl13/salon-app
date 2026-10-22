import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import SectionHeader from '@/components/mobile/SectionHeader'

interface StepProps {
  number: number
  icon: string
  title: string
  description: string
  color: string
  delay?: number
}

const Step: React.FC<StepProps> = ({ icon, title, description, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <div className="relative text-center">
      {/* شماره مرحله */}
      <div
        className="relative z-[1] mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-[2.5px]"
        style={{ backgroundColor: `${color}15`, borderColor: color }}
      >
        <Icon icon={icon} style={{ width: 22, height: 22, color }} />
      </div>

      {/* عنوان */}
      <h3 className="mb-1.5 text-[0.88rem] font-extrabold text-foreground">
        {title}
      </h3>

      {/* توضیحات */}
      <p className="mx-auto max-w-[240px] text-[0.72rem] leading-[1.6] text-muted-foreground">
        {description}
      </p>
    </div>
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
    <section className="mb-6">
      <SectionHeader
        title="چطور کار می‌کنه؟"
        subtitle="در ۵ قدم ساده، زمین رزرو کن"
      />

      <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.number}>
            <Step {...step} delay={index * 0.1} />
            {/* خط اتصال بین مراحل (فقط در دسکتاپ) */}
            {index < STEPS.length - 1 && (
              <div
                aria-hidden="true"
                className="absolute top-6 z-0 hidden h-0.5 w-[10%] bg-gradient-to-r from-transparent via-slate-900/10 to-transparent dark:via-white/10 lg:block"
                style={{ insetInlineStart: `calc(${(index + 1) * 20}% - 10%)` }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* نکته مهم */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-8"
      >
        <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.08] p-4 dark:bg-blue-500/10">
          <Icon icon="mdi:lightbulb-on" style={{ width: 24, height: 24, color: '#3b82f6', flexShrink: 0 }} />
          <p className="flex-1 text-[0.82rem] text-foreground">
            <strong>نکته:</strong> اولین رزروت با{' '}
            <span className="font-bold text-blue-600 dark:text-blue-400">
              ۵۰٪ تخفیف
            </span>{' '}
            همراهه! همین حالا شروع کن.
          </p>
        </div>
      </motion.div>
    </section>
  )
}
