// frontend/src/components/game/GameCard.tsx
// کارت بازی در صفحه کشف — موبایل‌فرست، هم‌الگو با VenueCard

import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Link } from 'react-router-dom'

import type { Game } from '@/types/game'
import { PAYMENT_MODE_LABELS } from '@/types/game'
import { SPORT_NAME_FA } from '@/components/team/shared'
import { CapacityBar, GameStatusChip, SkillChip, VisibilityChip, formatGameDateTime } from './shared'

interface Props {
  game: Game
  /** نمایش وضعیت کاربر روی کارت (عضو/در انتظار/لیست انتظار...) */
  showMyStatus?: boolean
}

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽',
  futsal: '⚽',
  basketball: '🏀',
  volleyball: '🏐',
  tennis: '🎾',
  badminton: '🏸',
  gym: '🏋️',
  pool: '🎱',
}

const MY_STATUS_BADGE: Record<string, { label: string; fg: string; bg: string }> = {
  accepted: { label: 'عضو هستید', fg: '#059669', bg: 'rgba(16,185,129,0.12)' },
  pending: { label: 'در انتظار تأیید', fg: '#b45309', bg: 'rgba(245,158,11,0.14)' },
  invited: { label: 'دعوت‌نامه دارید', fg: '#2563eb', bg: 'rgba(37,99,235,0.10)' },
}

const GameCard: React.FC<Props> = ({ game, showMyStatus = true }) => {
  const href = `/games/${game.id}`
  const remaining = Math.max(game.max_players - game.current_players, 0)
  const myBadge = showMyStatus && game.my_participant_status
    ? MY_STATUS_BADGE[game.my_participant_status]
    : undefined

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ height: '100%' }}
    >
      <Link
        to={href}
        className="flex h-full flex-col overflow-hidden rounded-[20px] border border-border bg-card text-inherit no-underline shadow-[0_1px_3px_rgba(15,23,42,0.05),0_8px_24px_rgba(15,23,42,0.05)] transition-[box-shadow,border-color] duration-200 hover:border-blue-600/25 hover:shadow-[0_4px_12px_rgba(15,23,42,0.07),0_16px_40px_rgba(15,23,42,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_8px_24px_rgba(0,0,0,0.3)]"
      >
        <div className="flex flex-1 flex-col gap-2.5 p-4">
          {/* هدر: ایموجی ورزش + نام + وضعیت */}
          <div className="flex min-w-0 items-start gap-2.5">
            <div
              role="img"
              aria-label={SPORT_NAME_FA[game.sport] ?? game.sport}
              className="flex h-9 w-11 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-blue-600/[0.08] to-violet-600/[0.08] text-[1.4rem]"
            >
              {SPORT_EMOJI[game.sport] ?? '⚽'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[0.98rem] font-extrabold leading-snug text-foreground">
                {game.name}
              </h3>
              <div className="flex min-w-0 items-center gap-2">
                <Icon icon="mdi:map-marker-outline" style={{ width: 15, height: 15, color: '#2563eb', flexShrink: 0 }} />
                <span className="truncate text-[0.78rem] text-muted-foreground">
                  {game.venue_name ?? '—'}
                </span>
              </div>
            </div>
            <div className="shrink-0">
              <GameStatusChip status={game.status} />
            </div>
          </div>

          {/* زمان + ظرفیت */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <Icon icon="mdi:clock-outline" style={{ width: 15, height: 15, color: '#64748b', flexShrink: 0 }} />
              <span className="whitespace-nowrap text-[0.8rem] font-semibold text-slate-700 dark:text-slate-300">
                {formatGameDateTime(game.slot_date, game.start_time)}
              </span>
              {game.distance_km != null && (
                <span className="inline-flex h-[22px] items-center rounded-full bg-violet-600/[0.08] px-2 text-[0.68rem] font-bold text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                  {`${game.distance_km.toLocaleString('fa-IR')} کیلومتر`}
                </span>
              )}
            </div>
            <CapacityBar current={game.current_players} max={game.max_players} />
          </div>

          {/* چیپ‌ها: سطح + حریم خصوصی + پرداخت */}
          <div className="flex flex-wrap gap-1">
            <SkillChip level={game.skill_level} />
            <VisibilityChip visibility={game.visibility} />
            <span className="inline-flex h-6 items-center rounded-full bg-slate-900/[0.05] px-2 text-[0.68rem] font-semibold text-muted-foreground dark:bg-white/[0.07]">
              {PAYMENT_MODE_LABELS[game.payment_mode] ?? game.payment_mode}
            </span>
          </div>

          {/* فوتر: قیمت + جای خالی / وضعیت من */}
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2.5">
            <div className="min-w-0">
              {game.payment_mode === 'free' || game.price_per_player == null ? (
                <p className="text-[0.85rem] font-extrabold text-emerald-600 dark:text-emerald-400">رایگان</p>
              ) : (
                <div className="inline-flex items-baseline gap-1">
                  <span dir="rtl" className="text-sm font-extrabold tabular-nums text-foreground">
                    {Math.round(game.price_per_player / 10).toLocaleString('fa-IR')}
                  </span>
                  <span className="text-[0.68rem] text-muted-foreground">تومان / نفر</span>
                </div>
              )}
            </div>
            {myBadge ? (
              <span
                className="whitespace-nowrap rounded-full px-2.5 py-1 text-[0.68rem] font-extrabold"
                style={{ backgroundColor: myBadge.bg, color: myBadge.fg }}
              >
                {myBadge.label}
              </span>
            ) : game.my_waitlist_position ? (
              <span className="whitespace-nowrap rounded-full bg-amber-500/[0.14] px-2.5 py-1 text-[0.68rem] font-extrabold text-amber-600 dark:text-amber-400">
                {`رتبه انتظار ${game.my_waitlist_position.toLocaleString('fa-IR')}`}
              </span>
            ) : (
              <p
                className={
                  remaining > 0
                    ? 'whitespace-nowrap text-[0.68rem] font-bold text-emerald-600 dark:text-emerald-400'
                    : 'whitespace-nowrap text-[0.68rem] font-bold text-amber-600 dark:text-amber-400'
                }
              >
                {remaining > 0 ? `${remaining.toLocaleString('fa-IR')} جای خالی` : 'تکمیل — لیست انتظار'}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default GameCard
