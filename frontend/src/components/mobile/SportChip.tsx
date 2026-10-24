import type React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

export interface Sport {
  key: string
  /** آیکون SVG (mdi) — جایگزین ایموجی در چیپ‌ها */
  icon: string
  /** @deprecated فقط برای منوهای متنی قدیمی نگه داشته شده */
  emoji: string
  label: string
  /** فیلتر اعمال‌شده روی venueService */
  category?: 'futsal' | 'gym'
  query?: string
}

export const SPORTS: Sport[] = [
  { key: 'futsal', icon: 'mdi:soccer', emoji: '⚽', label: 'فوتسال', category: 'futsal' },
  { key: 'football', icon: 'mdi:soccer-field', emoji: '🥅', label: 'فوتبال', category: 'futsal', query: 'فوتبال' },
  { key: 'basketball', icon: 'mdi:basketball', emoji: '🏀', label: 'بسکتبال', category: 'futsal', query: 'بسکتبال' },
  { key: 'volleyball', icon: 'mdi:volleyball', emoji: '🏐', label: 'والیبال', category: 'futsal', query: 'والیبال' },
  { key: 'tennis', icon: 'mdi:tennis', emoji: '🎾', label: 'تنیس', category: 'futsal', query: 'تنیس' },
  { key: 'badminton', icon: 'mdi:badminton', emoji: '🏸', label: 'بدمینتون', category: 'futsal', query: 'بدمینتون' },
  { key: 'gym', icon: 'mdi:dumbbell', emoji: '🏋️', label: 'بدنسازی', category: 'gym' },
  { key: 'pool', icon: 'mdi:billiards', emoji: '🎱', label: 'بیلیارد', category: 'futsal', query: 'بیلیارد' },
]

interface Props {
  sport: Sport
  active?: boolean
  onClick?: (sport: Sport) => void
}

/** چیپ ورزش — اسکرول افقی در Home */
const SportChip: React.FC<Props> = ({ sport, active = false, onClick }) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.95 }}
    transition={{ duration: 0.15 }}
    onClick={() => onClick?.(sport)}
    aria-pressed={active}
    className={cn(
      'inline-flex h-[64px] min-w-[68px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      active
        ? 'border-[1.5px] border-transparent bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-md shadow-amber-500/25'
        : 'border border-border bg-card shadow-sm hover:bg-muted/60'
    )}
  >
    <Icon
      icon={sport.icon}
      className={cn(
        'h-[22px] w-[22px]',
        active ? 'text-stone-900' : 'text-amber-800 dark:text-amber-400'
      )}
    />
    <span
      className={cn(
        'whitespace-nowrap text-[0.7rem]',
        active ? 'font-extrabold text-stone-900' : 'font-semibold text-slate-700 dark:text-slate-300'
      )}
    >
      {sport.label}
    </span>
  </motion.button>
)

/** ردیف اسکرول افقی چیپ‌ها */
export const SportChipRow: React.FC<{
  activeKey?: string | null
  onSelect: (sport: Sport) => void
}> = ({ activeKey, onSelect }) => (
  <div className="scrollbar-hide flex gap-2 overflow-x-auto px-0.5 pb-1">
    {SPORTS.map((s) => (
      <SportChip key={s.key} sport={s} active={activeKey === s.key} onClick={onSelect} />
    ))}
  </div>
)

export default SportChip
