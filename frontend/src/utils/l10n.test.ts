import { describe, it, expect } from 'vitest'
import { toLatinDigits, toPersianDigits, formatToman, formatNumber } from './l10n'

describe('l10n digits', () => {
  it('converts Persian digits to Latin (API input)', () => {
    expect(toLatinDigits('۰۹۱۲۳۴۵۶۷۸۹')).toBe('09123456789')
  })

  it('leaves non-digit characters untouched', () => {
    expect(toLatinDigits('۱۲abc-۳')).toBe('12abc-3')
  })

  it('is idempotent on Latin-only input', () => {
    expect(toLatinDigits('2026-10-15')).toBe('2026-10-15')
  })

  it('round-trips through Persian digits', () => {
    expect(toLatinDigits(toPersianDigits('1234567890'))).toBe('1234567890')
  })

  it('formats Rials into Toman with Persian separators', () => {
    expect(formatToman(1250000)).toBe('۱۲۵٬۰۰۰ تومان')
  })

  it('groups thousands before converting', () => {
    expect(formatNumber(200000)).toBe('۲۰۰٬۰۰۰')
  })
})
