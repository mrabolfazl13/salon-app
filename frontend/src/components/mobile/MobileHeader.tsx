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
  /**
   * سطح سرتیتر. صفحهٔ خانهٔ شخصی h1 می‌خواهد (کلمهٔ «خانه» در ناوبری هست)، ولی
   * نمای مهمان سرتیتر بازاریابیِ خودش را دارد و اینجا فقط <p> می‌ماند تا دو h1 نسازد.
   */
  headingTag?: 'p' | 'h1'
}

/** هدر موبایل: سلام + امروز کجا می‌خوای بازی کنی؟ + آواتار */
const MobileHeader: React.FC<Props> = ({ title, subtitle, showAccount = true, headingTag = 'p' }) => {
  const { user, isAuthenticated } = useAuthStore()
  const heading = title || (isAuthenticated && user?.fullName
    ? `سلام ${user.fullName.split(' ')[0]}`
    : 'سلام')
  const sub = subtitle || 'امروز کجا می‌خوای بازی کنی؟'
  const Heading = headingTag

  return (
    <div className="flex items-center justify-between gap-2 pb-2 pt-1 md:pt-0">
      <div className="min-w-0">
        <Heading className="text-[1.1rem] font-extrabold leading-[1.3] text-foreground">{heading}</Heading>
        <p className="mt-0.5 text-[0.72rem] text-muted-foreground">{sub}</p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <div className="block md:hidden">
          <ThemeToggle size={16} />
        </div>
        {showAccount && (
          <div className="flex shrink-0 md:hidden">
            {isAuthenticated ? (
              <Link
                to="/profile"
                aria-label="پروفایل"
                className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="h-9 w-9 shadow-[0_2px_8px_rgba(245,158,11,0.2)]">
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-[0.68rem] font-extrabold text-stone-900">
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
                <Icon icon="mdi:login-variant" style={{ width: 18, height: 18 }} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MobileHeader
