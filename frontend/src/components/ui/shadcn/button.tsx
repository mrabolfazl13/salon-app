import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // disabled با opacity محو نمی‌شود: این دکمه‌ها اغلب پیام اقدام بعدی را حمل می‌کنند و باید خوانا بمانند
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:bg-none disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-l from-amber-400 to-orange-500 text-stone-900 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30',
        primary:
          'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/25',
        secondary:
          'bg-muted text-foreground hover:bg-muted/70 border border-border',
        outline:
          'border border-border bg-card text-foreground hover:bg-muted',
        ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
        destructive: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
        link: 'text-blue-700 underline-offset-4 hover:underline dark:text-blue-400',
      },
      size: {
        default: 'h-12 px-5',
        sm: 'h-11 rounded-lg px-3 text-xs',
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
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
