import type React from 'react'
import { Icon } from '@iconify/react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar'

interface Props {
  title?: string
  subtitle?: string
  /** نمایش آواتار/ورود در انتهای خط */
  showAccount?: boolean
  onBell?: () => void
}

/** هدر موبایل: سلام + امروز کجا می‌خوای بازی کنی؟ + آواتار */
const MobileHeader: React.FC<Props> = ({ title, subtitle, showAccount = true }) => {
  const { user, isAuthenticated } = useAuthStore()
  const heading = title || (isAuthenticated && user?.fullName
    ? `سلام ${user.fullName.split(' ')[0]}`
    : 'سلام')
  const sub = subtitle || 'امروز کجا می‌خوای بازی کنی؟'

  return (
    <div className="flex items-center justify-between gap-3 pb-4 pt-3 md:pt-0">
      <div className="min-w-0">
        <p className="text-[1.35rem] font-extrabold leading-[1.4] text-foreground">{heading}</p>
        <p className="mt-0.5 text-[0.85rem] text-muted-foreground">{sub}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <div className="block md:hidden">
          <ThemeToggle size={18} />
        </div>
        {showAccount && (
          <div className="flex shrink-0 md:hidden">
            {isAuthenticated ? (
              <Link
                to="/profile"
                aria-label="پروفایل"
                className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="h-11 w-11 shadow-[0_4px_14px_rgba(245,158,11,0.3)]">
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-base font-extrabold text-stone-900">
                    {user?.fullName?.[0] || 'ک'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link
                to="/login"
                aria-label="ورود"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon icon="mdi:login-variant" style={{ width: 22, height: 22 }} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MobileHeader
