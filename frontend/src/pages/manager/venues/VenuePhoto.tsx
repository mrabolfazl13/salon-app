// عکس سالن با فالبک آیکون دسته — فایل تصویر در دِو یا آپلودهای قدیمی ممکن است ۴۰۴ باشد.

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { parseList, toFullUrl } from '@/utils/venueMedia'

const TONES = [
  'from-blue-600 to-violet-600',
  'from-teal-600 to-emerald-600',
  'from-amber-500 to-orange-600',
  'from-sky-600 to-indigo-600',
]

const VenuePhoto: React.FC<{
  id?: number
  name: string
  images?: string[]
  category?: 'futsal' | 'gym'
  className: string
}> = ({ id = 0, name, images, category, className }) => {
  const [failed, setFailed] = useState(false)
  const first = parseList(images)[0]
  if (!first || failed) {
    return (
      <div
        aria-hidden="true"
        title={name}
        className={`${className} flex items-center justify-center bg-gradient-to-br ${TONES[id % TONES.length]}`}
      >
        <Icon
          icon={category === 'gym' ? 'mdi:dumbbell' : 'mdi:soccer'}
          className="h-1/2 w-1/2 text-white/90"
        />
      </div>
    )
  }
  return (
    <img
      src={toFullUrl(first)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} object-cover`}
    />
  )
}

export default VenuePhoto
