/**
 * Localization utilities for Persian (Farsi) text rendering
 * Handles RTL-specific formatting, number conversion, and text normalization
 */

// Persian digits mapping
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

/**
 * Convert Latin digits to Persian digits
 * @param text - Input text containing Latin digits
 * @returns Text with Persian digits
 */
export function toPersianDigits(text: string | number): string {
  const str = String(text)
  return str.replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[parseInt(digit)])
}

/**
 * Convert Persian digits to Latin digits (for API input)
 * @param text - Input text containing Persian digits
 * @returns Text with Latin digits
 */
export function toLatinDigits(text: string): string {
  return text.replace(/[۰-۹]/g, (digit) => {
    const index = PERSIAN_DIGITS.indexOf(digit)
    return index !== -1 ? String(index) : digit
  })
}

/**
 * Format number with Persian thousand separators
 * @param num - Number to format
 * @returns Formatted string with Persian digits and thousand separators
 */
export function formatNumber(num: number): string {
  const formatted = num.toLocaleString('en-US')
  return toPersianDigits(formatted)
}

/**
 * Format currency in Toman (تومان)
 * @param amount - Amount in Rials
 * @returns Formatted currency string
 */
export function formatToman(amount: number): string {
  const toman = Math.round(amount / 10)
  return `${formatNumber(toman)} تومان`
}

/**
 * Normalize Persian text by removing extra spaces and normalizing characters
 * @param text - Raw Persian text
 * @returns Normalized text
 */
export function normalizePersianText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/ي/g, 'ی') // Arabic yeh to Persian
    .replace(/ك/g, 'ک') // Arabic kaf to Persian
    .replace(/ة/g, 'ه') // Arabic ta marbuta to Persian he
    .trim()
}

/**
 * Truncate text with ellipsis for Persian text
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with … (U+2026 HORIZONTAL ELLIPSIS)
 */
export function truncatePersianText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 1) + '…'
}

/**
 * Check if text contains RTL characters
 * @param text - Text to check
 * @returns true if text has RTL characters
 */
export function hasRTLCharacters(text: string): boolean {
  const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/
  return rtlRegex.test(text)
}

/**
 * Add ZWNJ (Zero Width Non-Joiner) for proper Persian ligature breaking
 * Useful for preventing unwanted ligatures in UI
 * @param text - Text to process
 * @returns Text with ZWNJ inserted where needed
 */
export function addZWNJForLigatures(text: string): string {
  // Insert ZWNJ between certain Persian character combinations
  // This prevents unwanted ligatures in headings and labels
  return text
    .replace(/([اآ])/g, '$1\u200c') // After alef variants
    .replace(/([و])/g, '$1\u200c') // After vav
    .trim()
}

/**
 * Format phone number in Persian format
 * @param phone - Phone number (e.g., "09123456789")
 * @returns Formatted phone number with Persian digits
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    return toPersianDigits(`${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`)
  }
  return toPersianDigits(cleaned)
}

/**
 * Create RTL-safe string by adding direction markers
 * @param parts - Array of text parts (mix of RTL and LTR)
 * @returns String with proper direction isolation
 */
export function joinRTL(parts: string[]): string {
  return parts.map((part) => {
    // If part is LTR (contains mostly Latin chars), wrap in LRI/PDI
    if (!hasRTLCharacters(part)) {
      return `\u2066${part}\u2069` // LRI ... PDI
    }
    return part
  }).join(' ')
}
