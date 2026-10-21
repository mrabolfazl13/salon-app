import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/shadcn/button'

interface StatsItem {
  icon: string
  value: string
  label: string
  color: string
}

const STATS: StatsItem[] = [
  { icon: 'mdi:users', value: '+۱۲,۰۰۰', label: 'بازیکن فعال', color: '#3b82f6' },
  { icon: 'mdi:soccer-field', value: '+۵۰', label: 'زمین حرفه‌ای', color: '#10b981' },
  { icon: 'mdi:trophy', value: '+۳۰۰', label: 'مسابقه هفتگی', color: '#f59e0b' },
  { icon: 'mdi:star', value: '۴.۸', label: 'امتیاز کاربران', color: '#ef4444' },
]

const FEATURES = [
  {
    icon: 'mdi:clock-check-outline',
    title: 'رزرو فوری',
    desc: 'در کمتر از ۳۰ ثانیه زمین رزرو کن',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  },
  {
    icon: 'mdi:cash-multiple',
    title: 'بهترین قیمت',
    desc: 'تضمین ارزان‌ترین نرخ با تخفیف‌های ویژه',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    icon: 'mdi:account-group',
    title: 'تیم‌سازی آسان',
    desc: 'هم‌تیمی پیدا کن و تیم بساز',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
]

export const HeroSection: React.FC = () => {
  const navigate = useNavigate()
  const [currentFeature, setCurrentFeature] = useState(0)
  const user = useAuthStore((s) => s.user)
  // «ثبت‌نام رایگان» برای کاربر واردشده به /register می‌رفت و PublicRoute بی‌صدا
  // به /venues برمی‌گرداند؛ دکمهٔ دوم را با نقش کاربر هم‌راستا می‌کنیم.
  const secondaryCta = !user
    ? { label: 'ثبت‌نام رایگان', icon: 'mdi:account-plus', to: '/register' }
    : user.role === 'super_admin'
      ? { label: 'پنل مدیریت', icon: 'mdi:shield-account', to: '/admin' }
      : user.role === 'venue_manager' || user.role === 'club_admin'
        ? { label: 'داشبورد مدیریت', icon: 'mdi:view-dashboard', to: '/manager-dashboard' }
        : { label: 'رزروهای من', icon: 'mdi:calendar-check', to: '/bookings' }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % FEATURES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-bl from-slate-900 via-blue-900 to-blue-700 px-4 py-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.4)] sm:px-6 sm:py-10 md:px-8 md:py-12">
      {/* پس‌زمینه متحرک */}
      <div className="pointer-events-none absolute -start-20 -top-20 h-[250px] w-[250px] animate-float rounded-full bg-white/[0.08]" />
      <div className="pointer-events-none absolute -bottom-16 -end-16 h-[200px] w-[200px] rounded-full border-[3px] border-dashed border-white/10 [animation:spin_20s_linear_infinite]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/[0.06] blur-[60px]" />

      {/* محتوای اصلی */}
      <div className="relative z-10">
        {/* عنوان اصلی */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mb-4 text-balance text-center text-[1.8rem] font-black leading-[1.3] sm:text-[2.2rem] md:text-[2.8rem]">
            فوتسال رو{' '}
            <span className="bg-gradient-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent">
              حرفه‌ای‌تر
            </span>{' '}
            تجربه کن
          </h1>
        </motion.div>

        {/* زیرعنوان */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p className="mx-auto mb-6 max-w-[600px] text-balance text-center text-[0.95rem] leading-[1.8] text-white/90 sm:text-[1.05rem]">
            بهترین زمین‌ها، راحت‌ترین رزرو، هیجان‌انگیزترین بازی‌ها
            <br className="hidden sm:block" />
            همین حالا شروع کن و به هزاران بازیکن بپیوند
          </p>
        </motion.div>

        {/* دکمه‌های CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 flex flex-wrap justify-center gap-3"
        >
          <Button
            onClick={() => navigate('/venues')}
            className="h-12 bg-gradient-to-br from-amber-300 to-amber-500 px-6 text-[0.95rem] font-extrabold text-stone-900 shadow-[0_8px_24px_rgba(251,191,36,0.35)] hover:shadow-[0_12px_32px_rgba(251,191,36,0.45)]"
          >
            <Icon icon="mdi:soccer" style={{ width: 20, height: 20 }} />
            مشاهده زمین‌ها
          </Button>
          <Button
            onClick={() => navigate(secondaryCta.to)}
            variant="outline"
            className="h-12 border-white/50 bg-transparent px-6 text-[0.95rem] font-bold text-white hover:border-white hover:bg-white/10 hover:text-white"
          >
            <Icon icon={secondaryCta.icon} style={{ width: 20, height: 20 }} />
            {secondaryCta.label}
          </Button>
        </motion.div>

        {/* ویژگی‌های چرخشی */}
        <motion.div
          key={currentFeature}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-center justify-center gap-3 rounded-xl bg-white/10 px-5 py-3 backdrop-blur-md"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: FEATURES[currentFeature].gradient }}
          >
            <Icon
              icon={FEATURES[currentFeature].icon}
              style={{ width: 22, height: 22, color: '#fff' }}
            />
          </span>
          <div>
            <p className="text-sm font-extrabold">{FEATURES[currentFeature].title}</p>
            <p className="text-xs text-white/80">{FEATURES[currentFeature].desc}</p>
          </div>
        </motion.div>

        {/* آمار اجتماعی */}
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.08] p-3 backdrop-blur-md">
                <span
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon icon={stat.icon} style={{ width: 22, height: 22, color: stat.color }} />
                </span>
                <div>
                  <p className="text-[1.1rem] font-black tabular-nums">{stat.value}</p>
                  <p className="text-xs text-white/85">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
