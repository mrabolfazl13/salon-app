// src/components/ui/Alert.tsx
import React from 'react'
import {
  Alert as MuiAlert,
  AlertProps as MuiAlertProps,
  AlertTitle,
  Collapse,
  IconButton,
} from '@mui/material'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'

export interface AlertProps extends MuiAlertProps {
  title?: string
  onClose?: () => void
  dismissible?: boolean
  icon?: string
}

const Alert: React.FC<AlertProps> = ({
  children,
  title,
  onClose,
  dismissible = true,
  icon,
  severity = 'info',
  variant = 'filled',
  ...props
}) => {
  const [open, setOpen] = React.useState(true)

  const handleClose = () => {
    setOpen(false)
    onClose?.()
  }

  const severityIcons = {
    success: 'mdi:check-circle',
    error: 'mdi:alert-circle',
    warning: 'mdi:alert',
    info: 'mdi:information',
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <MuiAlert
            severity={severity}
            variant={variant}
            icon={icon ? <Icon icon={icon} /> : false}
            action={
              dismissible ? (
                <IconButton
                  color="inherit"
                  size="small"
                  onClick={handleClose}
                  sx={{
                    padding: '4px',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                    },
                  }}
                >
                  <Icon icon="mdi:close" className="h-4 w-4" />
                </IconButton>
              ) : undefined
            }
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: 24,
              },
              ...props.sx,
            }}
            {...props}
          >
            {title && <AlertTitle>{title}</AlertTitle>}
            {children}
          </MuiAlert>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Alert