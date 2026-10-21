import React from 'react'
import { Icon } from '@iconify/react'
import { parseList, toFullUrl } from '@/utils/venueMedia'

interface Props {
  images: unknown
  name: string
  size?: number
  radius?: number
}

/** بندانگشتی سالن — تصویر واقعی سالن از دیتابیس؛ اگر نبود placeholder گرادیانی */
const VenueThumb: React.FC<Props> = ({ images, name, size = 44, radius = 12 }) => {
  const imgs = parseList(images)
  const src = imgs.length > 0 ? toFullUrl(imgs[0]) : ''

  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 to-violet-600"
      style={{ width: size, height: size, borderRadius: `${radius}px` }}
    >
      <Icon
        icon="mdi:stadium-variant"
        aria-hidden="true"
        style={{ width: size * 0.5, height: size * 0.5, color: 'rgba(255,255,255,0.5)' }}
      />
      {src && (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.opacity = '0'
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  )
}

export default VenueThumb
