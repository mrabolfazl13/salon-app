import React, { useState } from 'react'
import { Box, useTheme } from '@mui/material'
import { Icon } from '@iconify/react'
import { gradients, radii } from '@/theme'
import { parseList, toFullUrl } from '@/utils/venueMedia'

interface Props {
  images: unknown
  name: string
  ratio?: '16:10' | '4:3'
  verified?: boolean
  children?: React.ReactNode // overlay مثل FavoriteButton
  onClick?: () => void
}

/** تصویر بزرگ سالن با نسبت موبایلی + fallback گرادیانی */
const VenueImage: React.FC<Props> = ({ images, name, ratio = '16:10', verified, children, onClick }) => {
  const theme = useTheme()
  const [failed, setFailed] = useState(false)
  const imgs = parseList(images)
  const src = imgs[0] ? toFullUrl(imgs[0]) : ''
  const aspect = ratio === '16:10' ? '16 / 10' : '4 / 3'

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: aspect,
        overflow: 'hidden',
        borderRadius: `${radii.image}px`,
        bgcolor: theme.palette.grey[100],
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: gradients.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon icon="mdi:stadium-variant" style={{ width: 52, height: 52, color: 'rgba(255,255,255,0.45)' }} />
        </Box>
      )}

      {/* بَج تایید — ابتدای خط (سمت راست در RTL) */}
      {verified !== undefined && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            insetInlineStart: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.5,
            borderRadius: `${radii.chip}px`,
            bgcolor: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(6px)',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: verified ? '#059669' : '#b45309',
          }}
        >
          <Icon icon={verified ? 'mdi:shield-check' : 'mdi:shield-alert-outline'} style={{ width: 13, height: 13 }} />
          {verified ? 'تایید شده' : 'در انتظار تایید'}
        </Box>
      )}

      {/* انتهای خط (چپ در RTL) — جای FavoriteButton */}
      {children && (
        <Box sx={{ position: 'absolute', top: 8, insetInlineEnd: 8 }}>{children}</Box>
      )}
    </Box>
  )
}

export default VenueImage
