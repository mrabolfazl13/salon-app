import React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Dialog from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  loading?: boolean
  variant?: 'default' | 'destructive'
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'تایید',
  cancelText = 'لغو',
  onConfirm,
  loading = false,
  variant = 'default',
}) => {
  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="xs">
      <div className="text-center py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="mx-auto"
        >
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
              variant === 'destructive'
                ? 'bg-red-100 text-red-600'
                : 'bg-primary/10 text-primary'
            )}
          >
            <Icon
              icon={variant === 'destructive' ? 'mdi:alert' : 'mdi:information'}
              className="h-8 w-8"
            />
          </div>
        </motion.div>
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex gap-2 justify-center mt-4">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Dialog>
  )
}

export default ConfirmModal