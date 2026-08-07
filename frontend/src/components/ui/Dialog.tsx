// src/components/ui/Dialog.tsx
import React from 'react'
import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogProps as MuiDialogProps,
  IconButton,
} from '@mui/material'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'

export interface DialogProps extends MuiDialogProps {
  open: boolean
  onClose: () => void
  title?: string
  actions?: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  ...props
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <MuiDialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            {...props}
          >
            {title && (
              <DialogTitle>
                {title}
                <IconButton
                  onClick={onClose}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <Icon icon="mdi:close" />
                </IconButton>
              </DialogTitle>
            )}
            <DialogContent>{children}</DialogContent>
            {actions && <DialogActions>{actions}</DialogActions>}
          </MuiDialog>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Dialog