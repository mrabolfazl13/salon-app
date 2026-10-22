import type React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/shadcn/button'

interface Props {
  title?: string
  description?: string
  onRetry?: () => void
}

/** حالت خطا — «مشکلی پیش آمد / تلاش مجدد» */
const ErrorState: React.FC<Props> = ({
  title = 'مشکلی پیش آمد',
  description = 'لطفاً دوباره تلاش کنید.',
  onRetry,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="px-6 py-10 text-center"
  >
    <div className="mx-auto mb-5 flex h-[84px] w-[84px] items-center justify-center rounded-full bg-red-500/[0.08] dark:bg-red-400/[0.12]">
      <Icon icon="mdi:alert-circle-outline" className="h-10 w-10 text-red-500 dark:text-red-400" />
    </div>
    <p className="mb-1.5 text-[1.05rem] font-extrabold text-foreground">{title}</p>
    <p className="text-[0.68rem] text-muted-foreground">{description}</p>
    {onRetry && (
      <Button
        variant="outline"
        onClick={onRetry}
        className="mt-6 min-h-12 rounded-[14px] border-primary/40 px-8 font-bold text-primary hover:border-primary hover:bg-primary/5"
      >
        <Icon icon="mdi:refresh" aria-hidden="true" style={{ width: 18, height: 18 }} />
        تلاش مجدد
      </Button>
    )}
  </motion.div>
)

export default ErrorState
