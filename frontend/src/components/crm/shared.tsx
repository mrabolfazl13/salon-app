// frontend/src/components/crm/shared.tsx
// رنگ/برچسب segment، موقعیت‌ها و کدهای دسترسی (آینه‌ی utils/permissions.py)،
// پنل ۴۰۳ دوستانه و چیپ‌های مشترک کنسول CRM/کارکنان.

import React from 'react'
import { Box, Chip } from '@mui/material'
import { Icon } from '@iconify/react'
import { isAxiosError } from 'axios'
import ErrorState from '@/components/mobile/ErrorState'
import { extractError } from '@/components/finance/shared'
import type { CrmSegment } from '@/services/crm'
import type { StaffPosition } from '@/services/staff'

export const SEGMENT_LABELS: Record<CrmSegment, string> = {
  new: 'تازه',
  regular: 'معمولی',
  vip: 'ویژه',
  at_risk: 'در معرض ریزش',
  dormant: 'خاموش',
}

export const SEGMENT_COLORS: Record<CrmSegment, string> = {
  new: '#2563eb',
  regular: '#059669',
  vip: '#d97706',
  at_risk: '#ef4444',
  dormant: '#64748b',
}

export const SEGMENT_ORDER: CrmSegment[] = ['new', 'regular', 'vip', 'at_risk', 'dormant']

export const POSITION_LABELS: Record<StaffPosition, string> = {
  branch_manager: 'مدیر شعبه',
  reception: 'پذیرش',
  cashier: 'صندوقدار',
  accountant: 'حسابدار',
}

export const POSITION_DESCRIPTIONS: Record<StaffPosition, string> = {
  branch_manager: 'دسترسی کامل به همه‌ی بخش‌های پنل سالن (از جمله کارکنان و ممیزی)',
  reception: 'مدیریت رزرو و سانس، مشاهده پایه مشتری، انتشار شگفت‌انگیز و مشاهده قراردادها',
  cashier: 'مشاهده مالی، ثبت پرداخت و هزینه، مشاهده رزرو و پرداخت‌ها',
  accountant: 'امور مالی کامل (از جمله باطل‌سازی)، گزارش‌ها و مشاهده طلب‌ها',
}

export const POSITION_ORDER: StaffPosition[] = ['branch_manager', 'reception', 'cashier', 'accountant']

/** برچسب فارسی کد دسترسی (نمایشی؛ منبع اعتبارسنجی بک‌اند است) */
export const PERMISSION_LABELS: Record<string, string> = {
  'booking.view': 'مشاهده رزرو',
  'booking.confirm': 'تأیید رزرو',
  'booking.pending_list': 'لیست رزروهای در انتظار',
  'slot.view_manager': 'مشاهده مدیریتی سانس‌ها',
  'slot.generate': 'تولید سانس',
  'slot.block': 'مسدود/آزاد کردن سانس',
  'customer.view_basic': 'مشاهده پایه مشتری',
  'crm.view': 'مشاهده CRM',
  'crm.manage': 'مدیریت CRM',
  'finance.view': 'مشاهده مالی',
  'finance.record_payment': 'ثبت پرداخت',
  'finance.expense.create': 'ثبت هزینه',
  'finance.manage': 'مدیریت مالی (باطل‌سازی/خروجی)',
  'payment.view': 'مشاهده پرداخت‌ها',
  'reports.view': 'مشاهده گزارش‌ها',
  'receivables.view': 'مشاهده طلب‌ها',
  'contract.view': 'مشاهده قراردادها',
  'contract.manage': 'مدیریت قراردادها',
  'deal.publish': 'انتشار شگفت‌انگیز',
  'coupon.manage': 'مدیریت کدهای تخفیف',
  'pricing.manage': 'مدیریت قیمت‌گذاری',
  'holiday.manage': 'مدیریت تعطیلات',
  'staff.manage': 'مدیریت کارکنان',
  'staff.audit': 'ممیزی کارکنان',
}

export const SegmentChip: React.FC<{ segment: string; small?: boolean }> = ({ segment }) => (
  <Chip
    size='small'
    label={SEGMENT_LABELS[segment] ?? segment}
    sx={{
      borderRadius: '8px',
      fontWeight: 700,
      fontSize: '0.68rem',
      height: 22,
      bgcolor: `${SEGMENT_COLORS[segment] ?? '#6b7280'}18`,
      color: SEGMENT_COLORS[segment] ?? '#6b7280',
    }}
  />
)

export const ConsentIcon: React.FC<{ consent: boolean }> = ({ consent }) => (
  <Icon
    icon={consent ? 'mdi:email-check-outline' : 'mdi:email-off-outline'}
    className="h-4 w-4"
    style={{ color: consent ? '#059669' : '#9ca3af' }}
  />
)

// ─────────────── مدیریت ۴۰۳ ───────────────

export function isForbidden(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 403
}

/** پنل ۴۰۳ — بک‌اند per-permission تصمیم می‌گیرد؛ مسیر پنهان نمی‌شود */
export const ForbiddenPanel: React.FC<{ detail?: string }> = ({ detail }) => (
  <ErrorState
    title="دسترسی ندارید (۴۰۳)"
    description={
      detail ||
      'حساب شما برای این بخش از پنل مشتری اجازه لازم را ندارد؛ از مدیر سالن بخواهید دسترسی مربوط را در بخش «پرسنل» برایتان فعال کند.'
    }
  />
)

/** نمایش خطای فارسی درخواست CRM/کارکنان */
export function crmErrorMessage(err: unknown, fallback: string): string {
  if (isForbidden(err)) return 'شما اجازه دسترسی به این بخش را ندارید (۴۰۳).'
  return extractError(err, fallback)
}

/** ردیف‌های نمودار دسترسی‌ها — بر اساس کد دسترسی (مرتب، مطابق ALL_PERMISSION_CODES) */
export const PermissionMatrixRow: React.FC<{
  code: string
  allowedFor: Set<string>[]
}> = ({ code, allowedFor }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1.6fr) repeat(4, minmax(44px,0.6fr))',
      alignItems: 'center',
      gap: 0.5,
      px: 1.5,
      py: 0.75,
      borderBottom: '1px solid rgba(15,23,42,0.05)',
      '&:hover': { bgcolor: 'rgba(37,99,235,0.03)' },
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Box component="span" sx={{ fontSize: '0.78rem', fontWeight: 700 }}>
        {PERMISSION_LABELS[code] ?? code}
      </Box>
      <Box component="span" sx={{ fontSize: '0.66rem', color: 'text.secondary', mr: 1 }} dir="ltr">
        {code}
      </Box>
    </Box>
    {allowedFor.map((set, i) => (
      <Box key={i} sx={{ textAlign: 'center' }}>
        {set.has(code) ? (
          <Icon icon="mdi:check-circle" className="h-4 w-4" style={{ color: '#059669' }} />
        ) : (
          <Icon icon="mdi:minus-circle-outline" className="h-4 w-4" style={{ color: '#d1d5db' }} />
        )}
      </Box>
    ))}
  </Box>
)
// ─────────────── وضعیت رزرو ───────────────

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار',
  confirmed: 'تأییدشده',
  completed: 'انجام‌شده',
  cancelled: 'لغوشده',
}

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: '#d97706',
  confirmed: '#2563eb',
  completed: '#059669',
  cancelled: '#ef4444',
}

export const BookingStatusChip: React.FC<{ status: string }> = ({ status }) => (
  <Chip
    label={BOOKING_STATUS_LABELS[status] ?? status}
    size="small"
    sx={{
      borderRadius: '8px',
      fontWeight: 700,
      fontSize: '0.66rem',
      height: 20,
      bgcolor: `${BOOKING_STATUS_COLORS[status] ?? '#6b7280'}18`,
      color: BOOKING_STATUS_COLORS[status] ?? '#6b7280',
    }}
  />
)