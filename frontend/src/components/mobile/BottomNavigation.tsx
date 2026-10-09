import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Box, useTheme } from '@mui/material'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { useAuthStore } from '@/store/authStore'
import { shadows, shadowsDark } from '@/theme'

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
    return [home, { label: 'داشبورد', icon: 'view-dashboard', href: '/manager-dashboard', requiresAuth: true, roles: ['venue_manager', 'club_admin', 'super_admin'] }, competitions, { label: 'امور مالی', icon: 'cash-register', href: '/finance', requiresAuth: true }, profile]
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
  '/admin',
  '/join',
]

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

/** ناوبری پایین موبایل — fixed، safe-area، آیتم فعال با حالت کهربایی */
const BottomNavigation: React.FC = () => {
  const { pathname } = useLocation()
  const { user, isAuthenticated } = useAuthStore()
  const muiTheme = useTheme()
  const dark = muiTheme.palette.mode === 'dark'
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
    <Box
      component="nav"
      aria-label="ناوبری اصلی"
      sx={{
        position: 'fixed',
        bottom: 0,
        insetInline: 0,
        zIndex: 60,
        display: { xs: 'block', md: 'none' },
        bgcolor: dark ? 'rgba(11,18,32,0.94)' : 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid',
        borderColor: 'divider',
        boxShadow: dark ? shadowsDark.nav : shadows.nav,
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <Box sx={{ display: 'flex', height: 62 }}>
        {filteredItems.map((item) => {
          const active = isActive(pathname, item.href)
          const to = item.requiresAuth && !isAuthenticated ? '/login' : item.href
          return (
            <Link
              key={item.href}
              to={to}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, textDecoration: 'none', minWidth: 44 }}
              aria-current={active ? 'page' : undefined}
            >
              <NavIcon active={active} icon={item.icon} dark={dark} />
              <Box
                component="span"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: active ? 700 : 500,
                  color: active ? (dark ? '#fbbf24' : '#b45309') : (dark ? '#8b98ab' : '#64748b'),
                  transition: 'color 0.2s ease',
                }}
              >
                {item.label}
              </Box>
            </Link>
          )
        })}
      </Box>
    </Box>
  )
}

/** آیکون با پس‌زمینه pill کهربایی در حالت فعال */
const NavIcon: React.FC<{ active: boolean; icon: string; dark: boolean }> = ({ active, icon, dark }) => (
  <motion.span
    animate={{ scale: active ? 1 : 0.96 }}
    transition={{ duration: 0.2 }}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 46,
      height: 30,
      borderRadius: 999,
      background: active
        ? dark
          ? 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(249,115,22,0.18))'
          : 'linear-gradient(135deg, rgba(245,158,11,0.16), rgba(249,115,22,0.16))'
        : 'transparent',
    }}
  >
    <Icon
      icon={`mdi:${icon.endsWith('-outline') || !active ? icon : icon + '-outline'}`}
      style={{ width: 22, height: 22, color: active ? (dark ? '#fbbf24' : '#d97706') : (dark ? '#5b6879' : '#64748b') }}
    />
  </motion.span>
)

export default BottomNavigation