// src/components/ui/Button.tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1220] disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-l from-amber-400 to-orange-500 text-stone-900 font-bold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:-translate-y-0.5',
        destructive: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
        outline: 'border-2 border-amber-500 bg-transparent text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15',
        ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white',
        link: 'text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline',
        gradient: 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-0.5',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 rounded-xl px-3 text-xs',
        lg: 'h-14 rounded-2xl px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationIteration' | 'onAnimationEnd'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  icon?: string
  onDrag?: (event: React.DragEvent<HTMLButtonElement>) => void
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void
  onDragEnd?: (event: React.DragEvent<HTMLButtonElement>) => void
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, icon, children, disabled, onDrag, onDragStart, onDragEnd, ...props }, ref) => {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Icon icon="svg-spinners:3-dots-fade" className="h-4 w-4 animate-spin" />
        )}
        {icon && !loading && <Icon icon={icon} className="h-5 w-5" />}
        {children}
      </motion.button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }