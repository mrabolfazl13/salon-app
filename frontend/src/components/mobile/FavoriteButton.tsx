import React from 'react'
import { IconButton } from '@mui/material'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { useFavoritesStore } from '@/store/favoritesStore'
import toast from 'react-hot-toast'

interface Props {
  venue: { id: number; name: string }
  size?: 'sm' | 'md'
  /** استایل روی تصویر: پس‌زمینه شیشه‌ای */
  onImage?: boolean
}

/** دکمه ❤️ علاقه‌مندی — با انیمیشن ۲۰۰ms و ذخیره کلاینت‌ساید */
const FavoriteButton: React.FC<Props> = ({ venue, size = 'md', onImage = true }) => {
  const isFav = useFavoritesStore((s) => s.favorites.some((f) => f.id === venue.id))
  const toggle = useFavoritesStore((s) => s.toggle)
  const dim = size === 'md' ? 44 : 36

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const added = toggle(venue)
    toast(added ? 'به علاقه‌مندی‌ها اضافه شد ❤️' : 'از علاقه‌مندی‌ها حذف شد', { duration: 1800 })
  }

  return (
    <IconButton
      onClick={handleClick}
      aria-label={isFav ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
      sx={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        bgcolor: onImage ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: onImage ? 'blur(6px)' : undefined,
        boxShadow: onImage ? '0 2px 10px rgba(15,23,42,0.15)' : 'none',
        '&:hover': { bgcolor: onImage ? '#fff' : 'rgba(239,68,68,0.08)' },
      }}
    >
      <motion.span
        key={String(isFav)}
        initial={{ scale: isFav ? 0.5 : 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ display: 'flex' }}
      >
        <Icon
          icon={isFav ? 'mdi:heart' : 'mdi:heart-outline'}
          style={{ width: 22, height: 22, color: isFav ? '#ef4444' : onImage ? '#475569' : '#94a3b8' }}
        />
      </motion.span>
    </IconButton>
  )
}

export default FavoriteButton
