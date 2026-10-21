import React from 'react'
import { Icon } from '@iconify/react'
import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/lib/utils'

interface Props {
  size?: number
  className?: string
}

/** کلید تعویض حالت روشن/تاریک — نسخهٔ shadcn (بدون MUI) */
const ThemeToggle: React.FC<Props> = ({ size = 20, className }) => {
  const mode = useThemeStore((s) => s.mode)
  const toggle = useThemeStore((s) => s.toggle)
  const dark = mode === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'فعال‌سازی حالت روشن' : 'فعال‌سازی حالت تاریک'}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <Icon
        icon={dark ? 'mdi:weather-sunny' : 'mdi:weather-night'}
        style={{ width: size, height: size, color: dark ? '#fbbf24' : '#f59e0b' }}
      />
    </button>
  )
}

export default ThemeToggle
