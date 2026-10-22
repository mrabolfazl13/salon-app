import type React from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { useFavoritesStore } from '@/store/favoritesStore'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Props {
  venue: { id: number; name: string }
  size?: 'sm' | 'md'
  /** استایل روی تصویر: پس‌زمینه شیشه‌ای */
  onImage?: boolean
}

/** دکمه قلب علاقه‌مندی — با انیمیشن ۲۰۰ms و ذخیره کلاینت‌ساید */
const FavoriteButton: React.FC<Props> = ({ venue, size = 'md', onImage = true }) => {
  const isFav = useFavoritesStore((s) => s.favorites.some((f) => f.id === venue.id))
  const toggle = useFavoritesStore((s) => s.toggle)
  const iconDim = size === 'md' ? 22 : 18

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const added = toggle(venue)
    toast(added ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد', {
      duration: 1800,
      icon: added ? <span aria-hidden="true">❤</span> : undefined,
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFav ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
      className={cn(
        'flex h-9 w-11 min-h-9 min-w-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        onImage
          ? 'bg-white/90 shadow-md backdrop-blur-md hover:bg-white dark:bg-slate-950/70 dark:hover:bg-slate-950/85'
          : 'bg-transparent hover:bg-red-500/10'
      )}
    >
      <motion.span
        key={String(isFav)}
        initial={{ scale: isFav ? 0.5 : 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex"
      >
        <Icon
          icon={isFav ? 'mdi:heart' : 'mdi:heart-outline'}
          style={{ width: iconDim, height: iconDim, color: isFav ? '#ef4444' : onImage ? '#475569' : '#64748b' }}
        />
      </motion.span>
    </button>
  )
}

export default FavoriteButton
