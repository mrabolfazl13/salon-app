// frontend/src/components/game/WaitlistList.tsx
// لیست انتظار — به ترتیب رتبه؛ ارتقای خودکار پس از خالی‌شدن ظرفیت توسط بک‌اند انجام می‌شود

import React from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

import type { WaitlistEntry } from '@/types/game'
import { formatPersianDateTime } from '@/utils/helpers'

interface Props {
  entries: WaitlistEntry[]
}

const WaitlistList: React.FC<Props> = ({ entries }) => {
  if (entries.length === 0) {
    return <p className="py-2 text-[0.85rem] text-muted-foreground">لیست انتظار خالی است.</p>
  }

  const sorted = [...entries].sort((a, b) => a.position - b.position)

  return (
    <div className="flex flex-col gap-1.5">
      {sorted.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center gap-2.5 rounded-[14px] border border-border bg-slate-900/[0.015] px-3 py-2 dark:bg-white/[0.02]"
        >
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.78rem] font-extrabold',
              entry.position === 1
                ? 'bg-amber-500/[0.14] text-amber-700 dark:text-amber-400'
                : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
            )}
          >
            {entry.position.toLocaleString('fa-IR')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.82rem] font-semibold text-foreground">
              {`کاربر ${entry.user_id.toLocaleString('fa-IR')}`}
            </p>
            <p className="mt-px truncate text-[0.68rem] text-muted-foreground">
              {`در صف از: ${formatPersianDateTime(entry.created_at)}`}
            </p>
          </div>
          {entry.position === 1 && (
            <div className="flex items-center gap-1 text-[0.68rem] font-bold text-amber-600 dark:text-amber-400">
              <Icon icon="mdi:star-four-points" style={{ width: 13, height: 13 }} />
              نوبت بعدی
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default WaitlistList
