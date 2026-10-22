import type React from 'react'
import { cn, formatPrice } from '@/lib/utils'

interface Props {
  value: number
  from?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const sizes = {
  sm: { main: 'text-[0.75rem]', label: 'text-[0.65rem]' },
  md: { main: 'text-[0.88rem]', label: 'text-[0.68rem]' },
  lg: { main: 'text-[1.1rem]', label: 'text-[0.72rem]' },
} as const

/** قیمت برجسته و خوانا — «از: ۳۸۰٬۰۰۰ ریال» */
const Price: React.FC<Props> = ({ value, from = false, size = 'md', color }) => {
  const s = sizes[size]
  return (
    <span className="inline-flex flex-wrap items-baseline gap-0.5">
      {from && <span className={cn('text-muted-foreground', s.label)}>از:</span>}
      <span
        dir="rtl"
        className={cn(
          'font-extrabold tracking-[-0.01em] tabular-nums',
          !color && 'text-foreground',
          s.main
        )}
        style={color ? { color } : undefined}
      >
        {formatPrice(value)}
      </span>
    </span>
  )
}

export default Price
