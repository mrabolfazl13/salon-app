// frontend/src/components/contract/shared.tsx
// نگارخانه‌ی مشترک قراردادها — نقشه‌ی مرکزی رنگ/برچسب وضعیت‌ها (کاربر + مدیر)،
// واحدهای پول (ریال — واحد دفترکل بک‌اند؛ بازنشر از finance/shared بدون تکرار)،
// کمک‌تابع‌های تاریخ/سانس و دیالوگ دلیل‌دار عمومی.

import React, { useEffect, useId, useState } from 'react'
import { Icon } from '@iconify/react'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/shadcn/button'
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert'
import { Label } from '@/components/ui/shadcn/label'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { cn } from '@/lib/utils'
import {
  faNum,
  formatRial,
  parseAmountInput,
  extractError,
  EmptyBox,
  ErrorBox,
  LoadingBox,
  SectionCard,
  StatusChip,
} from '@/components/finance/shared'
import { getTodayISO } from '@/lib/jalali'
import type { ContractPaymentData, ContractSessionData } from '@/services/contract'

// ─────────────── پول — واحد بک‌اند ریال است (دفتر کل) ───────────────

export { faNum, formatRial, parseAmountInput, extractError, EmptyBox, ErrorBox, LoadingBox, SectionCard, StatusChip }
export { toPersianDigits } from '@/lib/jalali'

// ─────────────── نقشه‌ی مرکزی وضعیت قرارداد ───────────────

export interface StatusMeta { label: string; color: string }

export const CONTRACT_STATUS_META: Record<string, StatusMeta> = {
  pending: { label: 'در انتظار تأیید', color: '#d97706' },
  active: { label: 'فعال', color: '#059669' },
  rejected: { label: 'رد شده', color: '#ef4444' },
  expired: { label: 'منقضی', color: '#6b7280' },
  cancelled: { label: 'لغو شده', color: '#be123c' },
  suspended: { label: 'معلق', color: '#7c3aed' },
}

export function contractStatusMeta(status: string | null | undefined): StatusMeta {
  return CONTRACT_STATUS_META[status ?? ''] ?? { label: status || 'نامشخص', color: '#6b7280' }
}

export const CONTRACT_TAB_STATUSES = ['pending', 'active', 'rejected', 'expired', 'cancelled'] as const

// ─────────────── وضعیت مالی قرارداد (payment_status) ───────────────

export const PAYMENT_STATUS_META: Record<string, StatusMeta> = {
  pending: { label: 'در انتظار پرداخت', color: '#6b7280' },
  partial: { label: 'پرداخت جزئی', color: '#d97706' },
  paid: { label: 'تسویه شده', color: '#059669' },
  overdue: { label: 'معوق', color: '#ef4444' },
}

export function paymentStatusMeta(status: string | null | undefined): StatusMeta {
  return PAYMENT_STATUS_META[status ?? ''] ?? { label: status || 'نامشخص', color: '#6b7280' }
}

// ─────────────── وضعیت سانس قرارداد (ContractSlotStatus) ───────────────

export const SESSION_STATUS_META: Record<string, StatusMeta & { icon: string }> = {
  scheduled: { label: 'برنامه‌ریزی‌شده', color: '#2563eb', icon: 'mdi:calendar-clock' },
  completed: { label: 'برگزار شده', color: '#059669', icon: 'mdi:check-circle-outline' },
  excluded: { label: 'مستثنا شده', color: '#6b7280', icon: 'mdi:calendar-remove' },
  rescheduled: { label: 'جابه‌جا شده', color: '#d97706', icon: 'mdi:calendar-sync' },
}

export function sessionStatusMeta(status: string | null | undefined): StatusMeta & { icon: string } {
  return SESSION_STATUS_META[status ?? ''] ?? { label: status || 'نامشخص', color: '#6b7280', icon: 'mdi:calendar-blank' }
}

// ─────────────── وضعیت هر قسط (مشتق‌شده از ردیف) ───────────────

export function installmentState(p: ContractPaymentData): StatusMeta {
  if (p.is_voided) return { label: 'باطل', color: '#64748b' }
  if (p.is_paid) return { label: 'پرداخت شده', color: '#059669' }
  if (p.is_overdue || (p.due_date && p.due_date < getTodayISO())) return { label: 'سررسید گذشته', color: '#ef4444' }
  return { label: 'پرداخت نشده', color: '#d97706' }
}

// ─────────────── برچسب‌های متنی ───────────────

export const RECURRENCE_LABELS: Record<string, string> = {
  weekly: 'هفتگی',
  biweekly: 'دو هفته یکبار',
  monthly: 'ماهانه',
}

/** ترتیب بک‌اند: weekday پایتون — ۰=دوشنبه ... ۶=یکشنبه */
export { pyDayNames } from '@/lib/utils'

// ─────────────── کمک‌تابع‌های سانس ───────────────

/** تاریخ/ساعت مؤثر سانس — الگوی cs_effective بک‌اند */
export function effectiveSession(cs: ContractSessionData): { date: string; time: string } {
  return {
    date: cs.rescheduled_date || cs.session_date,
    time: cs.rescheduled_time || cs.start_time,
  }
}

/**_gate_client: آیا سانس هنوز آینده است؟ (بر اساس زمان مؤثر) */
export function isSessionFuture(cs: ContractSessionData): boolean {
  const eff = effectiveSession(cs)
  if (!eff.date) return false
  const today = getTodayISO()
  if (eff.date > today) return true
  if (eff.date < today) return false
  const now = new Date()
  const hm = (eff.time || '00:00').slice(0, 5)
  const [h, m] = hm.split(':').map(Number)
  return now.getHours() * 60 + now.getMinutes() < (h || 0) * 60 + (m || 0)
}

/** آیا سانس قابل درخواست لغو/جابه‌جایی/استثناست (قواعد سرویس بک‌اند) */
export function isSessionMutable(cs: ContractSessionData): boolean {
  return (cs.status === 'scheduled' || cs.status === 'rescheduled') && isSessionFuture(cs)
}

// ─────────────── ممیزی — برچسب اقدام و خلاصه‌ی داده ───────────────

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  created: 'ثبت درخواست قرارداد',
  approved: 'تأیید قرارداد',
  amended_on_approval: 'اصلاحات هنگام تأیید',
  rejected: 'رد درخواست',
  rejection_reason_updated: 'به‌روزرسانی دلیل رد',
  cancelled: 'لغو قرارداد',
  session_excluded: 'استثنای یک سانس',
  session_rescheduled: 'جابه‌جایی یک سانس',
  session_cancel_requested: 'درخواست لغو سانس (کاربر)',
  whole_contract_rescheduled: 'جابه‌جایی کل قرارداد',
  payment_schedule_generated: 'تولید تقویم اقساط',
  payment_paid: 'پرداخت قسط',
  payment_voided: 'ابطال قسط',
  overdue_notified: 'اعلامیه‌ی تأخیر',
  renewed: 'تمدید قرارداد',
  expired: 'انقضای دوره‌ی قرارداد',
}

const AUDIT_ACTION_ICONS: Record<string, string> = {
  created: 'mdi:file-document-plus-outline',
  approved: 'mdi:check-decagram',
  amended_on_approval: 'mdi:file-document-edit-outline',
  rejected: 'mdi:close-octagon-outline',
  cancelled: 'mdi:cancel',
  session_excluded: 'mdi:calendar-remove',
  session_rescheduled: 'mdi:calendar-sync',
  session_cancel_requested: 'mdi:calendar-alert',
  whole_contract_rescheduled: 'mdi:calendar-move',
  payment_schedule_generated: 'mdi:calendar-month-outline',
  payment_paid: 'mdi:credit-card-check-outline',
  payment_voided: 'mdi:backup-restore',
  overdue_notified: 'mdi:alert-circle-outline',
  renewed: 'mdi:autorenew',
  expired: 'mdi:calendar-end',
}

export function auditActionIcon(action: string): string {
  return AUDIT_ACTION_ICONS[action] || 'mdi:history'
}

const AUDIT_MONEY_KEYS = new Set(['price', 'total', 'price_per_session', 'total_amount', 'amount', 'down_payment', 'ledger_tx'])
const AUDIT_DATE_KEYS = new Set(['session_date', 'from', 'to_date', 'to_time', 'collides_at', 'to'])

/** خلاصه‌ی قابل‌خواندن داده‌ی ممیزی (diff) به‌صورت جفت‌کلید/مقدار فارسی */
export function summarizeAuditData(data: Record<string, unknown>): Array<{ key: string; value: string }> {
  const out: Array<{ key: string; value: string }> = []
  const push = (key: string, value: string) => out.push({ key, value })
  const fmt = (key: string, v: unknown): string => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'number') {
      if (AUDIT_MONEY_KEYS.has(key)) return formatRial(v)
      return faNum(v)
    }
    if (typeof v === 'string') {
      if (AUDIT_DATE_KEYS.has(key)) return v
      return v
    }
    if (Array.isArray(v)) return v.map((x) => String(x)).join('، ')
    return JSON.stringify(v)
  }
  const KEY_LABELS: Record<string, string> = {
    venue_id: 'سالن',
    sessions: 'سانس‌ها',
    price_per_session: 'قیمت هر سانس',
    total_amount: 'مبلغ کل',
    down_payment_amount: 'پیش‌پرداخت',
    auto_renew: 'تمدید خودکار',
    reason: 'دلیل',
    freed_slots: 'سانس‌های آزادشده',
    price: 'قیمت',
    total: 'جمع',
    before: 'قبل',
    after: 'بعد',
    max_sessions: 'سقف سانس',
    released_sessions: 'سانس‌های آزادشده',
    added_sessions: 'سانس‌های افزوده',
    total_installments: 'اقساط',
    installments: 'اقساط',
    amounts: 'مبالغ',
    payment_id: 'شناسه قسط',
    amount: 'مبلغ',
    ledger_tx: 'تراکنش دفتر کل',
    contract_slot_id: 'سانس',
    session_date: 'تاریخ سانس',
    from: 'از',
    to: 'به',
    moved_sessions: 'سانس‌های منتقل‌شده',
    old_day_of_week: 'روز قبلی',
    old_start_time: 'ساعت قبلی',
    collides_at: 'تداخل با',
    to_date: 'تاریخ مقصد',
    to_time: 'ساعت مقصد',
    raw: 'داده',
  }
  const visit = (key: string, value: unknown, prefix = '') => {
    const label = (KEY_LABELS[key] || key) + (prefix ? '' : '')
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const inner = value as Record<string, unknown>
      const parts = Object.entries(inner).map(([k, v]) => `${KEY_LABELS[k] || k}: ${fmt(k, v)}`)
      push(label, parts.join(' / '))
      return
    }
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      push(label, faNum(value.length) + ' مورد')
      return
    }
    push(label, fmt(key, value))
  }
  for (const [k, v] of Object.entries(data || {})) visit(k, v)
  return out.slice(0, 10)
}

// ─────────────── دیالوگ عمومی «دلیل» (رد/استثنا/لغو/ابطال/درخواست لغو) ───────────────

interface ReasonDialogProps {
  open: boolean
  title: string
  description?: string
  reasonLabel?: string
  confirmText?: string
  danger?: boolean
  loading?: boolean
  /** خطای متنی (فارسی بک‌اند) برای نمایش اینلاین */
  errorText?: string | null
  /** شمارش سانس‌های آینده برای تأیید سیاست‌محور لغو */
  onSubmit: (reason: string) => void
  onClose: () => void
}

export const ReasonDialog: React.FC<ReasonDialogProps> = ({
  open,
  title,
  description,
  reasonLabel = 'دلیل',
  confirmText = 'ثبت',
  danger = true,
  loading = false,
  errorText,
  onSubmit,
  onClose,
}) => {
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  // اتصال برچسب/خطا به textarea برای صفحه‌خوان
  const reasonId = useId()
  const reasonErrId = useId()

  useEffect(() => {
    if (open) {
      setReason('')
      setTouched(false)
    }
  }, [open])

  const trimmed = reason.trim()
  const invalid = trimmed.length < 3 || trimmed.length > 500

  const submit = () => {
    setTouched(true)
    if (invalid) return
    onSubmit(trimmed)
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      maxWidth="sm"
      actions={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl px-4"
          >
            انصراف
          </Button>
          <Button
            variant={danger ? 'destructive' : 'default'}
            onClick={submit}
            disabled={loading || (!touched && invalid)}
            className="rounded-xl font-bold"
          >
            {loading ? 'در حال ثبت...' : confirmText}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {description && (
          <Alert variant={danger ? 'warning' : 'info'} className="rounded-xl text-[0.82rem]">
            <AlertDescription>{description}</AlertDescription>
          </Alert>
        )}
        {errorText && (
          <Alert variant="destructive" className="rounded-xl text-[0.82rem]">
            <AlertDescription>{errorText}</AlertDescription>
          </Alert>
        )}
        <div>
          <Label htmlFor={reasonId} className="mb-1.5 block font-semibold">
            {reasonLabel} *
          </Label>
          <Textarea
            id={reasonId}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            rows={3}
            maxLength={500}
            placeholder="حداقل ۳ کاراکتر — این دلیل برای طرف مقابل و در ممیزی ثبت می‌شود"
            aria-invalid={touched && invalid ? true : undefined}
            aria-describedby={touched && invalid ? reasonErrId : undefined}
            className={cn(
              'min-h-[92px] resize-y text-[0.88rem]',
              touched && invalid && 'border-red-500 focus-visible:ring-red-500',
            )}
          />
          {touched && invalid && (
            <p id={reasonErrId} className="mt-1 text-xs text-red-600 dark:text-red-400">
              دلیل باید بین ۳ تا ۵۰۰ کاراکتر باشد
            </p>
          )}
        </div>
      </div>
    </Dialog>
  )
}

// ─────────────── چیپ‌های کمکی ───────────────

export const ContractStatusChip: React.FC<{ status: string | null | undefined; size?: 'small' }> = ({ status }) => {
  const meta = contractStatusMeta(status)
  return <StatusChip label={meta.label} color={meta.color} />
}

export const SessionStatusChip: React.FC<{ status: string | null | undefined }> = ({ status }) => {
  const meta = sessionStatusMeta(status)
  return (
    <span className="inline-flex items-center gap-1">
      <Icon icon={meta.icon} className="h-4 w-4" style={{ color: meta.color }} />
      <StatusChip label={meta.label} color={meta.color} />
    </span>
  )
}
