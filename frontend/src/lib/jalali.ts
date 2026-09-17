// frontend/src/lib/jalali.ts
// Jalali (Shamsi) conversion/formatting layer on top of Gregorian ISO.
// API payloads stay ISO Gregorian; this module only serves the UI layer.
//
// Based on jalaali-js (Borkowski algorithm; exact 1800-2256 Gregorian where it
// agrees with the official Persian calendar and Intl "fa-IR" rendering).
//
// Self-check (run with node against jalaali-js@2.0.1):
//   toJalali('2026-09-14')  -> { jy: 1405, jm: 6, jd: 23 }  OK
//   fromJalali(1405, 6, 23) -> '2026-09-14'                  OK
//   toJalali('2025-03-21')  -> { jy: 1404, jm: 1, jd: 1 }    OK (Nowruz 1404)
//   toJalali('2025-03-20')  -> { jy: 1403, jm: 12, jd: 30 }  OK (1403 is leap)
//   isJalaliLeap(1403)=true, isJalaliLeap(1405)=false        OK

import {
  toJalaali,
  toGregorian,
  isLeapJalaaliYear,
  jalaaliMonthLength as jalaaliMonthLengthRaw,
  isValidJalaaliDate,
} from 'jalaali-js'

export interface JalaliParts {
  jy: number
  jm: number
  jd: number
}

export const jalaliMonthNames = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
] as const

// the Jalali week starts on Saturday
export const jalaliWeekdayNames = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه',
] as const

export const jalaliWeekdayNamesShort = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
}

const pad2 = (n: number) => String(n).padStart(2, '0')

// Reads "YYYY-MM-DD" as a local calendar date (no timezone shift);
// datetime strings keep the previous `new Date(...)` local interpretation.
function parseDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null
  if (date instanceof Date) return Number.isNaN(date.getTime()) ? null : date
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const dt = new Date(date)
  return Number.isNaN(dt.getTime()) ? null : dt
}

/** Gregorian ISO (or Date) -> Jalali parts; null for invalid input */
export function toJalali(date: string | Date | null | undefined): JalaliParts | null {
  const dt = parseDate(date)
  if (!dt) return null
  const { jy, jm, jd } = toJalaali(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
  return { jy, jm, jd }
}

/** Jalali parts -> Gregorian ISO "YYYY-MM-DD"; invalid input -> '' */
export function fromJalali(jy: number, jm: number, jd: number): string {
  if (!isValidJalaaliDate(jy, jm, jd)) return ''
  const { gy, gm, gd } = toGregorian(jy, jm, jd)
  return `${gy}-${pad2(gm)}-${pad2(gd)}`
}

/** alias of fromJalali accepting parts-object or components */
export function toGregorianISO(parts: JalaliParts): string
export function toGregorianISO(jy: number, jm: number, jd: number): string
export function toGregorianISO(a: JalaliParts | number, b?: number, c?: number): string {
  return typeof a === 'number' ? fromJalali(a, b as number, c as number) : fromJalali(a.jy, a.jm, a.jd)
}

export function isJalaliLeap(jy: number): boolean {
  return isLeapJalaaliYear(jy)
}

export function jalaliMonthLength(jy: number, jm: number): number {
  return jalaaliMonthLengthRaw(jy, jm)
}

/** today as Gregorian ISO "YYYY-MM-DD" (local) */
export function getTodayISO(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

export interface JalaliFormatOptions {
  /** numeric: ۱۴۰۵/۰۶/۲۳ — long: ۲۳ شهریور ۱۴۰۵ — full: weekday + long */
  format?: 'numeric' | 'long' | 'full'
  /** digit glyphs (default Persian, matching the rest of the UI) */
  digits?: 'fa' | 'en'
}

const localize = (s: string, digits: 'fa' | 'en') => (digits === 'fa' ? toPersianDigits(s) : s)

/** Format a Gregorian ISO date as Jalali for display; invalid -> '—' */
export function formatJalaliDate(
  date: string | Date | null | undefined,
  opts: JalaliFormatOptions = {}
): string {
  const { format = 'long', digits = 'fa' } = opts
  const dt = parseDate(date)
  const j = toJalali(dt)
  if (!j || !dt) return '—'
  if (format === 'numeric') {
    return localize(`${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`, digits)
  }
  const label = `${j.jd} ${jalaliMonthNames[j.jm - 1]} ${j.jy}`
  if (format === 'full') {
    const weekday = jalaliWeekdayNames[(dt.getDay() + 1) % 7]
    return localize(`${weekday} ${label}`, digits)
  }
  return localize(label, digits)
}

/** local "HH:MM" with Persian digits; invalid -> '—' */
export function formatJalaliTime(date: string | Date | null | undefined, digits: 'fa' | 'en' = 'fa'): string {
  const dt = parseDate(date)
  if (!dt) return '—'
  return localize(`${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`, digits)
}

/** date + time, e.g. "۱۴۰۵/۰۶/۲۳ ۱۴:۳۰" (numeric) or "۲۳ شهریور ۱۴۰۵ ۱۴:۳۰" (long) */
export function formatJalaliDateTime(
  date: string | Date | null | undefined,
  opts: JalaliFormatOptions = {}
): string {
  const { format = 'long', digits = 'fa' } = opts
  if (!parseDate(date)) return '—'
  return `${formatJalaliDate(date, { format, digits })} ${formatJalaliTime(date, digits)}`
}

/** display shorthand: long Jalali string of a Gregorian ISO date */
export function toJalaliDisplay(date: string | Date | null | undefined): string {
  return formatJalaliDate(date, { format: 'long' })
}

/** Jalali weekday name from a Gregorian ISO date */
export function jalaliWeekdayName(date: string | Date): string {
  const dt = parseDate(date)
  if (!dt) return ''
  return jalaliWeekdayNames[(dt.getDay() + 1) % 7]
}