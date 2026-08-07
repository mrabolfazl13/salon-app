import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  icon?: string
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, label, ...props }, ref) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-1.5 w-full"
      >
        {label && (
          <label className="text-sm font-medium text-foreground block">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <Icon
              icon={icon}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5"
            />
          )}
          <input
            type={type}
            className={cn(
              'flex h-12 w-full rounded-2xl border-2 border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
              icon && 'pr-10',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    )
  }
)
Input.displayName = 'Input'

export { Input }