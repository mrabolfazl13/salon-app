/**
 * Component for displaying numbers in Persian format
 * Automatically converts Latin digits to Persian and applies proper formatting
 */
import { toPersianDigits } from '../utils/l10n'

interface PersianNumberProps {
  value: number | string
  className?: string
  /** Optional thousand separator (default: true) */
  separator?: boolean
}

export function PersianNumber({
  value,
  className = '',
  separator = true,
}: PersianNumberProps) {
  const formatted = (() => {
    if (typeof value === 'number') {
      return separator ? value.toLocaleString('fa-IR') : toPersianDigits(value)
    }
    return toPersianDigits(value)
  })()

  return <span className={`persian-numerals ${className}`}>{formatted}</span>
}

/**
 * Component for displaying currency in Toman
 */
interface PersianCurrencyProps {
  amount: number // in Rials
  className?: string
  showSymbol?: boolean
}

export function PersianCurrency({
  amount,
  className = '',
  showSymbol = true,
}: PersianCurrencyProps) {
  const toman = Math.round(amount / 10)
  const formatted = toman.toLocaleString('fa-IR')

  return (
    <span className={`persian-numerals ${className}`}>
      {formatted}
      {showSymbol && <span className="ml-1 text-sm opacity-75">تومان</span>}
    </span>
  )
}
