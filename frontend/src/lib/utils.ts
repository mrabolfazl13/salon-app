import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatJalaliDate, formatJalaliDateTime } from './jalali'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'
}

// نمایش جلالی یکنواخت (منطق مشترک در src/lib/jalali.ts)
export function formatDate(date: string | Date): string {
  return formatJalaliDate(date, { format: 'long' })
}

export function formatDateTime(date: string | Date): string {
  return formatJalaliDateTime(date, { format: 'long' })
}

export function formatTime(time: string): string {
  return time.slice(0, 5)
}

export function getInitials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    expired: 'bg-gray-100 text-gray-700',
    available: 'bg-green-100 text-green-700',
    booked: 'bg-red-100 text-red-700',
    blocked: 'bg-gray-100 text-gray-700',
    in_competition: 'bg-amber-100 text-amber-700',
    reserved: 'bg-purple-100 text-purple-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    confirmed: 'تایید شده',
    pending: 'در انتظار',
    cancelled: 'لغو شده',
    completed: 'انجام شده',
    active: 'فعال',
    expired: 'منقضی',
    available: 'آزاد',
    booked: 'رزرو شده',
    blocked: 'مسدود',
    in_competition: 'در حال رقابت',
    reserved: 'رزرو قرارداد',
  }
  return labels[status] || status
}

// رنگ Chip در MUI برای وضعیت‌ها (استفاده مشترک در همه صفحات)
export function getMuiStatusColor(status: string): string {
  const colors: Record<string, string> = {
    confirmed: 'success',
    pending: 'warning',
    cancelled: 'error',
    completed: 'info',
    active: 'success',
    expired: 'default',
    available: 'success',
    booked: 'error',
    blocked: 'default',
    in_competition: 'warning',
    reserved: 'secondary',
  }
  return colors[status] || 'default'
}

// برچسب فارسی وضعیت سانس با fallback امن برای وضعیت‌های ناشناختهٔ آینده
export const SLOT_STATUS_LABELS: Record<string, string> = {
  available: 'آزاد',
  booked: 'رزرو شده',
  blocked: 'مسدود',
  in_competition: 'در حال رقابت',
  reserved: 'رزرو قرارداد',
}

export function getSlotStatusLabel(status: string): string {
  return SLOT_STATUS_LABELS[status] ?? 'نامشخص'
}

// تبدیل ارقام فارسی/عربی به لاتین (تا فراخوانی دوبارهٔ فرمت‌کننده‌ها خراب نشود)
const toLatinDigits = (value: string): string =>
  value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))

// نمایش امن ساعت — ورودی لاتین ("HH:MM[:SS]") یا فارسی‌شده را می‌پذیرد؛
// در صورت نامعتبر بودن رشته، خودش را برمی‌گرداند و هرگز "Invalid Date" تولید نمی‌کند
function safeFaTime(time: string): string {
  const raw = toLatinDigits(time).slice(0, 5)
  const date = new Date(`2000-01-01T${raw}`)
  if (Number.isNaN(date.getTime())) return raw || time
  return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
}

// محاسبه ساعت پایان سانس بر اساس ساعت شروع و مدت (دقیقه) — خروجی فارسی‌شده
export function getSlotEndTime(startTime: string, durationMin: number): string {
  const [h, m] = toLatinDigits(startTime || '00:00').split(':').map(Number)
  const total = (h || 0) * 60 + (m || 0) + (durationMin || 90)
  const endH = Math.floor(total / 60) % 24
  const endM = total % 60
  const raw = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  return safeFaTime(raw)
}

// تبدیل ساعت "HH:MM" به نمایش فارسی
export function formatTimeFa(time?: string): string {
  if (!time) return '—'
  return safeFaTime(time)
}

export function truncateText(text: string, length: number = 50): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function getDayName(day: number): string {
  const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
  return days[day] || ''
}

// روزهای هفته از دید بک‌اند: 0 = دوشنبه ... 6 = یکشنبه (Python weekday)
export const pyDayNames = ['دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه', 'یکشنبه']

// تبدیل getDay جاوااسکریپت (0=یکشنبه) به weekday پایتون (0=دوشنبه)
export const toPyWeekday = (d: Date): number => (d.getDay() + 6) % 7

// شمارش جلسات قرارداد با منطق یکسان با بک‌اند
export function countContractSessions(
  startDate: string,
  endDate: string,
  dayOfWeek: number,
  recurrence: string
): number {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0

  let count = 0
  const current = new Date(start)
  let guard = 0
  while (current <= end && guard < 1000) {
    guard++
    if (toPyWeekday(current) === dayOfWeek) count++
    if (recurrence === 'biweekly') {
      current.setDate(current.getDate() + 14)
    } else if (recurrence === 'monthly') {
      current.setMonth(current.getMonth() + 1)
    } else {
      current.setDate(current.getDate() + 7)
    }
  }
  return count
}

// ─────────────── روش پرداخت + وضعیت فیش واریزی ───────────────

export const PAYMENT_MODE_LABELS: Record<string, string> = {
  gateway: 'درگاه آنلاین',
  bank_receipt: 'فیش واریزی',
  pay_in_place: 'پرداخت در محل',
}

export function getPaymentModeLabel(mode?: string | null): string {
  if (!mode) return 'نامشخص'
  return PAYMENT_MODE_LABELS[mode] ?? mode
}

export function getPaymentModeIcon(mode?: string | null): string {
  if (mode === 'gateway') return 'mdi:credit-card-wireless-outline'
  if (mode === 'pay_in_place') return 'mdi:cash-register'
  return 'mdi:receipt-text-outline'
}

export const RECEIPT_STATUS_LABELS: Record<string, string> = {
  none: 'بدون فیش',
  submitted: 'در انتظار بررسی مدیر',
  approved: 'تأیید شده',
  rejected: 'رد شده',
}

export function getReceiptStatusLabel(status?: string | null): string {
  if (!status) return RECEIPT_STATUS_LABELS.none
  return RECEIPT_STATUS_LABELS[status] ?? status
}

export function getReceiptStatusMuiColor(status?: string | null): 'default' | 'warning' | 'success' | 'error' {
  if (status === 'submitted') return 'warning'
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  return 'default'
}

/** رنگ چیپ روش پرداخت در جدول مدیر */
export const PAYMENT_MODE_CHIP_STYLE: Record<string, { bg: string; color: string }> = {
  gateway: { bg: 'rgba(37,99,235,0.1)', color: '#2563eb' },
  bank_receipt: { bg: 'rgba(217,119,6,0.1)', color: '#d97706' },
  pay_in_place: { bg: 'rgba(5,150,105,0.1)', color: '#059669' },
}

/** ترجمهٔ خطاهای شناخته‌شدهٔ بک‌اند دربارهٔ پرداخت/فیش به متن دوستانه */
export function translatePaymentError(message: string, fallback: string): string {
  const m = (message || '').trim()
  if (!m) return fallback
  if (/at least 4 characters/i.test(m) || /min_length|should have at least 4/i.test(m)) {
    return 'دلیل رد فیش باید حداقل ۴ حرف باشد'
  }
  if (/greater than 0|must be greater than 0/i.test(m)) return 'مبلغ باید بیشتر از صفر باشد'
  if (m.includes('قبلا پیشرفته')) return 'این رزرو قبلاً پرداخت شده است'
  if (m.includes('ارسال نشده')) return 'فیشی برای این رزرو ثبت نشده است'
  if (m.includes('در محل نیست')) return 'روش پرداخت این رزرو «پرداخت در محل» نیست'
  if (m.includes('فیش واریزی استفاده نمی‌کند')) return 'این رزرو از روش فیش واریزی استفاده نمی‌کند'
  return m
}