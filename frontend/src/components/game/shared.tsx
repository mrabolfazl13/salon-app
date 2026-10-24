// frontend/src/components/game/shared.tsx
// اجزای مشترک بازی‌ها: چیپ‌ها، نوار ظرفیت، خطایار — سبک هم‌راستا با VenueCard

import React from 'react'
import { Icon } from '@iconify/react'
import { isAxiosError } from 'axios'
import { chipInk } from '@/utils/contrast'
import { cn, formatTimeFa } from '@/lib/utils'
import { Progress } from '@/components/ui/shadcn/progress'

import {
  GAME_STATUS_LABELS,
  GAME_VISIBILITY_LABELS,
  PARTICIPANT_ROLE_LABELS,
  SKILL_LEVEL_LABELS,
} from '@/types/game'
import type {
  GameStatus,
  GameVisibility,
  ParticipantRole,
  SkillLevel,
} from '@/types/game'
import { formatPersianDate } from '@/utils/helpers'

/**
 * پیام فارسی خطای بازی — بک‌اند ساختار {detail: {code, message}} برمی‌گرداند؛
 * مسیرهای قدیمی‌تر string ساده. (fallback برای خطاهای شبکه)
 */
export function getGameError(err: unknown, fallback = 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (detail && typeof detail === 'object' && typeof detail.message === 'string') return detail.message
    if (typeof detail === 'string' && detail) return detail
  }
  return fallback
}

/** پیام فارسیِ خطاهای ثبت نتیجه بازی — کدهای ساختارمند بک‌اند اول ترجمه می‌شوند */
const GAME_RESULT_ERRORS: Record<string, string> = {
  RESULT_ALREADY_SET: 'برای این بازی قبلاً نتیجه ثبت شده است.',
  WINNER_NOT_PARTICIPANT: 'برندگان باید از شرکت‌کننده‌های فعلی بازی باشند.',
  NOT_AUTHORIZED: 'فقط برگزارکننده یا مدیر بازی می‌تواند نتیجه را ثبت کند.',
  GAME_NOT_FOUND: 'بازی مورد نظر یافت نشد.',
  GAME_CANCELLED: 'این بازی لغو شده و ثبت نتیجه ممکن نیست.',
}

export function getGameResultError(err: unknown, fallback = 'ثبت نتیجه ممکن نشد. لطفاً دوباره تلاش کنید.'): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail
    const code =
      detail && typeof detail === 'object' && typeof (detail as { code?: unknown }).code === 'string'
        ? (detail as { code: string }).code
        : undefined
    if (code && GAME_RESULT_ERRORS[code]) return GAME_RESULT_ERRORS[code]
  }
  return getGameError(err, fallback)
}

const STATUS_COLORS: Record<GameStatus, { bg: string; fg: string; icon: string }> = {
  draft: { bg: 'rgba(100,116,139,0.10)', fg: '#64748b', icon: 'mdi:file-document-outline' },
  open: { bg: 'rgba(16,185,129,0.10)', fg: '#059669', icon: 'mdi:account-group-outline' },
  full: { bg: 'rgba(245,158,11,0.12)', fg: '#b45309', icon: 'mdi:account-multiple-outline' },
  started: { bg: 'rgba(37,99,235,0.10)', fg: '#2563eb', icon: 'mdi:play-circle-outline' },
  completed: { bg: 'rgba(124,58,237,0.10)', fg: '#7c3aed', icon: 'mdi:check-decagram' },
  cancelled: { bg: 'rgba(239,68,68,0.10)', fg: '#dc2626', icon: 'mdi:close-circle-outline' },
}

// کاغذِ روشن/تیره برای سنجش کنتراست جوهرِ چیپ‌ها (جایگزین palette.background.paper)
const PAPER_LIGHT = '#ffffff'
const PAPER_DARK = '#121a2b'

/** جوهرِ خواناتر برای هر دو تم؛ با متغیر CSS تا کلاس dark بتواند جایگزینش کند */
const chipStyle = (fg: string, bg: string): React.CSSProperties =>
  ({
    backgroundColor: bg,
    '--chip-ink': chipInk(fg, bg, PAPER_LIGHT),
    '--chip-ink-dark': chipInk(fg, bg, PAPER_DARK),
  }) as React.CSSProperties

export const GameStatusChip: React.FC<{ status: GameStatus; size?: 'small' | 'medium' }> = ({
  status,
  size = 'small',
}) => {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.draft
  // «باز» با #059669 روی تیغِ خودش ۳٫۴۸:۱ بود — ممیزی axe F-21
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full font-bold text-[0.68rem] text-[color:var(--chip-ink)] dark:text-[color:var(--chip-ink-dark)]',
        size === 'small' ? 'h-[26px] px-2' : 'h-8 px-2.5'
      )}
      style={chipStyle(c.fg, c.bg)}
    >
      <Icon icon={c.icon} style={{ width: 15, height: 15 }} />
      {GAME_STATUS_LABELS[status] ?? status}
    </span>
  )
}

export const VisibilityChip: React.FC<{ visibility: GameVisibility }> = ({ visibility }) => {
  const map: Record<GameVisibility, { icon: string; fg: string; bg: string }> = {
    public: { icon: 'mdi:web', fg: '#059669', bg: 'rgba(16,185,129,0.08)' },
    public_approval: { icon: 'mdi:shield-check-outline', fg: '#b45309', bg: 'rgba(245,158,11,0.10)' },
    private: { icon: 'mdi:lock-outline', fg: '#64748b', bg: 'rgba(100,116,139,0.10)' },
  }
  const c = map[visibility]
  return (
    <span
      className="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full ps-1 pe-2 text-[0.68rem] font-semibold text-[color:var(--chip-ink)] dark:text-[color:var(--chip-ink-dark)]"
      style={chipStyle(c.fg, c.bg)}
    >
      <Icon icon={c.icon} style={{ width: 14, height: 14 }} />
      {GAME_VISIBILITY_LABELS[visibility] ?? visibility}
    </span>
  )
}

export const SkillChip: React.FC<{ level: SkillLevel }> = ({ level }) => (
  <span className="inline-flex h-6 items-center rounded-full bg-blue-600/[0.06] px-2 text-[0.68rem] font-semibold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
    {SKILL_LEVEL_LABELS[level] ?? level}
  </span>
)

const ROLE_COLORS: Record<ParticipantRole, { fg: string; bg: string; icon: string }> = {
  organizer: { fg: '#7c3aed', bg: 'rgba(124,58,237,0.10)', icon: 'mdi:crown-outline' },
  admin: { fg: '#2563eb', bg: 'rgba(37,99,235,0.10)', icon: 'mdi:shield-account-outline' },
  member: { fg: '#64748b', bg: 'rgba(100,116,139,0.10)', icon: 'mdi:account-outline' },
}

export const RoleBadge: React.FC<{ role: ParticipantRole }> = ({ role }) => {
  const c = ROLE_COLORS[role] ?? ROLE_COLORS.member
  return (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-[7px] py-0.5 text-[0.68rem] font-bold"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      <Icon icon={c.icon} style={{ width: 13, height: 13 }} />
      {PARTICIPANT_ROLE_LABELS[role] ?? role}
    </span>
  )
}

/** نوار ظرفیت — «۳/۸ نفر» + پیشرفت رنگی */
export const CapacityBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const ratio = max > 0 ? Math.min(current / max, 1) : 0
  return (
    <div className="min-w-[90px]">
      <div className="mb-1 flex items-center gap-2">
        <Icon
          icon="mdi:account-group-outline"
          style={{ width: 15, height: 15, color: ratio >= 1 ? '#f59e0b' : '#10b981' }}
        />
        <span className="text-[0.68rem] font-bold text-slate-700 dark:text-slate-300">
          {`${current.toLocaleString('fa-IR')}/${max.toLocaleString('fa-IR')}`}
        </span>
      </div>
      <Progress
        value={ratio * 100}
        aria-label="ظرفیت شرکت‌کننده‌ها"
        aria-valuetext={`${current.toLocaleString('fa-IR')} از ${max.toLocaleString('fa-IR')} نفر`}
        className={cn(
          'h-[5px] bg-slate-900/[0.06] dark:bg-white/10',
          ratio >= 1 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'
        )}
      />
    </div>
  )
}

/** «۱۴۰۴/۰۶/۱۹ - ۱۸:۰۰» از slot_date + start_time بک‌اند */
export function formatGameDateTime(slotDate?: string | null, startTime?: string | null): string {
  if (!slotDate) return '—'
  const d = formatPersianDate(slotDate)
  const t = startTime ? formatTimeFa(startTime) : ''
  return t ? `${d} - ${t}` : d
}
