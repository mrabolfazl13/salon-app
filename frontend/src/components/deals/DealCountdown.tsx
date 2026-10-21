// frontend/src/components/deals/DealCountdown.tsx
// شمارش معکوس زنده «تا پایان تخفیف» — رشته UTC بک‌اند (گاهی بی‌timezone) را
// آگاهانه UTC فرض می‌کند و هر ثانیه تیک می‌خورد.

import React, { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { toPersianDigits } from '@/lib/jalali'

function toExpiresTime(expiresAt: string): number {
  let s = expiresAt
  if (!/[zZ]$/.test(s) && !/[+-]\d{2}:?\d{2}$/.test(s)) s += 'Z'
  const t = new Date(s).getTime()
  return Number.isNaN(t) ? 0 : t
}

const fmt = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return toPersianDigits(h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`)
}

const DealCountdown: React.FC<{ expiresAt: string | null; compact?: boolean }> = ({ expiresAt, compact = false }) => {
  const deadline = useMemo(() => (expiresAt ? toExpiresTime(expiresAt) : null), [expiresAt])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!deadline) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [deadline])

  if (!deadline) {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Icon icon="mdi:infinity" style={{ width: 14, height: 14 }} />
        تخفیف تا شروع سانس معتبر است
      </span>
    )
  }
  const diff = deadline - now
  if (diff <= 0) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
        <Icon icon="mdi:timer-off-outline" style={{ width: 14, height: 14 }} />
        تخفیف منقضی شده
      </span>
    )
  }
  const urgent = diff < 15 * 60 * 1000
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full py-1 text-xs font-extrabold',
        compact ? 'px-1.5' : 'px-2.5',
        urgent
          ? 'bg-red-600/10 text-red-600 dark:text-red-400'
          : 'bg-amber-500/[0.12] text-amber-600 dark:text-amber-400'
      )}
    >
      <Icon icon="mdi:timer-sand" style={{ width: 14, height: 14 }} />
      تا پایان تخفیف
      <span dir="ltr" className="font-black tabular-nums">{fmt(diff)}</span>
    </span>
  )
}

export default DealCountdown
