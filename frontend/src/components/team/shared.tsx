// frontend/src/components/team/shared.tsx
// اجزای مشترک تیم: نگاشتار خطای TEAM_* به جمله‌ی فارسی، چیپ‌ها و بج‌ها — الگوی game/shared.tsx

import React from 'react'
import { Icon } from '@iconify/react'
import { isAxiosError } from 'axios'
import { chipInk, readableText } from '@/utils/contrast'
import { cn } from '@/lib/utils'

import type { TeamMemberStatus, TeamRole, TeamVisibility } from '@/types/team'
import { TEAM_MEMBER_STATUS_LABELS, TEAM_ROLE_LABELS, TEAM_VISIBILITY_LABELS } from '@/types/team'
import { toPersianDigits } from '@/lib/jalali'
import { Progress } from '@/components/ui/shadcn/progress'

/**
 * پیام‌های فارسی خطاهای ساختارمند تیم (detail = {code, message}).
 * کد اولویت دارد تا راهنمای عملیِ دقیق‌تر از پیام generic سرور بدهیم؛
 * در نبود کدِ شناخته‌شده، message سرور و در نهایت رشته‌ی detail استفاده می‌شود.
 */
const TEAM_ERROR_MESSAGES: Record<string, string> = {
  TEAM_NOT_FOUND: 'تیم مورد نظر یافت نشد — ممکن است حذف یا غیرفعال شده باشد.',
  TEAM_NAME_TAKEN: 'شما تیمی با همین نام دارید؛ لطفاً نام دیگری انتخاب کنید.',
  TEAM_INACTIVE: 'این تیم غیرفعال است و این عملیات روی تیم غیرفعال مجاز نیست.',
  TEAM_FULL: 'ظرفیت تیم تکمیل است (حداکثر ۵۰ نفر).',
  PRIVATE_TEAM: 'این تیم خصوصی است و فقط اعضا می‌توانند آن را ببینند.',
  NOT_A_MEMBER: 'شما عضو فعال این تیم نیستید.',
  NOT_AUTHORIZED: 'فقط کاپیتان یا مدیر تیم می‌تواند این کار را انجام دهد.',
  ONLY_CAPTAIN: 'این اقدام فقط برای کاپیتان تیم مجاز است.',
  ONLY_CAPTAIN_FOR_ADMINS: 'حذف یک مدیر فقط توسط کاپیتان مجاز است.',
  ALREADY_MEMBER: 'این کاربر از قبل عضو تیم است.',
  ALREADY_PENDING: 'دعوت این کاربر ارسال شده و در انتظار پاسخ است.',
  USER_NOT_FOUND: 'کاربری با این مشخصات پیدا نشد — مخاطب باید ابتدا ثبت‌نام کرده باشد.',
  INVITATION_NOT_FOUND: 'دعوت‌نامه یافت نشد یا متعلق به شما نیست.',
  INVITATION_ALREADY_ANSWERED: 'این دعوت قبلاً پاسخ داده شده است.',
  INVITE_EXPIRED: 'اعتبار این دعوت به پایان رسیده است.',
  USE_LEAVE: 'برای خروج از تیم از دکمه‌ی «خروج از تیم» استفاده کنید.',
  CANNOT_REMOVE_CAPTAIN: 'کاپیتان قابل حذف نیست؛ ابتدا کاپیتانی را به عضو دیگری منتقل کنید.',
  CANNOT_CHANGE_CAPTAIN_ROLE: 'نقش کاپیتان قابل تغییر نیست؛ از «انتقال کاپیتانی» استفاده کنید.',
  CAPTAIN_MUST_TRANSFER: 'کاپیتان نمی‌تواند از تیم خارج شود؛ ابتدا کاپیتانی را منتقل کنید یا تیم را غیرفعال نمایید.',
  ALREADY_CAPTAIN: 'شما هم‌اکنون کاپیتان این تیم هستید.',
  INVALID_ROLE: 'نقش قابل انتصاب فقط مدیر یا عضو عادی است.',
  NO_CHANGES: 'هیچ تغییری برای ذخیره ارسال نشده است.',
  JOIN_NOT_ALLOWED: 'ورود به این تیم فقط با دعوت مستقیم مدیران امکان‌پذیر است.',
  ALREADY_REQUESTED: 'درخواست شما ثبت شده و در انتظار بررسی است.',
  REQUEST_NOT_FOUND: 'درخواست یافت نشد یا قبلاً بررسی شده است.',
  NO_MEMBERS: 'عضو فعالی برای این اقدام وجود ندارد.',
  BAD_DUE_DATE: 'تاریخ سررسید حصه نمی‌تواند در گذشته باشد.',
  DUE_NOT_FOUND: 'سهم مورد نظر یافت نشد.',
  DUE_ALREADY_PAID: 'این سهم از قبل پرداخت شده است.',
  DUE_VOIDED: 'این سهم باطل شده است.',
  BOOKING_NOT_FOUND: 'رزرو مورد نظر یافت نشد.',
  NOT_MY_BOOKING: 'فقط صاحب رزرو می‌تواند آن را به تیم منتسب کند.',
  ALREADY_LINKED: 'این رزرو قبلاً به همین تیم منتسب شده است.',
  BOOKING_LINKED_ELSEWHERE: 'این رزرو به تیم دیگری منتسب شده است.',
  CHALLENGE_NOT_FOUND: 'چالش بازی یافت نشد یا متعلق به تیم‌های شما نیست.',
  CHALLENGE_EXPIRED: 'مهلت پاسخ به این چالش تمام شده است؛ می‌توانید چالش جدیدی بفرستید.',
  CHALLENGE_ALREADY_ANSWERED: 'این چالش پیش‌تر پاسخ گرفته است و دوباره قابل پذیرش یا رد نیست.',
  CHALLENGE_OPEN_EXISTS: 'بین این دو تیم یک چالش باز وجود دارد؛ پیش از پاسخ آن چالش جدید نفرستید.',
  SELF_CHALLENGE: 'به تیم خودتان چالش بازی نفرستید.',
  VENUE_NOT_FOUND: 'سالن پیشنهادی یافت نشد — آن را از فهرست سالن‌ها انتخاب کنید.',
}

export function getTeamError(err: unknown, fallback = 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (detail && typeof detail === 'object' && typeof (detail as { code?: unknown }).code === 'string') {
      const code = (detail as { code: string }).code
      if (TEAM_ERROR_MESSAGES[code]) return TEAM_ERROR_MESSAGES[code]
      const msg = (detail as { message?: unknown }).message
      if (typeof msg === 'string' && msg) return msg
    }
    if (typeof detail === 'string' && detail) return detail
  }
  return fallback
}

export const SPORT_EMOJI: Record<string, string> = {
  football: '⚽', futsal: '⚽', basketball: '🏀', volleyball: '🏐',
  tennis: '🎾', badminton: '🏸', gym: '🏋️', pool: '🎱',
}

/** برچسب فارسی ورزش — برای aria-label آیکن‌های ایموجی (دسترسی‌پذیری) */
export const SPORT_NAME_FA: Record<string, string> = {
  football: 'فوتبال', futsal: 'فوتسال', basketball: 'بسکتبال', volleyball: 'والیبال',
  tennis: 'تنیس', badminton: 'بدمینتون', gym: 'بدنسازی', pool: 'بیلیارد',
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

const inkStyle = (fg: string): React.CSSProperties =>
  ({
    '--chip-ink': readableText(fg, PAPER_LIGHT),
    '--chip-ink-dark': readableText(fg, PAPER_DARK),
  }) as React.CSSProperties

const CHIP_INK = 'text-[color:var(--chip-ink)] dark:text-[color:var(--chip-ink-dark)]'

const VISIBILITY_META: Record<TeamVisibility, { icon: string; fg: string; bg: string }> = {
  public: { icon: 'mdi:web', fg: '#059669', bg: 'rgba(16,185,129,0.08)' },
  invite_only: { icon: 'mdi:email-lock-outline', fg: '#b45309', bg: 'rgba(245,158,11,0.10)' },
  private: { icon: 'mdi:lock-outline', fg: '#64748b', bg: 'rgba(100,116,139,0.10)' },
}

export const TeamVisibilityChip: React.FC<{ visibility: TeamVisibility }> = ({ visibility }) => {
  const c = VISIBILITY_META[visibility] ?? VISIBILITY_META.private
  // «عمومی» با #059669 روی تیغِ خودش ۳٫۴۸:۱ داشت — ممیزی axe F-21
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full ps-1.5 pe-2 text-[0.68rem] font-semibold',
        CHIP_INK,
      )}
      style={chipStyle(c.fg, c.bg)}
    >
      <Icon icon={c.icon} style={{ width: 14, height: 14 }} />
      {TEAM_VISIBILITY_LABELS[visibility] ?? visibility}
    </span>
  )
}

const ROLE_META: Record<TeamRole, { fg: string; bg: string; icon: string }> = {
  captain: { fg: '#7c3aed', bg: 'rgba(124,58,237,0.10)', icon: 'mdi:crown-outline' },
  admin: { fg: '#2563eb', bg: 'rgba(37,99,235,0.10)', icon: 'mdi:shield-account-outline' },
  member: { fg: '#64748b', bg: 'rgba(100,116,139,0.10)', icon: 'mdi:account-outline' },
}

export const TeamRoleBadge: React.FC<{ role: TeamRole }> = ({ role }) => {
  const c = ROLE_META[role] ?? ROLE_META.member
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-[7px] py-0.5 text-[0.68rem] font-bold',
        CHIP_INK,
      )}
      style={chipStyle(c.fg, c.bg)}
    >
      <Icon icon={c.icon} style={{ width: 13, height: 13 }} />
      {TEAM_ROLE_LABELS[role] ?? role}
    </span>
  )
}

const MEMBER_STATUS_META: Record<TeamMemberStatus, { fg: string; icon: string }> = {
  active: { fg: '#059669', icon: 'mdi:check-circle-outline' },
  pending: { fg: '#b45309', icon: 'mdi:clock-outline' },
  removed: { fg: '#64748b', icon: 'mdi:account-remove-outline' },
  declined: { fg: '#64748b', icon: 'mdi:close-circle-outline' },
}

export const MemberStatusChip: React.FC<{ status: TeamMemberStatus }> = ({ status }) => {
  const m = MEMBER_STATUS_META[status] ?? MEMBER_STATUS_META.active
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-[0.68rem] font-bold', CHIP_INK)}
      style={inkStyle(m.fg)}
    >
      <Icon icon={m.icon} style={{ width: 13, height: 13 }} />
      {TEAM_MEMBER_STATUS_LABELS[status] ?? status}
    </span>
  )
}

/** وضعیت حصه — ترکیب paid/voided/overdue در یک چیپ */
export const DueStatusChip: React.FC<{ isPaid: boolean; isVoided: boolean; overdue: boolean }> = ({
  isPaid,
  isVoided,
  overdue,
}) => {
  const meta = isVoided
    ? { label: 'باطل', fg: '#64748b', bg: 'rgba(100,116,139,0.10)' }
    : isPaid
      ? { label: 'پرداخت‌شده', fg: '#059669', bg: 'rgba(16,185,129,0.10)' }
      : overdue
        ? { label: 'گذشته از سررسید', fg: '#dc2626', bg: 'rgba(239,68,68,0.10)' }
        : { label: 'پرداخت‌نشده', fg: '#b45309', bg: 'rgba(245,158,11,0.12)' }
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center whitespace-nowrap rounded-full px-2 text-[0.68rem] font-bold',
        CHIP_INK,
      )}
      style={chipStyle(meta.fg, meta.bg)}
    >
      {meta.label}
    </span>
  )
}

// ─────────────────────────── وضعیت رسمی‌شدن تیم ───────────────────────────

/** بج «رسمی» — وقتی تیم به حد نصاب اعضا رسیده باشد */
export const TeamOfficialBadge: React.FC<{ size?: 'small' | 'medium' }> = ({ size = 'small' }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-[7px] py-0.5 text-[0.68rem] font-extrabold',
      CHIP_INK,
    )}
    style={chipStyle('#7c3aed', 'rgba(124,58,237,0.10)')}
  >
    <Icon
      icon="mdi:shield-star-outline"
      style={{ width: size === 'small' ? 13 : 15, height: size === 'small' ? 13 : 15 }}
    />
    {'رسمی'}
  </span>
)

/** نوار پیشرفت «X از Y عضو» + بج رسمی + راهنمای حد نصاب (فقط برای اعضا/مدیران) */
export const TeamQuotaProgress: React.FC<{
  memberCount: number
  quota: number
  isOfficial?: boolean
  showHint?: boolean
  compact?: boolean
}> = ({ memberCount, quota, isOfficial = false, showHint = false, compact = false }) => {
  const total = quota > 0 ? quota : 0
  const ratio = total > 0 ? Math.min(memberCount / total, 1) : 0
  const reached = isOfficial || (total > 0 && memberCount >= total)
  return (
    // روی موبایل عرض ۱۵۰px + متن بلندِ راهنما فضای نام تیم را صفر می‌کرد و
    // هر دو روی هم می‌افتادند؛ در xs کل ردیف را می‌گیرد و زیر عنوان می‌نشیند.
    <div className={cn('min-w-0 shrink-0', compact ? 'w-[108px]' : 'w-full sm:w-[150px]')}>
      <div className="mb-1 flex items-center justify-between gap-1.5">
        <div className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-slate-700 dark:text-slate-300">
          <Icon icon="mdi:account-group-outline" style={{ width: 14, height: 14 }} />
          {total > 0
            ? `${toPersianDigits(memberCount)} از ${toPersianDigits(total)} عضو`
            : `${toPersianDigits(memberCount)} عضو`}
        </div>
        {isOfficial && <TeamOfficialBadge />}
      </div>
      {total > 0 && (
        <Progress
          value={ratio * 100}
          aria-label="پیشرفت عضویت تیم"
          aria-valuetext={`${toPersianDigits(memberCount)} از ${toPersianDigits(total)} عضو`}
          className={cn(
            'h-[5px] bg-slate-900/[0.06] dark:bg-white/10',
            reached ? '[&>div]:bg-[#7c3aed]' : '[&>div]:bg-[#2563eb]',
          )}
        />
      )}
      {showHint && !isOfficial && total > 0 && (
        <p className="mt-1 text-[0.68rem] font-semibold text-amber-700 dark:text-amber-400">
          {`برای رسمی‌شدن تیم به حداقل ${toPersianDigits(total)} عضو نیاز دارید`}
        </p>
      )}
    </div>
  )
}
