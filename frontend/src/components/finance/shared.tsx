// frontend/src/components/finance/shared.tsx
// ابزارها و اجزای مشترک کنسول مالی — ارقام ریال با جداکننده هزارگان فارسی،
// برچسب‌های فارسی enum‌ها، جعبه‌های loading/empty/error و چیدمان RTL نمودارها.

import React from 'react'
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Paper,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Icon } from '@iconify/react'
import type { Theme } from '@mui/material/styles'
import { formatJalaliDate, toPersianDigits } from '@/lib/jalali'

// ─────────────── فرمت اعداد ریال ───────────────

const faGrouping = new Intl.NumberFormat('fa-IR')

/** نمایش امن رقم فارسی با جداکننده هزارگان: ۱٬۲۵۰٬۰۰۰ */
export function faNum(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return faGrouping.format(n)
}

export function formatRial(n: number | null | undefined, withUnit = true): string {
  const s = faNum(n)
  return s === '—' ? s : withUnit ? `${s} ریال` : s
}

/** تیک فشرده محور Y: ۱۲٫۵م (میلیون) / ۳۵۰هزار */
export function shortRialAxis(v: number | string): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000
    return `${sign}${toPersianDigits(m >= 10 ? Math.round(m) : Math.round(m * 10) / 10)}م`
  }
  if (abs >= 1_000) return `${sign}${toPersianDigits(Math.round(abs / 1_000))}هزار`
  return `${sign}${toPersianDigits(Math.round(abs))}`
}

export function formatPct(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return `${toPersianDigits(Math.round(n * 10) / 10)}٪`
}

/** ورودی مبلغ (ارقام فارسی/عربی، جداکننده، فاصله) → عدد ریال؛ نامعتبر → NaN */
export function parseAmountInput(raw: string): number {
  const latin = raw
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[٬,\s_]/g, '')
  if (!/^\d+$/.test(latin)) return NaN
  return Number(latin)
}

// ─────────────── برچسب‌های فارسی enum ───────────────

/** بک‌اند: weekday = strftime %w / EXTRACT dow → ۰=یکشنبه تا ۶=شنبه */
export const FIN_WEEKDAY_NAMES = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه',
]

/** ترتیب نمایش فارسی هفته (شنبه‌محور) برای نمودارها */
export const SAT_FIRST_ORDER = [6, 0, 1, 2, 3, 4, 5]

export const TX_TYPE_LABELS: Record<string, string> = {
  payment: 'دریافت وجه',
  receivable: 'مطالبه',
  refund: 'بازگشت وجه',
  discount: 'تخفیف',
  expense: 'هزینه',
  credit: 'اعتبار',
  transfer: 'انتقال',
  adjustment: 'اصلاحیه',
}

export const TX_DIRECTION_LABELS: Record<string, string> = {
  income: 'درآمد',
  expense: 'هزینه',
}

export const TX_STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار',
  cleared: 'قطعی',
  voided: 'باطل',
}

export const TX_STATUS_COLORS: Record<string, string> = {
  pending: '#d97706',
  cleared: '#059669',
  voided: '#ef4444',
}

export const TX_METHOD_LABELS: Record<string, string> = {
  cash: 'نقدی',
  card_to_card: 'کارت‌به‌کارت',
  gateway: 'درگاه',
  pos: 'کارت‌خوان',
  credit: 'نسیه',
  other: 'سایر',
}

export const TX_SOURCE_LABELS: Record<string, string> = {
  booking: 'رزرو',
  booking_payment: 'پرداخت رزرو',
  game_payment: 'پرداخت بازی',
  membership_purchase: 'خرید اشتراک',
  contract: 'قرارداد',
  contract_payment: 'پرداخت قرارداد',
  manual: 'دستی',
}

export function labelOf(map: Record<string, string>, value: string | null | undefined, fallback = 'نامشخص'): string {
  if (!value) return fallback
  return map[value] ?? value
}

// ─────────────── خطا / دانلود ───────────────

/** پیام فارسی از پاسخ FastAPI (detail رشته یا 422 آرایه‌ای) */
export function extractError(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  if (typeof detail === 'string' && detail) return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    if (typeof first === 'string') return first
    const msg = (first as { msg?: string })?.msg
    if (msg) return msg.replace(/^Value error,\s*/, '')
  }
  return fallback
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ─────────────── اجزای UI ───────────────

export const SectionCard: React.FC<{
  title: string
  icon: string
  color?: string
  action?: React.ReactNode
  dense?: boolean
  children: React.ReactNode
}> = ({ title, icon, color = '#2563eb', action, dense = false, children }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: '16px',
      border: '1px solid rgba(0,0,0,0.05)',
      background: 'rgba(255,255,255,0.92)',
      overflow: 'hidden',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 2.5, pt: dense ? 1.5 : 2, pb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon icon={icon} className="h-5 w-5" style={{ color }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{title}</Typography>
      </Box>
      {action}
    </Box>
    <Box sx={{ px: dense ? 2 : 2.5, pb: dense ? 2 : 2.5 }}>{children}</Box>
  </Paper>
)

export const KpiCard: React.FC<{
  label: string
  value: string
  sub?: string
  icon: string
  color?: string
  loading?: boolean
  /** نود اختیاری کنار مقدار — چیپ دلتای مقایسه‌ای و... */
  end?: React.ReactNode
}> = ({ label, value, sub, icon, color = '#2563eb', loading = false, end }) => {
  const { main: accent } = useStatusColor(color)
  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        height: '100%',
      }}
    >
      <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: '12px',
            bgcolor: `${accent}14`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon icon={icon} className="h-5 w-5" style={{ color: accent }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
            {label}
          </Typography>
          {loading ? (
            <Skeleton aria-hidden="true" variant="rounded" width="80%" height={26} sx={{ mt: 0.5 }} />
          ) : (
            <Typography
              variant="body1"
              dir="rtl"
              sx={{ fontWeight: 800, color: accent, fontSize: '1.05rem', lineHeight: 1.5, fontVariantNumeric: 'tabular-nums' }}
            >
              {value}
            </Typography>
          )}
          {sub && !loading && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{sub}</Typography>
          )}
        </Box>
        {end && !loading && <Box sx={{ alignSelf: 'center', flexShrink: 0 }}>{end}</Box>}
      </Box>
    </Card>
  )
}

// نقشه‌ی هگزهای تزئینیِ وضعیت → توکن تم. متن چیپ با این هگزها روی سفید زیر ۴.۵:۱ بود
// (#059669≈3.8، #d97706≈3.2، #ef4444≈3.8)؛ توکن‌ها در هر دو مود کنتراست‌سنجی شده‌اند.
const STATUS_COLOR_TOKEN: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  '#059669': 'success',
  '#16a34a': 'success',
  '#10b981': 'success',
  '#047857': 'success',
  '#d97706': 'warning',
  '#f59e0b': 'warning',
  '#b45309': 'warning',
  '#ef4444': 'error',
  '#dc2626': 'error',
  '#b91c1c': 'error',
  '#be123c': 'error',
  '#2563eb': 'info',
  '#3b82f6': 'info',
}

/** نگاشت خالص (بدون hook) تا بتوان در حلقهٔ رندر هم صدا زد — vgl. SlotWeekGrid */
export const statusColorToken = (hex: string): 'success' | 'warning' | 'error' | 'info' | undefined =>
  STATUS_COLOR_TOKEN[hex.toLowerCase()]

/**
 * هگزهای تزئینی (که از کنفیگ‌های وضعیت می‌آیند) را به توکن سمانتیک نگاشت می‌کند.
 * دلیل: متن با #059669 ≈ ۳٫۸:۱ و #d97706 ≈ ۳٫۲:۱ روی سفید رد می‌شود؛
 * نسخهٔ دسترس‌پذیر در پالت است (success.main/warning.main ≥ ۴٫۵:۱).
 */
export const useStatusColor = (hex: string) => {
  const theme = useTheme()
  const token = statusColorToken(hex)
  return { main: token ? theme.palette[token].main : hex, mapped: Boolean(token) }
}

/**
 * جفت «پس‌زمینه + متن رویش» برای کنترل‌های selected (چیپ‌های یک‌دکمه‌ای).
 * نسخهٔ بدون hook؛ تم را یک‌بار بالای کامپوننت بگیرید و داخل .map() پاس دهید.
 * دلیل: «سفید روی #059669» ≈ ۳٫۷:۱ و «سفید روی #d97706» ≈ ۳٫۲:۱ برای متن ۱۲px رد می‌شود.
 */
export const statusPairOf = (
  theme: Theme,
  hex: string,
): { main: string; on: string } => {
  const token = statusColorToken(hex)
  if (!token) return { main: hex, on: '#ffffff' }
  return { main: theme.palette[token].main, on: theme.palette[token].contrastText }
}

export const StatusChip: React.FC<{ label: string; color?: string }> = ({ label, color = '#6b7280' }) => {
  const { main: text, mapped } = useStatusColor(color)
  // رنگ‌های بدون معادل (بنفش مسابقه، خاکستری‌ها) همان‌طور می‌مانند
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '0.75rem',
        height: 22,
        bgcolor: `${text}${mapped ? '1f' : '18'}`,
        color: text,
      }}
    />
  )
}

export const EmptyBox: React.FC<{ icon: string; title: string; text?: string }> = ({ icon, title, text }) => (
  <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
    <Box
      sx={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        bgcolor: 'rgba(37,99,235,0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mx: 'auto',
        mb: 1.5,
      }}
    >
      <Icon icon={icon} className="h-8 w-8" style={{ color: '#2563eb' }} />
    </Box>
    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
    {text && (
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 380, mx: 'auto' }}>
        {text}
      </Typography>
    )}
  </Box>
)

export const ErrorBox: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
    <Icon icon="mdi:cloud-off-outline" className="h-9 w-9" style={{ color: '#ef4444' }} />
    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, mb: onRetry ? 1.5 : 0 }}>{message}</Typography>
    {onRetry && (
      <Button size="small" variant="outlined" onClick={onRetry} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
        تلاش دوباره
      </Button>
    )}
  </Box>
)

export const LoadingBox: React.FC<{ text?: string }> = ({ text = 'در حال بارگذاری...' }) => (
  <Box sx={{ textAlign: 'center', py: 5 }}>
    <CircularProgress size={32} sx={{ color: '#2563eb' }} />
    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.5 }}>{text}</Typography>
  </Box>
)

/** شماره صفحه جلالی برای لیبل سری روزانه (کلید = YYYY-MM-DD میلادی) */
export function jalaliDayLabel(isoKey: string): string {
  return formatJalaliDate(isoKey, { format: 'numeric' }).slice(5) // «۰۶/۲۳»
}

export function useAboveSm(): boolean {
  return useMediaQuery('(min-width:600px)')
}

// ───────────────Tooltip RTL برای recharts ───────────────

interface TooltipEntry {
  name?: string | number
  value?: string | number
  color?: string
  dataKey?: string | number
}

export const FinTooltip: React.FC<{
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
  unit?: 'rial' | 'pct' | 'count'
}> = ({ active, payload, label, unit = 'rial' }) => {
  if (!active || !payload || payload.length === 0) return null
  return (
    <Box
      dir="rtl"
      sx={{
        bgcolor: 'rgba(15,23,42,0.92)',
        color: 'white',
        borderRadius: '12px',
        px: 1.5,
        py: 1,
        fontSize: '0.75rem',
        fontFamily: 'Vazirmatn, sans-serif',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        minWidth: 140,
      }}
    >
      {label !== undefined && label !== null && label !== '' && (
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, mb: 0.5, color: 'white' }}>
          {String(label)}
        </Typography>
      )}
      {payload.map((entry, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 0.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color ?? '#64748b' }} />
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{String(entry.name ?? entry.dataKey ?? '')}</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'white' }}>
            {unit === 'rial'
              ? formatRial(Number(entry.value ?? 0))
              : unit === 'pct'
                ? formatPct(Number(entry.value ?? 0))
                : toPersianDigits(Number(entry.value ?? 0))}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}