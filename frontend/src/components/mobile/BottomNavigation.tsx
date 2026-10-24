import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { useAuthStore } from '@/store/authStore'

interface NavItem {
  label: string
  icon: string
  href: string
  requiresAuth?: boolean
  roles?: string[]  // if empty or undefined, show for all authenticated users
}

const getItemsForRole = (role: string | undefined): NavItem[] => {
  const home: NavItem = { label: 'خانه', icon: 'home', href: '/' }
  const search: NavItem = { label: 'جستجو', icon: 'magnify', href: '/search' }
  const bookings: NavItem = { label: 'رزروها', icon: 'calendar-check', href: '/bookings', requiresAuth: true }
  const teams: NavItem = { label: 'تیم‌ها', icon: 'account-group', href: '/teams', requiresAuth: true }
  const competitions: NavItem = { label: 'رقابت‌ها', icon: 'trophy', href: '/competitions', requiresAuth: true }
  const profile: NavItem = { label: 'پروفایل', icon: 'account-circle', href: '/profile', requiresAuth: true }

  // ناوبال می‌گوید نوار پایین حداکثر ۵ آیتم سطح‌اول داشته باشد؛
  // بقیهٔ مقصدها (شگفت‌انگیز، قراردادها، CRM، مالی، تنظیمات) در بنرهای Home،
  // «مرور سریع» پروفایل و منوی آواتار در دسترس‌اند

  // کاربر مهمان
  if (!role) return [home, search, { label: 'علاقه‌مندی', icon: 'heart', href: '/favorites' }, profile]

  // مدیر نرم‌افزار
  if (role === 'super_admin') {
    return [home, { label: 'داشبورد', icon: 'view-dashboard', href: '/admin', requiresAuth: true, roles: ['super_admin'] }, competitions, { label: 'کاربران', icon: 'account-multiple', href: '/admin/users', requiresAuth: true, roles: ['super_admin'] }, profile]
  }

  // مدیر سالن / کلاب
  if (role === 'venue_manager' || role === 'club_admin') {
    // «cash-register» در MDI نسخهٔ `-outline` ندارد؛ NavIcon برای حالت فعال آن را
    // می‌سازد ⇒ آیکنِ خالی (پیلِ بی‌محتوا روی ۳۲۰px). «wallet» هر دو حالت را دارد.
    // «سالن‌های من» جایش «رقابت‌ها» را گرفت: برای مالکِ چندسالنه، عوض‌کردن سالن
    // تکراری‌ترین کار روزانه است؛ جدول رقابت‌ها در منوی آواتار و ناوبار دسکتاپ هست.
    return [home, { label: 'داشبورد', icon: 'view-dashboard', href: '/manager-dashboard', requiresAuth: true, roles: ['venue_manager', 'club_admin', 'super_admin'] }, { label: 'سالن‌های من', icon: 'store', href: '/manager/venues', requiresAuth: true }, { label: 'امور مالی', icon: 'wallet', href: '/finance', requiresAuth: true }, profile]
  }

  // کاربر عادی
  return [home, search, teams, bookings, profile]
}

/** مسیرهایی که نوار پایین مخفی می‌شود (flowهای ورود/ثبت‌نام/پرداخت/پنل‌ها) */
const HIDDEN_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/verify',
  '/payment',
  '/dashboard',
  '/coach',
  '/admin',
  '/join',
]

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

/** ناوبری پایین موبایل — fixed، safe-area، آیتم فعال با حالت کهربایی */
const BottomNavigation: React.FC = () => {
  const { pathname } = useLocation()
  const { user, isAuthenticated } = useAuthStore()
  const role = user?.role

  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null
  // صفحه جزئیات رزرو (flow پرداخت) هم مخفی
  if (/^\/bookings\/\d+$/.test(pathname)) return null

  const items = getItemsForRole(role)
  // Filter items based on authentication and role
  const filteredItems = items.filter((item) => {
    if (item.requiresAuth && !isAuthenticated) return false
    if (item.roles && role && !item.roles.includes(role)) return false
    return true
  })

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background/95 pb-safe backdrop-blur-xl shadow-[0_-2px_12px_rgba(15,23,42,0.05)] md:hidden dark:shadow-[0_-2px_12px_rgba(0,0,0,0.4)] print:hidden"
    >
      <div className="flex h-[56px]">
        {filteredItems.map((item) => {
          const active = isActive(pathname, item.href)
          const to = item.requiresAuth && !isAuthenticated ? '/login' : item.href
          return (
            <Link
              key={item.href}
              to={to}
              className="flex min-h-9 min-w-11 flex-1 flex-col items-center justify-center gap-[2px] no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              aria-current={active ? 'page' : undefined}
            >
              <NavIcon active={active} icon={item.icon} />
              <span
                className={
                  active
                    ? 'text-[0.65rem] font-bold text-amber-700 dark:text-amber-400'
                    : 'text-[0.65rem] font-medium text-slate-500 dark:text-slate-400'
                }
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

/** آیکون با پس‌زمینه pill کهربایی در حالت فعال */
const NavIcon: React.FC<{ active: boolean; icon: string }> = ({ active, icon }) => (
  <motion.span
    animate={{ scale: active ? 1 : 0.96 }}
    transition={{ duration: 0.2 }}
    className={
      active
        ? 'flex h-[26px] w-[40px] items-center justify-center rounded-full bg-gradient-to-br from-amber-500/15 to-orange-500/15 dark:from-amber-400/20 dark:to-orange-400/20'
        : 'flex h-[26px] w-[40px] items-center justify-center rounded-full'
    }
  >
    <Icon
      icon={`mdi:${icon.endsWith('-outline') || !active ? icon : icon + '-outline'}`}
      className={
        active
          ? 'h-[20px] w-[20px] text-amber-600 dark:text-amber-400'
          : 'h-[20px] w-[20px] text-slate-500 dark:text-slate-400'
      }
    />
  </motion.span>
)

export default BottomNavigation
