// frontend/src/components/team/shared.tsx
// اجزای مشترک تیم: نگاشتار خطای TEAM_* به جمله‌ی فارسی، چیپ‌ها و بج‌ها — الگوی game/shared.tsx

import React from 'react'
import { Box, Chip, LinearProgress, Typography } from '@mui/material'
import { Icon } from '@iconify/react'
import { isAxiosError } from 'axios'

import type { TeamMemberStatus, TeamRole, TeamVisibility } from '@/types/team'
import { TEAM_MEMBER_STATUS_LABELS, TEAM_ROLE_LABELS, TEAM_VISIBILITY_LABELS } from '@/types/team'
import { toPersianDigits } from '@/lib/jalali'

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

const VISIBILITY_META: Record<TeamVisibility, { icon: string; fg: string; bg: string }> = {
  public: { icon: 'mdi:web', fg: '#059669', bg: 'rgba(16,185,129,0.08)' },
  invite_only: { icon: 'mdi:email-lock-outline', fg: '#b45309', bg: 'rgba(245,158,11,0.10)' },
  private: { icon: 'mdi:lock-outline', fg: '#64748b', bg: 'rgba(100,116,139,0.10)' },
}

export const TeamVisibilityChip: React.FC<{ visibility: TeamVisibility }> = ({ visibility }) => {
  const c = VISIBILITY_META[visibility] ?? VISIBILITY_META.private
  return (
    <Chip
      size="small"
      icon={<Icon icon={c.icon} style={{ width: 14, height: 14 }} />}
      label={TEAM_VISIBILITY_LABELS[visibility] ?? visibility}
      sx={{
        height: 24,
        borderRadius: '999px',
        fontWeight: 600,
        fontSize: '0.68rem',
        bgcolor: c.bg,
        color: c.fg,
        '& .MuiChip-icon': { color: c.fg },
        '& .MuiChip-label': { px: 1 },
      }}
    />
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
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.9,
        py: 0.25,
        borderRadius: '999px',
        bgcolor: c.bg,
        color: c.fg,
        fontSize: '0.66rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      <Icon icon={c.icon} style={{ width: 13, height: 13 }} />
      {TEAM_ROLE_LABELS[role] ?? role}
    </Box>
  )
}

const MEMBER_STATUS_META: Record<TeamMemberStatus, { fg: string; icon: string }> = {
  active: { fg: '#059669', icon: 'mdi:check-circle-outline' },
  pending: { fg: '#b45309', icon: 'mdi:clock-outline' },
  removed: { fg: '#94a3b8', icon: 'mdi:account-remove-outline' },
  declined: { fg: '#94a3b8', icon: 'mdi:close-circle-outline' },
}

export const MemberStatusChip: React.FC<{ status: TeamMemberStatus }> = ({ status }) => {
  const m = MEMBER_STATUS_META[status] ?? MEMBER_STATUS_META.active
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, fontSize: '0.7rem', fontWeight: 700, color: m.fg }}>
      <Icon icon={m.icon} style={{ width: 13, height: 13 }} />
      {TEAM_MEMBER_STATUS_LABELS[status] ?? status}
    </Box>
  )
}

/** وضعیت حصه — ترکیب paid/voided/overdue در یک چیپ */
export const DueStatusChip: React.FC<{ isPaid: boolean; isVoided: boolean; overdue: boolean }> = ({
  isPaid,
  isVoided,
  overdue,
}) => {
  const meta = isVoided
    ? { label: 'باطل', fg: '#94a3b8', bg: 'rgba(100,116,139,0.10)' }
    : isPaid
      ? { label: 'پرداخت‌شده', fg: '#059669', bg: 'rgba(16,185,129,0.10)' }
      : overdue
        ? { label: 'گذشته از سررسید', fg: '#dc2626', bg: 'rgba(239,68,68,0.10)' }
        : { label: 'پرداخت‌نشده', fg: '#b45309', bg: 'rgba(245,158,11,0.12)' }
  return (
    <Chip
      size="small"
      label={meta.label}
      sx={{
        height: 24,
        borderRadius: '999px',
        fontWeight: 700,
        fontSize: '0.68rem',
        bgcolor: meta.bg,
        color: meta.fg,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  )
}

// ─────────────────────────── وضعیت رسمی‌شدن تیم ───────────────────────────

/** بج «رسمی ✅» — وقتی تیم به حد نصاب اعضا رسیده باشد */
export const TeamOfficialBadge: React.FC<{ size?: 'small' | 'medium' }> = ({ size = 'small' }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.4,
      px: 0.9,
      py: 0.25,
      borderRadius: '999px',
      bgcolor: 'rgba(124,58,237,0.10)',
      color: '#7c3aed',
      fontSize: size === 'small' ? '0.66rem' : '0.72rem',
      fontWeight: 800,
      whiteSpace: 'nowrap',
    }}
  >
    <Icon icon="mdi:shield-star-outline" style={{ width: size === 'small' ? 13 : 15, height: size === 'small' ? 13 : 15 }} />
    {'رسمی ✅'}
  </Box>
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
  const color = reached ? '#7c3aed' : '#2563eb'
  return (
    <Box sx={{ minWidth: compact ? 108 : 150 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.75, mb: 0.5 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, color: '#334155', fontSize: '0.72rem', fontWeight: 700 }}>
          <Icon icon="mdi:account-group-outline" style={{ width: 14, height: 14 }} />
          {total > 0
            ? `${toPersianDigits(memberCount)} از ${toPersianDigits(total)} عضو`
            : `${toPersianDigits(memberCount)} عضو`}
        </Box>
        {isOfficial && <TeamOfficialBadge />}
      </Box>
      {total > 0 && (
        <LinearProgress
          variant="determinate"
          value={ratio * 100}
          sx={{
            height: 5,
            borderRadius: 999,
            bgcolor: 'rgba(15,23,42,0.06)',
            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 999 },
          }}
        />
      )}
      {showHint && !isOfficial && total > 0 && (
        <Typography sx={{ fontSize: '0.66rem', color: '#b45309', mt: 0.5, fontWeight: 600 }}>
          {`برای رسمی‌شدن تیم به حداقل ${toPersianDigits(total)} عضو نیاز دارید`}
        </Typography>
      )}
    </Box>
  )
}