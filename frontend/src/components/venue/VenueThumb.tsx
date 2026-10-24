import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { resolveVenueImage } from './venueImageSource'

interface Props {
  images: unknown
  name: string
  size?: number
  radius?: number
}

/** بندانگشتی سالن — تصویر واقعی؛ اگر نبود (یا لود نشد) همان کاشی گرادیانی محلی می‌ماند */
const VenueThumb: React.FC<Props> = ({ images, name, size = 44, radius = 12 }) => {
  const src = resolveVenueImage(images)
  const [failed, setFailed] = useState(false)

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
      {src && !failed && (
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            // display:none به‌جای opacity — آیکون زیرین به‌عنوان کاشی جایگزین می‌ماند
            e.currentTarget.style.display = 'none'
            setFailed(true)
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  )
}

export default VenueThumb
