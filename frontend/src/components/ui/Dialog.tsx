// src/components/ui/Dialog.tsx
// پوسته‌ی دیالوگ پروژه روی shadcn/Radix — امضای عمومی قبلی حفظ شده است:
// open, onClose, title?, actions?, maxWidth?, fullWidth? و children.
// aria-labelledby برای عنوان و دکمه‌ی بستن با برچسب «بستن» در DialogContent اولیه هست.
import React, { useId } from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog'

type MaxWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** عرض‌های MUI → کلاس‌های معادل (همان مقادیر پیکسلی) */
const MAX_WIDTH_CLASS: Record<MaxWidth, string> = {
  xs: 'sm:!max-w-[444px]',
  sm: 'sm:!max-w-[600px]',
  md: 'sm:!max-w-[900px]',
  lg: 'sm:!max-w-[1200px]',
  xl: 'sm:!max-w-[1536px]',
}

export interface DialogProps {
  open: boolean
  /** اگر undefined باشد دیالوگ با Esc/کلیک بیرون بسته نمی‌شود (هم‌رفتار با MUI) */
  onClose?: () => void
  title?: string
  /** آیکون اختیاری کنار عنوان (تزئینی) */
  titleIcon?: React.ReactNode
  actions?: React.ReactNode
  maxWidth?: MaxWidth
  fullWidth?: boolean
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  titleIcon,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  className,
  ...props
}) => {
  // MUI دیالوگ را خودکار به DialogTitle وصل نمی‌کند؛ بدون این، صفحه‌خوان دیالوگ بی‌نام اعلام می‌کند
  const titleId = useId()

  return (
    <DialogRoot
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose?.()
      }}
    >
      <DialogContent
        aria-labelledby={title ? titleId : undefined}
        // بدون DialogDescription، Radix هشدار توصیف‌نبودن می‌دهد
        aria-describedby={undefined}
        className={cn(MAX_WIDTH_CLASS[maxWidth], fullWidth ? 'sm:w-full' : 'sm:!w-auto', className)}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {title && (
          <DialogHeader>
            <DialogTitle
              id={titleId}
              className="flex items-center gap-2 text-lg font-extrabold text-foreground"
            >
              {titleIcon && <span aria-hidden="true">{titleIcon}</span>}
              {title}
            </DialogTitle>
          </DialogHeader>
        )}
        {children}
        {actions && (
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">{actions}</div>
        )}
      </DialogContent>
    </DialogRoot>
  )
}

export default Dialog
