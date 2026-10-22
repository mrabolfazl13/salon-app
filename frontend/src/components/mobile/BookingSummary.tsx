import type React from 'react'
import Price from './Price'
import PrimaryButton from './PrimaryButton'

interface Props {
  price?: number | null
  /** متن کمکی زیر قیمت — مثلاً «امروز • ۱۸:۰۰» */
  subtitle?: string
  ctaLabel?: string
  disabled?: boolean
  loading?: boolean
  onAction?: () => void
}

/**
 * خلاصه رزرو — نوار CTA چسبان پایین صفحه جزئیات سالن.
 * بالای BottomNavigation (ارتفاع ۶۲) قرار می‌گیرد و safe-area را رعایت می‌کند.
 */
const BookingSummary: React.FC<Props> = ({
  price,
  subtitle,
  ctaLabel = 'رزرو سانس',
  disabled = false,
  loading = false,
  onAction,
}) => (
  <div className="fixed inset-x-0 bottom-[calc(62px_+_env(safe-area-inset-bottom))] z-[55] block border-t border-border bg-background/95 px-4 py-3 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl md:hidden dark:shadow-[0_-4px_24px_rgba(0,0,0,0.45)]">
    <div className="mx-auto flex max-w-[560px] items-center gap-3">
      <div className="min-w-0 flex-1">
        {price != null ? (
          <Price value={price} size="lg" />
        ) : (
          <p className="text-[0.85rem] font-semibold text-muted-foreground">سانسی انتخاب نشده</p>
        )}
        {subtitle && (
          <p className="mt-0.5 truncate text-[0.68rem] text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="w-36 shrink-0 sm:w-40">
        <PrimaryButton
          disabled={disabled || loading}
          loading={loading}
          onClick={onAction}
          fullWidth
          className="min-h-12 whitespace-nowrap"
        >
          {ctaLabel}
        </PrimaryButton>
      </div>
    </div>
  </div>
)

export default BookingSummary
