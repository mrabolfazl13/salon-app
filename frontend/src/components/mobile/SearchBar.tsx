import React from 'react'
import { Box, InputBase, IconButton, useTheme } from '@mui/material'
import { Icon } from '@iconify/react'
import { radii, shadows, shadowsDark } from '@/theme'

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

/** نوار جستجوی مدرن — ارتفاع ۵۲px، target لمسی ≥44 */
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
}) => {
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  return (
    <Box
      onClick={readOnly ? onClick : undefined}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        height: 52,
        px: 2,
        borderRadius: `${radii.button}px`,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: dark ? shadowsDark.card : shadows.card,
        cursor: readOnly ? 'pointer' : 'text',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:focus-within': {
          borderColor: dark ? 'rgba(251,191,36,0.55)' : 'rgba(245,158,11,0.6)',
          boxShadow: dark ? '0 0 0 3px rgba(251,191,36,0.14)' : '0 0 0 3px rgba(245,158,11,0.14)',
        },
      }}
    >
      <Icon icon="mdi:magnify" style={{ width: 22, height: 22, color: dark ? '#fbbf24' : '#d97706', flexShrink: 0 }} />
      <InputBase
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        placeholder={placeholder}
        readOnly={readOnly}
        autoFocus={autoFocus}
        fullWidth
        inputProps={{ 'aria-label': 'جستجو' }}
        sx={{
          fontSize: '0.95rem',
          color: 'text.primary',
          '& ::placeholder': { color: 'text.secondary', opacity: 0.8 },
        }}
      />
      {startAdornment}
      {!readOnly && value && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onClear?.()
            onChange?.('')
          }}
          aria-label="پاک کردن"
          sx={{ width: 44, height: 44, color: 'text.secondary' }}
        >
          <Icon icon="mdi:close-circle" style={{ width: 20, height: 20 }} />
        </IconButton>
      )}
    </Box>
  )
}

export default SearchBar
