import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startIcon?: React.ReactNode
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startIcon, error, ...props }, ref) => (
    <div className="w-full">
      <div className="relative">
        {startIcon && (
          <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:h-5 [&>svg]:w-5">
            {startIcon}
          </span>
        )}
        <input
          type={type}
          ref={ref}
          aria-invalid={error ? true : undefined}
          className={cn(
            'flex h-12 w-full rounded-xl border border-input bg-card px-4 py-2 text-sm text-foreground shadow-sm transition-colors',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            startIcon && 'ps-10',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

export { Input }
