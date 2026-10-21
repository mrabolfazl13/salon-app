import type React from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/shadcn/button'
import { cn } from '@/lib/utils'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string
  fullWidth?: boolean
  loading?: boolean
}

/** دکمه اصلی — CTA کهربایی برند برای رزرو و اقدام‌های اصلی */
const PrimaryButton: React.FC<Props> = ({
  icon,
  children,
  fullWidth = true,
  className,
  loading = false,
  disabled,
  type = 'button',
  ...rest
}) => (
  <Button
    type={type}
    disabled={disabled || loading}
    className={cn('min-h-12 rounded-[14px] py-3 text-[0.95rem] font-bold', fullWidth && 'w-full', className)}
    {...rest}
  >
    {loading ? (
      <span
        className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-stone-900/25 border-t-stone-900"
        role="status"
        aria-label="در حال بارگذاری"
      />
    ) : (
      icon && <Icon icon={icon} aria-hidden="true" style={{ width: 20, height: 20 }} />
    )}
    {children}
  </Button>
)

export default PrimaryButton
