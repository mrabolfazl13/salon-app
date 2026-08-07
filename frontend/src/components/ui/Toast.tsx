// src/components/ui/Toast.tsx
import React from 'react'
import { SnackbarProvider, useSnackbar, VariantType } from 'notistack'
import { Icon } from '@iconify/react'
import { Button, IconButton } from '@mui/material'

interface ToastProviderProps {
  children: React.ReactNode
  maxSnack?: number
}

const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxSnack = 5,
}) => {
  return (
    <SnackbarProvider
      maxSnack={maxSnack}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      autoHideDuration={4000}
      style={{
        fontFamily: 'Vazirmatn, sans-serif',
        direction: 'rtl',
      }}
      iconVariant={{
        success: <Icon icon="mdi:check-circle" className="h-5 w-5" />,
        error: <Icon icon="mdi:alert-circle" className="h-5 w-5" />,
        warning: <Icon icon="mdi:alert" className="h-5 w-5" />,
        info: <Icon icon="mdi:information" className="h-5 w-5" />,
      }}
    >
      {children}
    </SnackbarProvider>
  )
}

export const useToast = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()

  const showToast = (
    message: string,
    variant: VariantType = 'default',
    options?: any
  ) => {
    return enqueueSnackbar(message, {
      variant,
      ...options,
      style: {
        fontFamily: 'Vazirmatn, sans-serif',
        direction: 'rtl',
        borderRadius: '12px',
      },
    })
  }

  const success = (message: string, options?: any) => {
    return showToast(message, 'success', options)
  }

  const error = (message: string, options?: any) => {
    return showToast(message, 'error', options)
  }

  const warning = (message: string, options?: any) => {
    return showToast(message, 'warning', options)
  }

  const info = (message: string, options?: any) => {
    return showToast(message, 'info', options)
  }

  const close = (key: string | number) => {
    closeSnackbar(key)
  }

  return {
    showToast,
    success,
    error,
    warning,
    info,
    close,
  }
}

export default ToastProvider