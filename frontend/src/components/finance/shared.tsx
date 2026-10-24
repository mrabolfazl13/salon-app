// frontend/src/components/finance/shared.tsx
// ابزارها و اجزای مشترک کنسول مالی — ارقام ریال با جداکننده هزارگان فارسی،
// برچسب‌های فارسی enum‌ها، جعبه‌های loading/empty/error و چیدمان RTL نمودارها.

import React from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/shadcn/button'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
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

/** مبلغ فشرده برای کاشی‌های KPI باریک: «۱۹۵ میلیون ریال»؛ مقدار کامل در tooltip می‌آید */
export function formatRialCompact(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  const faDecimal = (v: number, digits: number) => toPersianDigits(v.toFixed(digits)).replace('.', '٫')
  if (abs >= 1_000_000_000) return `${sign}${faDecimal(abs / 1_000_000_000, abs >= 10_000_000_000 ? 0 : 1)} میلیارد ریال`
  if (abs >= 10_000_000) return `${sign}${faDecimal(abs / 1_000_000, 0)} میلیون ریال`
  return formatRial(n)
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
  <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div className={dense ? 'flex items-center justify-between gap-2 px-4 pb-2 pt-3' : 'flex items-center justify-between gap-2 px-5 pb-2 pt-4'}>
      <div className="flex min-w-0 items-center gap-2">
        <Icon icon={icon} className="h-5 w-5 shrink-0" style={{ color }} />
        {/* عنوان پنل = سرتیتر بخش (h2 زیر h1 صفحه)؛ اندازهٔ کوچک‌تر متن را جمع‌وجور نگه می‌دارد — ممیزی axe F-22 */}
        <h2 className="truncate text-sm font-extrabold text-foreground">{title}</h2>
      </div>
      {action}
    </div>
    <div className={dense ? 'px-4 pb-4' : 'px-5 pb-5'}>{children}</div>
  </section>
)

export const KpiCard: React.FC<{
  label: string
  value: string
  sub?: string
  icon: string
  color?: string
  loading?: boolean
  /** مقدار کامل وقتی نمایش فشرده است (tooltip) */
  title?: string
  /** نود اختیاری کنار مقدار — چیپ دلتای مقایسه‌ای و... */
  end?: React.ReactNode
}> = ({ label, value, sub, icon, color = '#2563eb', loading = false, title, end }) => {
  const { main: accent } = useStatusColor(color)
  // «۰٪» با #0891b2 روی کارت سفید ۳٫۶۸:۱ بود — ممیزی axe F-21؛ رنگِ نگاشت‌شده تیره‌تر است
  // «ریال» با همان اندازهٔ رقم در کارت باریک، خط دوم/سوم می‌شد (مثلاً «۸۰۰٬۰۰۰» /
  // «ریال»)؛ واحد کوچک‌تر می‌شود و بخش رقمی می‌تواند کامل بماند.
  const unitMatch = /^(.*?)\s(ریال)$/.exec(value)
  return (
    <div className="h-full rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex h-full flex-col gap-2 p-4">
        {/* آیکون روی موبایل کنار مقدار ۷۹px جا می‌گذاشت و «۱۹۵ میلیون ریال»
            از لبهٔ کارت بیرون می‌زد؛ برچسب+آیکون یک ردیف و مقدار تمام‌عرض. */}
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${accent}14` }}
          >
            <Icon icon={icon} className="h-[18px] w-[18px]" style={{ color: accent }} />
          </div>
          <span className="min-w-0 text-xs font-semibold text-muted-foreground">{label}</span>
        </div>
        <div className="min-w-0">
          {loading ? (
            <Skeleton aria-hidden="true" className="mt-1 h-[26px] w-4/5 rounded-lg" />
          ) : (
            <p
              dir="rtl"
              title={title}
              className="text-[1.05rem] font-extrabold leading-normal tabular-nums [overflow-wrap:anywhere]"
              style={{ color: accent }}
            >
              {unitMatch ? (
                <>
                  <span className="whitespace-nowrap">{unitMatch[1]}</span>{' '}
                  <span className="text-[0.8em] font-bold opacity-80">{unitMatch[2]}</span>
                </>
              ) : (
                value
              )}
            </p>
          )}
          {sub && !loading && (
            <span className="block text-xs text-muted-foreground">{sub}</span>
          )}
          {end && !loading && <div className="mt-1.5">{end}</div>}
        </div>
      </div>
    </div>
  )
}

// نقشه‌ی هگزهای تزئینیِ وضعیت → توکن تم. متن چیپ با این هگزها روی سفید زیر ۴٫۵:۱ بود
// (#059669≈3.8، #d97706≈3.2، #ef4444≈3.8)؛ نسخهٔ تیره‌تر همان رنگ‌ها در هر دو مود
// کنتراست‌سنجی شده‌اند.
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

/** نسخهٔ دسترس‌پذیرِ هر توکن (≥۴٫۵:۱ روی کارت روشن) — جانشین theme.palette[token].main */
const STATUS_INK: Record<'success' | 'warning' | 'error' | 'info', string> = {
  success: '#047857',
  warning: '#b45309',
  error: '#b91c1c',
  info: '#1d4ed8',
}

/** نگاشت خالص (بدون hook) تا بتوان در حلقهٔ رندر هم صدا زد — vgl. SlotWeekGrid */
export const statusColorToken = (hex: string): 'success' | 'warning' | 'error' | 'info' | undefined =>
  STATUS_COLOR_TOKEN[hex.toLowerCase()]

/**
 * هگزهای تزئینی (که از کنفیگ‌های وضعیت می‌آیند) را به رنگ دسترس‌پذیر نگاشت می‌کند.
 * دلیل: متن با #059669 ≈ ۳٫۸:۱ و #d97706 ≈ ۳٫۲:۱ روی سفید رد می‌شود.
 */
export const useStatusColor = (hex: string) => {
  const token = statusColorToken(hex)
  return { main: token ? STATUS_INK[token] : hex, mapped: Boolean(token) }
}

/**
 * جفت «پس‌زمینه + متن رویش» برای کنترل‌های selected (چیپ‌های یک‌دکمه‌ای).
 * پارامتر اول برای سازگاری با فراخوانی‌های قبلی (تم) نگه داشته شده و خوانده نمی‌شود.
 * دلیل: «سفید روی #059669» ≈ ۳٫۷:۱ و «سفید روی #d97706» ≈ ۳٫۲:۱ برای متن ۱۲px رد می‌شود.
 */
export const statusPairOf = (
  _theme: unknown,
  hex: string,
): { main: string; on: string } => {
  const token = statusColorToken(hex)
  if (!token) return { main: hex, on: '#ffffff' }
  return { main: STATUS_INK[token], on: '#ffffff' }
}

export const StatusChip: React.FC<{ label: string; color?: string }> = ({ label, color = '#6b7280' }) => {
  const { main: text, mapped } = useStatusColor(color)
  // رنگ‌های بدون معادل (بنفش مسابقه، خاکستری‌ها) همان‌طور می‌مانند
  const tint = mapped ? '1f' : '18'
  // کنتراست با خودِ زمینهٔ تیغ‌خورده سنجیده می‌شود، نه با کاغذ؛ متن همان رنگِ تیرهٔ
  // دسترس‌پذیر است — ممیزی axe F-21
  return (
    <span
      className="inline-flex h-[22px] items-center rounded-lg px-2 text-xs font-semibold leading-none"
      style={{ backgroundColor: `${text}${tint}`, color: text }}
    >
      {label}
    </span>
  )
}

/** چیپ دلتای دوره‌ای: ▲/▼ + درصد نسبت به بازهٔ قبل (invert برای هزینه‌ها) */
export const DeltaChip: React.FC<{
  value: number | null
  invert?: boolean
  suffix?: string
}> = ({ value, invert = false, suffix = 'نسبت به دوره قبل' }) => {
  if (value === null || !Number.isFinite(value)) {
    return <span className="text-[0.62rem] text-muted-foreground">دورهٔ قبل داده‌ای ندارد</span>
  }
  const up = value >= 0
  const flat = Math.abs(value) < 0.05
  const good = invert ? !up : up
  const color = flat ? '#64748b' : good ? '#047857' : '#b91c1c'
  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-[0.66rem] font-semibold" style={{ color }}>
      <Icon icon={up ? 'mdi:trending-up' : 'mdi:trending-down'} className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {toPersianDigits(Math.abs(Math.round(value * 10) / 10))}٪
      <span className="font-normal text-muted-foreground">{suffix}</span>
    </span>
  )
}

/** نوار سهم (برای تفکیک دسته‌ها/منابع) — بدون نمودار سنگین */
export const ShareBar: React.FC<{ pct: number; color?: string; className?: string }> = ({
  pct,
  color = '#2563eb',
  className,
}) => (
  <span className={`block h-1.5 w-full overflow-hidden rounded-full bg-muted ${className ?? ''}`} aria-hidden="true">
    <span
      className="block h-full rounded-full"
      style={{ width: `${Math.max(pct > 0 ? 2 : 0, Math.min(100, pct))}%`, backgroundColor: color }}
    />
  </span>
)

export const EmptyBox: React.FC<{ icon: string; title: string; text?: string }> = ({ icon, title, text }) => (  <div className="px-4 py-8 text-center">
    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/[0.07] dark:bg-blue-400/10">
      <Icon icon={icon} className="h-8 w-8" style={{ color: '#2563eb' }} />
    </div>
    {/* داخل پنل (h2) است؛ سرتیتر سطح سوم برای سلسله‌مراتب عنوان — axe F-22 */}
    <h3 className="text-sm font-bold text-foreground">{title}</h3>
    {text && (
      <p className="mx-auto mt-1 max-w-[380px] text-sm text-muted-foreground">
        {text}
      </p>
    )}
  </div>
)

export const ErrorBox: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="px-4 py-8 text-center">
    <Icon icon="mdi:cloud-off-outline" className="h-9 w-9" style={{ color: '#ef4444' }} />
    <p className={onRetry ? 'mb-3 mt-2 text-sm text-muted-foreground' : 'mt-2 text-sm text-muted-foreground'}>{message}</p>
    {onRetry && (
      <Button size="sm" variant="outline" onClick={onRetry}>
        تلاش دوباره
      </Button>
    )}
  </div>
)

export const LoadingBox: React.FC<{ text?: string }> = ({ text = 'در حال بارگذاری...' }) => (
  <div className="py-10 text-center">
    <span
      className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent"
      role="status"
      aria-label="در حال بارگذاری"
    />
    <p className="mt-3 text-sm text-muted-foreground">{text}</p>
  </div>
)

/** شماره صفحه جلالی برای لیبل سری روزانه (کلید = YYYY-MM-DD میلادی) */
export function jalaliDayLabel(isoKey: string): string {
  return formatJalaliDate(isoKey, { format: 'numeric' }).slice(5) // «۰۶/۲۳»
}

/** جایگزین useMediaQuery پس از حذف MUI — همان آستانهٔ sm (۶۰۰px) */
export function useAboveSm(): boolean {
  const [above, setAbove] = React.useState<boolean>(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width:600px)').matches,
  )
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width:600px)')
    const onChange = () => setAbove(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return above
}

// ─────────────── صفحه‌بندی ساده و دسترس‌پذیر ───────────────

/** پنجرهٔ شماره‌صفحه‌ها با «…» برای تعداد زیاد صفحه */
function pageWindow(page: number, count: number): (number | '…')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(count - 1, page + 1)
  if (start > 2) out.push('…')
  for (let p = start; p <= end; p += 1) out.push(p)
  if (end < count - 1) out.push('…')
  out.push(count)
  return out
}

export const Pager: React.FC<{
  count: number
  page: number
  onChange: (page: number) => void
  className?: string
}> = ({ count, page, onChange, className }) => {
  if (count <= 1) return null
  const btn = 'inline-flex h-11 min-w-11 items-center justify-center rounded-xl border px-2 text-xs font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40'
  return (
    <nav className={className ? `flex flex-wrap items-center justify-center gap-1 ${className}` : 'flex flex-wrap items-center justify-center gap-1'} aria-label="صفحه‌بندی">
      <button
        type="button"
        className={`${btn} border-border bg-card text-foreground hover:bg-muted`}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="صفحه قبل"
      >
        <Icon icon="mdi:chevron-right" className="h-5 w-5" aria-hidden="true" />
      </button>
      {pageWindow(page, count).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground" aria-hidden="true">…</span>
        ) : (
          <button
            key={`p-${p}`}
            type="button"
            className={`${btn} ${
              p === page
                ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                : 'border-border bg-card text-foreground hover:bg-muted'
            }`}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {toPersianDigits(p)}
          </button>
        ),
      )}
      <button
        type="button"
        className={`${btn} border-border bg-card text-foreground hover:bg-muted`}
        onClick={() => onChange(page + 1)}
        disabled={page >= count}
        aria-label="صفحه بعد"
      >
        <Icon icon="mdi:chevron-left" className="h-5 w-5" aria-hidden="true" />
      </button>
    </nav>
  )
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
    <div
      dir="rtl"
      className="min-w-[140px] rounded-xl bg-slate-900/[0.92] px-3 py-2 text-xs text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] dark:bg-slate-800/95"
      style={{ fontFamily: 'Vazirmatn, sans-serif' }}
    >
      {label !== undefined && label !== null && label !== '' && (
        <p className="mb-1 text-xs font-bold text-white">
          {String(label)}
        </p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color ?? '#64748b' }} />
            <span className="text-xs text-white/80">{String(entry.name ?? entry.dataKey ?? '')}</span>
          </div>
          <span className="text-xs font-bold tabular-nums text-white">
            {unit === 'rial'
              ? formatRial(Number(entry.value ?? 0))
              : unit === 'pct'
                ? formatPct(Number(entry.value ?? 0))
                : toPersianDigits(Number(entry.value ?? 0))}
          </span>
        </div>
      ))}
    </div>
  )
}
