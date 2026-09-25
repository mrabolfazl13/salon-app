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
  ({ className, type, error, icon, label, id, ...props }, ref) => {
    const autoId = React.useId()
    const inputId = id || autoId
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-1.5 w-full"
      >
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-800 dark:text-gray-200 block">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <Icon
              icon={icon}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5"
            />
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              'flex h-12 w-full rounded-2xl border-2 border-gray-200 dark:border-[#223049] bg-white dark:bg-[#121a2b] px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1220] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
              icon && 'pr-10',
              error && 'border-red-500 focus-visible:ring-red-500',
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
            className="text-sm text-red-600 dark:text-red-400"
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