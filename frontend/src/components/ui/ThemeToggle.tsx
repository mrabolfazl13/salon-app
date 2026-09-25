import React from 'react'
import { IconButton } from '@mui/material'
import type { SxProps, Theme } from '@mui/material'
import { Icon } from '@iconify/react'
import { useThemeStore } from '@/store/themeStore'

interface Props {
  size?: number
  sx?: SxProps<Theme>
}

/** کلید تعویض حالت روشن/تاریک */
const ThemeToggle: React.FC<Props> = ({ size = 20, sx }) => {
  const mode = useThemeStore((s) => s.mode)
  const toggle = useThemeStore((s) => s.toggle)
  const dark = mode === 'dark'

  return (
    <IconButton
      onClick={toggle}
      aria-label={dark ? 'فعال‌سازی حالت روشن' : 'فعال‌سازی حالت تاریک'}
      sx={{
        width: size + 20,
        height: size + 20,
        color: 'inherit',
        borderRadius: '12px',
        transition: 'background-color 0.2s ease',
        '&:hover': { bgcolor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)' },
        ...sx,
      }}
    >
      <Icon
        icon={dark ? 'mdi:weather-sunny' : 'mdi:weather-night'}
        style={{ width: size, height: size, color: dark ? '#fbbf24' : '#f59e0b' }}
      />
    </IconButton>
  )
}

export default ThemeToggle
