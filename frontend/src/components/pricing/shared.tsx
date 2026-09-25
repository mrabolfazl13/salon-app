// frontend/src/components/pricing/shared.tsx
// ابزارهای مشترک بخش قیمت‌گذاری — معناهای بک‌اند (weekday پایتون، percent=٪×100،
// ریال) با برچسب فارسی و ارقام جلالی.

import { formatRial } from '@/components/finance/shared'
import { fromJalali, toPersianDigits } from '@/lib/jalali'
import type { ModifierType, PricingRule } from '@/services/pricing'

/** ترتیب نمایش فارسی هفته با کلید weekdayِ بک‌اند (0=دوشنبه … 6=یکشنبه) */
export const WEEKDAYS_PY_ORDER: { value: number; label: string }[] = [
  { value: 5, label: 'شنبه' },
  { value: 6, label: 'یکشنبه' },
  { value: 0, label: 'دوشنبه' },
  { value: 1, label: 'سه\u200cشنبه' },
  { value: 2, label: 'چهارشنبه' },
  { value: 3, label: 'پنجشنبه' },
  { value: 4, label: 'جمعه' },
]

export const MODIFIER_LABELS: Record<ModifierType, string> = {
  percent: 'درصدی',
  fixed: 'مبلغ ثابت',
  absolute: 'قیمت قطعی',
}

/** نمایش مقدار قانون با واحدهای فارسی — percent در دیتا ٪×۱۰۰ است */
export function ruleValueLabel(type: ModifierType, value: number): string {
  if (type === 'percent') {
    const pct = value / 100
    return `${pct > 0 ? '+' : pct < 0 ? '−' : ''}${toPersianDigits(Math.abs(pct))}٪`
  }
  if (type === 'fixed') {
    return `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatRial(Math.abs(value))}`
  }
  return formatRial(value)
}

export function ruleDaysLabel(rule: Pick<PricingRule, 'day_of_week' | 'holiday_applies'>): string {
  if (rule.holiday_applies) return 'فقط تعطیلات'
  if (rule.day_of_week == null) return 'همه روزها'
  return WEEKDAYS_PY_ORDER.find((d) => d.value === rule.day_of_week)?.label ?? '—'
}

/** «HH:MM[:SS]» بک‌اند → نمایش فارسی «HH:MM» */
export function faTime(t: string | null | undefined): string {
  return t ? toPersianDigits(t.slice(0, 5)) : '—'
}

export function ruleTimeWindow(rule: Pick<PricingRule, 'start_time' | 'end_time'>): string {
  if (!rule.start_time && !rule.end_time) return 'کل روز'
  return `${faTime(rule.start_time)} تا ${faTime(rule.end_time)}`
}

export function ruleSummary(rule: PricingRule): string {
  return `${ruleDaysLabel(rule)} · ${ruleTimeWindow(rule)} · ${MODIFIER_LABELS[rule.modifier_type]} ${ruleValueLabel(rule.modifier_type, rule.value)}`
}

/** ورودی عددی فارسی/لاتین (با منفی) → عدد؛ نامعتبر → null */
export function parseIntFa(raw: string): number | null {
  const latin = raw
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[−‒–—]/g, '-')
    .replace(/[٬,\s_]/g, '')
  if (!/^-?\d+$/.test(latin)) return null
  return Number(latin)
}

const digitsLatin = (s: string) =>
  s
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))

/** تاریخ دستی کاربر (جلالی «۱۴۰۵/۰۶/۳۰» یا میلادی «2026-09-21») → ISO میلادی؛ نامعتبر → null */
export function parseDateInput(raw: string): string | null {
  const t = digitsLatin(raw.trim())
  if (!t) return null
  const g = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t)
  if (g) {
    const dt = new Date(Number(g[1]), Number(g[2]) - 1, Number(g[3]))
    if (dt.getFullYear() === Number(g[1]) && dt.getMonth() === Number(g[2]) - 1 && dt.getDate() === Number(g[3])) {
      return `${g[1]}-${g[2]}-${g[3]}`
    }
    return null
  }
  const j = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/.exec(t)
  if (j) return fromJalali(Number(j[1]), Number(j[2]), Number(j[3])) || null
  return null
}

/** ورودی «۱۸:۳۰» → «18:30» معتبر؛ نامعتبر → null */
export function timeToHHMM(raw: string): string | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(digitsLatin(raw.trim()))
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return `${String(h).padStart(2, '0')}:${m[2]}`
}

/** رشته‌ی UTC بک‌اند (گاهی بدون timezone) را آگاهانه به Date تبدیل می‌کند */
export function parseUtcAware(iso: string): number {
  let s = iso
  if (!/[zZ]$/.test(s) && !/[+-]\d{2}:\d{2}$/.test(s)) s += 'Z'
  return new Date(s).getTime()
}

/** برچسب فارسیِ علت امتیاز وفاداری — enum بک‌اند LoyaltyReason */
export const LOYALTY_REASON_LABELS: Record<string, string> = {
  booking_completed: 'تکمیل رزرو',
  cost_split_remainder: 'باقی\u200cمانده تقسیم هزینه بازی',
  manual_adjust: 'هدیه/تنظیم مدیر',
  coupon_redemption: 'ثبت کد تخفیف',
  loyalty_redeem: 'خرج امتیاز در رزرو',
  loyalty_refund: 'بازگشت امتیاز در لغو',
  game_win: 'برد در بازی',
  review: 'ثبت نظر',
  quiz: 'پاسخ درست چالش هفتگی',
}