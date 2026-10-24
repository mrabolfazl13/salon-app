import type React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/shadcn/button'

interface Props {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  /** وقتی حالت خالی، کل صفحه است ⇒ عنوان را سرفصل سطح‌یک می‌کند (ممیزی F-14) */
  asPageHeading?: boolean
}

/** حالت خالی استاندارد — مثل «هنوز سالنی ذخیره نکرده‌اید» */
const EmptyState: React.FC<Props> = ({ icon, title, description, actionLabel, onAction, asPageHeading }) => {
  const titleClass = 'mb-1.5 text-[1.05rem] font-extrabold text-foreground'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="px-6 py-10 text-center"
    >
      <div className="mx-auto mb-5 flex h-[84px] w-[84px] items-center justify-center rounded-full bg-gradient-to-br from-amber-500/10 to-blue-500/10 dark:from-amber-400/10 dark:to-blue-400/10">
        <Icon
          icon={icon || 'mdi:inbox-outline'}
          className="h-10 w-10 text-amber-800 dark:text-amber-400"
        />
      </div>
      {asPageHeading ? (
        <h1 className={titleClass}>{title}</h1>
      ) : (
        <p className={titleClass}>{title}</p>
      )}
      {description && (
        <p className="mx-auto max-w-[300px] text-[0.68rem] leading-[1.8] text-muted-foreground">
          {description}
        </p>
      )}
      {actionLabel && (
        <Button onClick={onAction} className="mt-6 min-h-12 rounded-[14px] px-8 font-bold">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}

export default EmptyState
