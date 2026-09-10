import React from 'react'
import { Box, InputBase, IconButton } from '@mui/material'
import { Icon } from '@iconify/react'
import { radii, shadows } from '@/theme'

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
        border: '1px solid rgba(15,23,42,0.07)',
        boxShadow: shadows.card,
        cursor: readOnly ? 'pointer' : 'text',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:focus-within': {
          borderColor: 'rgba(37,99,235,0.45)',
          boxShadow: '0 0 0 3px rgba(37,99,235,0.10)',
        },
      }}
    >
      <Icon icon="mdi:magnify" style={{ width: 22, height: 22, color: '#94a3b8', flexShrink: 0 }} />
      <InputBase
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        placeholder={placeholder}
        readOnly={readOnly}
        autoFocus={autoFocus}
        fullWidth
        inputProps={{ 'aria-label': 'جستجو' }}
        sx={{ fontSize: '0.95rem', '& ::placeholder': { color: '#94a3b8' } }}
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
          sx={{ width: 44, height: 44, color: '#94a3b8' }}
        >
          <Icon icon="mdi:close-circle" style={{ width: 20, height: 20 }} />
        </IconButton>
      )}
    </Box>
  )
}

export default SearchBar
