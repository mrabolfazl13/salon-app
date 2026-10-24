import type React from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

interface Props {
  value?: string
  onChange?: (v: string) => void
  onSubmit?: () => void
  onClear?: () => void
  placeholder?: string
  /** حالت نمایشی (کلیک → باز شدن صفحه جستجو) */
  readOnly?: boolean
  onClick?: () => void
  autoFocus?: boolean
  startAdornment?: React.ReactNode
}

/** نوار جستجوی مدرن — ارتفاع ۴۴px، target لمسی ≥44 */
const SearchBar: React.FC<Props> = ({
  value = '',
  onChange,
  onSubmit,
  onClear,
  placeholder = 'جستجوی سالن، منطقه یا ورزش...',
  readOnly = false,
  onClick,
  autoFocus = false,
  startAdornment,
}) => (
  <div
    onClick={readOnly ? onClick : undefined}
    className={cn(
      'flex h-12 items-center gap-1.5 rounded-xl border border-border bg-card px-3 shadow-sm transition-[border-color,box-shadow]',
      'focus-within:border-amber-500/60 focus-within:shadow-[0_0_0_2px_rgba(245,158,11,0.12)] dark:focus-within:border-amber-400/55 dark:focus-within:shadow-[0_0_0_2px_rgba(251,191,36,0.12)]',
      readOnly ? 'cursor-pointer' : 'cursor-text'
    )}
  >
    {/* #d97706 روی سفید ۳٫۲:۱ است — حتی برای گرافیک غیرمتنی هم زیر ۳:۱؛ نسخهٔ warning.main */}
    <Icon
      icon="mdi:magnify"
      className="h-[18px] w-[18px] shrink-0 text-amber-700 dark:text-amber-400"
      aria-hidden="true"
    />
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      // در حالت readOnly باکس با کلیک باز می‌شود؛ کیبورد روی خود input فوکوس است،
      // پس Enter باید همان کار کلیک را بکند (وگرنه کنترل با کیبورد غیرقابل استفاده است)
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return
        if (readOnly) { if (onClick) { e.preventDefault(); onClick() } return }
        onSubmit?.()
      }}
      placeholder={placeholder}
      readOnly={readOnly}
      autoFocus={autoFocus}
      aria-label="جستجو"
      className="h-full min-w-0 flex-1 bg-transparent text-[0.82rem] text-foreground outline-none placeholder:text-muted-foreground placeholder:opacity-80"
    />
    {startAdornment}
    {!readOnly && value && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClear?.()
          onChange?.('')
        }}
        aria-label="پاک کردن"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon icon="mdi:close-circle" style={{ width: 16, height: 16 }} />
      </button>
    )}
  </div>
)

export default SearchBar
