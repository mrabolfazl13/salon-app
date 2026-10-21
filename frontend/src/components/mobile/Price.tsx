import type React from 'react'
import { cn, formatPrice } from '@/lib/utils'

interface Props {
  value: number
  from?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const sizes = {
  sm: { main: 'text-[0.85rem]', label: 'text-xs' },
  md: { main: 'text-[1.05rem]', label: 'text-xs' },
  lg: { main: 'text-[1.35rem]', label: 'text-[0.78rem]' },
} as const

/** قیمت برجسته و خوانا — «از: ۳۸۰٬۰۰۰ ریال» */
const Price: React.FC<Props> = ({ value, from = false, size = 'md', color }) => {
  const s = sizes[size]
  return (
    <span className="inline-flex flex-wrap items-baseline gap-1">
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
