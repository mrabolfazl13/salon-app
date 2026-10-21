// src/components/ui/Card.tsx
// پوسته‌ی کارت پروژه روی Tailwind — نام و امضای صادرات قبلی حفظ شده است.
// فایل‌های هنوز مهاجرت‌نشده ممکن است پراپ‌های MUI (سx، elevation، variant…) بفرستند؛
// sx نادیده گرفته می‌شود و بقیه روی ریشه پخش می‌شوند تا رفتار قبلی نشکند.
import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/** پراپ‌های آزاد (سازگاری با فراخوانی‌های MUI) */
type LooseDivProps = React.HTMLAttributes<HTMLDivElement> & {
  sx?: unknown
  [key: string]: unknown
}

export interface CardProps extends LooseDivProps {
  hover?: boolean
}

const Card: React.FC<CardProps> = ({ hover = true, children, className, sx: _sx, ...props }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ height: '100%' }}
    >
      <div
        className={cn(
          'h-full rounded-2xl border border-border bg-card text-card-foreground shadow-sm',
          className
        )}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    </motion.div>
  )
}

export const CardContent: React.FC<LooseDivProps> = ({ className, sx: _sx, ...props }) => (
  <div className={cn('p-4', className)} {...(props as React.HTMLAttributes<HTMLDivElement>)} />
)

export const CardHeader: React.FC<LooseDivProps> = ({ className, sx: _sx, ...props }) => (
  <div
    className={cn('flex flex-col gap-1 p-4', className)}
    {...(props as React.HTMLAttributes<HTMLDivElement>)}
  />
)

export const CardActions: React.FC<LooseDivProps> = ({ className, sx: _sx, ...props }) => (
  <div
    className={cn('flex items-center gap-2 p-2', className)}
    {...(props as React.HTMLAttributes<HTMLDivElement>)}
  />
)

export const CardMedia: React.FC<LooseDivProps> = ({ className, sx: _sx, ...props }) => (
  <div
    className={cn('h-40 w-full bg-cover bg-center', className)}
    {...(props as React.HTMLAttributes<HTMLDivElement>)}
  />
)

export const CardTitle: React.FC<LooseDivProps> = ({ children, className, sx: _sx, ...props }) => (
  <h2
    className={cn('text-xl font-semibold text-foreground', className)}
    {...(props as React.HTMLAttributes<HTMLHeadingElement>)}
  >
    {children}
  </h2>
)

export const CardDescription: React.FC<LooseDivProps> = ({ children, className, sx: _sx, ...props }) => (
  <p
    className={cn('text-sm text-muted-foreground', className)}
    {...(props as React.HTMLAttributes<HTMLParagraphElement>)}
  >
    {children}
  </p>
)

export default Card
