import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const badgeVariants = cva(
  'inline-flex items-center rounded-2xl border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        warning: 'border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
        info: 'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        gradient: 'border-transparent bg-gradient-to-r from-primary to-blue-600 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="inline-block"
    >
      <div className={cn(badgeVariants({ variant }), className)} {...props} />
    </motion.div>
  )
}

export { Badge, badgeVariants }