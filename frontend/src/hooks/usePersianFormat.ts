/**
 * React hook for Persian text formatting utilities
 * Provides convenient access to l10n functions with React integration
 */
import { useMemo } from 'react'
import {
  toPersianDigits,
  formatNumber,
  formatToman,
  truncatePersianText,
  normalizePersianText,
  formatPhoneNumber,
} from '../utils/l10n'

export function usePersianFormat() {
  return useMemo(
    () => ({
      /** Convert Latin digits to Persian */
      digits: toPersianDigits,

      /** Format number with Persian thousand separators */
      number: formatNumber,

      /** Format amount in Toman */
      toman: formatToman,

      /** Truncate text with Persian ellipsis */
      truncate: truncatePersianText,

      /** Normalize Persian text characters */
      normalize: normalizePersianText,

      /** Format phone number */
      phone: formatPhoneNumber,
    }),
    []
  )
}
