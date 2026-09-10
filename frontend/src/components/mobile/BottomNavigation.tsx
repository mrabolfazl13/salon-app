import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Box } from '@mui/material'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { useAuthStore } from '@/store/authStore'
import { shadows } from '@/theme'

interface NavItem {
  label: string
  icon: string
  href: string
  requiresAuth?: boolean
}

const ITEMS: NavItem[] = [
  { label: 'خانه', icon: 'home', href: '/' },
  { label: 'جستجو', icon: 'magnify', href: '/search' },
  { label: 'رزروها', icon: 'calendar-check', href: '/bookings', requiresAuth: true },
  { label: 'علاقه‌مندی', icon: 'heart', href: '/favorites' },
  { label: 'پروفایل', icon: 'account-circle', href: '/profile', requiresAuth: true },
]

/** مسیرهایی که نوار پایین مخفی می‌شود (flowهای ورود/ثبت‌نام/پرداخت/پنل‌ها) */
const HIDDEN_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/verify',
  '/payment',
  '/dashboard',
  '/manager-dashboard',
  '/admin',
  '/join',
]

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

/** ناوبری پایین موبایل — fixed، safe-area، آیتم فعال با حالت gradient */
const BottomNavigation: React.FC = () => {
  const { pathname } = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null
  // صفحه جزئیات رزرو (flow پرداخت) هم مخفی
  if (/^\/bookings\/\d+$/.test(pathname)) return null

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
        bgcolor: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(15,23,42,0.06)',
        boxShadow: shadows.nav,
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <Box sx={{ display: 'flex', height: 62 }}>
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          const to = item.requiresAuth && !isAuthenticated ? '/login' : item.href
          return (
            <Link
              key={item.href}
              to={to}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, textDecoration: 'none', minWidth: 44 }}
              aria-current={active ? 'page' : undefined}
            >
              <NavIcon active={active} icon={item.icon} />
              <Box
                component="span"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: active ? 700 : 500,
                  color: active ? '#2563eb' : '#64748b',
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

/** آیکون با پس‌زمینه pill گرادیانی در حالت فعال */
const NavIcon: React.FC<{ active: boolean; icon: string }> = ({ active, icon }) => (
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
      background: active ? 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(124,58,237,0.12))' : 'transparent',
    }}
  >
    <Icon
      icon={`mdi:${active ? icon : icon + '-outline'}`}
      style={{ width: 22, height: 22, color: active ? '#2563eb' : '#94a3b8' }}
    />
  </motion.span>
)

export default BottomNavigation
