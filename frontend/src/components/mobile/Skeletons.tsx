import type React from 'react'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { cn } from '@/lib/utils'

/** اسکلتون‌های استاندارد — جایگزین spinner */

type ShimmerVariant = 'text' | 'rectangular' | 'rounded' | 'circular'

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ShimmerVariant
  animation?: 'pulse' | 'wave' | false
  width?: number | string
  height?: number | string
  /** پشتیبانی قدیمی از استایل‌های sx — فقط برای سازگاری با فراخوانی‌های موجود */
  sx?: object
}

const SPACING_STYLE: Record<string, string> = {
  m: 'margin',
  mt: 'marginTop',
  mr: 'marginRight',
  mb: 'marginBottom',
  ml: 'marginLeft',
  mx: 'marginInline',
  my: 'marginBlock',
  p: 'padding',
  pt: 'paddingTop',
  pr: 'paddingRight',
  pb: 'paddingBottom',
  pl: 'paddingLeft',
  px: 'paddingInline',
  py: 'paddingBlock',
}

const UNITLESS = new Set(['flex', 'flexGrow', 'flexShrink', 'opacity', 'order', 'zIndex', 'lineHeight', 'fontWeight'])

/** تبدیل ساده و محدود sx قدیمی به style — برای سازگاری با صفحاتی که هنوز مهاجرت نکرده‌اند */
function sxToStyle(sx?: object): React.CSSProperties {
  if (!sx) return {}
  const out: Record<string, string | number> = {}
  for (const [key, raw] of Object.entries(sx as Record<string, unknown>)) {
    if (raw == null) continue
    if (SPACING_STYLE[key]) {
      out[SPACING_STYLE[key]] = typeof raw === 'number' ? `${raw * 8}px` : String(raw)
    } else if (typeof raw === 'number') {
      out[key] = UNITLESS.has(key) ? raw : `${raw}px`
    } else if (typeof raw === 'string') {
      out[key] = raw
    }
  }
  return out as React.CSSProperties
}

const VARIANT_CLASS: Record<ShimmerVariant, string> = {
  text: 'rounded-md',
  rectangular: 'rounded-none',
  rounded: 'rounded-xl',
  circular: 'rounded-full',
}

export const Shimmer: React.FC<ShimmerProps> = ({
  variant = 'rounded',
  animation = 'pulse',
  width,
  height,
  sx,
  className,
  style,
  ...props
}) => (
  <Skeleton
    aria-hidden="true"
    className={cn(
      'bg-slate-900/[0.06] dark:bg-white/[0.07]',
      animation === false ? 'animate-none' : 'animate-pulse',
      VARIANT_CLASS[variant],
      className
    )}
    style={{
      ...(width != null ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
      ...(height != null ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
      ...sxToStyle(sx),
      ...style,
    }}
    {...props}
  />
)

/** اسکلتون کارت سالن (موبایل) */
export const VenueCardSkeleton: React.FC = () => (
  <div className="overflow-hidden rounded-[20px] border border-border bg-card">
    <Shimmer variant="rectangular" className="aspect-[16/10] w-full bg-slate-900/[0.05] dark:bg-white/[0.05]" />
    <div className="flex flex-col gap-2.5 p-4">
      <Shimmer width="60%" height={22} />
      <Shimmer width="35%" height={16} />
      <Shimmer width="80%" height={14} />
      <div className="mt-1 flex items-center justify-between">
        <Shimmer width={110} height={22} />
        <Shimmer width={84} height={40} className="rounded-xl" />
      </div>
    </div>
  </div>
)

export const VenueCardSkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="flex flex-col gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <VenueCardSkeleton key={i} />
    ))}
  </div>
)

/** اسکلتون صفحه جزئیات سالن */
export const VenueDetailSkeleton: React.FC = () => (
  <div>
    <Shimmer variant="rectangular" height={260} className="w-full bg-slate-900/[0.05] dark:bg-white/[0.05]" />
    <div className="flex flex-col gap-4 p-4">
      <Shimmer width="55%" height={28} />
      <Shimmer width="40%" height={18} />
      <Shimmer width="75%" height={16} />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Shimmer key={i} width={72} height={30} className="rounded-[10px]" />
        ))}
      </div>
      <Shimmer height={90} className="rounded-2xl" />
      <Shimmer height={90} className="rounded-2xl" />
    </div>
  </div>
)

/** اسکلتون لیست سانس‌ها */
export const SlotListSkeleton: React.FC = () => (
  <div className="flex flex-col gap-3">
    {[1, 2, 3, 4].map((i) => (
      <Shimmer key={i} height={64} className="rounded-2xl" />
    ))}
  </div>
)

/** اسکلتون نتایج جستجو */
export const SearchResultsSkeleton: React.FC = () => (
  <div className="flex flex-col gap-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3">
        <Shimmer width={64} height={64} className="shrink-0 rounded-[14px]" />
        <div className="flex flex-1 flex-col gap-2">
          <Shimmer width="55%" height={16} />
          <Shimmer width="75%" height={12} />
        </div>
      </div>
    ))}
  </div>
)
