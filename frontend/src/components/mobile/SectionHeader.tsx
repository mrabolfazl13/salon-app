import type React from 'react'
import { Icon } from '@iconify/react'

interface Props {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  /** سطح سرتیتر; صفحاتی که SectionHeader عنوان اصلی خودشان است «h1» می‌دهند */
  heading?: 'h1' | 'h2'
}

/** عنوان بخش با لینک «همه» — خط تأکید کهربایی برای هویت اسپرت */
const SectionHeader: React.FC<Props> = ({ title, subtitle, actionLabel, onAction, heading = 'h2' }) => {
  const titleClass = 'text-[0.9rem] font-extrabold text-foreground'
  return (
    <div className="mb-1 flex items-center justify-between gap-1.5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="h-4 w-0.5 shrink-0 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
          {heading === 'h1' ? (
            <h1 className={titleClass}>{title}</h1>
          ) : (
            <h2 className={titleClass}>{title}</h2>
          )}
        </div>
        {subtitle && (
          <span className="block ps-2.5 text-[0.68rem] text-muted-foreground">{subtitle}</span>
        )}
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center gap-0.5 rounded-lg px-2 text-[0.72rem] font-bold text-amber-700 transition-colors hover:bg-amber-500/[0.07] hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-amber-400 dark:hover:bg-amber-400/10 dark:hover:text-amber-300"
        >
          {actionLabel}
          <Icon icon="mdi:chevron-left" aria-hidden="true" style={{ width: 15, height: 15 }} />
        </button>
      )}
    </div>
  )
}

export default SectionHeader
