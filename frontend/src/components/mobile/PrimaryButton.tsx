import React from 'react'
import { Button, ButtonProps, CircularProgress } from '@mui/material'
import { Icon } from '@iconify/react'
import { gradients } from '@/theme'

interface Props extends Omit<ButtonProps, 'variant'> {
  icon?: string
  fullWidth?: boolean
  loading?: boolean
}

/** دکمه اصلی — تنها جای استفاده از گرادیان آبی→بنفش */
const PrimaryButton: React.FC<Props> = ({ icon, children, fullWidth = true, sx, startIcon, loading = false, disabled, ...rest }) => (
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
      boxShadow: '0 6px 20px rgba(37,99,235,0.3)',
      transition: 'all 0.2s ease',
      '&:hover': { background: gradients.primaryHover, boxShadow: '0 8px 26px rgba(37,99,235,0.38)' },
      '&:active': { transform: 'scale(0.985)' },
      '&.Mui-disabled': { background: 'rgba(15,23,42,0.12)', color: '#94a3b8', boxShadow: 'none' },
      ...sx,
    }}
    {...rest}
  >
    {children}
  </Button>
)

export default PrimaryButton
