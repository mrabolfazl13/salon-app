import React from 'react'
import { Box } from '@mui/material'
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
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: `${radius}px`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      }}
    >
      <Icon icon="mdi:stadium-variant" style={{ width: size * 0.5, height: size * 0.5, color: 'rgba(255,255,255,0.5)' }} />
      {src && (
        <Box
          component="img"
          src={src}
          alt={name}
          loading="lazy"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.opacity = '0'
          }}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
    </Box>
  )
}

export default VenueThumb
