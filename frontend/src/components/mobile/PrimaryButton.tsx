import React from 'react'
import { Button, ButtonProps, CircularProgress, useTheme } from '@mui/material'
import { Icon } from '@iconify/react'
import { gradients } from '@/theme'

interface Props extends Omit<ButtonProps, 'variant'> {
  icon?: string
  fullWidth?: boolean
  loading?: boolean
}

/** دکمه اصلی — گرادیان navy→blue با متن سفید؛ CTA رزرو */
const PrimaryButton: React.FC<Props> = ({ icon, children, fullWidth = true, sx, startIcon, loading = false, disabled, ...rest }) => {
  const dark = useTheme().palette.mode === 'dark'
  return (
    <Button
      variant="contained"
      fullWidth={fullWidth}
      disabled={disabled || loading}
      startIcon={
        loading ? (
          <CircularProgress size={18} color="inherit" />
        ) : icon && !startIcon ? (
          <Icon icon={icon} style={{ width: 20, height: 20 }} />
        ) : startIcon
      }
      sx={{
        textTransform: 'none',
        fontWeight: 700,
        fontSize: '0.95rem',
        py: 1.5,
        minHeight: 50,
        borderRadius: '14px',
        background: gradients.primary,
        boxShadow: dark ? '0 6px 20px rgba(29,78,216,0.35)' : '0 6px 20px rgba(30,58,138,0.28)',
        transition: 'all 0.2s ease',
        '&:hover': { background: gradients.primaryHover, boxShadow: dark ? '0 8px 26px rgba(29,78,216,0.45)' : '0 8px 26px rgba(30,58,138,0.36)' },
        '&:active': { transform: 'scale(0.985)' },
        '&.Mui-disabled': {
          background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.12)',
          color: dark ? '#5b6879' : '#94a3b8',
          boxShadow: 'none',
        },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Button>
  )
}

export default PrimaryButton
