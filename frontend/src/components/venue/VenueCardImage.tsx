import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { resolveVenueImage } from './venueImageSource'

interface Props {
  images: unknown
  name: string
  ratio?: '16:10' | '4:3'
  verified?: boolean
  /** overlay مثل FavoriteButton */
  children?: React.ReactNode
}

/**
 * کاشی جایگزین — محلی و بدون شبکه.
 * نسخهٔ قبلی به placeholder اینترنتی (images.unsplash.com) می‌رفت؛ آن دامنه در
 * محیط ممیزی در دسترس نبود و هر کارت یک درخواست ERR_CONNECTION_REFUSED + آیکون
 * تصویر شکسته تولید می‌کرد. این کاشی همان گرادیان/آیکون موجود در پروژه را دارد.
 */
const FallbackTile = () => (
  <div
    aria-hidden="true"
    className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700"
  >
    <Icon
      icon="mdi:stadium-variant"
      style={{ width: 52, height: 52, color: 'rgba(255,255,255,0.45)' }}
    />
  </div>
)

/** تصویر بزرگ کارت سالن — نسبت ثابت (CLS صفر)، fallback گرادیانی، بدون درخواست بی‌نتیجه */
const VenueCardImage: React.FC<Props> = ({ images, name, ratio = '16:10', verified, children }) => {
  const src = resolveVenueImage(images)
  const [failed, setFailed] = useState(false)

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg bg-muted',
        ratio === '16:10' ? 'aspect-[16/10]' : 'aspect-[4/3]'
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="block h-full w-full object-cover"
        />
      ) : (
        <FallbackTile />
      )}

      {/* بَج تأیید — ابتدای خط (سمت راست در RTL) */}
      {verified !== undefined && (
        <span
          className={cn(
            'absolute start-2.5 top-2.5 inline-flex items-center gap-1 rounded-[10px] bg-white/90 px-2 py-1 text-[0.68rem] font-bold backdrop-blur-md',
            verified ? 'text-emerald-700' : 'text-amber-700'
          )}
        >
          <Icon
            icon={verified ? 'mdi:shield-check' : 'mdi:shield-alert-outline'}
            aria-hidden="true"
            style={{ width: 13, height: 13 }}
          />
          {verified ? 'تأیید شده' : 'در انتظار تأیید'}
        </span>
      )}

      {/* انتهای خط (چپ در RTL) — جای FavoriteButton.
         FavoriteButton در src/components/mobile است (خارج از دامنهٔ این تغییر) و
         ارتفاعش ۳۶px بود؛ از همین‌جا روی فرزند به ۴۴px ارتقا می‌یابد تا هدف لمسی
         کارت به ۴۴×۴۴ برسد، بدون اینکه آن کامپوننت مشترک دست بخورد. */}
      {children && (
        <div className="absolute end-2 top-2 flex min-h-11 items-center [&>button]:min-h-11">
          {children}
        </div>
      )}
    </div>
  )
}

export default VenueCardImage
