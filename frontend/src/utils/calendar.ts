// src/utils/calendar.ts
// تولید فایل .ics (RFC 5545) از رزرو — دکمهٔ «افزودن به تقویم»
//
// چرا TZID به‌جای UTC: `date`/`time` رزرو زمان محلی تهران (wall-clock) است؛ تبدیل به
// Z با منطقهٔ زمانی دستگاه کاربر اشتباه می‌شود (مسافر/VPN). Asia/Tehran از ۱۴۰۱
// daylight-saving ندارد، پس VTIMEZONE یک جزء STANDARD ثابت دارد.

export interface CalendarEventInput {
  /** شناسهٔ رزرو — در UID و SUMMARY استفاده می‌شود */
  bookingId: number
  venueName: string
  /** YYYY-MM-DD (مطابق خروجی API) */
  date: string
  /** HH:mm یا HH:mm:ss */
  time: string
  /** مدت سانس به دقیقه — پیش‌فرض ۶۰ */
  durationMinutes?: number
  price?: number
  address?: string
}

const PRODUCT_ID = '-//Salon Futsal Booking//IR'

/** فرار مقادیر TEXT بر پایهٔ RFC 5545 §3.3.11 (backslash اولین، سپس ; , و newline) */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** YYYYMMDDTHHMMSS از اجزای محلی (بدون تبدیل منطقهٔ زمانی) */
function icsLocal(date: string, time: string): string {
  const [y, mo, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${y}${pad(mo)}${pad(d)}T${pad(hh || 0)}${pad(mm || 0)}00`
}

/** DTEND = شروع + مدت؛ از مرز نیمه‌شب/ماه با Dateٔ محلی عبور می‌کند */
function addMinutes(date: string, time: string, minutes: number): string {
  const [y, mo, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const end = new Date(y, mo - 1, d, hh || 0, (mm || 0) + minutes)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())} ${pad(end.getHours())}:${pad(end.getMinutes())}`
}

/** تا کردن خطوط ≥۷۵ octet با CRLF+space (RFC 5545 §3.1) — حروف فارسی UTF-۸ هستند */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line
  const out: string[] = []
  let current = ''
  let currentLen = 0
  for (const ch of line) {
    const chLen = encoder.encode(ch).length
    // خطوط ادامه یک فاصله رزرو می‌کنند ⇒ سقف ۷۴ در ادامهٔ خط
    const limit = out.length === 0 ? 75 : 74
    if (currentLen + chLen > limit) {
      out.push(current)
      current = ch
      currentLen = chLen
    } else {
      current += ch
      currentLen += chLen
    }
  }
  out.push(current)
  return out.join('\r\n ')
}

/** YYYYMMDDTHHMMSSZ — DTSTAMP باید UTC باشد (برخلاف DTSTART که wall-clock تهران است) */
function utcStamp(): string {
  const n = new Date()
  const pad = (x: number) => String(x).padStart(2, '0')
  return (
    `${n.getUTCFullYear()}${pad(n.getUTCMonth() + 1)}${pad(n.getUTCDate())}` +
    `T${pad(n.getUTCHours())}${pad(n.getUTCMinutes())}${pad(n.getUTCSeconds())}Z`
  )
}

/** ساخت متن کامل VCALENDAR — فقط خروجیِ این تابع دانلود می‌شود */
export function buildIcsEvent(input: CalendarEventInput): string {
  const { bookingId, venueName, date, time, price, address } = input
  const duration = input.durationMinutes ?? 60
  const start = icsLocal(date, time)
  const [endDate, endTime] = addMinutes(date, time, duration).split(' ')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODUCT_ID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Tehran',
    'BEGIN:STANDARD',
    'DTSTART:19790101T000000',
    'TZOFFSETFROM:+0330',
    'TZOFFSETTO:+0330',
    'TZNAME:+0330',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:booking-${bookingId}@salon.absadeghi.ir`,
    `DTSTAMP:${utcStamp()}`,
    `DTSTART;TZID=Asia/Tehran:${start}`,
    `DTEND;TZID=Asia/Tehran:${icsLocal(endDate, endTime)}`,
    foldIcsLine(`SUMMARY:${escapeIcsText(`سانس ${venueName}`)}`),
    foldIcsLine(`LOCATION:${escapeIcsText(address || venueName)}`),
    foldIcsLine(
      `DESCRIPTION:${escapeIcsText(
        `رزرو سالن ${venueName}` + (price ? ` — مبلغ ${price.toLocaleString('fa-IR')} ریال` : ''),
      )}`,
    ),
    `URL:https://salon.absadeghi.ir/bookings/${bookingId}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n') + '\r\n'
}

/** نام فایل پایدار برای دانلود */
export function icsFileName(input: CalendarEventInput): string {
  return `booking-${input.bookingId}-${input.date}.ics`
}

/** ساخت Blob و شروع دانلود فایل .ics */
export function downloadIcsEvent(input: CalendarEventInput): void {
  const blob = new Blob([buildIcsEvent(input)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = icsFileName(input)
  document.body.appendChild(a)
  a.click()
  a.remove()
  // آزادسازی بعد از یک tick — بعضی مرورگرها قبل از شروع دانلود URL را می‌سنجند
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
