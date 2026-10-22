import type React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import SectionHeader from '@/components/mobile/SectionHeader'
import { Button } from '@/components/ui/shadcn/button'
import { Progress } from '@/components/ui/shadcn/progress'

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
    <div
      className="relative overflow-hidden rounded-2xl border-2 border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
      style={{
        backgroundColor: isCurrent ? `${color}15` : undefined,
        borderColor: isCurrent ? color : undefined,
      }}
    >
      {isCurrent && (
        <span
          className="absolute end-3 top-3 rounded-md px-2 py-0.5 text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          سطح فعلی
        </span>
      )}

      <span
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-[14px]"
        style={{ background: `${color}20` }}
      >
        <Icon icon={icon} style={{ width: 28, height: 28, color }} />
      </span>

      <h3 className="mb-1 text-base font-extrabold text-foreground">
        {name}
      </h3>

      <p className="mb-3 text-[0.78rem] leading-relaxed text-muted-foreground">
        {description}
      </p>

      <p className="text-xs font-bold" style={{ color }}>
        از {minPoints.toLocaleString('fa-IR')} امتیاز
        {maxPoints && ` تا ${maxPoints.toLocaleString('fa-IR')} امتیاز`}
      </p>
    </div>
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
      <div
        className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        style={{ borderColor: canClaim ? color : undefined, opacity: canClaim ? 1 : 0.7 }}
      >
        <span
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: canClaim ? `${color}20` : 'rgba(0,0,0,0.05)' }}
        >
          <Icon icon={icon} style={{ width: 24, height: 24, color: canClaim ? color : '#9ca3af' }} />
        </span>

        <h3 className="mb-1 text-[0.9rem] font-bold text-foreground">
          {title}
        </h3>

        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>

        {/* نوار پیشرفت */}
        <div className="mb-2">
          <Progress
            value={progress}
            aria-label={`پیشرفت به سطح ${title}`}
            aria-valuetext={`${Math.round(progress)} درصد`}
            className="h-1.5 bg-black/[0.08] dark:bg-white/10 [&>div]:!bg-[var(--bar-color)]"
            style={{ '--bar-color': canClaim ? color : '#9ca3af' } as React.CSSProperties}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {userPoints.toLocaleString('fa-IR')} از {pointsRequired.toLocaleString('fa-IR')}
          </span>
          {canClaim && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11 rounded-lg px-3 text-xs font-bold text-white shadow-none hover:opacity-90"
              style={{ backgroundColor: color }}
            >
              دریافت جایزه
            </Button>
          )}
        </div>
      </div>
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
    color: '#92400e',
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
    color: '#a16207',
  },
  {
    icon: 'mdi:diamond-stone',
    name: 'الماسی',
    description: 'VIP با بهترین امکانات و تخفیف‌ها',
    minPoints: 15000,
    color: '#2563eb',
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
    color: '#047857',
  },
  {
    icon: 'mdi:tshirt-crew',
    title: 'تیشرت فوتسال',
    description: 'تیشرت اختصاصی با لوگوی تیم',
    pointsRequired: 2000,
    userPoints: 750,
    canClaim: false,
    color: '#2563eb',
  },
  {
    icon: 'mdi:soccer',
    title: 'توپ فوتسال',
    description: 'توپ حرفه‌ای سایز ۴',
    pointsRequired: 3000,
    userPoints: 750,
    canClaim: false,
    color: '#b45309',
  },
  {
    icon: 'mdi:gift-outline',
    title: 'هدیه تولد',
    description: '۲ ساعت بازی رایگان در ماه تولد',
    pointsRequired: 1000,
    userPoints: 750,
    canClaim: false,
    color: '#be185d',
  },
]

export const LoyaltySection: React.FC = () => {
  const navigate = useNavigate()
  const currentPoints = 750
  const nextLevelPoints = 1000
  const progress = (currentPoints / nextLevelPoints) * 100

  return (
    <section className="mb-6">
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
        <div className="mb-6 rounded-[20px] bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 p-6 text-white shadow-[0_12px_40px_rgba(245,158,11,0.3)]">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-white/20">
                <Icon icon="mdi:star" style={{ width: 28, height: 28, color: '#fff' }} />
              </span>
              <div>
                <h3 className="text-[1.1rem] font-extrabold">سطح برنزی</h3>
                <p className="text-[0.82rem] text-white/80">
                  {currentPoints.toLocaleString('fa-IR')} امتیاز جمع‌آوری شده
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="h-11 rounded-[10px] bg-white/20 px-4 py-2 text-[0.82rem] font-bold text-white hover:bg-white/30 hover:text-white"
            >
              مشاهده جزئیات
            </Button>
          </div>

          {/* نوار پیشرفت به سطح بعدی */}
          <div className="mb-1">
            <div className="mb-1 flex justify-between">
              <span className="text-xs text-white/80">
                پیشرفت به سطح نقره‌ای
              </span>
              <span className="text-xs font-bold text-white/90">
                {(nextLevelPoints - currentPoints).toLocaleString('fa-IR')} امتیاز دیگر
              </span>
            </div>
            <Progress
              value={progress}
              aria-label="پیشرفت به سطح نقره‌ای"
              aria-valuetext={`${Math.round(progress)} درصد`}
              className="h-2 bg-white/20 [&>div]:bg-white"
            />
          </div>
        </div>
      </motion.div>

      {/* سطوح کاربری */}
      <h3 className="mb-4 text-base font-bold text-foreground">
        سطوح وفاداری
      </h3>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {LEVELS.map((level, index) => (
          <LevelCard key={level.name} {...level} delay={index * 0.1} />
        ))}
      </div>

      {/* جوایز قابل دریافت */}
      <h3 className="mb-4 text-base font-bold text-foreground">
        جوایز ویژه
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REWARDS.map((reward, index) => (
          <RewardCard key={reward.title} {...reward} delay={index * 0.1} />
        ))}
      </div>
    </section>
  )
}
