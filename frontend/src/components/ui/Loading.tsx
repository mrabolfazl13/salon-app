// src/components/ui/Loading.tsx
// حالت بارگذاری سراسری — اسپینر + پیام فارسی، بدون MUI.
import React from 'react'
import { motion } from 'framer-motion'

interface LoadingProps {
  fullScreen?: boolean
  message?: string
  size?: 'small' | 'medium' | 'large'
}

const Loading: React.FC<LoadingProps> = ({
  fullScreen = false,
  message = 'در حال بارگذاری...',
  size = 'medium',
}) => {
  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
  }

  const content = (
    <div
      // role=status: پیشرفت بارگذاری بدون کلیک به صفحه‌خوان اعلام شود (متن با تغییر aria-busy خوانده می‌شود)
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col items-center justify-center gap-4"
    >
      <motion.div
        aria-hidden="true"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="rounded-full border-4 border-muted border-t-amber-500"
        style={{ width: sizeMap[size], height: sizeMap[size] }}
      />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}

export default Loading
