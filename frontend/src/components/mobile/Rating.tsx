import type React from 'react'
import { Icon } from '@iconify/react'
import { toPersianDigits } from '@/utils/l10n'
import { cn } from '@/lib/utils'

interface Props {
  value?: number
  count?: number
  size?: 'sm' | 'md'
}

/** ⭐ 4.8 (120) — نمایش فشرده امتیاز */
const Rating: React.FC<Props> = ({ value = 0, count = 0, size = 'sm' }) => {
  const iconPx = size === 'md' ? 16 : 13
  const font = size === 'md' ? 'text-[0.82rem]' : 'text-[0.72rem]'
  // «4.5» با ارقام لاتین و نقطهٔ اعشار در بقیهٔ رابط فارسی ناهمگون بود.
  const valueText = value ? toPersianDigits(value.toFixed(1)).replace('.', '٫') : '—'
  const label = value
    ? `امتیاز ${valueText} از ۵${count > 0 ? `، ${toPersianDigits(count.toLocaleString('fa-IR'))} نظر` : ''}`
    : 'امتیازی ثبت نشده'
  return (
    <span role="img" aria-label={label} className="inline-flex items-center gap-1">
      <Icon icon="mdi:star" style={{ color: '#f59e0b', width: iconPx, height: iconPx }} />
      <span className={cn('font-bold text-foreground', font)}>{valueText}</span>
      {count > 0 && (
        <span className={cn('text-muted-foreground', font)}>({count.toLocaleString('fa-IR')})</span>
      )}
    </span>
  )
}

export default Rating
