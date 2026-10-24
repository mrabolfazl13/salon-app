import type React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import SectionHeader from '@/components/mobile/SectionHeader'
import { Button } from '@/components/ui/shadcn/button'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { teamService } from '@/services/team'
import { useAuthStore } from '@/store/authStore'

interface LeaderboardPlayerProps {
  rank: number
  name: string
  avatar: string
  points: number
  gamesPlayed: number
  delay?: number
}

const LeaderboardPlayer: React.FC<LeaderboardPlayerProps> = ({ rank, name, avatar, points, gamesPlayed, delay = 0 }) => {
  const getRankStyle = (r: number) => {
    if (r === 1) return { bg: '#fbbf24', color: '#1c1917', icon: 'mdi:crown' }
    if (r === 2) return { bg: '#64748b', color: '#fff', icon: 'mdi:medal' }
    if (r === 3) return { bg: '#a16207', color: '#fff', icon: 'mdi:award-star' }
    return { bg: 'rgba(255,255,255,0.1)', color: '#fff', icon: null }
  }

  const style = getRankStyle(rank)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div
        className={`mb-1 flex items-center gap-2 rounded-lg p-2 transition-colors duration-200 hover:bg-white/[0.12] ${
          rank <= 3 ? 'border border-white/15 bg-white/[0.08]' : 'border border-transparent'
        }`}
      >
        {/* رتبه */}
        <span
          className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[0.75rem] font-black"
          style={{ backgroundColor: style.bg, color: style.color }}
        >
          {style.icon && (
            <Icon
              icon={style.icon}
              style={{
                width: rank === 1 ? 16 : 14,
                height: rank === 1 ? 16 : 14,
                position: 'absolute',
                top: -6,
                insetInlineStart: -6,
              }}
            />
          )}
          {rank}
        </span>

        {/* آواتار و نام */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-[0.72rem] font-bold text-white">
              {avatar}
            </span>
            <p className="truncate text-[0.78rem] font-bold text-white">
              {name}
            </p>
          </div>
          <p className="mt-0.5 text-[0.65rem] text-white/60">
            {gamesPlayed} بازی
          </p>
        </div>

        {/* امتیاز */}
        <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-[0.75rem] font-extrabold tabular-nums text-amber-400">
          {points.toLocaleString('fa-IR')}
        </span>
      </div>
    </motion.div>
  )
}

interface BadgeProps {
  icon: string
  name: string
  description: string
  color: string
  unlocked: boolean
  delay?: number
}

const Badge: React.FC<BadgeProps> = ({ icon, name, description, color, unlocked, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay }}
  >
    <div
      className="rounded-lg border border-border bg-card p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ borderColor: unlocked ? color : undefined, opacity: unlocked ? 1 : 0.5 }}
    >
      <span
        className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[14px]"
        style={{ backgroundColor: unlocked ? `${color}20` : 'rgba(0,0,0,0.05)' }}
      >
        <Icon icon={icon} style={{ width: 28, height: 28, color: unlocked ? color : '#9ca3af' }} />
      </span>
      <h3 className="mb-1 text-[0.85rem] font-bold text-foreground">
        {name}
      </h3>
      <p className="text-[0.68rem] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {!unlocked && (
        <span className="mt-2 inline-block rounded-md bg-black/5 px-2 py-0.5 text-[0.68rem] text-muted-foreground dark:bg-white/10">
          قفل شده
        </span>
      )}
    </div>
  </motion.div>
)

const BADGES = [
  {
    icon: 'mdi:star-shooting',
    name: 'ستاره درخشان',
    description: '۱۰ بازی متوالی بدون کنسل',
    color: '#fbbf24',
    unlocked: true,
  },
  {
    icon: 'mdi:soccer-field',
    name: 'بازیکن حرفه‌ای',
    description: '۵۰ بازی تکمیل شده',
    color: '#3b82f6',
    unlocked: true,
  },
  {
    icon: 'mdi:users',
    name: 'رهبر تیم',
    description: 'ساخت تیم با ۸ عضو فعال',
    color: '#10b981',
    unlocked: false,
  },
  {
    icon: 'mdi:trophy-variant',
    name: 'قهرمان مسابقات',
    description: 'برنده ۵ مسابقه',
    color: '#ef4444',
    unlocked: false,
  },
]

export const GamificationSection: React.FC = () => {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  // جدول واقعی لیگ (/teams/standings) — احراز هویت لازم دارد؛ مهمان CTA ورود می‌بیند
  const q = useQuery({
    queryKey: ['teams', 'standings', 5],
    queryFn: () => teamService.getStandings(5),
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: 0,
  })
  const items = q.data?.items ?? []

  return (
    <section className="mb-4">
      <SectionHeader
        title="چالش‌ها و جوایز"
        subtitle="بازی کن، امتیاز بگیر، جایزه ببر!"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* جدول امتیازات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-[20px] bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:trophy" style={{ width: 24, height: 24, color: '#fbbf24' }} />
                <h3 className="text-[1.1rem] font-extrabold">جدول برترین‌ها</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate(isAuthenticated ? '/teams' : '/login')}
                className="min-h-11 px-3 text-[0.78rem] font-bold text-amber-400 hover:bg-amber-400/10 hover:text-amber-300"
              >
                مشاهده همه
              </Button>
            </div>

            {q.isPending && isAuthenticated ? (
              [1, 2, 3].map((i) => (
                <Skeleton aria-hidden="true" key={i} className="mb-1 h-[62px] w-full rounded-xl bg-white/10" />
              ))
            ) : items.length === 0 ? (
              <p className="py-3 text-[0.68rem] text-white/[0.72]">
                هنوز جدولی منتشر نشده — بعد از اولین مسابقات رسمی همین‌جا پر می‌شود.
              </p>
            ) : (
              items.map((player, index) => (
                <LeaderboardPlayer
                  key={player.team_id}
                  rank={player.rank}
                  name={player.team_name}
                  avatar={player.team_name.trim().charAt(0)}
                  points={player.points}
                  gamesPlayed={player.played}
                  delay={index * 0.1}
                />
              ))
            )}
          </div>
        </motion.div>

        {/* نشان‌های افتخار */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="rounded-[20px] border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:badge-outline" style={{ width: 24, height: 24, color: '#3b82f6' }} />
                <h3 className="text-[1.1rem] font-extrabold text-foreground">نشان‌های افتخار</h3>
              </div>
              <p className="text-[0.78rem] text-muted-foreground">
                {BADGES.filter((b) => b.unlocked).length} از {BADGES.length} باز شده
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {BADGES.map((badge, index) => (
                <Badge key={badge.name} {...badge} delay={index * 0.1} />
              ))}
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={() => navigate('/profile')}
              className="mt-5 w-full py-3 font-bold"
            >
              مشاهده پروفایل من
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
