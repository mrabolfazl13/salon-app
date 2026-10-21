import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { parseList, toFullUrl } from '@/utils/venueMedia'

interface Props {
  images: unknown
  name: string
  ratio?: '16:10' | '4:3'
  verified?: boolean
  children?: React.ReactNode // overlay مثل FavoriteButton
}

/** تصویر بزرگ سالن با نسبت موبایلی + fallback گرادیانی */
const VenueImage: React.FC<Props> = ({ images, name, ratio = '16:10', verified, children }) => {
  const [failed, setFailed] = useState(false)
  const imgs = parseList(images)
  const src = imgs[0] ? toFullUrl(imgs[0]) : ''

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl bg-muted',
        ratio === '16:10' ? 'aspect-[16/10]' : 'aspect-[4/3]'
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="block h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700">
          <Icon
            icon="mdi:stadium-variant"
            aria-hidden="true"
            style={{ width: 52, height: 52, color: 'rgba(255,255,255,0.45)' }}
          />
        </div>
      )}

      {/* بَج تایید — ابتدای خط (سمت راست در RTL) */}
      {verified !== undefined && (
        <span
          className={cn(
            'absolute start-2.5 top-2.5 inline-flex items-center gap-1 rounded-[10px] bg-white/90 px-2 py-1 text-xs font-bold backdrop-blur-md',
            verified ? 'text-emerald-700' : 'text-amber-700'
          )}
        >
          <Icon
            icon={verified ? 'mdi:shield-check' : 'mdi:shield-alert-outline'}
            aria-hidden="true"
            style={{ width: 13, height: 13 }}
          />
          {verified ? 'تایید شده' : 'در انتظار تایید'}
        </span>
      )}

      {/* انتهای خط (چپ در RTL) — جای FavoriteButton */}
      {children && <div className="absolute end-2 top-2">{children}</div>}
    </div>
  )
}

export default VenueImage
