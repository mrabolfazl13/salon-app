import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useStaffCodes } from '@/hooks/useStaffMe'
import { getInitials, cn } from '@/lib/utils'
import NotificationPanel from './NotificationPanel'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { Button } from '@/components/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu'

const roleLabels: Record<string, string> = {
  user: 'کاربر',
  venue_manager: 'مدیر سالن',
  club_admin: 'مدیر باشگاه',
  super_admin: 'مدیر کل',
  coach: 'مربی',
}

interface NavbarProps {
  /** منوی کناری (Drawer) غیرفعال شده — ناوبری موبایل با نوار پایین انجام می‌شود */
  onMenuClick?: () => void
}

const Navbar: React.FC<NavbarProps> = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, isAuthenticated, logout } = useAuthStore()

  const isManager =
    user?.role === 'venue_manager' || user?.role === 'club_admin' || user?.role === 'super_admin'
  const isCoach = user?.role === 'coach'
  // کنسول‌ها بر پایهٔ کد دسترسی بک‌اند باز می‌شوند — مالک سالن همه، کارمند فقط کدهای
  // انتصاب فعالش (GET /staff/me). قبلاً هر انتصابی هر پنج لینک را می‌دید و سه‌تایشان
  // صفحهٔ پر از ۴۰۳ بود (ممیزی F-01/F-04).
  const staffCodes = useStaffCodes()
  const consoleLinks = [
    { label: 'قیمت\u200cگذاری', icon: 'mdi:tag-percent-outline', href: '/manager/pricing', codes: ['pricing.manage'] },
    { label: 'امور مالی', icon: 'mdi:cash-register', href: '/finance', codes: ['finance.view', 'reports.view'] },
    { label: 'مشتریان', icon: 'mdi:account-heart-outline', href: '/manager/crm', codes: ['crm.view', 'customer.view_basic'] },
    { label: 'مدیریت قراردادها', icon: 'mdi:file-document-check-outline', href: '/manager/contracts', codes: ['contract.view'] },
    { label: 'شیفت پرسنل', icon: 'mdi:calendar-clock', href: '/manager/shifts', codes: ['staff.manage'] },
  ].filter((item) => isManager || item.codes.some((code) => staffCodes.includes(code)))
  const canConsoleNav = consoleLinks.length > 0

  const handleLogout = () => {
    useNotificationStore.getState().reset()
    logout()
    navigate('/')
  }

  const navItems = [
    { label: 'خانه', icon: 'mdi:home', href: '/' },
    { label: 'سالن‌ها', icon: 'mdi:store', href: '/venues' },
    { label: 'بازی‌ها', icon: 'mdi:gamepad-variant', href: '/games' },
    { label: 'تیم\u200cها', icon: 'mdi:account-group', href: '/teams' },
    { label: 'رقابت\u200cها', icon: 'mdi:trophy', href: '/competitions' },
    { label: 'تورنمنت\u200cها', icon: 'mdi:trophy-outline', href: '/tournaments' },
    { label: 'رزروها', icon: 'mdi:calendar', href: '/bookings' },
    { label: 'قراردادها', icon: 'mdi:file-document', href: '/contracts' },
    ...(isAuthenticated ? [{ label: 'شگفت\u200cانگیز', icon: 'mdi:lightning-bolt', href: '/deals' }] : []),
    ...consoleLinks.map((item) => ({ label: item.label, icon: item.icon, href: item.href })),
    ...(isCoach ? [{ label: 'پنل مربی', icon: 'mdi:school-outline', href: '/coach' }] : []),
  ]

  const dashboardPath = isCoach ? '/coach' : isManager ? '/manager-dashboard' : '/dashboard'

  // آیتم‌های منوی آواتار — در همه اندازه‌ها (موبایل + دسکتاپ) در دسترس
  const menuItems = [
    { to: '/profile', label: 'پروفایل', icon: 'mdi:account-outline' },
    { to: '/teams', label: 'تیم\u200cها', icon: 'mdi:account-group' },
    { to: '/games', label: 'بازی\u200cها', icon: 'mdi:gamepad-variant' },
    { to: '/competitions', label: 'رقابت\u200cها', icon: 'mdi:trophy' },
    { to: '/tournaments', label: 'تورنمنت\u200cها', icon: 'mdi:trophy-outline' },
    { to: dashboardPath, label: isCoach ? 'پنل مربی' : isManager ? 'داشبورد مدیریت' : 'داشبورد', icon: 'mdi:view-dashboard-outline' },
    { to: '/deals', label: 'شگفت\u200cانگیزها', icon: 'mdi:lightning-bolt' },
    ...(canConsoleNav ? consoleLinks.map((item) => ({ to: item.href, label: item.label, icon: item.icon })) : []),
    ...(isManager ? [{ to: '/manager/teams', label: 'تیم\u200cهای همکار', icon: 'mdi:handshake-outline' }] : []),
    ...(user?.role === 'super_admin' ? [{ to: '/admin', label: 'پنل ادمین', icon: 'mdi:shield-account-outline' }] : []),
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.45, type: 'spring', stiffness: 100 }}
      className="sticky top-0 z-40 border-b border-border bg-background/85 pt-safe backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-1.5 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label="صفحه اصلی فوتسال"
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_4px_14px_rgba(245,158,11,0.3)]">
            <Icon icon="mdi:soccer" className="h-6 w-6" style={{ color: '#1c1917' }} />
          </span>
          <span className="hidden bg-gradient-to-bl from-amber-700 to-orange-700 bg-clip-text text-lg font-extrabold text-transparent sm:block">
            فوتسال
          </span>
        </Link>

        <div className="flex-1" />

        {/* دکمه‌های ناوبری — فقط دسکتاپ؛ موبایل با نوار پایین + منوی آواتار.
            جعبه ناو فقط خودش اسکرول افقی می‌شود تا هرگز عرض سند را از viewport
            عبور ندهد — ریشه H_OVERFLOW ممیزی UI. */}
        {isAuthenticated && (
          <nav
            aria-label="ناوبری بخش‌ها"
            className="hidden min-w-0 flex-[0_1_auto] items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive(item.href)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon icon={item.icon} className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <ThemeToggle />

        {/* زنگ اعلان — در همه اندازه‌ها (موبایل + دسکتاپ) دیده می‌شود */}
        {isAuthenticated && <NotificationPanel />}

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="منوی حساب کاربری"
                className="ms-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-extrabold text-stone-900 transition-transform hover:scale-105">
                  {user?.fullName ? getInitials(user.fullName) : <Icon icon="mdi:account" className="h-5 w-5" />}
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="max-h-[calc(100dvh-5rem)] w-60 overflow-y-auto">
              <DropdownMenuLabel className="px-3 py-2">
                <span className="block text-sm font-bold text-foreground">{user?.fullName || 'کاربر'}</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  {user ? roleLabels[user.role] || user.role : ''}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {menuItems.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link to={item.to} className="w-full">
                    <Icon icon={item.icon} className="h-5 w-5 text-muted-foreground" />
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleLogout}
                className="font-bold text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-500/10"
              >
                <Icon icon="mdi:logout" className="h-5 w-5" />
                <span>خروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">ورود</Link>
            </Button>
            <Button asChild size="sm" className="px-4 font-bold">
              <Link to="/register">ثبت‌نام</Link>
            </Button>
          </div>
        )}
      </div>
    </motion.header>
  )
}

export default Navbar
