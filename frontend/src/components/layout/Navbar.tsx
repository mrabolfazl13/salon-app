import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Button,
  Divider,
} from '@mui/material'
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminPanelIcon,
} from '@mui/icons-material'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useStaffMe } from '@/hooks/useStaffMe'
import { getInitials } from '@/lib/utils'
import NotificationPanel from './NotificationPanel'

const roleLabels: Record<string, string> = {
  user: 'کاربر',
  venue_manager: 'مدیر سالن',
  club_admin: 'مدیر باشگاه',
  super_admin: 'مدیر کل',
}

interface NavbarProps {
  /** منوی کناری (Drawer) غیرفعال شده — ناوبری موبایل با نوار پایین انجام می‌شود */
  onMenuClick?: () => void
}

const muiIconSx = { ml: 1, fontSize: 20 }
const iconifyStyle = { marginLeft: 8, fontSize: 18 }

const Navbar: React.FC<NavbarProps> = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()

  const isManager =
    user?.role === 'venue_manager' || user?.role === 'club_admin' || user?.role === 'super_admin'
  // کارمند انتصابی (role=user با انتساب فعال در /staff/me) — همان ناوبری کنسول‌ها
  const staffQuery = useStaffMe()
  const isStaff = (staffQuery.data?.length ?? 0) > 0
  const canConsoleNav = isManager || isStaff

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    useNotificationStore.getState().reset()
    logout()
    navigate('/')
  }

  const navItems = [
    { label: 'خانه', icon: 'mdi:home', href: '/' },
    { label: 'سالن‌ها', icon: 'mdi:store', href: '/venues' },
    { label: 'بازی‌ها', icon: 'mdi:gamepad-variant', href: '/games' },
    { label: 'تیم\u200cها', icon: 'mdi:account-group', href: '/teams' },
    { label: 'رزروها', icon: 'mdi:calendar', href: '/bookings' },
    { label: 'قراردادها', icon: 'mdi:file-document', href: '/contracts' },
    ...(isAuthenticated ? [{ label: 'شگفت\u200cانگیز', icon: 'mdi:fire', href: '/deals' }] : []),
    ...(isManager ? [{ label: 'رقابت\u200cها', icon: 'mdi:trophy', href: '/competitions' }, { label: 'قیمت\u200cگذاری', icon: 'mdi:tag-percent-outline', href: '/manager/pricing' }, { label: 'امور مالی', icon: 'mdi:cash-register', href: '/finance' }, { label: 'مشتریان', icon: 'mdi:account-heart-outline', href: '/manager/crm' }, { label: 'مدیریت قراردادها', icon: 'mdi:file-document-check-outline', href: '/manager/contracts' }] : []),
    ...(!isManager && isStaff ? [{ label: 'قیمت\u200cگذاری', icon: 'mdi:tag-percent-outline', href: '/manager/pricing' }, { label: 'امور مالی', icon: 'mdi:cash-register', href: '/finance' }, { label: 'مشتریان', icon: 'mdi:account-heart-outline', href: '/manager/crm' }, { label: 'قراردادها (مدیریت)', icon: 'mdi:file-document-check-outline', href: '/manager/contracts' }] : []),
  ]

  const dashboardPath = isManager ? '/manager-dashboard' : '/dashboard'

  // آیتم‌های منوی آواتار — در همه اندازه‌ها (موبایل + دسکتاپ) در دسترس
  const menuItems = [
    { to: '/profile', label: 'پروفایل', icon: <PersonIcon sx={muiIconSx} /> },
    { to: '/teams', label: 'تیم\u200cها', icon: <Icon icon="mdi:account-group" style={iconifyStyle} /> },
    { to: '/games', label: 'بازی\u200cها', icon: <Icon icon="mdi:gamepad-variant" style={iconifyStyle} /> },
    ...(canConsoleNav ? [{ to: '/competitions', label: 'رقابت\u200cها', icon: <Icon icon="mdi:trophy" style={iconifyStyle} /> }] : []),
    { to: dashboardPath, label: isManager ? 'داشبورد مدیریت' : 'داشبورد', icon: <DashboardIcon sx={muiIconSx} /> },
    { to: '/deals', label: 'شگفت\u200cانگیزها', icon: <Icon icon="mdi:fire" style={iconifyStyle} /> },
    ...(canConsoleNav ? [
      { to: '/manager/pricing', label: 'قیمت\u200cگذاری', icon: <Icon icon="mdi:tag-percent-outline" style={iconifyStyle} /> },
      { to: '/finance', label: 'امور مالی', icon: <Icon icon="mdi:cash-register" style={iconifyStyle} /> },
      { to: '/manager/crm', label: 'مشتریان', icon: <Icon icon="mdi:account-heart-outline" style={iconifyStyle} /> },
      { to: '/manager/contracts', label: 'مدیریت قراردادها', icon: <Icon icon="mdi:file-document-check-outline" style={iconifyStyle} /> },
    ] : []),
    ...(isManager ? [{ to: '/manager/teams', label: 'تیم\u200cهای همکار', icon: <Icon icon="mdi:handshake-outline" style={iconifyStyle} /> }] : []),
    ...(user?.role === 'super_admin' ? [{ to: '/admin', label: 'پنل ادمین', icon: <AdminPanelIcon sx={muiIconSx} /> }] : []),
  ]

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar>
          <Link to="/" className="flex items-center gap-2 no-underline">
            <Box
              sx={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon icon="mdi:soccer" className="h-6 w-6 text-white" />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              فوتسال
            </Typography>
          </Link>

          <Box sx={{ flexGrow: 1 }} />

          {/* زنگ اعلان — در همه اندازه‌ها (موبایل + دسکتاپ) دیده می‌شود */}
          {isAuthenticated && <NotificationPanel />}

          {/* دکمه‌های ناوبری — فقط دسکتاپ؛ موبایل با نوار پایین + منوی آواتار */}
          {isAuthenticated && (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  component={Link}
                  to={item.href}
                  color="inherit"
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      background: 'rgba(37, 99, 235, 0.08)',
                    },
                  }}
                  startIcon={<Icon icon={item.icon} />}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* بلوک حساب کاربری — در همه بریک‌پوینت‌ها (روی موبایل هم آواتار + خروج + بخش‌های فرعی) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mr: { xs: 0.5, md: 1 },
              flexShrink: 0,
            }}
          >
            {isAuthenticated ? (
              <>
                <IconButton
                  onClick={handleMenuOpen}
                  color="inherit"
                  aria-label="منوی حساب کاربری"
                  sx={{ p: { xs: 0.5, md: 0.75 } }}
                >
                  <Avatar
                    sx={{
                      width: { xs: 32, md: 36 },
                      height: { xs: 32, md: 36 },
                      bgcolor: 'primary.main',
                      fontSize: '0.8rem',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    {user?.fullName ? getInitials(user.fullName) : <PersonIcon fontSize="small" />}
                  </Avatar>
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                  sx={{
                    '& .MuiPaper-root': {
                      borderRadius: '16px',
                      minWidth: 220,
                      maxWidth: 'calc(100vw - 24px)',
                      maxHeight: 'calc(100vh - 80px)',
                      overflowY: 'auto',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      mt: 1,
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {user?.fullName || 'کاربر'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user ? roleLabels[user.role] || user.role : ''}
                    </Typography>
                  </Box>
                  <Divider />
                  {menuItems.map((item) => (
                    <MenuItem
                      key={item.to}
                      component={Link}
                      to={item.to}
                      onClick={handleMenuClose}
                      sx={{ borderRadius: '10px', mx: 0.5, textTransform: 'none' }}
                    >
                      {item.icon} {item.label}
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem
                    onClick={handleLogout}
                    sx={{ color: 'error.main', borderRadius: '10px', mx: 0.5, fontWeight: 700, '&:hover': { bgcolor: 'rgba(220,38,38,0.06)' } }}
                  >
                    <LogoutIcon sx={muiIconSx} /> خروج
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/login"
                  color="inherit"
                  sx={{ borderRadius: '10px', textTransform: 'none', px: { xs: 1, md: 2 } }}
                >
                  ورود
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    px: { xs: 1.5, md: 2 },
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  }}
                >
                  ثبت‌نام
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </motion.div>
  )
}

export default Navbar
